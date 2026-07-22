/**
 * SKORTEX — Hivemind Protocol
 * Orchestrates multi-instance synchronization across KAIROS agents (A/B/C/D)
 * 
 * Responsibilities:
 *   - Agent lifecycle management (register, heartbeat, presence)
 *   - Bidirectional context sync (SELF_CONTEXT + STATUS via Supabase)
 *   - Leader election (oldest uptime wins)
 *   - Hivemind status dashboard
 * 
 * Depends on: SyncClient (supabase-client.js)
 * Pattern: S09-S10 from SKYROS-ARCHITECTURE-GOLD RP
 */

import { readFileSync, writeFileSync, existsSync, statSync } from 'fs';

export class Hivemind {
  /**
   * @param {Object} options
   * @param {import('./supabase-client.js').SyncClient} options.syncClient
   * @param {Object} options.config - Full SKORTEX config
   * @param {Function} [options.chalk] - Chalk for colored output
   */
  constructor({ syncClient, config, chalk }) {
    this.sync = syncClient;
    this.config = config;
    this.chalk = chalk || ((s) => s);
    this.heartbeatInterval = null;
    this.bootTime = Date.now();
    this.agentId = config.sync.agentId;
    this.machineId = config.sync.machineId;
  }

  // ═══════════════════════════════════════════════
  // Bootstrap — Full Hivemind Initialization
  // ═══════════════════════════════════════════════

  /**
   * Bootstrap the hivemind connection:
   * 1. Announce presence
   * 2. Pull latest shared context from Supabase
   * 3. Start automatic heartbeat
   * 4. Log decision of session start
   */
  async bootstrap(sessionInfo = {}) {
    if (!this.sync.isConfigured()) {
      return { connected: false, reason: 'Supabase not configured' };
    }

    try {
      // 1. Announce session start
      await this.sync.announceStart({
        ...sessionInfo,
        bootTime: this.bootTime,
        version: '3.0.0',
      });

      // 2. Pull latest shared context and merge locally if newer
      await this.syncContextBidirectional();

      // 3. Start heartbeat (every 30 seconds)
      this.startHeartbeat();

      // 4. Log the bootstrap decision
      await this.sync.logDecision(
        `Session started on ${this.machineId}`,
        `Agent ${this.agentId} bootstrapped into hivemind`,
        'low'
      );

      return { connected: true, agentId: this.agentId, machine: this.machineId };
    } catch (err) {
      return { connected: false, reason: err.message };
    }
  }

  // ═══════════════════════════════════════════════
  // Heartbeat — Automatic Presence Signal
  // ═══════════════════════════════════════════════

  /**
   * Start automatic heartbeat every 30 seconds
   * Publishes a 'heartbeat' event so other agents know we're alive
   */
  startHeartbeat(intervalMs = 30_000) {
    if (this.heartbeatInterval) return; // already running

    this.heartbeatInterval = setInterval(async () => {
      try {
        await this.sync.publishEvent('heartbeat', {
          agentId: this.agentId,
          machine: this.machineId,
          uptime: Math.floor((Date.now() - this.bootTime) / 1000),
          memoryMB: Math.round(process.memoryUsage?.().heapUsed / 1024 / 1024) || 0,
        });
      } catch {
        // Silent — heartbeat failure is non-fatal
      }
    }, intervalMs);

    // Don't block Node from exiting
    if (this.heartbeatInterval.unref) {
      this.heartbeatInterval.unref();
    }
  }

  /**
   * Stop heartbeat
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // ═══════════════════════════════════════════════
  // Bidirectional Context Sync
  // ═══════════════════════════════════════════════

  /**
   * Sync SELF_CONTEXT.md and STATUS.md bidirectionally:
   * - If Supabase version is newer → pull and overwrite local
   * - If local version is newer → push to Supabase
   * - If no remote version → push local as seed
   */
  async syncContextBidirectional() {
    const contextFiles = [
      { key: 'self_context', path: this.config.paths.selfContext },
      { key: 'status', path: this.config.paths.status },
    ];

    for (const { key, path } of contextFiles) {
      try {
        // Read local file
        let localContent = '';
        let localMtime = 0;
        if (existsSync(path)) {
          localContent = readFileSync(path, 'utf-8');
          const { mtimeMs } = statSync(path);
          localMtime = mtimeMs;
        }

        // Pull remote version
        const remote = await this.sync.pullContext(key);

        if (!remote) {
          // No remote — seed it with local
          if (localContent) {
            await this.sync.pushContext(key, localContent);
          }
          continue;
        }

        const remoteMtime = new Date(remote.updated_at).getTime();

        if (remoteMtime > localMtime && remote.content !== localContent) {
          // Remote is newer — pull
          writeFileSync(path, remote.content, 'utf-8');
        } else if (localMtime > remoteMtime && localContent !== remote.content) {
          // Local is newer — push
          await this.sync.pushContext(key, localContent);
        }
        // Equal timestamps or same content → skip
      } catch {
        // Non-fatal — context sync is best-effort
      }
    }
  }

  // ═══════════════════════════════════════════════
  // Active Agents Discovery
  // ═══════════════════════════════════════════════

