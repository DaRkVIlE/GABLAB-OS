/**
 * SKORTEX — Built-in Tool: git
 * Git operations: status, diff, add, commit, log, branch, push.
 * Wraps the Git CLI with structured output.
 */

import { execSync } from 'child_process';

const runGit = (args, cwd) => {
  try {
    return execSync(`git ${args}`, {
      encoding: 'utf-8',
      timeout: 30000,
      maxBuffer: 2 * 1024 * 1024,
      cwd: cwd || process.cwd(),
      shell: process.platform === 'win32' ? 'powershell.exe' : '/bin/bash',
    });
  } catch (error) {
    return `Git error: ${error.stderr || error.message}`;
  }
};

export const gitTool = {
  name: 'git',
  description: `Execute git operations. Supported actions: status, diff, log, add, commit, push, branch, checkout, stash. Use this to manage version control. Examples: git status, git diff --staged, git log -5, git add ., git commit -m "message".`,
  parameters: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        description: 'Git action to perform',
        enum: ['status', 'diff', 'log', 'add', 'commit', 'push', 'pull', 'branch', 'checkout', 'stash', 'show', 'reset', 'custom'],
      },
      args: {
        type: 'string',
        description: 'Additional arguments for the git command (e.g. "-m message" for commit, "-5" for log, "." for add)',
      },
      cwd: {
        type: 'string',
        description: 'Working directory for the git command. Default: process.cwd()',
      },
    },
    required: ['action'],
  },
  execute: async ({ action, args, cwd }) => {
    const extra = args || '';

    switch (action) {
      case 'status':
        return runGit(`status --short ${extra}`, cwd);

      case 'diff': {
        const diff = runGit(`diff ${extra}`, cwd);
        // Truncate huge diffs
        if (diff.length > 8000) {
          return diff.slice(0, 8000) + `\n... (diff truncated, ${diff.length} total chars)`;
        }
        return diff || '(no changes)';
      }

      case 'log':
        return runGit(`log --oneline -n ${extra || '10'}`, cwd);

      case 'add':
        return runGit(`add ${extra || '.'}`, cwd) || '(staged successfully)';

      case 'commit':
        if (!extra) return 'Error: commit requires -m "message" in args';
        return runGit(`commit ${extra}`, cwd);

      case 'push':
        return runGit(`push ${extra}`, cwd);

      case 'pull':
        return runGit(`pull ${extra}`, cwd);

      case 'branch':
        return runGit(`branch ${extra}`, cwd);

      case 'checkout':
        if (!extra) return 'Error: checkout requires branch name in args';
        return runGit(`checkout ${extra}`, cwd);

      case 'stash':
        return runGit(`stash ${extra || 'push'}`, cwd);

      case 'show':
        return runGit(`show ${extra || 'HEAD'} --stat`, cwd);

      case 'reset':
        return runGit(`reset ${extra}`, cwd);

      case 'custom':
        if (!extra) return 'Error: custom action requires the full git subcommand in args';
        return runGit(extra, cwd);

      default:
        return `Unknown git action: ${action}. Use: status, diff, log, add, commit, push, pull, branch, checkout, stash, show, reset, custom`;
    }
  },
};

export default gitTool;
