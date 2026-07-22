/**
 * SKYROS Agent — THE Core Agent Loop
 * ~80 lines. The beating heart.
 * 
 * Pattern: call LLM → check tool_calls → execute → append → repeat
 * Inspired by: nanoAgent + Claude Code (Harness s01-s02)
 */

export class AgentLoop {
  /**
   * @param {Object} options
   * @param {ProviderRouter} options.router - LLM provider router
   * @param {ToolExecutor} options.executor - tool executor
   * @param {Object} options.config - agent config
   * @param {Function} options.onToolCall - callback when tool is called
   * @param {Function} options.onResponse - callback when LLM responds
   */
  constructor({ router, executor, config, onToolCall, onResponse }) {
    this.router = router;
    this.executor = executor;
    this.config = config;
    this.onToolCall = onToolCall || (() => {});
    this.onResponse = onResponse || (() => {});
  }

  /**
   * Run the agent loop
   * @param {string} userMessage - user's input
   * @param {Array} history - conversation history (mutated in place)
   * @param {Object} options - { systemPrompt, tier, provider, model }
   * @returns {string} - final assistant response
   */
  async run(userMessage, history = [], options = {}) {
    const systemPrompt = options.systemPrompt || this.config.agent.systemPrompt;
    
    // Build messages array
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: userMessage },
    ];

    // Add user message to history
    history.push({ role: 'user', content: userMessage });

    // Get tool definitions
    const tools = this.executor.getToolDefinitions();

    // THE LOOP
    for (let step = 0; step < this.config.agent.maxSteps; step++) {
      const response = await this.router.complete(messages, tools, {
        tier: options.tier || 'medium',
        provider: options.provider,
        model: options.model,
        maxTokens: this.config.agent.maxTokens,
        temperature: this.config.agent.temperature,
      });

      // No tool calls → we have the final answer
      if (!response.toolCalls || response.toolCalls.length === 0) {
        const text = response.text;
        history.push({ role: 'assistant', content: text });
        this.onResponse({ text, model: response.model, usage: response.usage, step });
        return text;
      }

      // Append the assistant message with tool calls
      messages.push(response.raw);
      history.push(response.raw);

      // Execute each tool call
      for (const toolCall of response.toolCalls) {
        const name = toolCall.function.name;
        let args;
        try {
          args = JSON.parse(toolCall.function.arguments);
        } catch {
          args = {};
        }

        this.onToolCall({ name, args, id: toolCall.id, step });

        let result;
        try {
          result = await this.executor.execute(name, args);
        } catch (error) {
          result = `Error executing ${name}: ${error.message}`;
        }

        // Truncate very long results
        if (typeof result === 'string' && result.length > 50000) {
          result = result.slice(0, 50000) + '\n\n[... truncated, showing first 50000 chars]';
        }

        const toolResult = {
          role: 'tool',
          tool_call_id: toolCall.id,
          content: typeof result === 'string' ? result : JSON.stringify(result),
        };
        messages.push(toolResult);
        history.push(toolResult);
      }
    }

    const msg = `⚠️  Max steps (${this.config.agent.maxSteps}) reached. Task may be incomplete.`;
    history.push({ role: 'assistant', content: msg });
    return msg;
  }
}

export default AgentLoop;
