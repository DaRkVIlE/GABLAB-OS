/**
 * SKORTEX — Built-in Tool: glob
 * File pattern matching / finder.
 * Uses PowerShell on Windows, find on Linux.
 */

import { execSync } from 'child_process';
import { resolve } from 'path';

export const globTool = {
  name: 'glob_search',
  description: 'Find files matching a pattern in a directory tree. Returns absolute paths of matching files. Use for locating files by extension, name pattern, or in specific directories.',
  parameters: {
    type: 'object',
    properties: {
      pattern: {
        type: 'string',
        description: 'File name or glob pattern to match (e.g. "*.js", "config*", "package.json")',
      },
      path: {
        type: 'string',
        description: 'Root directory to search from. Default: current directory.',
      },
      max_depth: {
        type: 'number',
        description: 'Maximum directory depth to search. Default: 5.',
      },
      max_results: {
        type: 'number',
        description: 'Maximum results to return. Default: 30.',
      },
    },
    required: ['pattern'],
  },
  execute: async ({ pattern, path, max_depth, max_results }) => {
    const searchPath = resolve(path || process.cwd());
    const depth = max_depth || 5;
    const maxHits = max_results || 30;
    const isWindows = process.platform === 'win32';

    try {
      let cmd;
      if (isWindows) {
        // PowerShell with depth limiting
        cmd = `Get-ChildItem -Path "${searchPath}" -Recurse -Depth ${depth} -Filter "${pattern}" -File -ErrorAction SilentlyContinue | Select-Object -First ${maxHits} -ExpandProperty FullName`;
      } else {
        cmd = `find "${searchPath}" -maxdepth ${depth} -name "${pattern}" -type f 2>/dev/null | head -${maxHits}`;
      }

      const result = execSync(cmd, {
        encoding: 'utf-8',
        timeout: 15000,
        maxBuffer: 1024 * 1024,
        shell: isWindows ? 'powershell.exe' : '/bin/bash',
      });

      const files = result.trim().split(/\r?\n/).filter(Boolean);
      if (files.length === 0) return `No files matching "${pattern}" found in ${searchPath}`;

      return `Found ${files.length} files:\n${files.join('\n')}`;
    } catch (error) {
      return `Glob error: ${error.stderr || error.message}`;
    }
  },
};

export default globTool;
