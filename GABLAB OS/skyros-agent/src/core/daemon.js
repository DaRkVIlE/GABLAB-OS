/**
 * SKORTEX — Daemon Mode
 * Autonomous background agent that monitors Supabase for unclaimed tasks,
 * auto-claims them, spawns sub-agents, and reports results.
 * 
 * Pattern: S11 (Autonomous Agents — "Self-Claim de Tarefas")
 *          + S08 (Background Tasks — "Pensamento Contínuo")
 * from SKYROS-ARCHITECTURE-GOLD RP
 *
 * Usage:
 *   const daemon = new Daemon({ orchestrator, hivemind, scheduler, syncClient, config, chalk });
 *   await daemon.start();  // Runs indefinitely until stopped
 */

import { readFileSync, existsSync } from 'fs';
import { Scheduler } from './scheduler.js';

export class Daemon {
  /**
   * @param {Object} options
   * @param {import('./orchestrator.js').Orchestrator} options.orchestrator
   * @param {import('../sync/hivemind.js').Hivemind} options.hivemind
   * @param {import('../sync/supabase-client.js').SyncClient} options.syncClient
   * @param {Object} options.config
   * @param {Function} [options.chalk]
   */
  constructor({ orchestrator, hivemind, syncClient, config, chalk }) {
    this.orchestrator = orchestrator;
    this.hivemind = hivemind;
    this.syncClient = syncClient;
    this.config = config;
    this.chalk = chalk || ((s) => s);
    this.running = false;
    this.processing = false;
    this.processedTasks = new Set();
    this.stats = { claimed: 0, completed: 0, errors: 0, started: null };

    // Internal scheduler for daemon routines
    this.scheduler = new Scheduler({ chalk });
  }

  // ═══════════════════════════════════════════════
  // Start / Stop
  // ═══════════════════════════════════════════════

