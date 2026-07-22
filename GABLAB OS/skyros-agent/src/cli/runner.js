/**
 * SKYROS Agent — One-shot Runner
 * Execute a single task and exit
 */

export class Runner {
  /**
   * @param {AgentLoop} loop
   * @param {SessionStore} sessionStore
   * @param {Object} config
   * @param {Function} chalk
   */
  constructor({ loop, sessionStore, config, chalk }) {
    this.loop = loop;
    this.sessionStore = sessionStore;
    this.config = config;
    this.chalk = chalk;
  }

  /**
   * Run a single task
   * @param {string} task - the user's task
   * @param {Object} options - { systemPrompt, tier, provider, model }
   */
  async run(task, options = {}) {
    const c = this.chalk;
    const sessionId = this.sessionStore.newId();

    console.log(c.dim(`Session: ${sessionId}`));
    console.log(c.dim(`Task: ${task.slice(0, 80)}...`));
    console.log(c.dim('⏳ Working...\n'));

    try {
      const history = [];
      const response = await this.loop.run(task, history, options);

      // Save session
      for (const msg of history) {
        this.sessionStore.saveMessage(sessionId, msg);
      }

      console.log(c.white(response));
      console.log(c.dim(`\n💾 Session: ${sessionId}`));
      return response;
    } catch (error) {
      console.error(c.red(`❌ Error: ${error.message}`));
      process.exit(1);
    }
  }
}

export default Runner;
