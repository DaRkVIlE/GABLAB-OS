/**
 * SKYROS Agent — Persona Loader
 * Loads AIOX agent personas from .aiox-core/development/agents/
 * Harness s05: "Load knowledge when you need it"
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { resolve, basename } from 'path';

export class PersonaLoader {
  constructor(agentsDir) {
    this.agentsDir = agentsDir;
    this.cache = new Map();
  }

  /**
   * List available personas
   */
  list() {
    if (!existsSync(this.agentsDir)) return [];
    return readdirSync(this.agentsDir)
      .filter(f => f.endsWith('.md'))
      .map(f => basename(f, '.md'));
  }

  /**
   * Load a persona by agent ID
   * @param {string} agentId - e.g. 'dev', 'architect', 'aiox-master'
   * @returns {{ id, title, persona, commands, raw }}
   */
  load(agentId) {
    if (this.cache.has(agentId)) return this.cache.get(agentId);

    const filePath = resolve(this.agentsDir, `${agentId}.md`);
    if (!existsSync(filePath)) {
      return null;
    }

    const raw = readFileSync(filePath, 'utf-8');
    const parsed = this.parse(agentId, raw);
    this.cache.set(agentId, parsed);
    return parsed;
  }

  /**
   * Parse an agent markdown file
   */
  parse(id, raw) {
    // Extract YAML frontmatter if present
    let title = id;
    let persona = '';
    let commands = [];

    // Try to extract title from first # heading
    const titleMatch = raw.match(/^#\s+(.+)/m);
    if (titleMatch) {
      title = titleMatch[1].trim();
    }

    // Extract persona section
    const personaMatch = raw.match(/## Persona\s*\n([\s\S]*?)(?=\n## |\n---|\$)/i);
    if (personaMatch) {
      persona = personaMatch[1].trim();
    }

    // Extract commands section
    const commandsMatch = raw.match(/## Commands?\s*\n([\s\S]*?)(?=\n## |\n---|\$)/i);
    if (commandsMatch) {
      const cmdBlock = commandsMatch[1];
      const cmdRegex = /\*(\w+)/g;
      let m;
      while ((m = cmdRegex.exec(cmdBlock)) !== null) {
        commands.push(m[1]);
      }
    }

    // Build system prompt from the persona
    const systemPrompt = this.buildSystemPrompt(id, title, persona, raw);

    return { id, title, persona, commands, systemPrompt, raw };
  }

  /**
   * Build a system prompt for the LLM from a persona
   */
  buildSystemPrompt(id, title, persona, raw) {
    // Use the full raw content as a rich system prompt,
    // prepended with SKYROS identity
    return [
      `You are operating as SKYROS Agent in the persona of "${title}".`,
      `Agent ID: ${id}`,
      '',
      'Your capabilities: execute_bash, read_file, write_file, edit_file, list_directory.',
      'Be concise, action-oriented, and proactive. Execute tasks directly using tools.',
      '',
      '--- PERSONA DEFINITION ---',
      raw,
      '--- END PERSONA ---',
    ].join('\n');
  }
}

export default PersonaLoader;