  /**
   * Start the daemon — runs indefinitely
   */
  async start() {
    const c = this.chalk;

    if (!this.syncClient.isConfigured()) {
      console.log(c.red('❌ Daemon requires Supabase. Set SUPABASE_URL in .env'));
      return;
    }

    this.running = true;
    this.stats.started = Date.now();

    // Bootstrap hivemind
    await this.hivemind.bootstrap({ mode: 'daemon' });

    console.log(c.cyan('\n╔═══════════════════════════════════════════╗'));
    console.log(c.cyan('║       🤖 SKORTEX DAEMON MODE              ║'));
    console.log(c.cyan('║       Autonomous Agent — Self-Claim S11    ║'));
    console.log(c.cyan('╠═══════════════════════════════════════════╣'));
    console.log(c.white(`║  Agent: ${this.config.sync.agentId.slice(-8)} @ ${this.config.sync.machineId}`));
    console.log(c.white(`║  Poll interval: 30s`));
    console.log(c.white(`║  Ctrl+C to stop`));
    console.log(c.cyan('╚═══════════════════════════════════════════╝\n'));

    // Register scheduled jobs
    this.scheduler.register('heartbeat', {
      intervalMs: 30_000,
      handler: () => this.hivemind.startHeartbeat ? null : this.syncClient.publishEvent('heartbeat', {
        agentId: this.config.sync.agentId,
        machine: this.config.sync.machineId,
        mode: 'daemon',
        uptime: Math.floor((Date.now() - this.stats.started) / 1000),
      }),
      silent: true,
    });

    this.scheduler.register('context-sync', {
      intervalMs: 5 * 60_000,  // every 5 minutes
      handler: () => this.hivemind.syncContextBidirectional(),
      immediate: true,
      silent: true,
    });

    this.scheduler.register('task-poll', {
      intervalMs: 30_000,  // every 30 seconds
      handler: () => this.pollAndClaim(),
      immediate: true,
      silent: false,
    });

    this.scheduler.register('roadmap-scan', {
      intervalMs: 15 * 60_000,  // every 15 minutes
      handler: () => this.scanRoadmap(),
      immediate: true,
      silent: false,
    });

    // Start the scheduler
    await this.scheduler.start();

    // Keep alive
    console.log(c.green('🟢 Daemon active — monitoring for tasks...'));

    // Graceful shutdown
    const shutdown = async () => {
      console.log(c.yellow('\n⏹️  Shutting down daemon...'));
      await this.stop();
      process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    // Keep process alive
    await new Promise(() => {}); // Never resolves — keeps daemon running
  }

  /**
   * Stop the daemon gracefully
   */
  async stop() {
    const c = this.chalk;
    this.running = false;
    this.scheduler.stop();

    // Final sync
    await this.hivemind.shutdown(`Daemon stopped. Claimed: ${this.stats.claimed}, Completed: ${this.stats.completed}, Errors: ${this.stats.errors}`);

    console.log(c.dim(`\n📊 Daemon stats: ${this.stats.claimed} claimed, ${this.stats.completed} completed, ${this.stats.errors} errors`));
  }

  // ═══════════════════════════════════════════════
  // Task Polling & Auto-Claim (S11 Core)
  // ═══════════════════════════════════════════════

  /**
   * Poll Supabase for unclaimed tasks and auto-claim them
   */
  async pollAndClaim() {
    if (!this.running || this.processing) return;
    const c = this.chalk;

    try {
      // Check for unclaimed tasks
      const unclaimedTasks = await this.syncClient.getUnclaimedTasks();

      if (!unclaimedTasks || unclaimedTasks.length === 0) return;

      // Filter out already processed tasks
      const newTasks = unclaimedTasks.filter(t => !this.processedTasks.has(t.id));
      if (newTasks.length === 0) return;

      console.log(c.yellow(`\n🔔 Found ${newTasks.length} unclaimed task(s)!`));

      // Check if we are the leader — only leader auto-claims
      const election = await this.hivemind.electLeader();
      if (!election.isLeader) {
        console.log(c.dim(`   Skipping — leader is ${election.leaderId.slice(-8)} (not us)`));
        return;
      }

      // Process the first task (one at a time)
      const task = newTasks[0];
      await this.executeTask(task);
    } catch (err) {
      // Silent — polling errors are non-fatal
      if (err.message !== 'Failed to fetch') {
        console.error(c.dim(`[poll] ${err.message}`));
      }
    }
  }

  /**
   * Claim and execute a single task
   */
  async executeTask(task) {
    const c = this.chalk;
    this.processing = true;

    try {
      // Try to claim it
      const claimed = await this.syncClient.claimTask(task.id);
      if (!claimed) {
        console.log(c.dim(`   Task ${task.id} already claimed by another agent`));
        this.processedTasks.add(task.id);
        return;
      }

      this.stats.claimed++;
      this.processedTasks.add(task.id);

      console.log(c.green(`✅ Claimed task: ${task.description?.slice(0, 60) || task.id}`));

      // Log decision
      await this.syncClient.logDecision(
        `Auto-claimed task: ${task.id}`,
        `Daemon @${this.config.sync.machineId} executing: ${task.description}`,
        'medium'
      );

      // Execute via orchestrator
      const result = await this.orchestrator.spawn(
        task.persona || 'dev',
        task.description || task.task || `Execute task ${task.id}`,
        { tier: task.tier || 'medium' }
      );

      // Mark complete
      await this.syncClient.completeTask(task.id, result?.slice(0, 500));
      this.stats.completed++;

      console.log(c.green(`✅ Task ${task.id} completed successfully`));

      // Log decision
      await this.syncClient.logDecision(
        `Task completed: ${task.id}`,
        `Result: ${result?.slice(0, 200) || 'done'}`,
        'low'
      );
    } catch (err) {
      this.stats.errors++;
      console.error(c.red(`❌ Task ${task.id} failed: ${err.message}`));

      // Try to release the claim
      try {
        await this.syncClient.releaseTask(task.id);
      } catch {
        // Best effort
      }
    } finally {
      this.processing = false;
    }
  }

  // ═══════════════════════════════════════════════
  // Roadmap Scanner — Local P0 Detection
  // ═══════════════════════════════════════════════

  /**
   * Scan roadmap.md for P0 tasks and publish them as claimable events
   */
  async scanRoadmap() {
    const c = this.chalk;
    const roadmapPath = this.config.paths.roadmap;

    if (!roadmapPath || !existsSync(roadmapPath)) return;

    try {
      const content = readFileSync(roadmapPath, 'utf-8');

      // Find P0 tasks that are not completed
      const p0Regex = /\|\s*\d+\s*\|[^|]+\|([^|]+)\|\s*P0\s*\|\s*((?!Concluído|✅)[^|]+)\|/gi;
      const p0Tasks = [];
      let match;

      while ((match = p0Regex.exec(content)) !== null) {
        const desc = match[1].trim();
        const status = match[2].trim();
        // Skip completed tasks
        if (!status.includes('Conclu') && !status.includes('✅')) {
          p0Tasks.push({ description: desc, status });
        }
      }

      if (p0Tasks.length > 0) {
        console.log(c.yellow(`📋 Roadmap scan: ${p0Tasks.length} P0 task(s) pending`));
        for (const t of p0Tasks) {
          console.log(c.white(`   🎯 ${t.description} [${t.status}]`));
        }
      }
    } catch {
      // Non-fatal
    }
  }

  // ═══════════════════════════════════════════════
  // Status
  // ═══════════════════════════════════════════════

  /**
   * Print daemon status
   */
  printStatus() {
    const c = this.chalk;
    const uptime = this.stats.started
      ? Math.floor((Date.now() - this.stats.started) / 1000)
      : 0;

    console.log(c.cyan('\n🤖 Daemon Status:'));
    console.log(c.white(`   Running: ${this.running ? '✅' : '⏸️'}`));
    console.log(c.white(`   Uptime: ${formatUptime(uptime)}`));
    console.log(c.white(`   Claimed: ${this.stats.claimed} | Completed: ${this.stats.completed} | Errors: ${this.stats.errors}`));
    console.log(c.white(`   Processed: ${this.processedTasks.size} tasks`));

    this.scheduler.printStatus();
  }
}

function formatUptime(seconds) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export default Daemon;
