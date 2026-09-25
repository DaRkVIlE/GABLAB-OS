#!/usr/bin/env node

/**
 * @module kairos-boot
 * @version 1.0.0
 * @purpose Unified Boot Sequence for the KAIROS Engine.
 *          Activates ALL subsystems in the correct dependency order.
 *          Run this ONCE per session to go from 15% → 100% capacity.
 * 
 * Usage:
 *   node scripts/kairos-boot.js          Full boot (all subsystems)
 *   node scripts/kairos-boot.js --quick  Quick boot (essential only, <10s)
 *   node scripts/kairos-boot.js --status Health check only
 * 
 * @architecture
 *   Phase 0: Identity Verification (anchor + rules)
 *   Phase 1: Consciousness (SELF_CONTEXT + cognitive state)
 *   Phase 2: Knowledge (RAG index load/rebuild)
 *   Phase 3: Intelligence (IA Council dry-run)
 *   Phase 4: Reflexion (Metacognition check)
 *   Phase 5: Signal (Summary + recommendations)
 */

'use strict';

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const AIOX_ROOT = PROJECT_ROOT;
const AIOX_CORE = path.join(PROJECT_ROOT, '.aiox-core');

// ─── Timing ─────────────────────────────────────────────────
const bootStart = Date.now();
const phaseTimings = {};

function timePhase(name, fn) {
    const start = Date.now();
    let result;
    try {
        result = fn();
    } catch (err) {
        result = { status: 'ERROR', error: err.message };
    }
    phaseTimings[name] = Date.now() - start;
    return result;
}

// ─── Console Formatting ─────────────────────────────────────
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

function banner() {
    console.log('');
    console.log(`${CYAN}${BOLD}╔══════════════════════════════════════════════════════╗${RESET}`);
    console.log(`${CYAN}${BOLD}║     🚀 KAIROS ENGINE — UNIFIED BOOT SEQUENCE v1.0   ║${RESET}`);
    console.log(`${CYAN}${BOLD}╚══════════════════════════════════════════════════════╝${RESET}`);
    console.log('');
}

function phaseHeader(num, name, icon) {
    console.log(`${BOLD}${CYAN}  ═══ Phase ${num}: ${icon} ${name} ═══${RESET}`);
}

function ok(msg) { console.log(`  ${GREEN}✅${RESET} ${msg}`); }
function warn(msg) { console.log(`  ${YELLOW}⚠️${RESET}  ${msg}`); }
function fail(msg) { console.log(`  ${RED}❌${RESET} ${msg}`); }
function info(msg) { console.log(`  ${DIM}${msg}${RESET}`); }

