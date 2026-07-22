/**
 * SKYROS Agent — MCP Bridge
 * Native JSON-RPC client to connect to KAIROS stdio MCP servers
 * Zero external dependencies.
 */

import { spawn } from 'child_process';
import { createInterface } from 'readline';

export class MCPBridge {
  /**
   * @param {Object} options
   * @param {string} options.serverPath - Path to the MCP server script
   * @param {ToolRegistry} options.registry - Standard SKYROS ToolRegistry
   * @param {Function} options.chalk - Chalk instance for logging
   */
  constructor(options) {
    this.serverPath = options.serverPath;
    this.registry = options.registry;
    this.chalk = options.chalk;
    this.process = null;
    this.requestId = 1;
    this.pending = new Map();
    this.ready = false;
  }

  /**
   * Start the MCP server process and initialize
   */
  async connect() {
    return new Promise((resolve, reject) => {
      // Spawn MCP server
      this.process = spawn('node', [this.serverPath], {
        stdio: ['pipe', 'pipe', 'inherit'], // inherit stderr for logs
      });

      // Handle raw JSON-RPC responses
      const rl = createInterface({
        input: this.process.stdout,
        terminal: false,
      });

      rl.on('line', (line) => {
        try {
          const msg = JSON.parse(line);
          this.handleMessage(msg);
        } catch (e) {
          // Non-JSON output (ignore or log dim)
        }
      });

      this.process.on('error', (err) => {
        reject(new Error(`Failed to start MCP server: ${err.message}`));
      });

      // Initialize the MCP protocol
      this.sendRequest('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'skyros-agent', version: '1.0.0' },
      }).then(async (initResult) => {
        // Send initialized notification
        this.sendNotification('notifications/initialized');
        
        // Fetch available tools and register them
        await this.syncTools();
        
        this.ready = true;
        resolve();
      }).catch(reject);
    });
  }

  /**
   * Handle incoming JSON-RPC message
   */
  handleMessage(msg) {
    if (msg.id !== undefined && this.pending.has(msg.id)) {
      const { resolve, reject } = this.pending.get(msg.id);
      this.pending.delete(msg.id);

      if (msg.error) {
        reject(new Error(msg.error.message || JSON.stringify(msg.error)));
      } else {
        resolve(msg.result);
      }
    }
    // Notifications from server would go here if needed
  }

  /**
   * Send a JSON-RPC notification (no response expected)
   */
  sendNotification(method, params = {}) {
    const msg = {
      jsonrpc: '2.0',
      method,
      params,
    };
    this.process.stdin.write(JSON.stringify(msg) + '\n');
  }

  /**
   * Send a JSON-RPC request and await response
   */
  sendRequest(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.requestId++;
      this.pending.set(id, { resolve, reject });

      const msg = {
        jsonrpc: '2.0',
        id,
        method,
        params,
      };

      try {
        this.process.stdin.write(JSON.stringify(msg) + '\n');
      } catch (err) {
        this.pending.delete(id);
        reject(err);
      }
    });
  }

  /**
   * Fetch tools from the MCP server and adapt them to SKYROS registry
   */
  async syncTools() {
    const result = await this.sendRequest('tools/list');
    const tools = result.tools || [];

    for (const remoteTool of tools) {
      // Map JSON Schema 'type' objects to our structure if needed,
      // but remoteTool.inputSchema is already valid JSON Schema.
      
      const localTool = {
        name: remoteTool.name,
        description: remoteTool.description || `MCP Tool: ${remoteTool.name}`,
        parameters: remoteTool.inputSchema,
        
        // Wrap execution to forward via JSON-RPC
        execute: async (args) => {
          try {
            const callResult = await this.sendRequest('tools/call', {
              name: remoteTool.name,
              arguments: args,
            });
            
            // Format MCP Content blocks back to a single string
            if (callResult && callResult.content && Array.isArray(callResult.content)) {
              return callResult.content.map(c => c.text).join('\n');
            }
            return JSON.stringify(callResult, null, 2);
          } catch (error) {
            return `MCP Tool Error inside '${remoteTool.name}': ${error.message}`;
          }
        },
      };

      this.registry.register(localTool);
    }

    if (this.chalk) {
      console.log(this.chalk.green(`🔌 Bridged ${tools.length} exact tools from MCP Server`));
    }
  }

  /**
   * Close the bridge gracefully
   */
  disconnect() {
    if (this.process) {
      this.process.kill('SIGTERM');
      this.process = null;
    }
    this.ready = false;
  }
}

export default MCPBridge;
