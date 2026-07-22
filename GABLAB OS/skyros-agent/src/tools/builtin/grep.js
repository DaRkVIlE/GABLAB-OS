/**
 * SKORTEX — Built-in Tool: grep
 * Fast text search across files using findstr (Windows) or grep (Linux).
 * Pattern: Equivalent to Antigravity's grep_search tool.
 */

import { execSync } from 'child_process';
import { resolve } from 'path';

export const grepTool = {
  name: 'grep_search',
  description: 'Search for a text pattern across files in a directory. Returns matching lines with file paths and line numbers. Supports regex patterns. Use for finding code patterns, function definitions, imports, or any text across a codebase.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The text or regex pattern to search for',
      },
      path: {
        type: 'string',
        description: 'Directory or file path to search in (default: current directory)',
      },
      include: {
        type: 'string',
        description: 'File glob pattern to filter (e.g. "*.js", "*.md"). Optional.',
      },
      case_insensitive: {
        type: 'boolean',
        description: 'If true, ignore case when matching. Default: false.',
      },
      max_results: {
        type: 'number',
        description: 'Maximum number of results to return. Default: 50.',
      },
    },
    required: ['query'],
  },
  execute: async ({ query, path, include, case_insensitive, max_results }) => {
    const searchPath = resolve(path || process.cwd());
    const maxHits = max_results || 50;

    try {
      // Try ripgrep first (rg), then fall back to findstr / grep
      let cmd;
      const isWindows = process.platform === 'win32';

      // Check if rg is available
      try {
        execSync('rg --version', { encoding: 'utf-8', stdio: 'pipe' });
        // rg available — use it
        const caseFlag = case_insensitive ? '-i' : '';
        const includeFlag = include ? `--glob "${include}"` : '';
        cmd = `rg -n --no-heading ${caseFlag} ${includeFlag} --max-count ${maxHits} -- "${query.replace(/"/g, '\\"')}" "${searchPath}"`;
      } catch {
        // rg not available — fallback
        if (isWindows) {
          const caseFlag = case_insensitive ? '/I' : '';
          const pathArg = include ? `${searchPath}\\${include}` : `${searchPath}\\*`;
          cmd = `findstr /S /N ${caseFlag} /C:"${query}" "${pathArg}"`;
        } else {
          const caseFlag = case_insensitive ? '-i' : '';
          const includeFlag = include ? `--include="${include}"` : '';
          cmd = `grep -rn ${caseFlag} ${includeFlag} "${query}" "${searchPath}" | head -${maxHits}`;
        }
      }

      const result = execSync(cmd, {
        encoding: 'utf-8',
        timeout: 15000,
        maxBuffer: 2 * 1024 * 1024,
        cwd: searchPath,
        shell: isWindows ? 'powershell.exe' : '/bin/bash',
      });

      const lines = result.trim().split('\n');
      if (lines.length > maxHits) {
        return lines.slice(0, maxHits).join('\n') + `\n... (${lines.length - maxHits} more results truncated)`;
      }
      return result || '(no matches found)';
    } catch (error) {
      if (error.status === 1) return '(no matches found)';
      return `Search error: ${error.stderr || error.message}`;
    }
  },
};

export default grepTool;
