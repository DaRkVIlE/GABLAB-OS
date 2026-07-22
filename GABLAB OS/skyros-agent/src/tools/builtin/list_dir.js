/**
 * SKYROS Agent — Built-in Tool: list_directory
 * Recursive directory listing with file sizes
 */

import { readdirSync, statSync, existsSync } from 'fs';
import { join, relative } from 'path';

function listRecursive(dir, baseDir, maxDepth = 3, currentDepth = 0) {
  const entries = [];
  
  try {
    const items = readdirSync(dir);
    for (const item of items) {
      // Skip heavy/irrelevant directories
      if (['node_modules', '.git', '__pycache__', '.next', 'dist'].includes(item)) {
        entries.push(`${relative(baseDir, join(dir, item))}/ (skipped)`);
        continue;
      }

      const fullPath = join(dir, item);
      try {
        const stat = statSync(fullPath);
        const relPath = relative(baseDir, fullPath);

        if (stat.isDirectory()) {
          entries.push(`📁 ${relPath}/`);
          if (currentDepth < maxDepth) {
            entries.push(...listRecursive(fullPath, baseDir, maxDepth, currentDepth + 1));
          }
        } else {
          const size = stat.size;
          const sizeStr = size > 1024 * 1024 
            ? `${(size / 1024 / 1024).toFixed(1)}MB`
            : size > 1024 
              ? `${(size / 1024).toFixed(1)}KB`
              : `${size}B`;
          entries.push(`  ${relPath} (${sizeStr})`);
        }
      } catch {
        // Skip unreadable files
      }
    }
  } catch (error) {
    entries.push(`Error reading ${dir}: ${error.message}`);
  }

  return entries;
}

export const listDirTool = {
  name: 'list_directory',
  description: 'List the contents of a directory, showing files with sizes and subdirectories. Skips node_modules, .git, etc.',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Path to the directory to list',
      },
      maxDepth: {
        type: 'number',
        description: 'Maximum depth of recursion (default: 3)',
      },
    },
    required: ['path'],
  },
  execute: async ({ path, maxDepth }) => {
    if (!existsSync(path)) {
      return `Error: Directory not found: ${path}`;
    }

    const entries = listRecursive(path, path, maxDepth || 3);
    return `Directory: ${path}\n\n${entries.join('\n')}`;
  },
};

export default listDirTool;
