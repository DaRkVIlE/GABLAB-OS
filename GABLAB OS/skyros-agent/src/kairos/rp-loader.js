/**
 * SKYROS Agent — Reasoning Package Loader
 * Lazy-loads RPs on demand via *rp command
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { resolve, basename } from 'path';

export class RPLoader {
  constructor(rpDir) {
    this.rpDir = rpDir;
    this.categories = ['strategic', 'core', 'tasks'];
  }

  /**
   * List all available RPs organized by category
   */
  list() {
    const result = {};
    for (const cat of this.categories) {
      const dir = resolve(this.rpDir, cat);
      if (!existsSync(dir)) continue;
      result[cat] = readdirSync(dir)
        .filter(f => f.endsWith('.md'))
        .map(f => basename(f, '.md'));
    }
    return result;
  }

  /**
   * Search for an RP by keyword (fuzzy match)
   * @param {string} query
   * @returns {Array<{category, filename, path}>}
   */
  search(query) {
    const q = query.toLowerCase();
    const matches = [];

    for (const cat of this.categories) {
      const dir = resolve(this.rpDir, cat);
      if (!existsSync(dir)) continue;
      const files = readdirSync(dir).filter(f => f.endsWith('.md'));
      for (const file of files) {
        if (file.toLowerCase().includes(q)) {
          matches.push({
            category: cat,
            filename: file,
            path: resolve(dir, file),
          });
        }
      }
    }

    return matches;
  }

  /**
   * Load an RP by filename (searches all categories)
   * @param {string} filename
   * @returns {{ content, category, filename } | null}
   */
  load(filename) {
    // If no extension, add .md
    if (!filename.endsWith('.md')) {
      filename = filename + '.md';
    }

    for (const cat of this.categories) {
      const filePath = resolve(this.rpDir, cat, filename);
      if (existsSync(filePath)) {
        return {
          content: readFileSync(filePath, 'utf-8'),
          category: cat,
          filename,
        };
      }
    }

    // Try fuzzy search
    const matches = this.search(filename.replace('.md', ''));
    if (matches.length > 0) {
      const best = matches[0];
      return {
        content: readFileSync(best.path, 'utf-8'),
        category: best.category,
        filename: best.filename,
      };
    }

    return null;
  }
}

export default RPLoader;
