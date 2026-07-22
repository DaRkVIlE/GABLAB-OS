/**
 * SKYROS Agent — Session Store
 * JSONL-based session persistence with resume and compaction
 */

import { readFileSync, writeFileSync, appendFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';
import { resolve, basename } from 'path';
import { randomBytes } from 'crypto';

export class SessionStore {
  constructor(sessionsDir) {
    this.sessionsDir = sessionsDir;
    if (!existsSync(sessionsDir)) {
      mkdirSync(sessionsDir, { recursive: true });
    }
  }

  /**
   * Generate a new session ID
   */
  newId() {
    return randomBytes(8).toString('hex');
  }

  /**
   * Get the file path for a session
   */
  getPath(sessionId) {
    return resolve(this.sessionsDir, `${sessionId}.jsonl`);
  }

  /**
   * Append an event to a session
   */
  append(sessionId, event) {
    const line = JSON.stringify({
      ...event,
      timestamp: new Date().toISOString(),
    });
    appendFileSync(this.getPath(sessionId), line + '\n', 'utf-8');
  }

  /**
   * Save a full message to session
   */
  saveMessage(sessionId, message) {
    this.append(sessionId, {
      type: message.role,
      content: message.content,
      tool_calls: message.tool_calls,
      tool_call_id: message.tool_call_id,
    });
  }

  /**
   * Load all events from a session
   * @returns {Array} events
   */
  loadEvents(sessionId) {
    const path = this.getPath(sessionId);
    if (!existsSync(path)) return [];

    const lines = readFileSync(path, 'utf-8').split('\n').filter(l => l.trim());
    return lines.map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(Boolean);
  }

  /**
   * Rebuild conversation history from a session's events
   * @returns {Array} messages in OpenAI format
   */
  loadHistory(sessionId) {
    const events = this.loadEvents(sessionId);
    return events.map(e => {
      const msg = { role: e.type, content: e.content };
      if (e.tool_calls) msg.tool_calls = e.tool_calls;
      if (e.tool_call_id) msg.tool_call_id = e.tool_call_id;
      return msg;
    }).filter(m => ['user', 'assistant', 'tool'].includes(m.role));
  }

  /**
   * List all sessions with basic metadata
   */
  list() {
    if (!existsSync(this.sessionsDir)) return [];

    return readdirSync(this.sessionsDir)
      .filter(f => f.endsWith('.jsonl'))
      .map(f => {
        const id = basename(f, '.jsonl');
        const path = resolve(this.sessionsDir, f);
        const stat = statSync(path);
        const events = this.loadEvents(id);
        const firstUser = events.find(e => e.type === 'user');
        return {
          id,
          created: stat.birthtime,
          modified: stat.mtime,
          events: events.length,
          preview: firstUser?.content?.slice(0, 80) || '(empty)',
        };
      })
      .sort((a, b) => b.modified - a.modified);
  }

  /**
   * Get the most recent session ID
   */
  getLastSession() {
    const sessions = this.list();
    return sessions.length > 0 ? sessions[0].id : null;
  }

  /**
   * Compact a session by keeping only the last N events + a summary
   */
  compact(sessionId, maxEvents = 50) {
    const events = this.loadEvents(sessionId);
    if (events.length <= maxEvents) return;

    const kept = events.slice(-maxEvents);
    const compacted = [
      {
        type: 'system',
        content: `[Session compacted: ${events.length - maxEvents} older events removed. ${kept.length} recent events retained.]`,
        timestamp: new Date().toISOString(),
      },
      ...kept,
    ];

    const path = this.getPath(sessionId);
    writeFileSync(path, compacted.map(e => JSON.stringify(e)).join('\n') + '\n', 'utf-8');
  }
}

export default SessionStore;
