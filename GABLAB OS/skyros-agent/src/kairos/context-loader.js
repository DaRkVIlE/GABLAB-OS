/**
 * SKYROS Agent — Context Loader
 * Loads SELF_CONTEXT.md and STATUS.md for session context
 */

import { readFileSync, existsSync } from 'fs';

export class ContextLoader {
  constructor(paths) {
    this.selfContextPath = paths.selfContext;
    this.statusPath = paths.status;
  }

  /**
   * Load context and build a context injection string
   * @param {Object} options - { maxChars: limit injected size }
   * @returns {string} - context to inject into system prompt
   */
  load(options = {}) {
    const maxChars = options.maxChars || 4000;
    const sections = [];

    // SELF_CONTEXT.md
    if (existsSync(this.selfContextPath)) {
      const selfContext = readFileSync(this.selfContextPath, 'utf-8');
      const trimmed = selfContext.slice(0, maxChars / 2);
      sections.push('--- SELF_CONTEXT (KAIROS STATE) ---');
      sections.push(trimmed);
    }

    // STATUS.md
    if (existsSync(this.statusPath)) {
      const status = readFileSync(this.statusPath, 'utf-8');
      const trimmed = status.slice(0, maxChars / 2);
      sections.push('--- STATUS ---');
      sections.push(trimmed);
    }

    if (sections.length === 0) {
      return '';
    }

    return sections.join('\n');
  }

  /**
   * Check if context files exist
   */
  isAvailable() {
    return existsSync(this.selfContextPath) || existsSync(this.statusPath);
  }
}

export default ContextLoader;
