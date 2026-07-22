#!/usr/bin/env node

/**
 * SKYROS Agent — Entry Point
 * Independent AI Agent Runtime for KAIROS OS
 * 
 * Usage:
 *   node cli.js                     # Interactive REPL
 *   node cli.js "do something"      # One-shot task
 *   node cli.js --persona dev       # With specific persona
 *   node cli.js --provider groq     # With specific provider
 *   node cli.js --continue          # Resume last session
 *   node cli.js --resume <id>       # Resume specific session
 */

import { Command } from 'commander';
import chalk from 'chalk';

import { loadConfig } from './src/core/config.js';
import { AgentLoop } from './src/core/loop.js';
import { ProviderRouter } from './src/providers/router.js';
import { ToolRegistry } from './src/tools/registry.js';
import { ToolExecutor } from './src/tools/executor.js';
import { SessionStore } from './src/memory/session-store.js';
import { ContextCompactor } from './src/memory/context-compactor.js';
import { PersonaLoader } from './src/kairos/persona-loader.js';
import { ContextLoader } from './src/kairos/context-loader.js';
import { RPLoader } from './src/kairos/rp-loader.js';
import { MCPBridge } from './src/tools/mcp-bridge.js';
import { SyncClient } from './src/sync/supabase-client.js';
import { Hivemind } from './src/sync/hivemind.js';
import { Orchestrator } from './src/core/orchestrator.js';
import { Daemon } from './src/core/daemon.js';
import { REPL } from './src/cli/repl.js';
import { Runner } from './src/cli/runner.js';

// Built-in tools
import { bashTool } from './src/tools/builtin/bash.js';
import { readFileTool } from './src/tools/builtin/read_file.js';
import { writeFileTool } from './src/tools/builtin/write_file.js';
import { editFileTool } from './src/tools/builtin/edit_file.js';
import { listDirTool } from './src/tools/builtin/list_dir.js';
import { grepTool } from './src/tools/builtin/grep.js';
import { gitTool } from './src/tools/builtin/git.js';
import { webSearchTool } from './src/tools/builtin/web_search.js';
import { globTool } from './src/tools/builtin/glob.js';

// ═══════════════════════════════════════════════
// Bootstrap
// ═══════════════════════════════════════════════

function bootstrap() {
  // 1. Load config
  const config = loadConfig();

  // 2. Initialize provider router
  const router = new ProviderRouter(config);

  // 3. Initialize tool registry
  const registry = new ToolRegistry();
  registry.register(bashTool);
  registry.register(readFileTool);
  registry.register(writeFileTool);
  registry.register(editFileTool);
  registry.register(listDirTool);
  registry.register(grepTool);
  registry.register(gitTool);
  registry.register(webSearchTool);
  registry.register(globTool);

  // 4. Initialize tool executor
  const executor = new ToolExecutor(registry);

  // 5. Initialize KAIROS integrations
  const personaLoader = new PersonaLoader(config.paths.agents);
  const contextLoader = new ContextLoader(config.paths);
  const rpLoader = new RPLoader(config.paths.reasoningPackages);
  const sessionStore = new SessionStore(config.paths.sessions);
  const compactor = new ContextCompactor(router);

  // 6. Initialize MCP Bridge (Async syncTools handled in action)
  const mcpBridge = new MCPBridge({
    serverPath: config.paths.mcpServer,
    registry,
    chalk,
  });

  // 7. Initialize agent loop
  const loop = new AgentLoop({
    router,
    executor,
    config,
    onToolCall: ({ name, args, step }) => {
      const argsStr = JSON.stringify(args);
      const truncArgs = argsStr.length > 120 ? argsStr.slice(0, 120) + '...' : argsStr;
      console.log(chalk.yellow(`  [Tool] ${name}(${truncArgs})`));
    },
    onResponse: ({ model, usage, step }) => {
      const tokens = usage?.total_tokens || '?';
      console.log(chalk.dim(`  [${model} | ${tokens} tokens | step ${step + 1}]`));
    },
  });

  // 8. Initialize Sync Client (Multi-Instance)
  const syncClient = new SyncClient({
    supabaseUrl: config.sync.supabaseUrl,
    supabaseKey: config.sync.supabaseKey,
    agentId: config.sync.agentId,
    machineId: config.sync.machineId,
    chalk,
  });

  // 9. Initialize Hivemind Protocol
  const hivemind = new Hivemind({ syncClient, config, chalk });

  // 10. Initialize Orchestrator (Multi Sub-Agent Engine)
  const orchestrator = new Orchestrator({
    router,
    executor,
    config,
    personaLoader,
    chalk,
    onProgress: (info) => {
      if (info.status === 'running') {
        console.log(chalk.dim(`  ⚡ ${info.id} @${info.persona}: started`));
      }
    },
  });

  return { config, router, registry, executor, loop, personaLoader, contextLoader, rpLoader, sessionStore, compactor, mcpBridge, syncClient, hivemind, orchestrator };
}

