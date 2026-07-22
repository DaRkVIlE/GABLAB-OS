/**
 * SKYROS Agent — Built-in Tool: read_file
 * Read files with optional line range
 */

import { readFileSync, existsSync, statSync } from 'fs';

export const readFileTool = {
  name: 'read_file',
  description: 'Read the contents of a file. Returns the file content with line numbers. For large files, use startLine/endLine to read specific sections.',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Path to the file to read (absolute or relative to project root)',
      },
      startLine: {
        type: 'number',
        description: 'Start line (1-indexed). Optional.',
      },
      endLine: {
        type: 'number',
        description: 'End line (1-indexed, inclusive). Optional.',
      },
    },
    required: ['path'],
  },
  execute: async ({ path, startLine, endLine }) => {
    if (!existsSync(path)) {
      return `Error: File not found: ${path}`;
    }

    const stat = statSync(path);
    if (stat.isDirectory()) {
      return `Error: '${path}' is a directory, not a file. Use list_directory instead.`;
    }
    if (stat.size > 2 * 1024 * 1024) {
      return `Error: File too large (${(stat.size / 1024 / 1024).toFixed(1)}MB). Use startLine/endLine to read a section.`;
    }

    try {
      const content = readFileSync(path, 'utf-8');
      const lines = content.split('\n');

      const start = (startLine || 1) - 1;
      const end = endLine || lines.length;
      const slice = lines.slice(start, end);

      const numbered = slice.map((line, i) => `${start + i + 1}: ${line}`).join('\n');
      return `File: ${path} (${lines.length} lines total, showing ${start + 1}-${Math.min(end, lines.length)})\n\n${numbered}`;
    } catch (error) {
      return `Error reading ${path}: ${error.message}`;
    }
  },
};

export default readFileTool;
