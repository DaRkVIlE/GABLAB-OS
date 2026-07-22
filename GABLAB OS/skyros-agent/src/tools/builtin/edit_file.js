/**
 * SKYROS Agent — Built-in Tool: edit_file
 * Search and replace in files (unique match required)
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';

export const editFileTool = {
  name: 'edit_file',
  description: 'Edit a file by replacing a specific string with new content. The target string must be unique in the file (exact match required, including whitespace).',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Path to the file to edit',
      },
      target: {
        type: 'string',
        description: 'The exact string to find and replace (must be unique in the file)',
      },
      replacement: {
        type: 'string',
        description: 'The string to replace the target with',
      },
    },
    required: ['path', 'target', 'replacement'],
  },
  execute: async ({ path, target, replacement }) => {
    if (!existsSync(path)) {
      return `Error: File not found: ${path}`;
    }

    try {
      const content = readFileSync(path, 'utf-8');
      const count = content.split(target).length - 1;

      if (count === 0) {
        return `Error: Target string not found in ${path}. Make sure the string matches exactly (including whitespace).`;
      }
      if (count > 1) {
        return `Error: Target string found ${count} times in ${path}. It must be unique. Add more surrounding context to make it unique.`;
      }

      const newContent = content.replace(target, replacement);
      writeFileSync(path, newContent, 'utf-8');
      return `✅ Edited ${path}: replaced 1 occurrence`;
    } catch (error) {
      return `Error editing ${path}: ${error.message}`;
    }
  },
};

export default editFileTool;
