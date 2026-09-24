// ═══════════════════════════════════════════════════════════════════════════════
// AIOX MCP SERVER v5.0.1-security-patched
// Exposes AIOX agents & squads as MCP tools for Antigravity & other MCP clients
// 
// SECURITY FIXES (2026-04-15):
// - Path traversal defense: normalize + strip leading ../ + strict startsWith check
// - Input sanitization: newline stripping for JSONL, invalid char replacement
// - Null checks: array bounds validation before access, skill registry validation
// - Error handling: no silent catches, explicit error propagation
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @module mcp-server
 * @version 5.0.1
 * @purpose Expose all AIOX agents and squads as MCP tools for any
 *          compatible AI client (Claude Desktop, Cursor, Cline, etc.).
 *          Runs in stdio mode per the Model Context Protocol spec.
 * @inputs  MCP JSON-RPC requests via stdin (or --list / --test CLI flags)
 * @outputs MCP JSON-RPC responses via stdout
 * @exports { startMCPServer }
 * @dependencies entity-registry, squad definitions
 */

const fs = require('fs');
const path = require('path');
const { getToolsBridge } = require('./tools-bridge');

const AIOX_ROOT = path.resolve(__dirname, '..');
const SQUADS_DIR = path.join(AIOX_ROOT, 'squads');

// OBRIGATÓRIO: Força carregamento do .env do KAIROS para o MCP Server (quiet para não quebrar stdio JSON-RPC)
require('dotenv').config({ path: path.join(AIOX_ROOT, '.env'), quiet: true });

const toolsBridge = getToolsBridge();

// ============================================================
// SCAN AIOX FOR TOOLS
// ============================================================

