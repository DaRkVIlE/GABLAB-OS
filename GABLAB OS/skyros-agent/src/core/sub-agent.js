/**
 * SKORTEX — Sub-Agent Worker
 * Isolated AgentLoop wrapper with clean history and persona injection.
 * Pattern: S04 from SKYROS-ARCHITECTURE-GOLD RP
 * 
 * Each SubAgent:
 *   - Gets its own messages[] (no context pollution)
 *   - Has a persona-specific system prompt
 *   - Reports progress via callbacks
 *   - Can be cancelled mid-execution
 *   - Logs its own session
 */

export class SubAgent {
  /**
   * @param {Object} options
   * @param {string} options.id - Unique sub-agent identifier
   * @param {string} options.persona - Persona ID (dev, architect, qa, etc.)
   * @param {string} options.systemPrompt - Full system prompt with persona
   * @param {import('./loop.js').AgentLoop} options.loop - Shared agent loop
   * @param {Object} options.config - Agent config
   * @param {Function} [options.onProgress] - Progress callback
   * @param {Function} [options.chalk] - Chalk for output
   */
  constructor({ id, persona, systemPrompt, loop, config, onProgress, chalk }) {
    this.id = id;
    this.persona = persona;
    this.systemPrompt = systemPrompt;
    this.loop = loop;
    this.config = config;
    this.onProgress = onProgress || (() => {});
    this.chalk = chalk || ((s) => s);

    this.history = [];  // Clean, isolated history (S04 core principle)
    this.status = 'idle';  // idle → running → done → error → cancelled
    this.result = null;
    this.error = null;
    this.startedAt = null;
    this.completedAt = null;
    this.cancelled = false;
  }

  /**
   * Execute a task with this sub-agent
   * @param {string} task - The task description
   * @param {Object} [options] - { tier, provider, model }
   * @returns {Promise<string>} - The agent's response
   */
  async execute(task, options = {}) {
    this.status = 'running';
    this.startedAt = Date.now();
    this.onProgress({ id: this.id, persona: this.persona, status: 'running', task });

    try {
      if (this.cancelled) throw new Error('Cancelled before start');

      const response = await this.loop.run(task, this.history, {
        systemPrompt: this.systemPrompt,
        tier: options.tier || 'medium',
        provider: options.provider,
        model: options.model,
      });

      if (this.cancelled) throw new Error('Cancelled during execution');

      this.result = response;
      this.status = 'done';
      this.completedAt = Date.now();
      this.onProgress({ id: this.id, persona: this.persona, status: 'done', elapsed: this.getElapsed() });

      return response;
    } catch (err) {
      this.error = err.message;
      this.status = this.cancelled ? 'cancelled' : 'error';
      this.completedAt = Date.now();
      this.onProgress({ id: this.id, persona: this.persona, status: this.status, error: err.message });
      throw err;
    }
  }

  /**
   * Cancel this sub-agent
   */
  cancel() {
    this.cancelled = true;
    this.status = 'cancelled';
    this.completedAt = Date.now();
  }

  /**
   * Get elapsed time in human-readable format
   */
  getElapsed() {
    if (!this.startedAt) return '0s';
    const end = this.completedAt || Date.now();
    const seconds = Math.floor((end - this.startedAt) / 1000);
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  }

  /**
   * Get a summary of this sub-agent's state
   */
  getSummary() {
    return {
      id: this.id,
      persona: this.persona,
      status: this.status,
      elapsed: this.getElapsed(),
      historySize: this.history.length,
      result: this.result ? this.result.slice(0, 200) + (this.result.length > 200 ? '...' : '') : null,
      error: this.error,
    };
  }
}

export default SubAgent;
