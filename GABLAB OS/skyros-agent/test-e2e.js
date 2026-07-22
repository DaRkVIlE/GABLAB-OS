#!/usr/bin/env node
/**
 * SKORTEX — End-to-End Infrastructure Validation
 * Tests ALL components WITHOUT calling any LLM API.
 */

import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
let passed = 0, failed = 0;
const results = [];

function ok(name, detail = '') {
  passed++;
  results.push({ name, status: '✅', detail });
  console.log(`  ✅ ${name}${detail ? ' — ' + detail : ''}`);
}
function fail(name, err) {
  failed++;
  results.push({ name, status: '❌', detail: err });
  console.log(`  ❌ ${name} — ${err}`);
}
async function test(name, fn) {
  try { ok(name, await fn()); }
  catch (e) { fail(name, e.message); }
}

console.log(`\n╔══════════════════════════════════════════════════════╗`);
console.log(`║  🧪 SKORTEX — End-to-End Infrastructure Validation  ║`);
console.log(`║  Zero LLM calls — Pure infrastructure test          ║`);
console.log(`╚══════════════════════════════════════════════════════╝\n`);

// ═══════════ T1: Config ═══════════
console.log('📦 T1–T4: Core Modules');

await test('T1: Config loader', async () => {
  const { loadConfig } = await import('./src/core/config.js');
  const config = loadConfig();
  if (!config.agent) throw new Error('config.agent missing');
  if (!config.routing) throw new Error('config.routing missing');
  const tiers = Object.keys(config.routing);
  return `${tiers.length} tiers: ${tiers.join(', ')}`;
});

// ═══════════ T2: Provider Router ═══════════
await test('T2: Provider router', async () => {
  const { loadConfig } = await import('./src/core/config.js');
  const { ProviderRouter } = await import('./src/providers/router.js');
  const config = loadConfig();
  const router = new ProviderRouter(config);
  const providerNames = Object.keys(router.providers);
  if (providerNames.length === 0) throw new Error('No providers initialized');
  return `${providerNames.length} providers: ${providerNames.join(', ')}`;
});

// ═══════════ T3: Tool Registry + Builtins ═══════════
await test('T3: Tool registry + builtins', async () => {
  const { ToolRegistry } = await import('./src/tools/registry.js');
  const registry = new ToolRegistry();

  const builtinNames = ['read_file', 'write_file', 'list_dir', 'run_command', 'search_replace'];
  for (const name of builtinNames) {
    try {
      const mod = await import(`./src/tools/builtin/${name}.js`);
      // Each builtin exports a default object with { name, execute, ... }
      const tool = mod.default || mod[Object.keys(mod)[0]];
      if (tool?.name && tool?.execute) registry.register(tool);
    } catch { /* skip missing */ }
  }

  // Also try the new tools from Agent E
  const extraTools = ['git', 'grep', 'web_search', 'glob'];
  for (const name of extraTools) {
    try {
      const mod = await import(`./src/tools/builtin/${name}.js`);
      const tool = mod.default || mod[Object.keys(mod)[0]];
      if (tool?.name && tool?.execute) registry.register(tool);
    } catch { /* skip missing */ }
  }

  const tools = registry.list();
  if (tools.length === 0) throw new Error('No tools registered');
  return `${tools.length} builtins: ${tools.join(', ')}`;
});

// ═══════════ T4: Persona Loader ═══════════
await test('T4: Persona loader', async () => {
  const { PersonaLoader } = await import('./src/kairos/persona-loader.js');
  const agentsDir = resolve(PROJECT_ROOT, '.aiox-core', 'development', 'agents');
  const loader = new PersonaLoader(agentsDir);
  const personas = loader.list();
  return `${personas.length} personas: ${personas.slice(0, 5).join(', ')}${personas.length > 5 ? '...' : ''}`;
});

// ═══════════ T5: MCP Bridge ═══════════
console.log('\n🔌 T5: MCP Bridge');

