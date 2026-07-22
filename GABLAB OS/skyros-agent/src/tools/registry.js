/**
 * SKYROS Agent — Tool Registry
 * "Adding a tool = adding one handler" (Harness s02)
 */

export class ToolRegistry {
  constructor() {
    this.tools = new Map();
  }

  /**
   * Register a tool
   * @param {Object} tool - { name, description, parameters, execute }
   */
  register(tool) {
    if (!tool.name || !tool.execute) {
      throw new Error(`Tool must have 'name' and 'execute': ${JSON.stringify(tool)}`);
    }
    this.tools.set(tool.name, tool);
  }

  /**
   * Get a tool by name
   */
  get(name) {
    return this.tools.get(name);
  }

  /**
   * Check if a tool exists
   */
  has(name) {
    return this.tools.has(name);
  }

  /**
   * Get all tool names
   */
  list() {
    return Array.from(this.tools.keys());
  }

  /**
   * Get OpenAI-compatible tool definitions for the LLM
   */
  getDefinitions() {
    return Array.from(this.tools.values()).map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description || '',
        parameters: tool.parameters || {
          type: 'object',
          properties: {},
        },
      },
    }));
  }

  /**
   * Get count of registered tools
   */
  get size() {
    return this.tools.size;
  }
}

export default ToolRegistry;
