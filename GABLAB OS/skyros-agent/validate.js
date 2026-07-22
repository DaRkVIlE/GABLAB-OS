/**
 * SKYROS Agent — Validation Suite
 * Tests providers, tools, agent loop, and spawner
 */

import { parseArgs } from 'util';
import loadConfig from './src/core/config.js';
import { ProviderRouter } from './src/providers/router.js';
import { ToolExecutor } from './src/tools/executor.js';
import { AgentLoop } from './src/core/loop.js';
import chalk from 'chalk';
import { ToolRegistry } from './src/tools/registry.js';
import { bashTool } from './src/tools/builtin/bash.js';

const { values } = parseArgs({
  options: {
    providers: { type: 'boolean' },
    tools: { type: 'boolean' },
    loop: { type: 'boolean' },
    full: { type: 'boolean' },
  },
});

const runAll = values.full || (!values.providers && !values.tools && !values.loop);

async function run() {
  console.log(chalk.bold.blue('=== SKORTEX E2E VALIDATION ===\n'));
  
  const config = loadConfig();
  const router = new ProviderRouter(config);
  
  if (runAll || values.providers) {
    console.log(chalk.yellow('1. Testing Providers Health'));
    const status = await router.checkHealth();
    for (const [name, result] of Object.entries(status)) {
      if (result.status === 'alive') {
        console.log(`  ✅ ${name.padEnd(12)} - ${result.latency}ms`);
      } else {
        console.log(`  ❌ ${name.padEnd(12)} - ${result.error} (Code ${result.code})`);
      }
    }
    console.log('');
  }

  const registry = new ToolRegistry();
  registry.register(bashTool);
  const executor = new ToolExecutor(registry);
  
  if (runAll || values.tools) {
    console.log(chalk.yellow('2. Testing Tools'));
    const defs = executor.getToolDefinitions();
    console.log(`  Found ${defs.length} tools registered.`);
    
    // Quick test on bash
    try {
      const res = await executor.execute('run_command', { command: 'echo "hello"' });
      if (res.includes('hello')) {
        console.log('  ✅ run_command works');
      } else {
        console.log('  ❌ run_command returned unexpected:', res);
      }
    } catch (e) {
       console.log('  ❌ run_command failed:', e.message);
    }
    console.log('');
  }

  if (runAll || values.loop) {
    console.log(chalk.yellow('3. Testing Agent Loop'));
    const loop = new AgentLoop({
      router,
      executor,
      config,
      onToolCall: (tc) => console.log(chalk.gray(`  [Tool] ${tc.name}`)),
    });
    
    // Test the best tier available
    let availableTier = 'medium';
    if (!router.deadProviders.has('huggingface') && router.providers.huggingface) availableTier = 'heavy';
    if (!router.deadProviders.has('groq') && router.providers.groq) availableTier = 'light';
    if (!router.deadProviders.has('gemini') && router.providers.gemini) availableTier = 'medium';

    console.log(`  Running test task using tier: ${availableTier}`);
    
    try {
      const resp = await loop.run('What is 2+2? Reply with ONLY the number 4, no other words.', [], { tier: availableTier });
      console.log(`  ✅ Agent replied: ${resp}`);
    } catch (e) {
      console.log(`  ❌ Agent Loop failed: ${e.message}`);
    }
    console.log('');
  }

  console.log(chalk.bold.green('=== Done ==='));
  process.exit(0);
}

run().catch(e => {
  console.error(chalk.red('\nFatal Exception:'), e);
  process.exit(1);
});