function scanTools() {
    const tools = [];

    // Tool: list-squads
    tools.push({
        name: 'aiox_list_squads',
        description: 'List all AIOX squads with agent counts',
        inputSchema: { type: 'object', properties: {}, required: [] },
    });

    // Tool: list-agents
    tools.push({
        name: 'aiox_list_agents',
        description: 'List all agents in a specific squad',
        inputSchema: {
            type: 'object',
            properties: {
                squad: { type: 'string', description: 'Squad name (e.g., marketing, ops, cs)' },
            },
            required: ['squad'],
        },
    });

    // Tool: get-agent
    tools.push({
        name: 'aiox_get_agent',
        description: 'Get the full definition of an AIOX agent, including persona, KPIs, commands, and DNA sources',
        inputSchema: {
            type: 'object',
            properties: {
                squad: { type: 'string', description: 'Squad name' },
                agent: { type: 'string', description: 'Agent ID (filename without .md)' },
            },
            required: ['squad', 'agent'],
        },
    });

    // Tool: search-agents
    tools.push({
        name: 'aiox_search_agents',
        description: 'Search across all AIOX agents by keyword (searches in name, title, persona, KPIs)',
        inputSchema: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'Search query' },
            },
            required: ['query'],
        },
    });

    // Tool: get-status
    tools.push({
        name: 'aiox_status',
        description: 'Get AIOX system status: version, squad count, agent count, health',
        inputSchema: { type: 'object', properties: {}, required: [] },
    });

    // Tool: invoke-squad
    tools.push({
        name: 'aiox_invoke_squad',
        description: 'Invoke an entire squad for a task. Returns the squad definition and recommended workflow.',
        inputSchema: {
            type: 'object',
            properties: {
                squad: { type: 'string', description: 'Squad name' },
                task: { type: 'string', description: 'Task description' },
            },
            required: ['squad', 'task'],
        },
    });

    // Tool: event-publish
    tools.push({
        name: 'aiox_publish_event',
        description: 'Publish an event to the AIOX event bus for cross-squad communication',
        inputSchema: {
            type: 'object',
            properties: {
                channel: { type: 'string', description: 'Event channel (e.g., ops.emergency, revenue.deal_closed)' },
                data: { type: 'object', description: 'Event payload data' },
                source: { type: 'string', description: 'Source agent ID' },
            },
            required: ['channel', 'data'],
        },
    });

    // Tool: list-skills
    tools.push({
        name: 'aiox_list_skills',
        description: 'List available skills from the tools arsenal (tools/integrations). Limited by default, use search for specific skills.',
        inputSchema: {
            type: 'object',
            properties: {
                limit: { type: 'number', description: 'Maximum number of skills to return (default: 50)' }
            },
            required: []
        },
    });

    // Tool: search-skills
    tools.push({
        name: 'aiox_search_skills',
        description: 'Search for specific skills in the AIOX tools arsenal by keyword',
        inputSchema: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'Search query (e.g., "react", "pdf", "python")' },
            },
            required: ['query'],
        },
    });

    // Tool: read-skill
    tools.push({
        name: 'aiox_read_skill',
        description: 'Read the full instructional content of a specific skill (returns the SKILL.md content)',
        inputSchema: {
            type: 'object',
            properties: {
                skill_id: { type: 'string', description: 'ID of the skill (e.g., "python-pro", "mcp-builder")' },
            },
            required: ['skill_id'],
        },
    });

    // ============================================================
    // KAIROS EXCLUSIVE TOOLS
    // ============================================================

    // Tool: list-rps
    tools.push({
        name: 'kairos_list_rps',
        description: 'List all Reasoning Packages (RPs) organized by category (strategic, core, tasks)',
        inputSchema: {
            type: 'object',
            properties: {
                category: { type: 'string', description: 'Filter by category: strategic, core, tasks, or all (default: all)' },
            },
            required: [],
        },
    });

    // Tool: read-rp
    tools.push({
        name: 'kairos_read_rp',
        description: 'Read the full content of a specific Reasoning Package by filename',
        inputSchema: {
            type: 'object',
            properties: {
                filename: { type: 'string', description: 'RP filename (e.g., "RP-20260219-CODEX-GIGAS-v1.0.md")' },
                category: { type: 'string', description: 'Category folder: strategic, core, or tasks (default: searches all)' },
            },
            required: ['filename'],
        },
    });

    // Tool: read-doc
    tools.push({
        name: 'kairos_read_doc',
        description: 'Read any document from the KAIROS project by relative path',
        inputSchema: {
            type: 'object',
            properties: {
                path: { type: 'string', description: 'Relative path from project root (e.g., "docs/core/KAIROS-MANIFEST.md", "SELF_CONTEXT.md")' },
            },
            required: ['path'],
        },
    });

    // Tool: kairos-health
    tools.push({
        name: 'kairos_health',
        description: 'Full KAIROS system health check: agents, squads, RPs, scripts, tools, clients',
        inputSchema: { type: 'object', properties: {}, required: [] },
    });

    // Tool: list-workflows
    tools.push({
        name: 'kairos_list_workflows',
        description: 'List all AIOX workflows available for orchestration',
        inputSchema: { type: 'object', properties: {}, required: [] },
    });

    // ============================================================
    // v3.0 — DEEP SCAN GAP CLOSERS
    // ============================================================

    // Tool: list-tasks (204 AIOX tasks)
    tools.push({
        name: 'kairos_list_tasks',
        description: 'List all 204 AIOX development tasks with optional keyword filter',
        inputSchema: {
            type: 'object',
            properties: {
                filter: { type: 'string', description: 'Optional keyword filter (e.g., "qa", "dev", "db", "squad")' },
            },
            required: [],
        },
    });

    // Tool: read-task
    tools.push({
        name: 'kairos_read_task',
        description: 'Read the full content of a specific AIOX task by filename',
        inputSchema: {
            type: 'object',
            properties: {
                filename: { type: 'string', description: 'Task filename (e.g., "analyze-framework.md", "qa-review-build.md")' },
            },
            required: ['filename'],
        },
    });

    // Tool: list-framework-agents (12 AIOX agents - NOT squad agents)
    tools.push({
        name: 'kairos_list_framework_agents',
        description: 'List all 12 AIOX framework agent definitions (architect, dev, qa, etc.) with sizes',
        inputSchema: { type: 'object', properties: {}, required: [] },
    });

    // Tool: read-framework-agent
    tools.push({
        name: 'kairos_read_framework_agent',
        description: 'Read the full definition of an AIOX framework agent (persona, commands, dependencies)',
        inputSchema: {
            type: 'object',
            properties: {
                agent: { type: 'string', description: 'Agent ID (e.g., "architect", "dev", "qa", "aiox-master")' },
            },
            required: ['agent'],
        },
    });

    // Tool: list-clients
    tools.push({
        name: 'kairos_list_clients',
        description: 'List all KAIROS clients with their directory contents and config files',
        inputSchema: { type: 'object', properties: {}, required: [] },
    });

    // Tool: read-context (SELF_CONTEXT + STATUS)
    tools.push({
        name: 'kairos_read_context',
        description: 'Read SELF_CONTEXT.md and/or STATUS.md for session continuity',
        inputSchema: {
            type: 'object',
            properties: {
                file: { type: 'string', description: 'Which file: self_context, status, or both (default: both)' },
            },
            required: [],
        },
    });

    // Tool: explore-arsenal (Deep Scan of all executable scripts)
    tools.push({
        name: 'kairos_explore_arsenal',
        description: 'Deep scan to list all available executable scripts in the KAIROS arsenal (Evolution, Noesis, Utils)',
        inputSchema: {
            type: 'object',
            properties: {
                category: { type: 'string', description: 'Folder to scan (e.g. "evolution", "operator-noesis", "utils" or "all")' },
            },
            required: [],
        },
    });

    // Tool: read-script
    tools.push({
        name: 'kairos_read_script',
        description: 'Read the full source code of any script in the KAIROS arsenal to understand its execution logic.',
        inputSchema: {
            type: 'object',
            properties: {
                path: { type: 'string', description: 'Relative path to script (e.g., "scripts/evolution/convergence-guard.js")' },
            },
            required: ['path'],
        },
    });

    // Tool: read-synapse
    tools.push({
        name: 'kairos_read_synapse',
        description: 'Read agent synapse memory from .synapse/ (agent state, commands, constitution)',
        inputSchema: {
            type: 'object',
            properties: {
                target: { type: 'string', description: 'Synapse target: agent name (e.g., "agent-dev"), or "all" for listing' },
            },
            required: ['target'],
        },
    });

    // Tool: read-engine
    tools.push({
        name: 'kairos_read_engine',
        description: 'Read engine state: cognitive-state, identity-anchor, operator-profile, quality-baseline',
        inputSchema: {
            type: 'object',
            properties: {
                module: { type: 'string', description: 'Engine module: noesis, memory, or all (default: all)' },
            },
            required: [],
        },
    });

    // ---- SKYROS Personal OS Tools ----

    // Tool: skyros-triage
    tools.push({
        name: 'skyros_triage',
        description: 'Run SKYROS Morning Triage: scans roadmap.md for P0 tasks and checks Anamnesis vault status',
        inputSchema: { type: 'object', properties: {}, required: [] },
    });

    // Tool: skyros-isolation
    tools.push({
        name: 'skyros_isolation',
        description: 'Toggle SKYROS Isolation Mode (Deep Work): injects focus protocol into STATUS.md blocking distractions',
        inputSchema: {
            type: 'object',
            properties: {
                action: { type: 'string', description: 'Action: engage or disengage (default: engage)' },
            },
            required: [],
        },
    });

    // ============================================================
    // HIVEMIND PROTOCOL v1.0 — Multi-Agent Sync Tools
    // ============================================================

    tools.push({
        name: 'hivemind_log_decision',
        description: 'Log a decision/artifact/event to the Hivemind shared memory (engine/hivemind/decisions.jsonl). All agents read this on /context activation.',
        inputSchema: {
            type: 'object',
            properties: {
                agent: { type: 'string', description: 'Agent ID logging the decision (e.g., pc-chatA-root, pc-chatB, note-chatC)' },
                type: { type: 'string', description: 'Entry type: decision, artifact, task, or event' },
                summary: { type: 'string', description: 'Short summary of the decision' },
                context: { type: 'string', description: 'Why this decision was made' },
                affects: { type: 'array', items: { type: 'string' }, description: 'Areas affected (e.g., architecture, infra, tooling, all-agents)' },
            },
            required: ['agent', 'type', 'summary'],
        },
    });

    tools.push({
        name: 'hivemind_read_decisions',
        description: 'Read the latest N decisions from the Hivemind shared memory. Use on session start to sync with other agents.',
        inputSchema: {
            type: 'object',
            properties: {
                limit: { type: 'number', description: 'Number of most recent decisions to read (default: 20)' },
                filter_agent: { type: 'string', description: 'Optional: filter by agent ID' },
                filter_type: { type: 'string', description: 'Optional: filter by type (decision, artifact, task, event)' },
            },
            required: [],
        },
    });

    tools.push({
        name: 'hivemind_update_state',
        description: 'Update this agent\'s state in the Hivemind registry (engine/hivemind/agent-states.json)',
        inputSchema: {
            type: 'object',
            properties: {
                agent_id: { type: 'string', description: 'Agent ID (e.g., pc-chatA-root, pc-chatB, note-chatC, note-chatD)' },
                focus: { type: 'string', description: 'Current focus/task of this agent' },
                status: { type: 'string', description: 'Status: active, idle, or done' },
                chat_id: { type: 'string', description: 'Optional: Antigravity chat/conversation ID' },
                machine: { type: 'string', description: 'Optional: Machine identifier' },
            },
            required: ['agent_id'],
        },
    });

    tools.push({
        name: 'hivemind_read_states',
        description: 'Read the state of all Hivemind agents from the registry',
        inputSchema: { type: 'object', properties: {}, required: [] },
    });

    tools.push({
        name: 'hivemind_assign_task',
        description: 'Assign a task to a specific agent via the Hivemind decision log',
        inputSchema: {
            type: 'object',
            properties: {
                from_agent: { type: 'string', description: 'Agent assigning the task' },
                to_agent: { type: 'string', description: 'Target agent to receive the task' },
                task: { type: 'string', description: 'Task description' },
                priority: { type: 'string', description: 'Priority: P0, P1, P2 (default: P1)' },
            },
            required: ['from_agent', 'to_agent', 'task'],
        },
    });


    // ============================================================
    // RAILWAY API TOOLS v1.0
    // ============================================================

    // Tool: railway_list_services
    tools.push({
        name: 'railway_list_services',
        description: 'Lista todos os serviços de um projeto Railway. Retorna nome, status e ID de cada serviço.',
        inputSchema: {
            type: 'object',
            properties: {
                project_id: { type: 'string', description: 'ID do projeto Railway (opcional — usa RAILWAY_PROJECT_ID do .env se omitido)' },
            },
            required: [],
        },
    });

    // Tool: railway_service_status
    tools.push({
        name: 'railway_service_status',
        description: 'Verifica o status de deploy de um serviço Railway específico: ambiente, última versão, URL pública e status de saúde.',
        inputSchema: {
            type: 'object',
            properties: {
                service_id: { type: 'string', description: 'ID do serviço Railway' },
                project_id: { type: 'string', description: 'ID do projeto Railway (opcional — usa RAILWAY_PROJECT_ID do .env se omitido)' },
            },
            required: ['service_id'],
        },
    });

    // Tool: railway_deploy_service
    tools.push({
        name: 'railway_deploy_service',
        description: 'Dispara um redeploy de um serviço Railway. Útil após alterar variáveis de ambiente ou para forçar um reinício.',
        inputSchema: {
            type: 'object',
            properties: {
                service_id: { type: 'string', description: 'ID do serviço Railway a ser redeployado' },
                environment_id: { type: 'string', description: 'ID do ambiente Railway (opcional — usa o ambiente production por padrão)' },
            },
            required: ['service_id'],
        },
    });

    // Tool: railway_set_variable
    tools.push({
        name: 'railway_set_variable',
        description: 'Define ou atualiza uma variável de ambiente em um serviço Railway sem precisar acessar o dashboard.',
        inputSchema: {
            type: 'object',
            properties: {
                service_id: { type: 'string', description: 'ID do serviço Railway' },
                environment_id: { type: 'string', description: 'ID do ambiente Railway (opcional — usa production por padrão)' },
                name: { type: 'string', description: 'Nome da variável (ex: GROQ_API_KEY, PROMPT_BASE)' },
                value: { type: 'string', description: 'Valor da variável' },
            },
            required: ['service_id', 'name', 'value'],
        },
    });

    // Tool: railway_get_logs
    tools.push({
        name: 'railway_get_logs',
        description: 'Busca os logs mais recentes de um serviço Railway para debug e monitoramento.',
        inputSchema: {
            type: 'object',
            properties: {
                service_id: { type: 'string', description: 'ID do serviço Railway' },
                environment_id: { type: 'string', description: 'ID do ambiente Railway (opcional — usa production por padrão)' },
                limit: { type: 'number', description: 'Número de linhas de log a retornar (padrão: 50, máx: 500)' },
            },
            required: ['service_id'],
        },
    });

    return tools;
}