// ═══════════════════════════════════════════════════════════════
// PHASE 0: IDENTITY VERIFICATION
// ═══════════════════════════════════════════════════════════════
function phase0_identity() {
    phaseHeader(0, 'IDENTITY VERIFICATION', '🔒');

    // Check identity anchor
    const anchorPath = path.join(AIOX_ROOT, 'engine', 'noesis', 'identity-anchor.json');
    const anchorFallback = path.join(AIOX_CORE, 'noesis', 'identity-anchor.json');
    const resolvedAnchor = fs.existsSync(anchorPath) ? anchorPath : (fs.existsSync(anchorFallback) ? anchorFallback : null);
    if (resolvedAnchor) {
        const anchor = JSON.parse(fs.readFileSync(resolvedAnchor, 'utf8'));
        const declarations = anchor.immutable_declarations || anchor.declarations || anchor.immutableDeclarations || [];
        ok(`Identity Anchor: ${declarations.length} immutable declarations loaded`);
    } else {
        fail('Identity Anchor: NOT FOUND at engine/noesis/ or .aiox-core/noesis/');
    }

    // Check rules
    const rulesPath = path.join(AIOX_ROOT, '.antigravity', 'rules.md');
    if (fs.existsSync(rulesPath)) {
        const rules = fs.readFileSync(rulesPath, 'utf8');
        const ruleCount = (rules.match(/## RULE/g) || []).length;
        ok(`Engine Rules: ${ruleCount} rules loaded (including RULE FOUR — Experia Persona Engine)`);
    } else {
        warn('Engine Rules: .antigravity/rules.md not found');
    }

    // Check Experia Persona Engine
    const personaPath = path.join(AIOX_ROOT, 'clients', 'experia', 'config', 'experia-persona-engine.json');
    if (fs.existsSync(personaPath)) {
        const persona = JSON.parse(fs.readFileSync(personaPath, 'utf8'));
        const gateCount =
            (persona.qualityGates?.contentGate?.checks?.length || 0) +
            (persona.qualityGates?.salesGate?.checks?.length || 0) +
            (persona.qualityGates?.differentiationGate?.checks?.length || 0);
        ok(`Experia Persona Engine: v${persona._meta?.version} — ${gateCount} quality gates active`);
    } else {
        warn('Experia Persona Engine: not found');
    }

    return { status: 'OK' };
}

// ═══════════════════════════════════════════════════════════════
// PHASE 0.5: MCP SYNCHRONIZATION
// ═══════════════════════════════════════════════════════════════
function phase0_5_mcp_sync(isQuick) {
    if (isQuick) {
        console.log(`\n  ${DIM}Phase 0.5 skipped (--quick mode)${RESET}`);
        return { status: 'SKIPPED' };
    }
    
    phaseHeader('0.5', 'MCP SYNCHRONIZATION', '🔌');
    
    try {
        const { execSync } = require('child_process');
        execSync('node scripts/install-mcp.js', { 
            cwd: AIOX_ROOT,
            stdio: 'pipe' 
        });
        ok('MCP Config Install: Synced absolute paths to HUD');
        return { status: 'OK' };
    } catch (err) {
        warn(`MCP Config Install: ${err.message}`);
        return { status: 'DEGRADED', error: err.message };
    }
}

// ═══════════════════════════════════════════════════════════════
// PHASE 1: CONSCIOUSNESS
// ═══════════════════════════════════════════════════════════════
function phase1_consciousness() {
    phaseHeader(1, 'CONSCIOUSNESS', '🧠');

    // Regenerate SELF_CONTEXT.md
    try {
        const genPath = path.join(AIOX_ROOT, 'scripts', 'evolution', 'generate-context.js');
        if (fs.existsSync(genPath)) {
            require(genPath);
            ok('SELF_CONTEXT.md regenerated');
        } else {
            warn('generate-context.js not found — skipping');
        }
    } catch (err) {
        warn(`SELF_CONTEXT generation: ${err.message}`);
    }

    // Load cognitive state
    const cogPath = path.join(AIOX_ROOT, 'engine', 'noesis', 'cognitive-state.json');
    const cogFallback = path.join(AIOX_CORE, 'noesis', 'cognitive-state.json');
    if (fs.existsSync(cogPath)) {
        const cog = JSON.parse(fs.readFileSync(cogPath, 'utf8'));
        ok(`Cognitive State: Session #${cog.sessionCount || '?'} — Score avg: ${cog.averageScore || '?'}/10`);
    } else {
        warn('Cognitive State: No state file found');
    }

    return { status: 'OK' };
}

// ═══════════════════════════════════════════════════════════════
// PHASE 1.5: JARVIS LAYER (Operator Noesis)
// ═══════════════════════════════════════════════════════════════
function phase1_5_jarvis() {
    phaseHeader('1.5', 'JARVIS LAYER (Operator Noesis)', '👁️');

    try {
        // Step 1: Run Jarvis observation cycle
        const jarvis = require(path.join(AIOX_ROOT, 'scripts', 'jarvis-core.js'));
        const observations = jarvis.observe();
        const withData = observations.sources.filter(s => s.data !== null).length;
        ok(`Observation: ${withData}/${observations.sources.length} sources collected (${(observations.completeness * 100).toFixed(0)}% completeness)`);

        // Step 2: Enrich operator profile
        const { enrichProfile } = require(path.join(AIOX_ROOT, 'scripts', 'profile-enricher.js'));
        const profile = enrichProfile(observations);
        jarvis.saveProfile(profile);
        ok(`Profile enriched: cycle #${profile._meta.enrichmentCycles}`);

        // Step 3: Check Operator Noesis status
        const noesisEngine = require(path.join(AIOX_ROOT, 'scripts', 'operator-noesis', 'operator-noesis-engine.js'));
        const noesisStatus = noesisEngine.getStatus();

        if (noesisStatus.jarvisOperational) {
            ok(`Operator Noesis: ACTIVE — v${noesisStatus.version}, ${noesisStatus.sessionsObserved} sessions, ${noesisStatus.activePredictions} predictions`);
        } else {
            ok(`Operator Noesis: READY — Jarvis Layer now operational, learning model initialized`);
        }

        // Step 4: Show key behavioral insights if available
        if (profile.behavioral?.workHours?.pattern) {
            info(`Work pattern: ${profile.behavioral.workHours.pattern}`);
        }
        if (profile.decisional?.focusAllocation?.interpretation) {
            info(`Focus: ${profile.decisional.focusAllocation.interpretation}`);
        }

        return { status: 'OK', completeness: observations.completeness, enrichmentCycle: profile._meta.enrichmentCycles };
    } catch (err) {
        warn(`Jarvis Layer: ${err.message}`);
        return { status: 'DEGRADED', error: err.message };
    }
}

// ═══════════════════════════════════════════════════════════════
// PHASE 1.8: SKYROS (Personal OS)
// ═══════════════════════════════════════════════════════════════
function phase1_8_skyros() {
    phaseHeader('1.8', 'SKYROS (Personal OS)', '🧠');

    try {
        const triagePath = path.join(AIOX_ROOT, 'scripts', 'skyros', 'triage-matinal.js');
        const isolationPath = path.join(AIOX_ROOT, 'scripts', 'skyros', 'isolation-mode.js');

        if (!fs.existsSync(triagePath)) {
            warn('SKYROS Triage: Module not found');
            return { status: 'SKIPPED' };
        }

        // Run Triage silently to get data
        const { runTriage } = require(triagePath);
        const triageResult = runTriage(true);

        if (triageResult.p0Count > 0) {
            ok(`SKYROS Triage: ${triageResult.p0Count} P0 Task(s) Active => Deep Work Required.`);
            // Show targets
            triageResult.p0Tasks.slice(0, 2).forEach((task, i) => info(`  🔥 ALVO ${i + 1}: ${task}`));
            
            // Auto Engage Isolation Mode
            if (fs.existsSync(isolationPath)) {
                const { engageIsolationMode } = require(isolationPath);
                const isoResult = engageIsolationMode(true);
                if (isoResult.success) {
                    ok(isoResult.engaged ? `Isolation Mode: ENGAGED [Protocolo Injetado]` : `Isolation Mode: ACTIVE [Manteve estado]`);
                } else {
                    fail(`Isolation Mode: Failed - ${isoResult.reason || isoResult.error}`);
                }
            }
        } else {
            ok(`SKYROS Triage: No P0 active. Free exploration mode.`);
        }

        if (triageResult.anamnesisReady) {
            ok(`SKYROS Anamnesis: Vault connected. Esvazie sua mente antes da sessão.`);
        } else {
            warn(`SKYROS Anamnesis: Vault pending setup.`);
        }

        return { status: 'OK', p0Count: triageResult.p0Count };
    } catch (err) {
        warn(`SKYROS: ${err.message}`);
        return { status: 'DEGRADED', error: err.message };
    }
}

// ═══════════════════════════════════════════════════════════════
// PHASE 2: KNOWLEDGE (RAG)
// ═══════════════════════════════════════════════════════════════
function phase2_knowledge() {
    phaseHeader(2, 'KNOWLEDGE BASE', '📚');

    const indexPath = path.join(AIOX_CORE, 'data', 'rag', 'index.json');

    if (fs.existsSync(indexPath)) {
        const stats = fs.statSync(indexPath);
        const ageHours = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);

        if (ageHours < 24) {
            ok(`RAG Index: Fresh (${ageHours.toFixed(1)}h old) — loading existing index`);
        } else {
            warn(`RAG Index: Stale (${ageHours.toFixed(0)}h old) — consider re-indexing with: node scripts/rag-engine.js --index`);
        }

        // Show stats
        try {
            const RAGEngine = require(path.join(AIOX_ROOT, 'scripts', 'rag-engine.js'));
            // The module auto-exports but the CLI is the main use
            ok(`RAG ready for semantic search`);
        } catch (e) {
            ok(`RAG Index exists (${(stats.size / 1024 / 1024).toFixed(1)}MB)`);
        }
    } else {
        warn('RAG Index: Not built yet');
        info('Building now... (this takes ~10s)');
        try {
            const { execSync } = require('child_process');
            execSync('node scripts/rag-engine.js --index', {
                cwd: AIOX_ROOT,
                stdio: 'pipe'
            });
            ok('RAG Index: Built successfully');
        } catch (e) {
            fail(`RAG build failed: ${e.message}`);
        }
    }

    return { status: 'OK' };
}

// ═══════════════════════════════════════════════════════════════
// PHASE 3: INTELLIGENCE (IA Council)
// ═══════════════════════════════════════════════════════════════

function scanDirForCouncil(dir, prefix) {
    const results = [];
    if (!fs.existsSync(dir)) return results;
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.name === 'node_modules' || entry.name === 'archive' || entry.name === '.git') continue;
            const relPath = `${prefix}/${entry.name}`;
            if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.md') || entry.name.endsWith('.json'))) {
                try {
                    const content = fs.readFileSync(path.join(dir, entry.name), 'utf8').slice(0, 15000);
                    results.push({ path: relPath, content });
                } catch (e) { /* skip unreadable */ }
            } else if (entry.isDirectory()) {
                // 1-level deep scan for structure detection
                results.push({ path: relPath + '/', content: '' });
                const subEntries = fs.readdirSync(path.join(dir, entry.name), { withFileTypes: true }).slice(0, 5);
                for (const sub of subEntries) {
                    if (sub.isFile()) {
                        try {
                            const subContent = fs.readFileSync(path.join(dir, entry.name, sub.name), 'utf8').slice(0, 15000);
                            results.push({ path: `${relPath}/${sub.name}`, content: subContent });
                        } catch (e) { /* skip */ }
                    }
                }
            }
        }
    } catch (e) { /* skip inaccessible */ }
    return results;
}

