/**
 * SKYROS Agent — Context Compactor
 * Auto-compress conversation when it gets too long (Harness s06)
 */

export class ContextCompactor {
  /**
   * @param {ProviderRouter} router - to call LLM for summarization
   * @param {Object} options
   */
  constructor(router, options = {}) {
    this.router = router;
    this.maxTokenEstimate = options.maxTokens || 100000;
    this.compactThreshold = options.compactThreshold || 0.7; // 70% of max
    this.keepRecent = options.keepRecent || 10; // keep last N messages
  }

  /**
   * Estimate token count (rough: 1 token ≈ 4 chars)
   */
  estimateTokens(messages) {
    let chars = 0;
    for (const msg of messages) {
      chars += (msg.content || '').length;
      if (msg.tool_calls) {
        chars += JSON.stringify(msg.tool_calls).length;
      }
    }
    return Math.ceil(chars / 4);
  }

  /**
   * Check if compaction is needed
   */
  needsCompaction(history) {
    const tokens = this.estimateTokens(history);
    return tokens > this.maxTokenEstimate * this.compactThreshold;
  }

  /**
   * Compact the conversation history
   * @param {Array} history - full conversation history (mutated)
   * @returns {Array} - compacted history
   */
  async compact(history) {
    if (history.length <= this.keepRecent + 2) return history;

    const oldMessages = history.slice(0, -this.keepRecent);
    const recentMessages = history.slice(-this.keepRecent);

    // Summarize old messages using the LLM (use light tier)
    const summaryPrompt = [
      { role: 'system', content: 'Summarize the following conversation concisely, keeping key decisions, file paths mentioned, and important context. Output ONLY the summary, no preamble.' },
      { role: 'user', content: oldMessages.map(m => `[${m.role}]: ${m.content || '(tool call)'}`).join('\n').slice(0, 20000) },
    ];

    try {
      const response = await this.router.complete(summaryPrompt, [], { tier: 'light', maxTokens: 2000 });
      const summary = response.text;

      // Build compacted history
      const compacted = [
        { role: 'user', content: `[CONTEXT SUMMARY of ${oldMessages.length} previous messages]:\n${summary}` },
        { role: 'assistant', content: 'Understood. I have the context from our previous conversation. Let me continue.' },
        ...recentMessages,
      ];

      return compacted;
    } catch (error) {
      // If summarization fails, just truncate
      console.error(`⚠️  Compaction failed: ${error.message}. Truncating instead.`);
      return recentMessages;
    }
  }
}

export default ContextCompactor;