// ═══════════════════════════════════════════════
// CLI Program
// ═══════════════════════════════════════════════

const program = new Command();

program
  .name('skyros')
  .description('✦ SKYROS Agent — Independent AI Runtime for KAIROS OS')
  .version('3.0.0')
  .argument('[task...]', 'Task to execute (one-shot mode)')
  .option('-p, --persona <id>', 'Agent persona to use (e.g. dev, architect)')
  .option('--provider <name>', 'Force specific provider (gemini, groq, huggingface)')
  .option('--model <name>', 'Force specific model')
  .option('--tier <level>', 'Complexity tier (light, medium, heavy, supreme, god)', 'medium')
  .option('-c, --continue', 'Resume the last session')
  .option('-r, --resume <id>', 'Resume a specific session')
  .option('--no-context', 'Skip loading SELF_CONTEXT and STATUS')
  .option('--list-sessions', 'List all saved sessions')
  .option('--list-personas', 'List available agent personas')
  .option('--sync-status', 'Show multi-instance sync status')
  .option('--hivemind', 'Show full hivemind status (all active agents)')
  .option('--orchestra', 'Execute task via multi-agent orchestration')
  .option('--spawn <persona>', 'Spawn a single sub-agent with persona')
  .option('--daemon', 'Run in daemon mode (autonomous task monitor)')
  .option('--lite', 'Skip MCP bridge (5 builtins only — lower token footprint)')
  .action(async (taskParts, options) => {
    const { config, loop, personaLoader, contextLoader, rpLoader, sessionStore, compactor, mcpBridge, syncClient, hivemind, orchestrator } = bootstrap();

    // Start MCP Bridge (skip in --lite mode for lower token footprint)
    if (!options.lite) {
      try {
        await mcpBridge.connect();
      } catch (err) {
        console.error(chalk.red(`⚠️ Failed to connect to KAIROS MCP Server: ${err.message}`));
      }
    }

    // Bootstrap Hivemind Protocol (replaces raw sync announce)
    if (syncClient.isConfigured()) {
      try {
        const hiveResult = await hivemind.bootstrap({ tier: options.tier, persona: options.persona });
        if (hiveResult.connected) {
          console.log(chalk.green(`🐝 Hivemind: Connected (${hiveResult.agentId.slice(-8)} @ ${hiveResult.machine})`));
        } else {
          console.error(chalk.yellow(`⚠️ Hivemind: ${hiveResult.reason}`));
        }
      } catch (err) {
        console.error(chalk.yellow(`⚠️ Hivemind: ${err.message}`));
      }
    }

    // Handle hivemind status
    if (options.hivemind) {
      await hivemind.printStatus();
      return;
    }

    // Daemon mode (autonomous, never returns)
    if (options.daemon) {
      const daemon = new Daemon({
        orchestrator,
        hivemind,
        syncClient,
        config,
        chalk,
      });
      await daemon.start();  // blocks forever
      return;
    }

    // Handle sync status
    if (options.syncStatus) {
      const status = await syncClient.getSyncStatus();
      console.log(chalk.cyan('\n🔄 Sync Status:'));
      if (status.error) {
        console.log(chalk.red(`  Error: ${status.error}`));
      } else if (!status.configured) {
        console.log(chalk.yellow('  Not configured — add SUPABASE_URL to .env'));
      } else {
        console.log(chalk.white(`  Recent events: ${status.recentEvents}`));
        console.log(chalk.white(`  Active claims: ${status.activeClaims}`));
        console.log(chalk.white(`  Recent decisions: ${status.recentDecisions}`));
        console.log(chalk.white(`  Active agents: ${status.activeAgents?.join(', ') || 'none'}`));
      }
      return;
    }

    // Handle list commands
    if (options.listSessions) {
      const sessions = sessionStore.list();
      console.log(chalk.cyan(`\n💾 Sessions (${sessions.length}):`));
      for (const s of sessions.slice(0, 20)) {
        const date = new Date(s.modified).toLocaleString();
        console.log(chalk.white(`  ${s.id} | ${date} | ${s.events} events | ${s.preview}`));
      }
      return;
    }

    if (options.listPersonas) {
      const personas = personaLoader.list();
      console.log(chalk.cyan('\n🎭 Available Personas:'));
      for (const p of personas) {
        const loaded = personaLoader.load(p);
        console.log(chalk.white(`  ${p}${loaded?.title !== p ? ` — ${loaded.title}` : ''}`));
      }
      return;
    }

    // Build system prompt
    let systemPrompt = config.agent.systemPrompt;

    // Load persona if specified
    if (options.persona) {
      const persona = personaLoader.load(options.persona);
      if (persona) {
        systemPrompt = persona.systemPrompt;
        console.log(chalk.green(`🎭 Persona: ${persona.title}`));
      } else {
        console.error(chalk.red(`❌ Persona not found: ${options.persona}`));
        console.log(chalk.dim(`Available: ${personaLoader.list().join(', ')}`));
        process.exit(1);
      }
    }

    // Inject KAIROS context
    if (options.context !== false) {
      const contextStr = contextLoader.load();
      if (contextStr) {
        systemPrompt += '\n\n' + contextStr;
      }
    }

    const runOptions = {
      systemPrompt,
      tier: options.tier,
      provider: options.provider,
      model: options.model,
    };

    // One-shot mode
    const task = taskParts.join(' ');
    if (task) {
      // Orchestrated mode
      if (options.orchestra) {
        await orchestrator.execute(task, {
          decompose: true,
          maxAgents: 4,
          qaPass: true,
          tier: options.tier,
        });
        return;
      }

      // Spawn single sub-agent
      if (options.spawn) {
        const result = await orchestrator.spawn(options.spawn, task, { tier: options.tier });
        console.log(chalk.white(result));
        return;
      }

      // Standard one-shot
      const runner = new Runner({ loop, sessionStore, config, chalk });
      await runner.run(task, runOptions);
      return;
    }

    // Interactive REPL mode
    const repl = new REPL({
      loop,
      sessionStore,
      personaLoader,
      rpLoader,
      compactor,
      config,
      chalk,
      hivemind,
      orchestrator,
    });

    // Apply persona if set
    if (options.persona) {
      const persona = personaLoader.load(options.persona);
      if (persona) {
        repl.currentPersona = persona;
        repl.systemPrompt = persona.systemPrompt;
      }
    }

    // Inject context into REPL system prompt
    if (options.context !== false) {
      const contextStr = contextLoader.load();
      if (contextStr) {
        repl.systemPrompt += '\n\n' + contextStr;
      }
    }

    // Resume or new session
    if (options.continue) {
      const lastId = sessionStore.getLastSession();
      if (lastId) {
        await repl.start(lastId);
      } else {
        console.log(chalk.yellow('No previous session found. Starting new.'));
        await repl.start();
      }
    } else if (options.resume) {
      await repl.start(options.resume);
    } else {
      await repl.start();
    }

    // Graceful shutdown
    const gracefulShutdown = async () => {
      await hivemind.shutdown('Session ended by user');
      process.exit(0);
    };
    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
  });

program.parse();
