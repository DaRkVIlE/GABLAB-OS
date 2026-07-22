#!/usr/bin/env node
/**
 * SKORTEX — Multi-Agent Spawner
 * Spawna N agentes SKYROS headless em paralelo, cada um com sua task.
 * 
 * Diferencial vs Antigravity:
 *   - Spawna quantos agentes quiser (limitado apenas por API keys)
 *   - Cada agente registra-se no Supabase (kairos_task_claims)
 *   - Semáforo anti-conflito via task claims com heartbeat
 *   - Resultado consolidado ao final
 * 
 * Usage:
 *   node spawner.js run tasks.json                  # Executa tasks de um arquivo
 *   node spawner.js run --tasks "task1" "task2"     # Tasks inline
 *   node spawner.js run --from-roadmap              # Extrai P0 do roadmap.md
 *   node spawner.js status                          # Mostra agentes ativos
 *   node spawner.js kill                            # Mata todos os agentes
 * 
 * tasks.json format:
 *   [
 *     { "task": "...", "persona": "dev", "tier": "medium" },
 *     { "task": "...", "persona": "architect", "tier": "heavy" }
 *   ]
 */

import { fork } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI_PATH = resolve(__dirname, 'cli.js');
const PROJECT_ROOT = resolve(__dirname, '..');

// ══════════════════════════════════════════
// AGENT PROCESS MANAGEMENT
// ══════════════════════════════════════════

class AgentProcess {
  constructor(id, task, options = {}) {
    this.id = id;
    this.task = task;
    this.persona = options.persona || null;
    this.tier = options.tier || 'medium';
    this.provider = options.provider || null;
    this.model = options.model || null;
    this.noContext = options.noContext || false;
    this.process = null;
    this.output = '';
    this.status = 'pending';   // pending → running → done → failed
    this.startedAt = null;
    this.finishedAt = null;
    this.exitCode = null;
  }

  start() {
    return new Promise((resolve, reject) => {
      const args = [this.task];
      if (this.persona) args.push('--persona', this.persona);
      if (this.tier) args.push('--tier', this.tier);
      if (this.provider) args.push('--provider', this.provider);
      if (this.model) args.push('--model', this.model);
      if (this.noContext) args.push('--no-context');
      args.push('--lite');  // Always use lite mode in spawner (5 builtins, no MCP 27-tool overhead)

      this.status = 'running';
      this.startedAt = new Date();
      
      this.process = fork(CLI_PATH, args, {
        cwd: __dirname,
        silent: true,
        env: { ...process.env, SKORTEX_AGENT_ID: this.id },
      });

      this.process.stdout.on('data', (data) => {
        this.output += data.toString();
      });

      this.process.stderr.on('data', (data) => {
        this.output += data.toString();
      });

      this.process.on('exit', (code) => {
        this.exitCode = code;
        this.finishedAt = new Date();
        this.status = code === 0 ? 'done' : 'failed';
        resolve(this);
      });

      this.process.on('error', (err) => {
        this.status = 'failed';
        this.finishedAt = new Date();
        this.output += `\nProcess error: ${err.message}`;
        reject(err);
      });
    });
  }

  kill() {
    if (this.process && this.status === 'running') {
      this.process.kill('SIGTERM');
      this.status = 'killed';
      this.finishedAt = new Date();
    }
  }

  getResult() {
    // Extract the final assistant response (last meaningful text)
    const lines = this.output.split('\n').filter(l => 
      l.trim() && 
      !l.startsWith('🔧') && !l.startsWith('🔌') && !l.startsWith('🐝') &&
      !l.startsWith('Session:') && !l.startsWith('Task:') && !l.startsWith('⏳') &&
      !l.startsWith('💾') && !l.startsWith('  [') && !l.includes('MODULE_TYPELESS')
    );
    return lines.join('\n').trim();
  }

  getDuration() {
    if (!this.startedAt) return 0;
    const end = this.finishedAt || new Date();
    return Math.round((end - this.startedAt) / 1000);
  }
}

// ══════════════════════════════════════════
// SPAWNER ORCHESTRATOR
// ══════════════════════════════════════════

class Spawner {
  constructor() {
    this.agents = [];
    this.maxConcurrent = 4;   // default: 4 agentes simultâneos
  }

  /**
   * Add a task to the queue
   */
  addTask(task, options = {}) {
    const id = `agent-${this.agents.length + 1}`;
    this.agents.push(new AgentProcess(id, task, options));
    return id;
  }

