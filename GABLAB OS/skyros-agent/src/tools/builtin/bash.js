/**
 * SKYROS Agent — Built-in Tool: bash
 * Execute shell commands (PowerShell on Windows)
 */

import { execSync } from 'child_process';

export const bashTool = {
  name: 'execute_bash',
  description: 'Execute a shell command and return stdout + stderr. On Windows, uses PowerShell. Use for file operations, git, npm, system queries, etc.',
  parameters: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'The shell command to execute',
      },
    },
    required: ['command'],
  },
  execute: async ({ command }) => {
    try {
      const result = execSync(command, {
        encoding: 'utf-8',
        timeout: 30000,
        maxBuffer: 1024 * 1024,
        shell: process.platform === 'win32' ? 'powershell.exe' : '/bin/bash',
        cwd: process.cwd(),
      });
      return result || '(command completed with no output)';
    } catch (error) {
      const stdout = error.stdout || '';
      const stderr = error.stderr || '';
      return `Exit code: ${error.status}\nstdout: ${stdout}\nstderr: ${stderr}`;
    }
  },
};

export default bashTool;
