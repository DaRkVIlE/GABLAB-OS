import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import http from 'node:http';
import { MoodleClient } from './moodle-client.js';
import { getMoodleToolsDefinitions, handleMoodleToolCall, generateOpenAPISpec } from './tools.js';
import { saveLead } from './leads.js';

dotenv.config();

const MOODLE_URL = process.env.MOODLE_URL || 'https://moodle.experiasolutions.com.br';
const MOODLE_TOKEN = process.env.MOODLE_TOKEN || 'your_moodle_webservice_token_here';
const HABITICA_CONNECTOR_URL = process.env.HABITICA_CONNECTOR_URL || 'http://localhost:4050';

export const moodleClient = new MoodleClient({
  baseUrl: MOODLE_URL,
  token: MOODLE_TOKEN,
  habiticaConnectorUrl: HABITICA_CONNECTOR_URL
});

export const server = new Server(
  {
    name: 'moodle-bridge-mcp',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// Register list of tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: getMoodleToolsDefinitions()
  };
});

// Register tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    const result = await handleMoodleToolCall(name, args || {}, moodleClient);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  } catch (error: any) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Erro ao executar ${name}: ${error.message || String(error)}`
        }
      ]
    };
  }
});

let sseTransport: SSEServerTransport | null = null;

export function createHttpServer(client: MoodleClient = moodleClient): http.Server {
  return http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-bridge-token');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

    if (req.url === '/health' || req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        status: 'healthy',
        service: 'moodle-bridge',
        version: '1.0.0',
        toolsAvailable: 5,
        timestamp: new Date().toISOString()
      }));
    }

    if (req.url === '/openapi.json' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(generateOpenAPISpec(), null, 2));
    }

    if (req.url === '/tools' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(getMoodleToolsDefinitions(), null, 2));
    }

    // SSE MCP Transport
    if (req.url === '/sse' && req.method === 'GET') {
      sseTransport = new SSEServerTransport('/messages', res);
      await server.connect(sseTransport);
      return;
    }

    if (req.url === '/messages' && req.method === 'POST') {
      if (sseTransport) {
        await sseTransport.handlePostMessage(req, res);
      } else {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Sessão SSE não estabelecida' }));
      }
      return;
    }

    if (req.url === '/api/lead-capture' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const payload = body ? JSON.parse(body) : {};
          if (!payload.name || !payload.whatsapp) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, error: 'Nome e WhatsApp são obrigatórios' }));
          }
          const saved = await saveLead(payload);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, leadId: saved.id }));
        } catch (err: any) {
          console.error('Erro ao capturar lead:', err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
      return;
    }

    if (req.url?.startsWith('/tools/') && req.method === 'POST') {
      const toolName = req.url.replace('/tools/', '');
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const args = body ? JSON.parse(body) : {};
          const result = await handleMoodleToolCall(toolName, args, client);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, data: result }));
        } catch (err: any) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint não encontrado' }));
  });
}

async function main() {
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4051;
  const isCloudDeploy = !!process.env.RAILWAY_ENVIRONMENT || !!process.env.PORT;

  const httpServer = createHttpServer(moodleClient);

  httpServer.listen(PORT, () => {
    console.error(`🌐 Moodle Bridge HTTP Server & Healthcheck operacional na porta ${PORT}`);
  });

  // Se não estiver em modo cloud-only sem TTY, conectar stdio também
  if (!isCloudDeploy || process.env.STDIO_ENABLED === 'true') {
    try {
      const transport = new StdioServerTransport();
      await server.connect(transport);
      console.error('🚀 Moodle Bridge MCP Server running on Stdio transport (v1.0.0)');
    } catch (e: any) {
      console.error('Stdio transport omitido no container cloud:', e.message);
    }
  }
}

// Iniciar apenas se executado diretamente
const isDirectExecution = process.argv[1]?.endsWith('src/index.ts') || process.argv[1]?.endsWith('dist/index.js');
if (isDirectExecution) {
  main().catch((err) => {
    console.error('Fatal error starting Moodle Bridge MCP Server:', err);
    process.exit(1);
  });
}


