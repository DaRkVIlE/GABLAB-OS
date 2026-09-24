#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.dirname(__dirname);
const traeDir = path.join(projectRoot, '.trae');

console.log('Setting up KAIROX MCP Server for TRAE...\n');

// Create .trae directory if needed
await fs.mkdir(traeDir, { recursive: true });

// Create TRAE configuration
const configContent = `# KAIROX MCP Server for TRAE

This directory contains configuration files for using the KAIROX MCP Server in TRAE.

## How to use

1. First, build the server:
   npm run build

2. Configure TRAE MCP configuration:
   In your TRAE configuration, add:

{
  "mcpServers": {
    "kairox": {
      "command": "node",
      "args": ["${path.join(projectRoot, "dist", "mcp-server.js").replace(/\\/g, "\\\\")}"]
    }
  }
}
`;

await fs.writeFile(path.join(traeDir, 'README.md'), configContent, 'utf-8');
console.log('✓ Created .trae/README.md');

// Copy agent files if needed (if we want to embed some default agents, let's just log that the MCP is available via MCP tools, the agents are in the tools:

console.log('\n✅ KAIROX MCP Server setup complete!\n');
console.log('Next steps:');
console.log('1. Run npm run build to compile the server');
console.log('2. Add the MCP server to your TRAE config using the instructions in .trae/README.md');
console.log('');
console.log('Tools available:');
console.log(' - AIOX tools: list squads, agents, skills');
console.log(' - KAIROX: health check, read/write context, log artifacts');
console.log(' - Hivemind: decisions, states, handoffs');
console.log(' - HYDRA: spawn agents, queue tasks');
