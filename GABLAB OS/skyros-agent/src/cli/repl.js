/**
 * SKYROS Agent — Interactive REPL
 * Lightweight readline-based REPL with colored output
 * Zero GUI, zero React/Ink — pure Node.js readline
 */

import { createInterface } from 'readline';

export class REPL {
  /**
   * @param {Object} options
   * @param {AgentLoop} options.loop
   * @param {SessionStore} options.sessionStore
   * @param {PersonaLoader} options.personaLoader
   * @param {RPLoader} options.rpLoader
   * @param {ContextCompactor} options.compactor
   * @param {Object} options.config
   * @param {Function} options.chalk - chalk instance for colors
   */
  constructor(options) {
    this.loop = options.loop;
    this.sessionStore = options.sessionStore;
    this.personaLoader = options.personaLoader;
    this.rpLoader = options.rpLoader;
    this.compactor = options.compactor;
    this.config = options.config;
    this.chalk = options.chalk;
    this.hivemind = options.hivemind || null;
    this.orchestrator = options.orchestrator || null;

    this.history = [];
    this.sessionId = null;
    this.currentPersona = null;
    this.systemPrompt = options.config.agent.systemPrompt;
    this.running = false;
  }

  /**
   * Start a new session or resume
   */
  async start(resumeSessionId = null) {
    const c = this.chalk;

    if (resumeSessionId) {
      this.sessionId = resumeSessionId;
      this.history = this.sessionStore.loadHistory(resumeSessionId);
      console.log(c.yellow(`📂 Resumed session: ${resumeSessionId} (${this.history.length} messages)`));
    } else {
      this.sessionId = this.sessionStore.newId();
      console.log(c.dim(`Session: ${this.sessionId}`));
    }

    // Print banner
    this.printBanner();

    // Start REPL
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: c.cyan('\n❯ '),
      terminal: true,
    });

    this.running = true;
    rl.prompt();

    rl.on('line', async (line) => {
      const input = line.trim();
      if (!input) { rl.prompt(); return; }

      // Handle special commands
      if (input.startsWith('*') || input.startsWith('/')) {
        const handled = await this.handleCommand(input);
        if (handled === 'exit') { rl.close(); return; }
        if (handled) { rl.prompt(); return; }
      }

      // Run the agent
      try {
        console.log(c.dim('⏳ Thinking...'));
        
        // Check if compaction is needed
        if (this.compactor.needsCompaction(this.history)) {
          console.log(c.yellow('📦 Compacting context...'));
          this.history = await this.compactor.compact(this.history);
        }

        const response = await this.loop.run(input, this.history, {
          systemPrompt: this.systemPrompt,
        });

        // Save to session
        this.sessionStore.saveMessage(this.sessionId, { role: 'user', content: input });
        this.sessionStore.saveMessage(this.sessionId, { role: 'assistant', content: response });

        // Print response
        console.log('\n' + c.white(response));
      } catch (error) {
        console.error(c.red(`\n❌ Error: ${error.message}`));
        if (error.status === 429) {
          console.error(c.yellow('💡 All API keys rate-limited. Wait a moment and try again.'));
        }
      }

      rl.prompt();
    });

    rl.on('close', () => {
      this.running = false;
      console.log(this.chalk.dim(`\n💾 Session saved: ${this.sessionId}`));
      process.exit(0);
    });
  }

  /**
   * Handle * and / commands
   */
  async handleCommand(input) {
    const c = this.chalk;
    const cmd = input.slice(1).toLowerCase().split(' ');
    const name = cmd[0];
    const args = cmd.slice(1).join(' ');

    switch (name) {
      case 'exit':
      case 'quit':
      case 'q':
        return 'exit';

      case 'help':
      case 'h':
        console.log(c.cyan(`
╔════════════════════════════════════════╗
║        SKORTEX v3.0 Commands           ║
╠════════════════════════════════════════╣
║  *help          Show this help         ║
║  *status        Show system status     ║
║  *hivemind      Hivemind agent map     ║
║  *spawn <p> <t> Spawn sub-agent        ║
║  *orchestra <t> Multi-agent task       ║
║  *persona <id>  Switch agent persona   ║
║  *personas      List available agents  ║
║  *rp <name>     Load Reasoning Package ║
║  *rps           List available RPs     ║
║  *sessions      List saved sessions    ║
║  *compact       Force context compact  ║
║  *clear         Clear conversation     ║
║  *exit          Exit SKORTEX           ║
╚════════════════════════════════════════╝`));
        return true;

      case 'status':
        const router = this.loop.router;
        const status = router.getStatus();
        console.log(c.cyan('\n📊 SKYROS Status:'));
        for (const [name, info] of Object.entries(status)) {
          console.log(c.white(`  ${name}: ${info.keys} keys, ${info.model}, ${info.totalRpm} RPM`));
        }
        console.log(c.white(`  Session: ${this.sessionId}`));
        console.log(c.white(`  History: ${this.history.length} messages`));
        console.log(c.white(`  Tokens (est): ~${this.compactor.estimateTokens(this.history)}`));
        if (this.currentPersona) {
          console.log(c.white(`  Persona: ${this.currentPersona.title}`));
        }
        return true;

      case 'persona':
      case 'p':
        if (!args) {
          console.log(c.yellow('Usage: *persona <agent-id> (e.g. *persona dev)'));
          return true;
        }
        const persona = this.personaLoader.load(args);
        if (!persona) {
          console.log(c.red(`❌ Persona not found: ${args}`));
          console.log(c.dim(`Available: ${this.personaLoader.list().join(', ')}`));
          return true;
        }
        this.currentPersona = persona;
        this.systemPrompt = persona.systemPrompt;
        console.log(c.green(`🎭 Switched to: ${persona.title}`));
        return true;

      case 'personas':
        const personas = this.personaLoader.list();
        console.log(c.cyan('\n🎭 Available Personas:'));
        for (const p of personas) {
          const loaded = this.personaLoader.load(p);
          const marker = this.currentPersona?.id === p ? c.green(' ◀ active') : '';
          console.log(c.white(`  ${p}${loaded?.title !== p ? ` — ${loaded?.title}` : ''}${marker}`));
        }
        return true;

      case 'rp':
        if (!args) {
          console.log(c.yellow('Usage: *rp <name> (e.g. *rp codex-gigas)'));
          return true;
        }
        const rp = this.rpLoader.load(args);
        if (!rp) {
          console.log(c.red(`❌ RP not found: ${args}`));
          const matches = this.rpLoader.search(args);
          if (matches.length > 0) {
            console.log(c.dim(`Did you mean: ${matches.map(m => m.filename).join(', ')}`));
          }
          return true;
        }
        // Inject RP as user message
        this.history.push({
          role: 'user',
          content: `[Reasoning Package loaded: ${rp.filename}]\n\n${rp.content}`,
        });
        this.history.push({
          role: 'assistant',
          content: `📄 Loaded RP: ${rp.filename} (${rp.category}). I've internalized this reasoning package and will apply it to our work.`,
        });
        console.log(c.green(`📄 Loaded RP: ${rp.filename} (${rp.category}, ${(rp.content.length / 1024).toFixed(1)}KB)`));
        return true;

      case 'rps':
        const rps = this.rpLoader.list();
        console.log(c.cyan('\n📄 Available Reasoning Packages:'));
        for (const [cat, files] of Object.entries(rps)) {
          console.log(c.yellow(`  [${cat}]`));
          for (const f of files.slice(0, 10)) {
            console.log(c.white(`    ${f}`));
          }
          if (files.length > 10) {
            console.log(c.dim(`    ... and ${files.length - 10} more`));
          }
        }
        return true;

      case 'sessions':
        const sessions = this.sessionStore.list();
        console.log(c.cyan(`\n💾 Sessions (${sessions.length}):`));
        for (const s of sessions.slice(0, 10)) {
          const date = new Date(s.modified).toLocaleString();
          const active = s.id === this.sessionId ? c.green(' ◀ current') : '';
          console.log(c.white(`  ${s.id} | ${date} | ${s.events} events | ${s.preview}${active}`));
        }
        return true;

      case 'compact':
        console.log(c.yellow('📦 Compacting context...'));
        this.history = await this.compactor.compact(this.history);
        console.log(c.green(`✅ Compacted to ${this.history.length} messages`));
        return true;

      case 'hivemind':
      case 'hive':
        if (this.hivemind) {
          await this.hivemind.printStatus();
        } else {
          console.log(c.yellow('⚠️ Hivemind not initialized'));
        }
        return true;

      case 'spawn':
        if (!this.orchestrator) {
          console.log(c.yellow('⚠️ Orchestrator not initialized'));
          return true;
        }
        if (!args) {
          console.log(c.yellow('Usage: *spawn <persona> <task>  (e.g. *spawn dev "create hello.py")'));
          return true;
        }
        {
          const spaceIdx = args.indexOf(' ');
          if (spaceIdx === -1) {
            console.log(c.yellow('Usage: *spawn <persona> <task>'));
            return true;
          }
          const spawnPersona = args.slice(0, spaceIdx);
          const spawnTask = args.slice(spaceIdx + 1);
          try {
            const result = await this.orchestrator.spawn(spawnPersona, spawnTask);
            console.log('\n' + c.white(result));
            // Add to history so conversation stays aware
            this.history.push({ role: 'assistant', content: `[SubAgent @${spawnPersona}]: ${result}` });
          } catch (err) {
            console.log(c.red(`❌ SubAgent error: ${err.message}`));
          }
        }
        return true;

      case 'orchestra':
        if (!this.orchestrator) {
          console.log(c.yellow('⚠️ Orchestrator not initialized'));
          return true;
        }
        if (!args) {
          console.log(c.yellow('Usage: *orchestra <complex task description>'));
          return true;
        }
        try {
          const orchResult = await this.orchestrator.execute(args, {
            decompose: true,
            maxAgents: 4,
            qaPass: true,
          });
          // Inject summary into history
          const summary = Object.entries(orchResult.results)
            .map(([id, r]) => `[${id}/@${r.persona}]: ${r.status}`)
            .join(', ');
          this.history.push({ role: 'assistant', content: `[Orchestration complete: ${summary}]` });
        } catch (err) {
          console.log(c.red(`❌ Orchestration error: ${err.message}`));
        }
        return true;

      case 'clear':
        this.history = [];
        this.sessionId = this.sessionStore.newId();
        console.log(c.green(`🔄 Cleared. New session: ${this.sessionId}`));
        return true;

      default:
        console.log(c.dim(`Unknown command: ${name}. Type *help for available commands.`));
        return true;
    }
  }

  /**
   * Print the welcome banner
   */
  printBanner() {
    const c = this.chalk;
    const router = this.loop.router;
    const status = router.getStatus();
    const providers = Object.entries(status)
      .map(([name, info]) => `${name}(${info.keys}keys/${info.totalRpm}rpm)`)
      .join(' + ');

    console.log(c.cyan(`
╔═══════════════════════════════════════════════╗
║       ✦ SKORTEX v3.0 ✦                       ║
║       Sovereign CLI Engine for KAIROS         ║
╠═══════════════════════════════════════════════╣
║  Providers: ${providers.padEnd(33)}║
║  Tools: ${(this.loop.executor.registry.size + ' registered').padEnd(37)}║
║  Type *help for commands                      ║
╚═══════════════════════════════════════════════╝`));

    if (this.currentPersona) {
      console.log(c.green(`  🎭 Persona: ${this.currentPersona.title}`));
    }
  }
}

export default REPL;