  /**
   * Run all tasks with concurrency control
   */
  async runAll(concurrency = null) {
    const max = concurrency || this.maxConcurrent;
    const total = this.agents.length;
    
    console.log(`\n╔══════════════════════════════════════════════╗`);
    console.log(`║  🧠 SKORTEX Multi-Agent Spawner              ║`);
    console.log(`║  Agents: ${total}  |  Concurrency: ${max}              ║`);
    console.log(`╚══════════════════════════════════════════════╝\n`);

    const results = [];
    const queue = [...this.agents];
    const active = new Set();

    const runNext = async () => {
      if (queue.length === 0) return;
      const agent = queue.shift();
      active.add(agent.id);
      
      const num = total - queue.length;
      console.log(`▶ [${num}/${total}] ${agent.id} starting: ${agent.task.slice(0, 60)}...`);
      if (agent.persona) console.log(`  🎭 Persona: ${agent.persona} | Tier: ${agent.tier}`);

      try {
        await agent.start();
        const icon = agent.status === 'done' ? '✅' : '❌';
        console.log(`${icon} [${agent.id}] ${agent.status} (${agent.getDuration()}s)`);
      } catch (e) {
        console.log(`❌ [${agent.id}] crashed: ${e.message}`);
      }

      active.delete(agent.id);
      results.push(agent);
      
      // Start next in queue
      if (queue.length > 0) {
        await runNext();
      }
    };

    // Launch up to `max` concurrent agents
    const runners = [];
    for (let i = 0; i < Math.min(max, total); i++) {
      runners.push(runNext());
    }
    await Promise.all(runners);

    this.printSummary(results);
    return results;
  }