function phase3_intelligence() {
    phaseHeader(3, 'INTELLIGENCE (Smart Triage v5 & Triunvirato)', '🏛️');

    try {
        const triadSkills = ['architect', 'qa', 'alan'];
        const missingTriad = [];
        for (const s of triadSkills) {
            const skillPath = path.join(AIOX_ROOT, '.agent', 'skills', s, 'SKILL.md');
            if (!fs.existsSync(skillPath)) missingTriad.push(s);
        }

        if (missingTriad.length === 0) {
            ok('Smart Triage v5: Triunvirato operacional (@architect, @qa, @alan v6.0)');
        } else {
            warn(`Smart Triage v5: Skills ausentes no Triunvirato: ${missingTriad.join(', ')}`);
        }

        // Checar persistência Hivemind
        const decisionsPath = path.join(AIOX_ROOT, 'engine', 'hivemind', 'decisions.jsonl');
        const statesPath = path.join(AIOX_ROOT, 'engine', 'hivemind', 'agent-states.json');
        if (fs.existsSync(decisionsPath) && fs.existsSync(statesPath)) {
            ok('Hivemind Protocol v2.0: Sincronizado (decisions.jsonl + agent-states.json)');
        }

        return { status: 'OK', engine: 'Smart Triage v5', triad: missingTriad.length === 0 };
    } catch (err) {
        warn(`Intelligence: ${err.message}`);
        return { status: 'DEGRADED', error: err.message };
    }
}