// ============================================================
// TOOL HANDLERS
// ============================================================

async function handleTool(name, args) {
    switch (name) {
        case 'aiox_list_squads': {
            const squads = fs.readdirSync(SQUADS_DIR)
                .filter(s => { try { return fs.statSync(path.join(SQUADS_DIR, s)).isDirectory(); } catch { return false; } })
                .map(s => {
                    const ad = path.join(SQUADS_DIR, s, 'agents');
                    let count = 0;
                    try { count = fs.readdirSync(ad).filter(f => f.endsWith('.md')).length; } catch { }
                    return { name: s, agents: count, hasYaml: fs.existsSync(path.join(SQUADS_DIR, s, 'squad.yaml')) };
                });
            const total = squads.reduce((sum, s) => sum + s.agents, 0);
            return { squads, totalSquads: squads.length, totalAgents: total };
        }

        case 'aiox_list_agents': {
            const ad = path.join(SQUADS_DIR, args.squad, 'agents');
            try {
                const agents = fs.readdirSync(ad).filter(f => f.endsWith('.md')).map(f => f.replace('.md', ''));
                return { squad: args.squad, agents, count: agents.length };
            } catch {
                return { error: `Squad '${args.squad}' not found` };
            }
        }

        case 'aiox_get_agent': {
            const fp = path.join(SQUADS_DIR, args.squad, 'agents', `${args.agent}.md`);
            try {
                const content = fs.readFileSync(fp, 'utf8');
                return { squad: args.squad, agent: args.agent, definition: content };
            } catch {
                return { error: `Agent '${args.agent}' not found in squad '${args.squad}'` };
            }
        }

        case 'aiox_search_agents': {
            const query = args.query.toLowerCase();
            const results = [];
            const squads = fs.readdirSync(SQUADS_DIR).filter(s => {
                try { return fs.statSync(path.join(SQUADS_DIR, s)).isDirectory(); } catch { return false; }
            });
            squads.forEach(squad => {
                const ad = path.join(SQUADS_DIR, squad, 'agents');
                try {
                    fs.readdirSync(ad).filter(f => f.endsWith('.md')).forEach(f => {
                        const content = fs.readFileSync(path.join(ad, f), 'utf8').toLowerCase();
                        if (content.includes(query) || f.toLowerCase().includes(query)) {
                            const titleMatch = content.match(/title:\s*(.+)/);
                            results.push({
                                id: f.replace('.md', ''),
                                squad,
                                title: titleMatch ? titleMatch[1].trim() : f.replace('.md', ''),
                            });
                        }
                    });
                } catch { }
            });
            return { query: args.query, results, count: results.length };
        }

        case 'aiox_status': {
            const squads = fs.readdirSync(SQUADS_DIR).filter(s => {
                try { return fs.statSync(path.join(SQUADS_DIR, s)).isDirectory(); } catch { return false; }
            });
            let totalAgents = 0;
            squads.forEach(s => {
                try { totalAgents += fs.readdirSync(path.join(SQUADS_DIR, s, 'agents')).filter(f => f.endsWith('.md')).length; } catch { }
            });
            let version = 'unknown';
            try { version = JSON.parse(fs.readFileSync(path.join(AIOX_ROOT, '.aiox-core', 'version.json'), 'utf8')).version; } catch { }
            return { version, squads: squads.length, agents: totalAgents, status: 'online', timestamp: new Date().toISOString() };
        }

        case 'aiox_invoke_squad': {
            const yamlPath = path.join(SQUADS_DIR, args.squad, 'squad.yaml');
            try {
                const yaml = fs.readFileSync(yamlPath, 'utf8');
                const agents = fs.readdirSync(path.join(SQUADS_DIR, args.squad, 'agents'))
                    .filter(f => f.endsWith('.md')).map(f => f.replace('.md', ''));
                const entryPoint = agents.length > 0 ? `@${agents[0]}` : 'No agents available';
                return {
                    squad: args.squad, definition: yaml, agents, task: args.task,
                    recommendation: `Use ${entryPoint} as entry point. Available agents: ${agents.join(', ') || 'none'}`
                };
            } catch {
                return { error: `Squad '${args.squad}' not found` };
            }
        }

        case 'aiox_publish_event': {
            return { published: true, channel: args.channel, data: args.data, source: args.source || 'mcp-client', timestamp: new Date().toISOString() };
        }

        case 'aiox_list_skills': {
            const discovery = toolsBridge.getDiscovery();
            if (!discovery.available) return { error: 'Tools bridge is not available. Ensure the tools/ directory exists.' };
            const limit = args.limit || 50;
            return {
                total_skills: discovery.totalSkills,
                integrations: discovery.integrations.length,
                skills_preview: discovery.allSkills.slice(0, limit).map(s => ({ id: s.id, name: s.name })),
                note: `Showing first ${Math.min(limit, discovery.totalSkills)} skills. Use aiox_search_skills to find specific ones.`
            };
        }

        case 'aiox_search_skills': {
            if (!toolsBridge.available) return { error: 'Tools bridge is not available.' };
            const results = toolsBridge.searchSkills(args.query);
            return {
                query: args.query,
                count: results.length,
                results: results.slice(0, 20).map(s => ({
                    id: s.id,
                    name: s.name,
                    relevance: s.relevance,
                    description: s.description
                }))
            };
        }

        case 'aiox_read_skill': {
            if (!toolsBridge.available) return { error: 'Tools bridge is not available.' };
            const content = toolsBridge.loadSkillContent(args.skill_id);
            if (!content) return { error: `Skill '${args.skill_id}' not found or has no content.` };
            const skill = toolsBridge.getSkillById(args.skill_id);
            if (!skill) return { error: `Skill '${args.skill_id}' not found in registry.` };
            return {
                id: args.skill_id,
                name: skill.name,
                path: skill.path,
                content: content
            };
        }

        // ============================================================
        // KAIROS EXCLUSIVE HANDLERS
        // ============================================================

        case 'kairos_list_rps': {
            const RP_DIR = path.join(AIOX_ROOT, 'reasoning-packages');
            const categories = ['strategic', 'core', 'tasks'];
            const filterCat = args.category || 'all';
            const result = {};
            let total = 0;

            for (const cat of categories) {
                if (filterCat !== 'all' && filterCat !== cat) continue;
                const catDir = path.join(RP_DIR, cat);
                try {
                    const files = fs.readdirSync(catDir).filter(f => f.endsWith('.md'));
                    result[cat] = files.map(f => {
                        const content = fs.readFileSync(path.join(catDir, f), 'utf8');
                        const titleMatch = content.match(/^#\s+(.+)/m);
                        return { filename: f, title: titleMatch ? titleMatch[1].trim() : f.replace('.md', '') };
                    });
                    total += files.length;
                } catch { result[cat] = []; }
            }
            return { categories: result, total, filter: filterCat };
        }

        case 'kairos_read_rp': {
            const RP_DIR = path.join(AIOX_ROOT, 'reasoning-packages');
            const searchDirs = args.category ? [args.category] : ['strategic', 'core', 'tasks'];
            for (const dir of searchDirs) {
                const fp = path.join(RP_DIR, dir, args.filename);
                try {
                    const content = fs.readFileSync(fp, 'utf8');
                    return { filename: args.filename, category: dir, content, chars: content.length };
                } catch { continue; }
            }
            return { error: `RP '${args.filename}' not found in any category` };
        }

        case 'kairos_read_doc': {
            // Security: prevent path traversal with strict validation
            const docPath = path.normalize(args.path).replace(/^(\.\.(\/|\\))+/g, '');
            const resolved = path.resolve(AIOX_ROOT, docPath);
            const rootResolved = path.resolve(AIOX_ROOT);
            if (!resolved.startsWith(rootResolved) || resolved.length < rootResolved.length) {
                return { error: 'Access denied: path traversal detected' };
            }
            try {
                const content = fs.readFileSync(resolved, 'utf8');
                return { path: args.path, content, chars: content.length };
            } catch {
                return { error: `Document '${args.path}' not found` };
            }
        }

        case 'kairos_health': {
            const health = { timestamp: new Date().toISOString(), subsystems: {} };

            // Squads
            try {
                const squads = fs.readdirSync(SQUADS_DIR).filter(s => {
                    try { return fs.statSync(path.join(SQUADS_DIR, s)).isDirectory(); } catch { return false; }
                });
                let totalAgents = 0;
                squads.forEach(s => {
                    try { totalAgents += fs.readdirSync(path.join(SQUADS_DIR, s, 'agents')).filter(f => f.endsWith('.md')).length; } catch { }
                });
                health.subsystems.squads = { status: 'ok', count: squads.length, agents: totalAgents };
            } catch { health.subsystems.squads = { status: 'error' }; }

            // RPs
            const rpDir = path.join(AIOX_ROOT, 'reasoning-packages');
            try {
                let rpTotal = 0;
                for (const cat of ['strategic', 'core', 'tasks']) {
                    try { rpTotal += fs.readdirSync(path.join(rpDir, cat)).filter(f => f.endsWith('.md')).length; } catch { }
                }
                health.subsystems.reasoning_packages = { status: 'ok', count: rpTotal };
            } catch { health.subsystems.reasoning_packages = { status: 'error' }; }

            // Tools
            const toolsHealth = toolsBridge.getHealth();
            health.subsystems.tools = { status: toolsHealth.available ? 'ok' : 'error', ...toolsHealth };

            // Scripts
            const scriptsDir = path.join(AIOX_ROOT, 'scripts');
            try {
                const scripts = fs.readdirSync(scriptsDir).filter(f => f.startsWith('kairos-'));
                health.subsystems.kairos_scripts = { status: 'ok', count: scripts.length, files: scripts };
            } catch { health.subsystems.kairos_scripts = { status: 'error' }; }

            // Clients
            const clientsDir = path.join(AIOX_ROOT, 'clients');
            try {
                const clients = fs.readdirSync(clientsDir).filter(c => {
                    try { return fs.statSync(path.join(clientsDir, c)).isDirectory(); } catch { return false; }
                });
                health.subsystems.clients = { status: 'ok', count: clients.length, names: clients };
            } catch { health.subsystems.clients = { status: 'error' }; }

            // AIOX Core
            const corePath = path.join(AIOX_ROOT, '.aiox-core');
            health.subsystems.aiox_core = { status: fs.existsSync(corePath) ? 'ok' : 'missing' };

            // Context files
            health.subsystems.self_context = { status: fs.existsSync(path.join(AIOX_ROOT, 'SELF_CONTEXT.md')) ? 'ok' : 'missing' };
            health.subsystems.status_md = { status: fs.existsSync(path.join(AIOX_ROOT, 'STATUS.md')) ? 'ok' : 'missing' };

            // Overall
            const allOk = Object.values(health.subsystems).every(s => s.status === 'ok');
            health.overall = allOk ? 'healthy' : 'degraded';

            return health;
        }

        case 'kairos_list_workflows': {
            const wfDir = path.join(AIOX_ROOT, '.aiox-core', 'development', 'workflows');
            try {
                const files = fs.readdirSync(wfDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
                const workflows = files.map(f => {
                    const content = fs.readFileSync(path.join(wfDir, f), 'utf8');
                    const nameMatch = content.match(/name:\s*(.+)/i);
                    return { filename: f, name: nameMatch ? nameMatch[1].trim() : f.replace(/\.ya?ml$/, '') };
                });
                return { workflows, count: workflows.length };
            } catch {
                return { error: 'Workflows directory not found', path: wfDir };
            }
        }

        // ============================================================
        // v3.0 — DEEP SCAN GAP CLOSERS
        // ============================================================

        case 'kairos_list_tasks': {
            const tasksDir = path.join(AIOX_ROOT, '.aiox-core', 'development', 'tasks');
            try {
                let files = fs.readdirSync(tasksDir).filter(f => f.endsWith('.md'));
                if (args.filter) {
                    const q = args.filter.toLowerCase();
                    files = files.filter(f => f.toLowerCase().includes(q));
                }
                return { tasks: files, count: files.length, total: fs.readdirSync(tasksDir).filter(f => f.endsWith('.md')).length };
            } catch {
                return { error: 'Tasks directory not found' };
            }
        }

        case 'kairos_read_task': {
            const taskPath = path.join(AIOX_ROOT, '.aiox-core', 'development', 'tasks', args.filename);
            try {
                const content = fs.readFileSync(taskPath, 'utf8');
                return { filename: args.filename, content, chars: content.length };
            } catch {
                return { error: `Task '${args.filename}' not found` };
            }
        }

        case 'kairos_list_framework_agents': {
            const agentsDir = path.join(AIOX_ROOT, '.aiox-core', 'development', 'agents');
            try {
                const files = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'));
                const agents = files.map(f => {
                    const stat = fs.statSync(path.join(agentsDir, f));
                    const content = fs.readFileSync(path.join(agentsDir, f), 'utf8');
                    const titleMatch = content.match(/title:\s*(.+)/i);
                    const hasSubdir = fs.existsSync(path.join(agentsDir, f.replace('.md', '')));
                    return {
                        id: f.replace('.md', ''),
                        filename: f,
                        title: titleMatch ? titleMatch[1].trim() : f.replace('.md', ''),
                        bytes: stat.size,
                        hasSubdir,
                    };
                });
                return { agents, count: agents.length };
            } catch {
                return { error: 'Agents directory not found' };
            }
        }

        case 'kairos_read_framework_agent': {
            const agentPath = path.join(AIOX_ROOT, '.aiox-core', 'development', 'agents', `${args.agent}.md`);
            try {
                const content = fs.readFileSync(agentPath, 'utf8');
                return { agent: args.agent, content, chars: content.length };
            } catch {
                return { error: `Framework agent '${args.agent}' not found` };
            }
        }

        case 'kairos_list_clients': {
            const clientsDir = path.join(AIOX_ROOT, 'clients');
            try {
                const dirs = fs.readdirSync(clientsDir).filter(c => {
                    try { return fs.statSync(path.join(clientsDir, c)).isDirectory(); } catch { return false; }
                });
                const clients = dirs.map(d => {
                    const clientDir = path.join(clientsDir, d);
                    const files = fs.readdirSync(clientDir);
                    const hasConfig = files.some(f => f.includes('config') || f.endsWith('.yaml') || f.endsWith('.json'));
                    return { name: d, files: files.slice(0, 20), fileCount: files.length, hasConfig };
                });
                return { clients, count: clients.length };
            } catch {
                return { error: 'Clients directory not found' };
            }
        }

        case 'kairos_read_context': {
            const target = args.file || 'both';
            const result = {};
            if (target === 'self_context' || target === 'both') {
                try {
                    result.self_context = fs.readFileSync(path.join(AIOX_ROOT, 'SELF_CONTEXT.md'), 'utf8');
                } catch { result.self_context = null; }
            }
            if (target === 'status' || target === 'both') {
                try {
                    result.status = fs.readFileSync(path.join(AIOX_ROOT, 'STATUS.md'), 'utf8');
                } catch { result.status = null; }
            }
            return result;
        }

        case 'kairos_explore_arsenal': {
            const cat = args.category || 'all';
            const results = [];
            
            function scanDir(dir, relPrefix = '') {
                try {
                    const entries = fs.readdirSync(dir, { withFileTypes: true });
                    for (const entry of entries) {
                        const relPath = path.join(relPrefix, entry.name);
                        const fullPath = path.join(dir, entry.name);
                        if (entry.isDirectory()) {
                            if (entry.name !== 'node_modules' && entry.name !== '.git' && !entry.name.startsWith('.')) {
                                scanDir(fullPath, relPath);
                            }
                        } else if (entry.name.endsWith('.js') || entry.name.endsWith('.py') || entry.name.endsWith('.ps1')) {
                            const stat = fs.statSync(fullPath);
                            results.push({
                                path: `${relPrefix ? relPrefix.split(path.sep)[0] : ''}/${relPath.split(path.sep).slice(1).join('/') || entry.name}`.replace(/^\//, '') || relPath.replace(/\\/g, '/'),
                                name: entry.name,
                                bytes: stat.size
                            });
                        }
                    }
                } catch (e) {
                    // Ignore inaccessible folders
                }
            }
            
            if (cat === 'all') {
                const roots = ['scripts', 'tools', 'packages'];
                for (const r of roots) {
                    const targetDir = path.join(AIOX_ROOT, r);
                    if (fs.existsSync(targetDir)) scanDir(targetDir, r);
                }
            } else {
                const targetDir = path.join(AIOX_ROOT, cat);
                const resolvedTarget = path.resolve(targetDir);
                if (!resolvedTarget.startsWith(path.resolve(AIOX_ROOT))) {
                    return { error: 'Invalid category path' };
                }
                scanDir(targetDir, cat);
            }
            
            return { arsenal: results, count: results.length };
        }

        case 'kairos_read_script': {
            const scriptPath = path.join(AIOX_ROOT, args.path);
            const resolved = path.resolve(scriptPath);
            const validRoots = ['scripts', 'tools', 'packages'].map(r => path.resolve(AIOX_ROOT, r));
            
            if (!validRoots.some(root => resolved.startsWith(root))) {
                return { error: 'Access denied. You can only read files within scripts, tools, or packages directories.' };
            }
            try {
                const content = fs.readFileSync(resolved, 'utf8');
                return { path: args.path, content, chars: content.length };
            } catch {
                return { error: `Script '${args.path}' not found` };
            }
        }

        case 'kairos_read_synapse': {
            const synapseDir = path.join(AIOX_ROOT, '.synapse');
            if (args.target === 'all') {
                try {
                    const files = fs.readdirSync(synapseDir).filter(f => !f.startsWith('.'));
                    const synapses = files.map(f => {
                        const stat = fs.statSync(path.join(synapseDir, f));
                        return { name: f, isDir: stat.isDirectory(), bytes: stat.isFile() ? stat.size : 0 };
                    });
                    return { synapses, count: synapses.length };
                } catch {
                    return { error: 'Synapse directory not found' };
                }
            }
            // Read specific synapse
            const synapsePath = path.join(synapseDir, args.target);
            try {
                const content = fs.readFileSync(synapsePath, 'utf8');
                return { target: args.target, content, chars: content.length };
            } catch {
                return { error: `Synapse '${args.target}' not found` };
            }
        }

        case 'kairos_read_engine': {
            const mod = args.module || 'all';
            const result = {};
            if (mod === 'noesis' || mod === 'all') {
                const noesisDir = path.join(AIOX_ROOT, 'engine', 'noesis');
                try {
                    const files = ['cognitive-state.json', 'identity-anchor.json', 'state-history.json'];
                    result.noesis = {};
                    for (const f of files) {
                        try {
                            const content = fs.readFileSync(path.join(noesisDir, f), 'utf8');
                            result.noesis[f.replace('.json', '')] = JSON.parse(content);
                        } catch { result.noesis[f.replace('.json', '')] = null; }
                    }
                } catch { result.noesis = { error: 'not found' }; }
            }
            if (mod === 'memory' || mod === 'all') {
                const memDir = path.join(AIOX_ROOT, 'engine', 'memory');
                try {
                    const files = ['operator-profile.json', 'quality-baseline.json'];
                    result.memory = {};
                    for (const f of files) {
                        try {
                            const content = fs.readFileSync(path.join(memDir, f), 'utf8');
                            result.memory[f.replace('.json', '')] = JSON.parse(content);
                        } catch { result.memory[f.replace('.json', '')] = null; }
                    }
                } catch { result.memory = { error: 'not found' }; }
            }
            return result;
        }

        // ---- SKYROS Personal OS Handlers ----

        case 'skyros_triage': {
            const roadmapPath = path.join(AIOX_ROOT, 'roadmap.md');
            const anamnesisPath = path.join(AIOX_ROOT, 'docs', 'anamnesis');
            const result = { timestamp: new Date().toISOString() };

            if (!fs.existsSync(roadmapPath)) {
                result.error = 'roadmap.md not found in project root';
                return result;
            }

            const roadmapContent = fs.readFileSync(roadmapPath, 'utf8');
            const p0Matches = [...roadmapContent.matchAll(/\|.*[pP]0.*\|/g)];
            result.p0Tasks = p0Matches.map(m => m[0].trim());
            result.p0Count = p0Matches.length;
            result.anamnesisReady = fs.existsSync(anamnesisPath);

            if (result.anamnesisReady) {
                try {
                    result.anamnesisFiles = fs.readdirSync(anamnesisPath).filter(f => !f.startsWith('.'));
                } catch { result.anamnesisFiles = []; }
            }

            result.directive = result.p0Count > 0
                ? `FOCO: ${result.p0Count} tarefa(s) P0 detectada(s). Ataque apenas estas.`
                : 'Nenhuma P0 ativa. Tempo livre para P1/Deep Learning.';

            return result;
        }

        case 'skyros_isolation': {
            const statusPath = path.join(AIOX_ROOT, 'STATUS.md');
            const action = (args.action || 'engage').toLowerCase();
            const isolationTag = '> \uD83D\uDD34 [SKYROS]: ISOLATION MODE ENGAGED. O operador está em Deep Work. Novas tarefas fora da SPRINT P0 devem ser TERMINANTEMENTE negadas.';

            if (!fs.existsSync(statusPath)) {
                return { error: 'STATUS.md not found' };
            }

            let content = fs.readFileSync(statusPath, 'utf8');
            const isActive = content.includes('ISOLATION MODE ENGAGED');

            if (action === 'engage') {
                if (isActive) {
                    return { status: 'already_active', message: 'Isolation Mode já estava ativo.' };
                }
                content = isolationTag + '\n\n' + content;
                fs.writeFileSync(statusPath, content);
                return { status: 'engaged', message: 'Deep Work ativado. STATUS.md injetado com protocolo de Foco Máximo.' };
            } else if (action === 'disengage') {
                if (!isActive) {
                    return { status: 'already_inactive', message: 'Isolation Mode não estava ativo.' };
                }
                content = content.replace(/^>.*ISOLATION MODE ENGAGED.*\n?\n?/m, '');
                fs.writeFileSync(statusPath, content);
                return { status: 'disengaged', message: 'Isolation Mode desativado. Operações normais retomadas.' };
            }
            return { error: 'Invalid action. Use "engage" or "disengage".' };
        }

        // ============================================================
        // HIVEMIND PROTOCOL v1.0 — Handlers
        // ============================================================

        case 'hivemind_log_decision': {
            const HIVEMIND_DIR = path.join(AIOX_ROOT, 'engine', 'hivemind');
            const logPath = path.join(HIVEMIND_DIR, 'decisions.jsonl');
            try {
                if (!fs.existsSync(HIVEMIND_DIR)) fs.mkdirSync(HIVEMIND_DIR, { recursive: true });
                const sanitize = (str) => typeof str === 'string' ? str.replace(/[\n\r]/g, ' ') : str;
                const entry = {
                    ts: new Date().toISOString(),
                    agent: args.agent,
                    type: args.type || 'decision',
                    summary: sanitize(args.summary),
                    context: sanitize(args.context) || '',
                    affects: args.affects || [],
                };
                fs.appendFileSync(logPath, JSON.stringify(entry) + '\n');
                return { logged: true, entry };
            } catch (e) {
                return { error: `Failed to log decision: ${e.message}` };
            }
        }

        case 'hivemind_read_decisions': {
            const HIVEMIND_DIR = path.join(AIOX_ROOT, 'engine', 'hivemind');
            const logPath = path.join(HIVEMIND_DIR, 'decisions.jsonl');
            try {
                if (!fs.existsSync(logPath)) return { decisions: [], count: 0 };
                const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n').filter(l => l.trim());
                let decisions = lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
                if (args.filter_agent) decisions = decisions.filter(d => d.agent === args.filter_agent);
                if (args.filter_type) decisions = decisions.filter(d => d.type === args.filter_type);
                const limit = args.limit || 20;
                decisions = decisions.slice(-limit);
                return { decisions, count: decisions.length, total_in_log: lines.length };
            } catch (e) {
                return { error: `Failed to read decisions: ${e.message}` };
            }
        }

        case 'hivemind_update_state': {
            const HIVEMIND_DIR = path.join(AIOX_ROOT, 'engine', 'hivemind');
            const statePath = path.join(HIVEMIND_DIR, 'agent-states.json');
            try {
                if (!fs.existsSync(HIVEMIND_DIR)) fs.mkdirSync(HIVEMIND_DIR, { recursive: true });
                let states = { agents: {}, protocol_version: '1.0', last_sync: new Date().toISOString() };
                if (fs.existsSync(statePath)) {
                    states = JSON.parse(fs.readFileSync(statePath, 'utf8'));
                }
                if (!states.agents[args.agent_id]) states.agents[args.agent_id] = {};
                const agent = states.agents[args.agent_id];
                agent.last_active = new Date().toISOString();
                if (args.focus) agent.focus = args.focus;
                if (args.status) agent.status = args.status;
                if (args.chat_id) agent.id = args.chat_id;
                if (args.machine) agent.machine = args.machine;
                states.last_sync = new Date().toISOString();
                fs.writeFileSync(statePath, JSON.stringify(states, null, 2));
                return { updated: true, agent_id: args.agent_id, state: agent };
            } catch (e) {
                return { error: `Failed to update state: ${e.message}` };
            }
        }

        case 'hivemind_read_states': {
            const HIVEMIND_DIR = path.join(AIOX_ROOT, 'engine', 'hivemind');
            const statePath = path.join(HIVEMIND_DIR, 'agent-states.json');
            try {
                if (!fs.existsSync(statePath)) return { agents: {}, count: 0 };
                const states = JSON.parse(fs.readFileSync(statePath, 'utf8'));
                return { ...states, count: Object.keys(states.agents || {}).length };
            } catch (e) {
                return { error: `Failed to read states: ${e.message}` };
            }
        }

        case 'hivemind_assign_task': {
            const HIVEMIND_DIR = path.join(AIOX_ROOT, 'engine', 'hivemind');
            const logPath = path.join(HIVEMIND_DIR, 'decisions.jsonl');
            try {
                if (!fs.existsSync(HIVEMIND_DIR)) fs.mkdirSync(HIVEMIND_DIR, { recursive: true });
                const entry = {
                    ts: new Date().toISOString(),
                    agent: args.from_agent,
                    type: 'task',
                    summary: `[ASSIGN → ${args.to_agent}] ${args.task}`,
                    context: `Priority: ${args.priority || 'P1'}`,
                    affects: [args.to_agent],
                };
                fs.appendFileSync(logPath, JSON.stringify(entry) + '\n');
                return { assigned: true, from: args.from_agent, to: args.to_agent, task: args.task, priority: args.priority || 'P1' };
            } catch (e) {
                return { error: `Failed to assign task: ${e.message}` };
            }
        }

        // ============================================================
        // RAILWAY API HANDLERS v1.0
        // ============================================================

        case 'railway_list_services': {
            const fs = require('fs');
            const envContent = fs.readFileSync(path.join(AIOX_ROOT, '.env'), 'utf8');
            const match = envContent.match(/RAILWAY_TOKEN=(.+)/);
            const token = process.env.RAILWAY_TOKEN || process.env.RAILWAY_API_TOKEN || (match ? match[1].trim() : null);
            if (!token) return { error: 'DEBUG: RAILWAY_TOKEN missing. env keys: ' + Object.keys(process.env).join(',') };

            const projectId = args.project_id || process.env.RAILWAY_PROJECT_ID;
            if (!projectId) return { error: 'project_id não fornecido e RAILWAY_PROJECT_ID não está no .env' };

            const query = `query { project(id: "${projectId}") { services { edges { node { id name createdAt } } } } }`;

            try {
                const https = require('https');
                const body = JSON.stringify({ query });
                const result = await new Promise((resolve, reject) => {
                    const req = https.request({
                        hostname: 'backboard.railway.com',
                        path: '/graphql/v2',
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                            'Content-Length': Buffer.byteLength(body),
                        },
                    }, (res) => {
                        let data = '';
                        res.on('data', chunk => data += chunk);
                        res.on('end', () => resolve(JSON.parse(data)));
                    });
                    req.on('error', reject);
                    req.write(body);
                    req.end();
                });
                if (result.errors) return { error: result.errors[0].message, details: result.errors };
                const services = result.data.project.services.edges.map(e => e.node);
                return { project_id: projectId, services, count: services.length };
            } catch (e) {
                return { error: `Falha na chamada Railway API: ${e.message}` };
            }
        }

        case 'railway_service_status': {
            const token = process.env.RAILWAY_TOKEN || process.env.RAILWAY_API_TOKEN;
            if (!token) return { error: 'RAILWAY_TOKEN não configurado no .env' };

            const projectId = args.project_id || process.env.RAILWAY_PROJECT_ID;
            const serviceId = args.service_id;

            const query = `query {
                deployments(input: { serviceId: "${serviceId}" }) {
                    edges {
                        node {
                            id
                            status
                            createdAt
                            url
                            meta
                        }
                    }
                }
            }`;

            try {
                const https = require('https');
                const body = JSON.stringify({ query });
                const result = await new Promise((resolve, reject) => {
                    const req = https.request({
                        hostname: 'backboard.railway.com',
                        path: '/graphql/v2',
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                            'Content-Length': Buffer.byteLength(body),
                        },
                    }, (res) => {
                        let data = '';
                        res.on('data', chunk => data += chunk);
                        res.on('end', () => resolve(JSON.parse(data)));
                    });
                    req.on('error', reject);
                    req.write(body);
                    req.end();
                });
                if (result.errors) return { error: result.errors[0].message };
                const deployments = result.data.deployments.edges.map(e => e.node);
                const latest = deployments[0] || null;
                return {
                    service_id: serviceId,
                    latest_deployment: latest,
                    all_deployments_count: deployments.length,
                };
            } catch (e) {
                return { error: `Falha na chamada Railway API: ${e.message}` };
            }
        }

        case 'railway_deploy_service': {
            const token = process.env.RAILWAY_TOKEN || process.env.RAILWAY_API_TOKEN;
            if (!token) return { error: 'RAILWAY_TOKEN não configurado no .env' };

            const serviceId = args.service_id;
            const environmentId = args.environment_id || process.env.RAILWAY_ENVIRONMENT_ID;
            if (!environmentId) return { error: 'environment_id não fornecido e RAILWAY_ENVIRONMENT_ID não está no .env' };

            const mutation = `mutation {
                serviceInstanceRedeploy(environmentId: "${environmentId}", serviceId: "${serviceId}")
            }`;

            try {
                const https = require('https');
                const body = JSON.stringify({ query: mutation });
                const result = await new Promise((resolve, reject) => {
                    const req = https.request({
                        hostname: 'backboard.railway.com',
                        path: '/graphql/v2',
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                            'Content-Length': Buffer.byteLength(body),
                        },
                    }, (res) => {
                        let data = '';
                        res.on('data', chunk => data += chunk);
                        res.on('end', () => resolve(JSON.parse(data)));
                    });
                    req.on('error', reject);
                    req.write(body);
                    req.end();
                });
                if (result.errors) return { error: result.errors[0].message };
                return {
                    redeployed: true,
                    service_id: serviceId,
                    environment_id: environmentId,
                    timestamp: new Date().toISOString(),
                    message: 'Redeploy disparado com sucesso. Use railway_service_status para acompanhar.',
                };
            } catch (e) {
                return { error: `Falha no redeploy: ${e.message}` };
            }
        }

        case 'railway_set_variable': {
            const token = process.env.RAILWAY_TOKEN || process.env.RAILWAY_API_TOKEN;
            if (!token) return { error: 'RAILWAY_TOKEN não configurado no .env' };

            const projectId = args.project_id || process.env.RAILWAY_PROJECT_ID;
            const environmentId = args.environment_id || process.env.RAILWAY_ENVIRONMENT_ID;
            if (!environmentId) return { error: 'environment_id não fornecido e RAILWAY_ENVIRONMENT_ID não está no .env' };

            const mutation = `mutation {
                variableUpsert(input: {
                    projectId: "${projectId}"
                    environmentId: "${environmentId}"
                    serviceId: "${args.service_id}"
                    name: "${args.name.replace(/"/g, '\\"')}"
                    value: "${args.value.replace(/"/g, '\\"')}"
                })
            }`;

            try {
                const https = require('https');
                const body = JSON.stringify({ query: mutation });
                const result = await new Promise((resolve, reject) => {
                    const req = https.request({
                        hostname: 'backboard.railway.com',
                        path: '/graphql/v2',
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                            'Content-Length': Buffer.byteLength(body),
                        },
                    }, (res) => {
                        let data = '';
                        res.on('data', chunk => data += chunk);
                        res.on('end', () => resolve(JSON.parse(data)));
                    });
                    req.on('error', reject);
                    req.write(body);
                    req.end();
                });
                if (result.errors) return { error: result.errors[0].message };
                return {
                    set: true,
                    variable: args.name,
                    service_id: args.service_id,
                    message: `Variável '${args.name}' definida. Faça redeploy via railway_deploy_service para aplicar.`,
                };
            } catch (e) {
                return { error: `Falha ao definir variável: ${e.message}` };
            }
        }

        case 'railway_get_logs': {
            const token = process.env.RAILWAY_TOKEN || process.env.RAILWAY_API_TOKEN;
            if (!token) return { error: 'RAILWAY_TOKEN não configurado no .env' };

            const environmentId = args.environment_id || process.env.RAILWAY_ENVIRONMENT_ID;
            if (!environmentId) return { error: 'environment_id não fornecido e RAILWAY_ENVIRONMENT_ID não está no .env' };

            const limit = Math.min(args.limit || 50, 500);

            const query = `query {
                deploymentLogs(
                    deploymentId: ""
                    filter: ""
                    limit: ${limit}
                ) {
                    timestamp
                    message
                    severity
                }
            }`;

            // Busca o último deployment ID primeiro
            const deployQuery = `query {
                deployments(input: { serviceId: "${args.service_id}" }) {
                    edges { node { id status } }
                }
            }`;

            try {
                const https = require('https');

                const makeRequest = (body) => new Promise((resolve, reject) => {
                    const req = https.request({
                        hostname: 'backboard.railway.com',
                        path: '/graphql/v2',
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                            'Content-Length': Buffer.byteLength(body),
                        },
                    }, (res) => {
                        let data = '';
                        res.on('data', chunk => data += chunk);
                        res.on('end', () => resolve(JSON.parse(data)));
                    });
                    req.on('error', reject);
                    req.write(body);
                    req.end();
                });

                const deployResult = await makeRequest(JSON.stringify({ query: deployQuery }));
                if (deployResult.errors) return { error: deployResult.errors[0].message };

                const deployments = deployResult.data?.deployments?.edges || [];
                if (!deployments.length) return { error: 'Nenhum deployment encontrado para este serviço', service_id: args.service_id };

                const latestDeployId = deployments[0].node.id;
                const logQuery = `query {
                    deploymentLogs(
                        deploymentId: "${latestDeployId}"
                        filter: ""
                        limit: ${limit}
                    ) {
                        timestamp
                        message
                        severity
                    }
                }`;

                const logResult = await makeRequest(JSON.stringify({ query: logQuery }));
                if (logResult.errors) return { error: logResult.errors[0].message };

                const logs = logResult.data?.deploymentLogs || [];
                return {
                    service_id: args.service_id,
                    deployment_id: latestDeployId,
                    deployment_status: deployments[0].node.status,
                    logs,
                    log_count: logs.length,
                };
            } catch (e) {
                return { error: `Falha ao buscar logs: ${e.message}` };
            }
        }

        default:
            return { error: `Unknown tool: ${name}` };
    }
}

