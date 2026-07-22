/**
 * SKYROS Agent — Supabase Sync Client
 * Connects to Supabase for multi-instance synchronization
 * Zero dependencies — uses native fetch + WebSocket
 */

const REALTIME_URL_SUFFIX = '/realtime/v1/websocket';

export class SyncClient {
  /**
   * @param {Object} config
   * @param {string} config.supabaseUrl - Supabase project URL
   * @param {string} config.supabaseKey - Supabase service role or anon key
   * @param {string} config.agentId - Unique ID for this agent instance
   * @param {string} config.machineId - Machine hostname
   * @param {Function} config.onEvent - Callback for incoming events
   * @param {Function} [config.chalk] - Chalk instance for colored output
   */
  constructor(config) {
    this.url = config.supabaseUrl;
    this.key = config.supabaseKey;
    this.agentId = config.agentId;
    this.machineId = config.machineId;
    this.onEvent = config.onEvent || (() => {});
    this.chalk = config.chalk || (s => s);
    this.connected = false;
    this.headers = {
      'apikey': this.key,
      'Authorization': `Bearer ${this.key}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Check if Supabase is configured
   */
  isConfigured() {
    return !!(this.url && this.key);
  }

  // ═══════════════════════════════════════════════
  // REST API (fetch-based)
  // ═══════════════════════════════════════════════

  /**
   * Generic REST call to Supabase PostgREST
   */
  async _rest(method, table, params = '', body = null) {
    const url = `${this.url}/rest/v1/${table}${params ? '?' + params : ''}`;
    const options = {
      method,
      headers: { ...this.headers, 'Prefer': method === 'POST' ? 'return=representation' : undefined },
    };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(url, options);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Supabase ${method} ${table}: ${res.status} ${text}`);
    }
    const contentType = res.headers.get('content-type');
    if (contentType?.includes('json')) return res.json();
    return null;
  }

  // ═══════════════════════════════════════════════
  // Events
  // ═══════════════════════════════════════════════

  /**
   * Publish an event to the bus
   */
  async publishEvent(eventType, payload = {}) {
    if (!this.isConfigured()) return;
    return this._rest('POST', 'kairos_events', '', {
      agent_id: this.agentId,
      machine: this.machineId,
      event_type: eventType,
      payload,
    });
  }

  /**
   * Get recent events (last N)
   */
  async getRecentEvents(limit = 20) {
    if (!this.isConfigured()) return [];
    return this._rest('GET', 'kairos_events', `order=created_at.desc&limit=${limit}`);
  }

  /**
   * Get events since a timestamp
   */
  async getEventsSince(since) {
    if (!this.isConfigured()) return [];
    return this._rest('GET', 'kairos_events',
      `created_at=gte.${since}&order=created_at.asc`);
  }

  // ═══════════════════════════════════════════════
  // Task Claims (Semaphore)
  // ═══════════════════════════════════════════════

  /**
   * Attempt to claim a task (atomic via Supabase RLS)
   * Returns true if claimed, false if already taken
   */
  async claimTask(taskId, taskName = '') {
    if (!this.isConfigured()) return true; // no sync = always claimable

    // Check if already claimed
    const existing = await this._rest('GET', 'kairos_task_claims',
      `task_id=eq.${encodeURIComponent(taskId)}&select=*`);

    if (existing && existing.length > 0) {
      const claim = existing[0];
      if (claim.completed) return true; // already done

      // Check if claim is stale (>2 min no heartbeat)
      const heartbeatAge = Date.now() - new Date(claim.heartbeat_at).getTime();
      if (heartbeatAge > 120_000 && claim.claimed_by !== this.agentId) {
        // Steal the stale claim
        await this._rest('PATCH', 'kairos_task_claims',
          `task_id=eq.${encodeURIComponent(taskId)}`, {
            claimed_by: this.agentId,
            machine: this.machineId,
            claimed_at: new Date().toISOString(),
            heartbeat_at: new Date().toISOString(),
          });
        return true;
      }

      // Already claimed by another agent
      if (claim.claimed_by !== this.agentId) {
        return false;
      }
      return true; // we already own it
    }

    // Create new claim
    await this._rest('POST', 'kairos_task_claims', '', {
      task_id: taskId,
      task_name: taskName,
      claimed_by: this.agentId,
      machine: this.machineId,
      claimed_at: new Date().toISOString(),
      heartbeat_at: new Date().toISOString(),
    });
    return true;
  }

  /**
   * Send heartbeat for an active task claim
   */
  async heartbeat(taskId) {
    if (!this.isConfigured()) return;
    return this._rest('PATCH', 'kairos_task_claims',
      `task_id=eq.${encodeURIComponent(taskId)}`, {
        heartbeat_at: new Date().toISOString(),
      });
  }

  /**
   * Complete a task claim
   */
  async completeTask(taskId, result = {}) {
    if (!this.isConfigured()) return;
    await this._rest('PATCH', 'kairos_task_claims',
      `task_id=eq.${encodeURIComponent(taskId)}`, {
        completed: true,
        result,
        heartbeat_at: new Date().toISOString(),
      });
    await this.publishEvent('task_completed', { taskId, result });
  }

  /**
   * Get all active claims (across all agents)
   */
  async getActiveClaims() {
    if (!this.isConfigured()) return [];
    return this._rest('GET', 'kairos_task_claims',
      'completed=eq.false&order=claimed_at.desc');
  }

  // ═══════════════════════════════════════════════
  // Shared Context
  // ═══════════════════════════════════════════════

  /**
   * Push shared context (SELF_CONTEXT or STATUS)
   */
  async pushContext(key, content) {
    if (!this.isConfigured()) return;

    // Upsert: try update first, insert if not exists
    const existing = await this._rest('GET', 'kairos_shared_context',
      `key=eq.${encodeURIComponent(key)}&select=key`);

    const data = {
      key,
      content,
      updated_by: this.agentId,
      machine: this.machineId,
      updated_at: new Date().toISOString(),
    };

    if (existing && existing.length > 0) {
      await this._rest('PATCH', 'kairos_shared_context',
        `key=eq.${encodeURIComponent(key)}`, data);
    } else {
      await this._rest('POST', 'kairos_shared_context', '', data);
    }

    await this.publishEvent('context_update', { key, byAgent: this.agentId });
  }

  /**
   * Pull shared context
   */
  async pullContext(key) {
    if (!this.isConfigured()) return null;
    const rows = await this._rest('GET', 'kairos_shared_context',
      `key=eq.${encodeURIComponent(key)}&select=*`);
    return rows?.[0] || null;
  }

  // ═══════════════════════════════════════════════
  // Decisions Log
  // ═══════════════════════════════════════════════

  /**
   * Log a decision
   */
  async logDecision(decision, context = '', impact = 'medium') {
    if (!this.isConfigured()) return;
    await this._rest('POST', 'kairos_decisions', '', {
      agent_id: this.agentId,
      machine: this.machineId,
      decision,
      context,
      impact,
    });
    await this.publishEvent('decision', { decision, impact });
  }

  /**
   * Get recent decisions
   */
  async getRecentDecisions(limit = 10) {
    if (!this.isConfigured()) return [];
    return this._rest('GET', 'kairos_decisions',
      `order=created_at.desc&limit=${limit}`);
  }

  // ═══════════════════════════════════════════════
  // Session Lifecycle
  // ═══════════════════════════════════════════════

  /**
   * Announce session start
   */
  async announceStart(sessionInfo = {}) {
    return this.publishEvent('session_start', {
      agentId: this.agentId,
      machine: this.machineId,
      ...sessionInfo,
    });
  }

  /**
   * Announce session end
   */
  async announceEnd(summary = '') {
    return this.publishEvent('session_end', {
      agentId: this.agentId,
      machine: this.machineId,
      summary,
    });
  }

  /**
   * Get sync status summary
   */
  async getSyncStatus() {
    if (!this.isConfigured()) {
      return { configured: false, message: 'Supabase not configured' };
    }

    try {
      const [events, claims, decisions] = await Promise.all([
        this.getRecentEvents(5),
        this.getActiveClaims(),
        this.getRecentDecisions(5),
      ]);

      return {
        configured: true,
        recentEvents: events?.length || 0,
        activeClaims: claims?.length || 0,
        recentDecisions: decisions?.length || 0,
        activeAgents: [...new Set(events?.map(e => e.agent_id) || [])],
      };
    } catch (err) {
      return { configured: true, error: err.message };
    }
  }

  // ═══════════════════════════════════════════════
  // Daemon Support — Task Management (S11)
  // ═══════════════════════════════════════════════

  /**
   * Get unclaimed tasks from kairos_task_claims
   */
  async getUnclaimedTasks() {
    if (!this.isConfigured()) return [];
    return this._rest('GET', 'kairos_task_claims',
      'completed=eq.false&claimed_by=is.null&limit=10');
  }

  /**
   * Claim a pre-existing task by UUID (Daemon use case — task already exists in DB)
   */
  async claimDaemonTask(taskId) {
    if (!this.isConfigured()) return false;
    try {
      await this._rest('PATCH', 'kairos_task_claims',
        `task_id=eq.${encodeURIComponent(taskId)}&claimed_by=is.null`,
        {
          claimed_by: this.agentId,
          claimed_at: new Date().toISOString(),
          machine: this.machineId,
        });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Release a claimed task (on error)
   */
  async releaseTask(taskId) {
    if (!this.isConfigured()) return;
    await this._rest('PATCH', 'kairos_task_claims',
      `task_id=eq.${encodeURIComponent(taskId)}`,
      {
        claimed_by: null,
        claimed_at: null,
        machine: null,
      });
  }

  // ═══════════════════════════════════════════════
  // Hivemind Support — Context & Events (S10)
  // ═══════════════════════════════════════════════

  /**
   * Get events since a specific timestamp
   */
  async getEventsSince(sinceISO) {
    if (!this.isConfigured()) return [];
    return this._rest('GET', 'kairos_events',
      `created_at=gte.${sinceISO}&order=created_at.desc&limit=50`);
  }

  /**
   * Pull shared context by key
   */
  async pullContext(key) {
    if (!this.isConfigured()) return null;
    const results = await this._rest('GET', 'kairos_shared_context',
      `key=eq.${key}&order=updated_at.desc&limit=1`);
    return results?.[0] || null;
  }

  /**
   * Push shared context by key (upsert)
   */
  async pushContext(key, content) {
    if (!this.isConfigured()) return;
    // Try upsert via POST with on_conflict
    await this._rest('POST', 'kairos_shared_context', '', {
      key,
      content,
      agent_id: this.agentId,
      machine: this.machineId,
      updated_at: new Date().toISOString(),
    }, {
      'Prefer': 'resolution=merge-duplicates',
    });
  }
}

export default SyncClient;