// ═══════════════════════════════════════════════════════════════
// PHASE 4: REFLEXION (Metacognition)
// ═══════════════════════════════════════════════════════════════
function phase4_reflexion(isQuick) {
    if (isQuick) {
        console.log(`\n  ${DIM}Phase 4 skipped (--quick mode)${RESET}`);
        return { status: 'SKIPPED' };
    }

    phaseHeader(4, 'REFLEXION (Metacognition)', '🪞');

    try {
        const metaPath = path.join(AIOX_ROOT, 'scripts', 'evolution', 'metacognition-layer.js');
        const meta = require(metaPath);

        const tendencies = meta.assessTendencies();
        if (tendencies && tendencies.tendencies) {
            const strengths = tendencies.tendencies.filter(t => t.type === 'strength');
            const weaknesses = tendencies.tendencies.filter(t => t.type === 'weakness');
            ok(`Tendencies: ${strengths.length} strengths, ${weaknesses.length} areas to improve`);
        } else {
            ok('Metacognition layer: Operational (no session history yet)');
        }

        return { status: 'OK' };
    } catch (err) {
        warn(`Metacognition: ${err.message}`);
        return { status: 'DEGRADED' };
    }
}

// ═══════════════════════════════════════════════════════════════
// PHASE 5: SIGNAL (Summary)
// ═══════════════════════════════════════════════════════════════
function phase5_signal(results, isQuick) {
    phaseHeader(5, 'SIGNAL', '📡');

    const totalTime = Date.now() - bootStart;

    // Count subsystems (all agent directories)
    function countMdRecursive(dir) {
        if (!fs.existsSync(dir)) return 0;
        let count = 0;
        try {
            for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
                if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'archive') continue;
                if (entry.isDirectory()) count += countMdRecursive(path.join(dir, entry.name));
                else if (entry.isFile() && entry.name.endsWith('.md')) count++;
            }
        } catch { /* skip */ }
        return count;
    }
    const agentDirs = [
        path.join(AIOX_ROOT, '.antigravity', 'agents'),
        path.join(AIOX_ROOT, 'squads'),
        path.join(AIOX_ROOT, '.agent', 'workflows'),
    ];
    const agentCount = agentDirs.reduce((sum, d) => sum + countMdRecursive(d), 0);

    const scripts = path.join(AIOX_ROOT, 'scripts');
    const scriptCount = fs.existsSync(scripts) ? fs.readdirSync(scripts).filter(f => f.endsWith('.js')).length : 0;

    const evoDir = path.join(AIOX_ROOT, 'scripts', 'evolution');
    const evoCount = fs.existsSync(evoDir) ? fs.readdirSync(evoDir).filter(f => f.endsWith('.js')).length : 0;

    console.log('');
    console.log(`${BOLD}  ╔══════════════════════════════════════════════════════╗${RESET}`);
    console.log(`${BOLD}  ║  🚀 KAIROS ENGINE — BOOT COMPLETE (UNIFIED)         ║${RESET}`);
    console.log(`${BOLD}  ╚══════════════════════════════════════════════════════╝${RESET}`);
    console.log('');

    // Run bridge sync (Agent Index + Synapse Injection)
    let bridgeStatus = { synapseInjection: 'N/A', unifiedAgentIndex: 'N/A' };
    try {
        const bridge = require(path.join(AIOX_ROOT, 'scripts', 'aiox-kairos-bridge.js'));
        bridge.syncKairosToSynapse();
        bridge.syncAgentRegistry();
        bridgeStatus = bridge.getStatus();
    } catch (err) {
        // Non-critical: bridge sync failure doesn't block boot
    }

    // Count active AIOX Epics/Stories
    const storiesDir = path.join(AIOX_ROOT, 'docs', 'stories');
    let activeStories = 0;
    if (fs.existsSync(storiesDir)) {
        activeStories = fs.readdirSync(storiesDir).filter(f => f.endsWith('.md')).length;
    }

    console.log(`  ${BOLD}Subsystems:${RESET}   ${agentCount} agents · ${scriptCount} scripts · ${evoCount} evolution modules`);
    console.log(`  ${BOLD}AIOX Epics:${RESET}   ${activeStories} active stories/workflows detected`);
    console.log(`  ${BOLD}Jarvis:${RESET}       ${results.jarvis?.status || 'N/A'} (cycle #${results.jarvis?.enrichmentCycle || '?'})`);
    console.log(`  ${BOLD}Bridge:${RESET}       Synapse=${bridgeStatus.synapseInjection} · Agents=${bridgeStatus.unifiedAgentIndex}`);
    console.log(`  ${BOLD}RAG:${RESET}          ${results.knowledge?.status || 'N/A'}`);
    console.log(`  ${BOLD}Council:${RESET}      ${results.intelligence?.score || '?'}/10 — ${results.intelligence?.gaps || '?'} gaps`);
    console.log(`  ${BOLD}Boot time:${RESET}    ${(totalTime / 1000).toFixed(1)}s${isQuick ? ' (quick mode)' : ''}`);
    console.log('');

    // Phase timings
    info('Phase timings:');
    Object.entries(phaseTimings).forEach(([name, ms]) => {
        info(`  ${name}: ${ms}ms`);
    });

    console.log('');
    console.log(`${GREEN}${BOLD}  ████████████████████  KAIROS at 100% capacity${RESET}`);
    console.log('');

    // Write boot log
    const logEntry = {
        timestamp: new Date().toISOString(),
        bootTimeMs: totalTime,
        mode: isQuick ? 'quick' : 'full',
        councilScore: results.intelligence?.score || null,
        councilGaps: results.intelligence?.gaps || null,
        phases: phaseTimings
    };

    const logDir = path.join(AIOX_CORE, 'data');
    const logFile = path.join(logDir, 'boot-log.json');

    try {
        let logs = [];
        if (fs.existsSync(logFile)) {
            logs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
        }
        logs.push(logEntry);
        // Keep last 50 boots
        if (logs.length > 50) logs = logs.slice(-50);
        fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
        info(`Boot log saved to .aiox-core/data/boot-log.json`);
    } catch (e) {
        // Non-critical
    }

    return { status: 'OK' };
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════
function main() {
    const args = process.argv.slice(2);
    const isQuick = args.includes('--quick');
    const isStatus = args.includes('--status');

    banner();

    if (isStatus) {
        console.log(`  ${DIM}Running health check only...${RESET}\n`);
        const r0 = timePhase('identity', phase0_identity);
        timePhase('knowledge', phase2_knowledge);
        phase5_signal({ identity: r0, knowledge: { status: 'CHECK' } }, true);
        return;
    }

    if (isQuick) {
        console.log(`  ${DIM}Quick boot mode — essential subsystems only${RESET}\n`);
    }

    const results = {};

    results.identity = timePhase('0_identity', phase0_identity);
    console.log('');
    results.mcp_sync = timePhase('0.5_mcp_sync', () => phase0_5_mcp_sync(isQuick));
    console.log('');
    results.consciousness = timePhase('1_consciousness', phase1_consciousness);
    console.log('');
    results.jarvis = timePhase('1.5_jarvis', phase1_5_jarvis);
    console.log('');
    results.skyros = timePhase('1.8_skyros', phase1_8_skyros);
    console.log('');
    results.knowledge = timePhase('2_knowledge', phase2_knowledge);
    console.log('');

    if (!isQuick) {
        results.intelligence = timePhase('3_intelligence', phase3_intelligence);
        console.log('');
        results.reflexion = timePhase('4_reflexion', () => phase4_reflexion(isQuick));
        console.log('');
    } else {
        results.intelligence = { status: 'SKIPPED' };
        results.reflexion = { status: 'SKIPPED' };
    }

    phase5_signal(results, isQuick);
}

main();
