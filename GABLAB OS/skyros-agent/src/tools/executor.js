/**
 * SKYROS Agent — Tool Executor
 * Looks up tools from the registry and executes them
 */

export class ToolExecutor {
  /**
   * @param {ToolRegistry} registry
   */
  constructor(registry) {
    this.registry = registry;
  }

  /**
   * Execute a tool by name
   * @param {string} name - tool name
   * @param {Object} args - tool arguments
   * @returns {string} - result
   */
  async execute(name, args) {
    const tool = this.registry.get(name);
    if (!tool) {
      return `Error: Unknown tool '${name}'. Available tools: ${this.registry.list().join(', ')}`;
    }
    try {
      const result = await tool.execute(args);
      return typeof result === 'string' ? result : JSON.stringify(result, null, 2);
    } catch (error) {
      return `Error in ${name}: ${error.message}`;
    }
  }

  /**
   * Get tool definitions for LLM
   */
  getToolDefinitions() {
    return this.registry.getDefinitions();
  }
}

export default ToolExecutor;