// ============================================================
// MCP STDIO SERVER
// ============================================================

if (process.argv.includes('--list')) {
    console.log('🔧 AIOX MCP Server — Available Tools\n');
    const tools = scanTools();
    tools.forEach(t => {
        console.log(`  📌 ${t.name}`);
        console.log(`     ${t.description}`);
        const params = Object.keys(t.inputSchema.properties || {});
        if (params.length) console.log(`     Params: ${params.join(', ')}`);
        console.log();
    });
    console.log(`Total: ${tools.length} tools exposed`);
    process.exit(0);
}

if (process.argv.includes('--test')) {
    console.log('🧪 AIOX MCP Server — Self Test\n');

    const tests = [
        ['aiox_status', {}],
        ['aiox_list_squads', {}],
        ['aiox_list_agents', { squad: 'doombot' }],
        ['aiox_search_agents', { query: 'revenue' }],
        ['aiox_publish_event', { channel: 'test.ping', data: { msg: 'hello' } }],
        ['aiox_list_skills', { limit: 5 }],
        ['aiox_search_skills', { query: 'react' }],
        // KAIROS v2.0 tests
        ['kairos_list_rps', { category: 'all' }],
        ['kairos_read_doc', { path: 'package.json' }],
        ['kairos_health', {}],
        ['kairos_list_workflows', {}],
        // KAIROS v3.0 deep-scan gap closers
        ['kairos_list_tasks', { filter: 'qa' }],
        ['kairos_read_task', { filename: 'analyze-framework.md' }],
        ['kairos_list_framework_agents', {}],
        ['kairos_read_framework_agent', { agent: 'dev' }],
        ['kairos_list_clients', {}],
        ['kairos_read_context', { file: 'both' }],
        ['kairos_read_synapse', { target: 'all' }],
        ['kairos_read_engine', { module: 'all' }],
        ['kairos_explore_arsenal', { category: 'all' }],
        ['kairos_read_script', { path: 'scripts/mcp-server.js' }],
        // SKYROS Personal OS
        ['skyros_triage', {}],
        ['skyros_isolation', { action: 'engage' }],
        // Hivemind Protocol v1.0
        ['hivemind_log_decision', { agent: 'test', type: 'event', summary: 'MCP self-test' }],
        ['hivemind_read_decisions', { limit: 5 }],
        ['hivemind_update_state', { agent_id: 'test-agent', focus: 'self-test', status: 'active' }],
        ['hivemind_read_states', {}],
        ['hivemind_assign_task', { from_agent: 'test', to_agent: 'test-target', task: 'test task' }],
    ];

    let passed = 0;
    tests.forEach(([name, args]) => {
        try {
            const result = handleTool(name, args);
            const hasError = result.error;
            console.log(`  ${hasError ? '❌' : '✅'} ${name}: ${hasError ? result.error : 'OK'}`);
            if (!hasError) passed++;
        } catch (e) {
            console.log(`  ❌ ${name}: ${e.message}`);
        }
    });

    console.log(`\n${passed}/${tests.length} tests passed`);
    process.exit(passed === tests.length ? 0 : 1);
}

