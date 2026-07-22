/**
 * SKYROS Agent — Built-in Tool: write_file
 * Create or overwrite files, auto-creating directories
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';

export const writeFileTool = {
  name: 'write_file',
  description: 'Write content to a file. Creates the file and any parent directories if they do not exist. Overwrites existing files.',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Path to the file to write',
      },
      content: {
        type: 'string',
        description: 'Content to write to the file',
      },
    },
    required: ['path', 'content'],
  },
  execute: async ({ path, content }) => {
    try {
      const dir = dirname(path);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(path, content, 'utf-8');
      const lines = content.split('\n').length;
      return `✅ Wrote ${lines} lines to ${path}`;
    } catch (error) {
      return `Error writing ${path}: ${error.message}`;
    }
  },
};

export default writeFileTool;