  /**
   * Print final summary
   */
  printSummary(results) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`  SKORTEX — Execution Summary`);
    console.log(`${'═'.repeat(60)}`);

    const succeeded = results.filter(r => r.status === 'done').length;
    const failed = results.filter(r => r.status !== 'done').length;
    const totalTime = results.reduce((s, r) => s + r.getDuration(), 0);

    console.log(`  ✅ Succeeded: ${succeeded}/${results.length}`);
    if (failed) console.log(`  ❌ Failed: ${failed}`);
    console.log(`  ⏱️  Total time: ${totalTime}s`);
    console.log(`${'═'.repeat(60)}`);

    for (const r of results) {
      const icon = r.status === 'done' ? '✅' : '❌';
      console.log(`\n${icon} ${r.id} (${r.persona || 'default'}) — ${r.getDuration()}s`);
      console.log(`   Task: ${r.task.slice(0, 80)}`);
      const result = r.getResult();
      if (result) {
        const preview = result.length > 200 ? result.slice(0, 200) + '...' : result;
        console.log(`   Result: ${preview}`);
      }
    }

    // Save results to file
    const reportPath = resolve(__dirname, 'sessions', `spawn-${Date.now()}.json`);
    const report = results.map(r => ({
      id: r.id,
      task: r.task,
      persona: r.persona,
      tier: r.tier,
      status: r.status,
      duration: r.getDuration(),
      result: r.getResult(),
      exitCode: r.exitCode,
      startedAt: r.startedAt,
      finishedAt: r.finishedAt,
    }));

    try {
      writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n💾 Report saved: ${reportPath}`);
    } catch {
      // sessions dir might not exist, non-critical
    }
  }
}

// ══════════════════════════════════════════
// CLI INTERFACE
// ══════════════════════════════════════════

function printHelp() {
  console.log(`
╔══════════════════════════════════════════════╗
║  🧠 SKORTEX — Multi-Agent Spawner           ║
╠══════════════════════════════════════════════╣
║                                              ║
║  run <tasks.json>     Run tasks from file    ║
║  run --tasks "a" "b"  Run inline tasks       ║
║  run --pull           Pull from Supabase DB  ║
║  run --demo           Run demo (3 agents)    ║
║  status               Show Supabase status   ║
║                                              ║
║  Options:                                    ║
║    --concurrency N    Max parallel agents     ║
║    --provider NAME    Force provider          ║
║    --model NAME       Force model             ║
║    --tier LEVEL       Complexity tier         ║
║    --no-context       Skip KAIROS context     ║
║                                              ║
╚══════════════════════════════════════════════╝
`);
}

function getArg(args, flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : null;
}

function hasFlag(args, flag) {
  return args.includes(flag);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help') {
    printHelp();
    return;
  }

  if (command === 'status') {
    // Use shared-brain-bus for status
    const { execSync } = await import('child_process');
    execSync(`node ${resolve(PROJECT_ROOT, 'scripts', 'shared-brain-bus.js')} status`, {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
    });
    return;
  }

  if (command === 'run') {
    const spawner = new Spawner();
    const concurrency = parseInt(getArg(args, '--concurrency') || '4');
    const globalProvider = getArg(args, '--provider');
    const globalModel = getArg(args, '--model');
    const globalTier = getArg(args, '--tier') || 'medium';
    const noContext = hasFlag(args, '--no-context');

    const baseOptions = {
      provider: globalProvider,
      model: globalModel,
      tier: globalTier,
      noContext,
    };

    if (hasFlag(args, '--pull')) {
      const { loadConfig } = await import('./src/core/config.js');
      const { SyncClient } = await import('./src/sync/supabase-client.js');
      const config = loadConfig();
      const syncClient = new SyncClient({
        supabaseUrl: config.sync.supabaseUrl,
        supabaseKey: config.sync.supabaseKey,
        agentId: config.sync.agentId + '-spawner',
        machineId: config.sync.machineId,
      });

      if (!syncClient.isConfigured()) {
        console.error('❌ Supabase not configured in .env');
        process.exit(1);
      }

      console.log(`\n╔══════════════════════════════════════════════╗`);
      console.log(`║  🧠 SKORTEX Spawner — Pull Mode Active       ║`);
      console.log(`║  Polling Supabase every 15s for tasks...     ║`);
      console.log(`╚══════════════════════════════════════════════╝\n`);

      const pollLoop = async () => {
        try {
          const unclaimed = await syncClient.getUnclaimedTasks();
          if (unclaimed && unclaimed.length > 0) {
            const toProcess = unclaimed.slice(0, concurrency);
            spawner.agents = [];
            const agentToTaskMap = new Map();

            for (const task of toProcess) {
              const taskId = task.task_id;
              const taskName = task.task_name || `Execute task ${taskId}`;
              
              const claimed = await syncClient.claimDaemonTask(taskId);
              if (claimed) {
                 const agentId = spawner.addTask(taskName, baseOptions);
                 agentToTaskMap.set(agentId, taskId);
              }
            }

            if (spawner.agents.length > 0) {
               console.log(`\n🔔 Auto-claimed ${spawner.agents.length} tasks! Spawning subprocesses...`);
               const results = await spawner.runAll(concurrency);
               
               for (const r of results) {
                 const taskId = agentToTaskMap.get(r.id);
                 if (r.status === 'done') {
                   const resultText = r.getResult()?.slice(0, 500) || 'Task completed successfully.';
                   await syncClient.completeTask(taskId, resultText);
                   console.log(`✅ Supabase Task completed: ${taskId}`);
                 } else {
                   await syncClient.releaseTask(taskId);
                   console.log(`♻️ Released failed task back to pool: ${taskId}`);
                 }
               }
               console.log(`\n⏱️  Resuming polling...`);
            }
          }
        } catch (err) {
          if (err.message !== 'Failed to fetch') {
            console.error(`[poll error] ${err.message}`);
          }
        }
        setTimeout(pollLoop, 15000);
      };
      
      pollLoop();
      return;
    } else if (hasFlag(args, '--demo')) {
      // Demo mode: 3 parallel agents doing simple tasks
      spawner.addTask('List the files in the current directory', { ...baseOptions, persona: null });
      spawner.addTask('What is the current date and time?', { ...baseOptions, persona: null });
      spawner.addTask('Read SELF_CONTEXT.md and summarize it in 2 sentences', { ...baseOptions, persona: null });
    } else if (hasFlag(args, '--tasks')) {
      // Inline tasks: everything after --tasks
      const tasksIdx = args.indexOf('--tasks');
      const tasks = args.slice(tasksIdx + 1).filter(t => !t.startsWith('--'));
      for (const task of tasks) {
        spawner.addTask(task, baseOptions);
      }
    } else if (args[1] && !args[1].startsWith('-')) {
      // Tasks from JSON file
      const filePath = resolve(process.cwd(), args[1]);
      if (!existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        process.exit(1);
      }
      const tasks = JSON.parse(readFileSync(filePath, 'utf-8'));
      for (const t of tasks) {
        spawner.addTask(t.task, {
          persona: t.persona || baseOptions.persona,
          tier: t.tier || baseOptions.tier,
          provider: t.provider || baseOptions.provider,
          model: t.model || baseOptions.model,
          noContext: t.noContext ?? baseOptions.noContext,
        });
      }
    } else {
      console.error('❌ Provide tasks: --tasks "..." or a tasks.json file or --demo or --pull');
      process.exit(1);
    }

    if (spawner.agents.length === 0) {
      console.error('❌ No tasks to run');
      process.exit(1);
    }

    await spawner.runAll(concurrency);
  }
}

main().catch(console.error);
