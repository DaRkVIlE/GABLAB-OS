/**
 * SKORTEX — Scheduler
 * Cron-like internal scheduler for autonomous routines.
 * Pattern: S08 (Background Tasks) from SKYROS-ARCHITECTURE-GOLD RP
 *
 * Manages recurring jobs:
 *   - Heartbeat (30s)
 *   - Context sync (5min)
 *   - Triage scan (configurable)
 *   - Custom user-defined jobs
 */

export class Scheduler {
  constructor({ chalk }) {
    this.chalk = chalk || ((s) => s);
    this.jobs = new Map();
    this.running = false;
  }

  /**
   * Register a recurring job
   * @param {string} id - Unique job identifier
   * @param {Object} options
   * @param {number} options.intervalMs - Interval in milliseconds
   * @param {Function} options.handler - Async function to execute
   * @param {boolean} [options.immediate=false] - Run immediately on start
   * @param {boolean} [options.silent=true] - Don't log execution
   */
  register(id, { intervalMs, handler, immediate = false, silent = true }) {
    if (this.jobs.has(id)) {
      this.unregister(id);
    }

    this.jobs.set(id, {
      id,
      intervalMs,
      handler,
      immediate,
      silent,
      timer: null,
      lastRun: null,
      runCount: 0,
      errors: 0,
    });
  }

  /**
   * Unregister a job
   */
  unregister(id) {
    const job = this.jobs.get(id);
    if (job?.timer) {
      clearInterval(job.timer);
    }
    this.jobs.delete(id);
  }

  /**
   * Start all registered jobs
   */
  async start() {
    if (this.running) return;
    this.running = true;

    for (const [id, job] of this.jobs) {
      // Run immediately if configured
      if (job.immediate) {
        await this._executeJob(job);
      }

      // Set up interval
      job.timer = setInterval(() => this._executeJob(job), job.intervalMs);

      // Don't block Node exit
      if (job.timer.unref) {
        job.timer.unref();
      }
    }
  }

  /**
   * Stop all jobs
   */
  stop() {
    this.running = false;
    for (const [id, job] of this.jobs) {
      if (job.timer) {
        clearInterval(job.timer);
        job.timer = null;
      }
    }
  }

  /**
   * Execute a single job with error handling
   */
  async _executeJob(job) {
    const c = this.chalk;
    try {
      await job.handler();
      job.lastRun = Date.now();
      job.runCount++;
    } catch (err) {
      job.errors++;
      if (!job.silent) {
        console.error(c.dim(`[scheduler] ${job.id} error: ${err.message}`));
      }
    }
  }

  /**
   * Get status of all registered jobs
   */
  getStatus() {
    const jobs = [];
    for (const [id, job] of this.jobs) {
      jobs.push({
        id,
        intervalMs: job.intervalMs,
        interval: formatInterval(job.intervalMs),
        lastRun: job.lastRun ? new Date(job.lastRun).toISOString() : null,
        runCount: job.runCount,
        errors: job.errors,
        active: !!job.timer,
      });
    }
    return { running: this.running, jobs };
  }

  /**
   * Print formatted scheduler status
   */
  printStatus() {
    const c = this.chalk;
    const status = this.getStatus();

    console.log(c.cyan('\n⏰ Scheduler Status:'));
    console.log(c.white(`   Running: ${status.running ? '✅' : '⏸️'}`));

    for (const job of status.jobs) {
      const lastRun = job.lastRun ? formatAgo(job.lastRun) : 'never';
      const errors = job.errors > 0 ? c.red(` (${job.errors} errors)`) : '';
      console.log(c.white(`   ${job.id}: every ${job.interval} | runs: ${job.runCount} | last: ${lastRun}${errors}`));
    }
  }
}

// ═══════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════

function formatInterval(ms) {
  if (ms < 60_000) return `${ms / 1000}s`;
  if (ms < 3_600_000) return `${ms / 60_000}m`;
  return `${ms / 3_600_000}h`;
}

function formatAgo(isoString) {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 10) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default Scheduler;