  /**
   * Get all agents that have sent a heartbeat in the last N seconds
   * @param {number} windowSeconds - How recent is "active" (default: 120s = 2 min)
   * @returns {Array} Active agent records
   */
  async getActiveAgents(windowSeconds = 120) {
    if (!this.sync.isConfigured()) return [];

    try {
      const since = new Date(Date.now() - windowSeconds * 1000).toISOString();
      const events = await this.sync.getEventsSince(since);

      // Group by agent_id and get latest event per agent
      const agentMap = new Map();
      for (const evt of events) {
        const existing = agentMap.get(evt.agent_id);
        if (!existing || new Date(evt.created_at) > new Date(existing.created_at)) {
          agentMap.set(evt.agent_id, evt);
        }
      }

      return Array.from(agentMap.values()).map(evt => ({
        agentId: evt.agent_id,
        machine: evt.machine,
        lastSeen: evt.created_at,
        eventType: evt.event_type,
        payload: evt.payload,
      }));
    } catch {
      return [];
    }
  }

  // ═══════════════════════════════════════════════
  // Leader Election
  // ═══════════════════════════════════════════════

  /**
   * Simple leader election: the agent with the oldest boot time wins
   * If self has been alive longest among active agents → we are leader
   */
  async electLeader() {
    const activeAgents = await this.getActiveAgents();

    if (activeAgents.length === 0) {
      return { isLeader: true, leaderId: this.agentId, reason: 'only agent' };
    }

    // Find the agent with the earliest session_start event
    let oldestAgent = null;
    let oldestTime = Infinity;

    for (const agent of activeAgents) {
      const ts = new Date(agent.lastSeen).getTime();
      // Favor agents with 'session_start' events; heartbeat events are recurring
      if (agent.eventType === 'session_start' && ts < oldestTime) {
        oldestTime = ts;
        oldestAgent = agent;
      }
    }

    // Fallback: compare by lastSeen (oldest = leader)
    if (!oldestAgent) {
      const earliest = activeAgents.reduce((a, b) =>
        new Date(a.lastSeen) < new Date(b.lastSeen) ? a : b
      );
      oldestAgent = earliest;
    }

    const isLeader = oldestAgent.agentId === this.agentId;
    return {
      isLeader,
      leaderId: oldestAgent.agentId,
      leaderMachine: oldestAgent.machine,
      totalAgents: activeAgents.length,
    };
  }

  // ═══════════════════════════════════════════════
  // Hivemind Status Dashboard
  // ═══════════════════════════════════════════════

  /**
   * Full hivemind status: active agents, claims, decisions, leader
   */
  async getHivemindStatus() {
    if (!this.sync.isConfigured()) {
      return { configured: false };
    }

    try {
      const [activeAgents, syncStatus, leader] = await Promise.all([
        this.getActiveAgents(),
        this.sync.getSyncStatus(),
        this.electLeader(),
      ]);

      return {
        configured: true,
        self: {
          agentId: this.agentId,
          machine: this.machineId,
          uptime: Math.floor((Date.now() - this.bootTime) / 1000),
          isLeader: leader.isLeader,
        },
        hivemind: {
          totalAgents: activeAgents.length,
          agents: activeAgents,
          leaderId: leader.leaderId,
          leaderMachine: leader.leaderMachine,
        },
        sync: {
          recentEvents: syncStatus.recentEvents || 0,
          activeClaims: syncStatus.activeClaims || 0,
          recentDecisions: syncStatus.recentDecisions || 0,
        },
      };
    } catch (err) {
      return { configured: true, error: err.message };
    }
  }

  /**
   * Print formatted hivemind status to console
   */
  async printStatus() {
    const c = this.chalk;
    const status = await this.getHivemindStatus();

    if (!status.configured) {
      console.log(c.yellow('⚠️  Hivemind not configured — add SUPABASE_URL to .env'));
      return status;
    }

    if (status.error) {
      console.log(c.red(`❌ Hivemind error: ${status.error}`));
      return status;
    }

    console.log(c.cyan('\n╔═══════════════════════════════════════════╗'));
    console.log(c.cyan('║          🐝 HIVEMIND STATUS               ║'));
    console.log(c.cyan('╠═══════════════════════════════════════════╣'));

    // Self
    const selfLeader = status.self.isLeader ? c.green(' 👑 LEADER') : '';
    console.log(c.white(`║  Self: ${status.self.agentId.slice(-8)} @ ${status.self.machine}${selfLeader}`));
    console.log(c.white(`║  Uptime: ${formatUptime(status.self.uptime)}`));

    // Active Agents
    console.log(c.cyan('╠═══════════════════════════════════════════╣'));
    console.log(c.white(`║  Active Agents: ${status.hivemind.totalAgents}`));
    for (const agent of status.hivemind.agents) {
      const isSelf = agent.agentId === this.agentId ? c.dim(' (self)') : '';
      const isLeader = agent.agentId === status.hivemind.leaderId ? c.green(' 👑') : '';
      const ago = formatAgo(agent.lastSeen);
      console.log(c.white(`║    ${agent.agentId.slice(-8)} @ ${agent.machine} — ${ago}${isLeader}${isSelf}`));
    }

    // Sync
    console.log(c.cyan('╠═══════════════════════════════════════════╣'));
    console.log(c.white(`║  Events: ${status.sync.recentEvents} | Claims: ${status.sync.activeClaims} | Decisions: ${status.sync.recentDecisions}`));
    console.log(c.cyan('╚═══════════════════════════════════════════╝'));

    return status;
  }

  // ═══════════════════════════════════════════════
  // Shutdown
  // ═══════════════════════════════════════════════

  /**
   * Graceful shutdown: stop heartbeat, announce end, push context
   */
  async shutdown(summary = '') {
    this.stopHeartbeat();

    if (this.sync.isConfigured()) {
      try {
        // Push final context state
        await this.syncContextBidirectional();
        // Announce session end
        await this.sync.announceEnd(summary);
      } catch {
        // Best-effort
      }
    }
  }
}

// ═══════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════

function formatUptime(seconds) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function formatAgo(isoString) {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 10) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default Hivemind;