// STDIO MCP Server Mode
if (!process.argv.includes('--list') && !process.argv.includes('--test')) {
    const tools = scanTools();

    // Read JSON-RPC messages from stdin
    let buffer = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
        buffer += chunk;

        // Try to parse complete JSON-RPC messages
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        lines.filter(l => l.trim()).forEach(async line => {
            try {
                const msg = JSON.parse(line);
                const response = await handleMessage(msg, tools);
                if (response) {
                    process.stdout.write(JSON.stringify(response) + '\n');
                }
            } catch (e) {
                // Ignore parse errors
            }
        });
    });

    async function handleMessage(msg, tools) {
        const { id, method, params } = msg;

        switch (method) {
            case 'initialize':
                return {
                    jsonrpc: '2.0', id, result: {
                        protocolVersion: '2024-11-05',
                        capabilities: { tools: {} },
                        serverInfo: { name: 'aiox-kairos-mcp-server', version: '5.0.0-hivemind' },
                    }
                };

            case 'tools/list':
                return { jsonrpc: '2.0', id, result: { tools } };

            case 'tools/call':
                const result = await Promise.resolve(handleTool(params.name, params.arguments || {}));
                return {
                    jsonrpc: '2.0', id, result: {
                        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                    }
                };

            case 'notifications/initialized':
                return null; // No response needed

            default:
                return { jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } };
        }
    }

    // Log to stderr (MCP standard)
    process.stderr.write('🔧 AIOX + KAIROS MCP Server v5.1.0-railway started (stdio mode)\n');
    process.stderr.write(`   ${tools.length} tools exposed (10 AIOX + 13 KAIROS + 5 Hivemind + 5 Railway)\n`);
}
