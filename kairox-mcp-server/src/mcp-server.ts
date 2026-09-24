import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { env } from "./utils/env.js";
import { logger } from "./utils/logger.js";
import { toMcpError } from "./utils/errors.js";

import { aioxTools, aioxHandlers } from "./tools/aiox.tool.js";
import { hivemindTools, hivemindHandlers } from "./tools/hivemind.tool.js";
import { kairosTools, kairosHandlers } from "./tools/kairos.tool.js";
import { hydraTools, hydraHandlers } from "./tools/hydra.tool.js";

class KairosMcpServer {
  private server: Server;
  private tools: any[] = [];
  private handlers = new Map<string, Function>();

  constructor() {
    this.server = new Server(
      { name: "kairox-mcp-server", version: "3.1.0" },
      { capabilities: { tools: {} } }
    );

    this.registerTools();
    this.setupHandlers();
    this.setupErrorHandling();
  }

  private registerTools() {
    this.tools.push(...aioxTools);
    Object.entries(aioxHandlers).forEach(([name, handler]) => this.handlers.set(name, handler));

    this.tools.push(...hivemindTools);
    Object.entries(hivemindHandlers).forEach(([name, handler]) => this.handlers.set(name, handler));

    this.tools.push(...kairosTools);
    Object.entries(kairosHandlers).forEach(([name, handler]) => this.handlers.set(name, handler));

    this.tools.push(...hydraTools);
    Object.entries(hydraHandlers).forEach(([name, handler]) => this.handlers.set(name, handler));
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      logger.debug("ListTools request received");
      return { tools: this.tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const toolName = request.params.name;
      logger.info(`Chamando tool: ${toolName}`, { tool: toolName });

      const handler = this.handlers.get(toolName);
      if (!handler) {
        throw new Error(`Tool não encontrada: ${toolName}`);
      }

      try {
        const result = await handler(request.params.arguments || {});
        return {
          content: [
            {
              type: "text",
              text: typeof result === "string" ? result : JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        logger.error(`Erro ao executar tool ${toolName}`, { error });
        throw toMcpError(error);
      }
    });
  }

  private setupErrorHandling() {
    this.server.onerror = (error) => {
      logger.error("Erro no Servidor MCP", { error });
    };

    process.on("SIGINT", async () => {
      await this.cleanup();
      process.exit(0);
    });
  }

  private async cleanup() {
    logger.info("Encerrando Servidor MCP...");
    await this.server.close();
  }

  public async run() {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      logger.info(`KAIROX Engine MCP Server rodando na porta STDIO (env: ${env.NODE_ENV})`);
    } catch (error) {
      logger.error("Falha ao iniciar Servidor MCP", { error });
      process.exit(1);
    }
  }
}

const server = new KairosMcpServer();
server.run().catch((e) => logger.error("Erro fatal:", e));