await test('T5: MCP Bridge connect + tool sync', async () => {
  const { MCPBridge } = await import('./src/tools/mcp-bridge.js');
  const { ToolRegistry } = await import('./src/tools/registry.js');
  const registry = new ToolRegistry();
  const serverPath = resolve(PROJECT_ROOT, 'scripts', 'mcp-server.js');

  const bridge = new MCPBridge({ serverPath, registry });

  // 10s timeout for connect
  await Promise.race([
    bridge.connect(),
    new Promise((_, rej) => setTimeout(() => rej(new Error('MCP connect timeout (10s)')), 10000)),
  ]);

  const tools = registry.list();
  bridge.disconnect();

  if (tools.length === 0) throw new Error('No MCP tools bridged');
  return `${tools.length} MCP tools bridged: ${tools.slice(0, 6).join(', ')}...`;
});

// ═══════════ T6: Session Store ═══════════
console.log('\n💾 T6: Session Store');

await test('T6: Session store (JSONL append + load)', async () => {
  const { SessionStore } = await import('./src/memory/session-store.js');
  const store = new SessionStore(resolve(__dirname, 'sessions'));

  const testId = 'test-e2e-' + Date.now();

  // Append messages (JSONL format)
  store.saveMessage(testId, { role: 'user', content: 'E2E test message' });
  store.saveMessage(testId, { role: 'assistant', content: 'E2E test response' });

  // Load and verify
  const events = store.loadEvents(testId);
  if (events.length !== 2) throw new Error(`Expected 2 events, got ${events.length}`);
  const history = store.loadHistory(testId);
  if (history.length !== 2) throw new Error(`Expected 2 history items, got ${history.length}`);
  if (history[0].content !== 'E2E test message') throw new Error('Content mismatch');

  // Cleanup
  const fs = await import('fs');
  try { fs.unlinkSync(resolve(__dirname, 'sessions', `${testId}.jsonl`)); } catch {}

  return `Append 2 msgs → LoadEvents(${events.length}) → LoadHistory(${history.length}) → Cleanup OK`;
});

// ═══════════ T7: Scheduler ═══════════
console.log('\n⏰ T7: Scheduler');

await test('T7: Scheduler lifecycle', async () => {
  const { Scheduler } = await import('./src/core/scheduler.js');
  const scheduler = new Scheduler({ chalk: (s) => s });

  let execCount = 0;
  scheduler.register('test-job', {
    intervalMs: 100,
    handler: async () => { execCount++; },
    immediate: true,
    silent: true,
  });

  await scheduler.start();
  await new Promise(r => setTimeout(r, 350));
  scheduler.stop();

  const status = scheduler.getStatus();
  if (execCount < 2) throw new Error(`Job ran only ${execCount}x, expected >=2`);
  return `Job executed ${execCount}x in 350ms, scheduler reports ${status.jobs.length} job(s)`;
});

// ═══════════ T8–T12: Supabase ═══════════
console.log('\n☁️  T8–T12: Supabase Integration');

let syncClient = null;

await test('T8: Supabase — Event publish', async () => {
  const { SyncClient } = await import('./src/sync/supabase-client.js');
  const { loadConfig } = await import('./src/core/config.js');
  const config = loadConfig();

  syncClient = new SyncClient({
    supabaseUrl: config.sync?.supabaseUrl,
    supabaseKey: config.sync?.supabaseKey,
    agentId: 'e2e-test-' + Date.now().toString(36),
    machineId: 'PC-E2E',
  });

  if (!syncClient.isConfigured()) throw new Error('Supabase not configured (SUPABASE_URL/SERVICE_ROLE_KEY missing from .env)');

  await syncClient.publishEvent('e2e_test', {
    test: true,
    timestamp: new Date().toISOString(),
    message: 'SKORTEX E2E validation',
  });
  return 'Event published to kairos_events';
});

await test('T9: Supabase — Read recent events', async () => {
  if (!syncClient?.isConfigured()) throw new Error('Skipped (no Supabase)');
  const events = await syncClient.getRecentEvents(5);
  if (!Array.isArray(events)) throw new Error('Expected array');
  const ourEvent = events.find(e => e.event_type === 'e2e_test');
  if (!ourEvent) throw new Error('Our e2e_test event not found');
  return `${events.length} recent events found, e2e_test verified ✓`;
});

await test('T10: Supabase — Task claim lifecycle', async () => {
  if (!syncClient?.isConfigured()) throw new Error('Skipped');
  const taskId = `e2e-claim-${Date.now()}`;
  const claimed = await syncClient.claimTask(taskId, 'E2E test task');
  if (!claimed) throw new Error('Failed to claim');
  await syncClient.heartbeat(taskId);
  await syncClient.completeTask(taskId, { validated: true });
  return 'Claim → Heartbeat → Complete lifecycle OK';
});

await test('T11: Supabase — Decision log', async () => {
  if (!syncClient?.isConfigured()) throw new Error('Skipped');
  await syncClient.logDecision('E2E validation passed', 'test-e2e.js', 'low');
  const decisions = await syncClient.getRecentDecisions(3);
  if (!Array.isArray(decisions)) throw new Error('Expected array');
  return `Decision logged, ${decisions.length} recent decisions readable`;
});

await test('T12: Supabase — Sync status', async () => {
  if (!syncClient?.isConfigured()) throw new Error('Skipped');
  const status = await syncClient.getSyncStatus();
  if (!status.configured) throw new Error('Status says not configured');
  return `Events: ${status.recentEvents}, Claims: ${status.activeClaims}, Decisions: ${status.recentDecisions}`;
});

// ═══════════ T13: Hivemind ═══════════
console.log('\n🐝 T13: Hivemind');

await test('T13: Hivemind bootstrap', async () => {
  const { Hivemind } = await import('./src/sync/hivemind.js');
  const { loadConfig } = await import('./src/core/config.js');
  const config = loadConfig();

  const hivemind = new Hivemind({
    syncClient,
    config,
    chalk: (s) => s,
  });

  const result = await hivemind.bootstrap({ tier: 'medium', persona: null });
  return `Connected: ${result.connected}, Agent: ${result.agentId} @ ${result.machine}`;
});

// ═══════════ T14: Spawner ═══════════
console.log('\n🚀 T14: Spawner');

await test('T14: Spawner source validation', async () => {
  const fs = await import('fs');
  const spawnerCode = fs.readFileSync(resolve(__dirname, 'spawner.js'), 'utf-8');
  const checks = ['class AgentProcess', 'class Spawner', 'async runAll', 'printSummary', '--lite', 'fork(CLI_PATH'];
  const missing = checks.filter(c => !spawnerCode.includes(c));
  if (missing.length > 0) throw new Error(`Missing patterns: ${missing.join(', ')}`);
  return `${checks.length} patterns validated (AgentProcess, Spawner, runAll, lite, fork)`;
});

// ═══════════ SUMMARY ═══════════
console.log(`\n${'═'.repeat(56)}`);
console.log(`  SKORTEX E2E Validation — FINAL REPORT`);
console.log(`${'═'.repeat(56)}`);
console.log(`  ✅ Passed: ${passed}/${passed + failed}`);
if (failed > 0) console.log(`  ❌ Failed: ${failed}`);
console.log(`${'═'.repeat(56)}`);

if (failed === 0) {
  console.log(`\n  🎉 ALL SYSTEMS OPERATIONAL — SKORTEX VALIDATED\n`);
} else {
  console.log(`\n  ⚠️  ${failed} test(s) need attention\n`);
}

// Save report
const fs = await import('fs');
const reportPath = resolve(__dirname, 'sessions', `e2e-report-${Date.now()}.json`);
try {
  fs.mkdirSync(resolve(__dirname, 'sessions'), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify({ timestamp: new Date().toISOString(), passed, failed, total: passed + failed, results }, null, 2));
  console.log(`  💾 Report: ${reportPath}\n`);
} catch {}

process.exit(failed > 0 ? 1 : 0);
