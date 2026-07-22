/**
 * SKORTEX — Orchestrator
 * The brain of the multi-agent system.
 * Receives complex tasks, decomposes them, spawns N sub-agents in parallel,
 * collects results, and optionally runs a QA validation pass.
 * 
 * Pattern: S04 (Sub-Agents) + S09 (Agent Teams) + S10 (Team Protocols)
 * from SKYROS-ARCHITECTURE-GOLD RP
 * 
 * Usage:
 *   const orchestrator = new Orchestrator({ router, executor, config, personaLoader, chalk });
 *   const result = await orchestrator.execute("Build a REST API", { decompose: true, qaPass: true });
 */

import { SubAgent } from './sub-agent.js';
import { AgentLoop } from './loop.js';
import { TaskDecomposer } from './task-decomposer.js';

export class Orchestrator {
  /**
   * @param {Object} options
   * @param {import('../providers/router.js').ProviderRouter} options.router
   * @param {import('../tools/executor.js').ToolExecutor} options.executor
   * @param {Object} options.config
   * @param {import('../kairos/persona-loader.js').PersonaLoader} options.personaLoader
   * @param {Function} [options.chalk]
   * @param {Function} [options.onProgress] - Global progress callback
   */
  constructor({ router, executor, config, personaLoader, chalk, onProgress }) {
    this.router = router;
    this.executor = executor;
    this.config = config;
    this.personaLoader = personaLoader;
    this.chalk = chalk || ((s) => s);
    this.onProgress = onProgress || (() => {});
    this.decomposer = new TaskDecomposer({ router, tier: 'heavy' });
    this.activeAgents = new Map();
    this.completedAgents = [];
  }

  // ═══════════════════════════════════════════════
  // Full Orchestration — Decompose + Spawn + Collect + QA
  // ═══════════════════════════════════════════════

  /**
   * Execute a complex task with full orchestration
   * @param {string} task - Complex task description
   * @param {Object} options
   * @param {boolean} [options.decompose=true] - Auto-decompose into sub-tasks
   * @param {number} [options.maxAgents=4] - Max concurrent sub-agents
   * @param {boolean} [options.qaPass=true] - Run QA validation after completion
   * @param {string} [options.tier='medium'] - Default tier for sub-agents
   * @returns {Object} - { results, qa, summary }
   */
  async execute(task, options = {}) {
    const c = this.chalk;
    const {
      decompose = true,
      maxAgents = 4,
      qaPass = true,
      tier = 'medium',
    } = options;

    console.log(c.cyan('\n╔═══════════════════════════════════════════════╗'));
    console.log(c.cyan('║       🧠 SKORTEX ORCHESTRATOR                 ║'));
    console.log(c.cyan('╚═══════════════════════════════════════════════╝'));

    // Step 1: Decompose (or use task directly)
    let plan;
    if (decompose) {
      console.log(c.yellow('\n📋 Decomposing task...'));
      plan = await this.decomposer.decompose(task);
      console.log(c.green(`✅ Decomposed into ${plan.subtasks.length} sub-tasks:`));
      for (const st of plan.subtasks) {
        const deps = st.dependencies.length > 0 ? ` (after: ${st.dependencies.join(', ')})` : '';
        console.log(c.white(`   ${st.id}. [@${st.persona}] ${st.description}${deps}`));
      }
      console.log(c.dim(`   Strategy: ${plan.summary}`));
    } else {
      plan = {
        subtasks: [{ id: 't1', description: task, persona: 'dev', dependencies: [], priority: 1 }],
        summary: 'Direct execution (no decomposition)',
        parallel_groups: [['t1']],
      };
    }

    // Step 2: Execute parallel groups sequentially
    const results = {};
    const startTime = Date.now();

    for (let gi = 0; gi < plan.parallel_groups.length; gi++) {
      const group = plan.parallel_groups[gi];
      const groupTasks = plan.subtasks.filter(st => group.includes(st.id));

      console.log(c.yellow(`\n⚡ Group ${gi + 1}/${plan.parallel_groups.length}: ${group.join(', ')} (${groupTasks.length} agents)`));

      // Spawn sub-agents for this group (up to maxAgents)
      const batch = groupTasks.slice(0, maxAgents);
      const promises = batch.map(st => this.spawnSubAgent(st, { tier }));

      // Wait for all in group to complete
      const groupResults = await Promise.allSettled(promises);

      for (let i = 0; i < batch.length; i++) {
        const st = batch[i];
        const res = groupResults[i];
        if (res.status === 'fulfilled') {
          results[st.id] = { persona: st.persona, result: res.value, status: 'done' };
          console.log(c.green(`   ✅ ${st.id} [@${st.persona}] — done`));
        } else {
          results[st.id] = { persona: st.persona, error: res.reason?.message, status: 'error' };
          console.log(c.red(`   ❌ ${st.id} [@${st.persona}] — ${res.reason?.message}`));
        }
      }
    }

    // Step 3: QA Pass (optional)
    let qaResult = null;
    if (qaPass) {
      console.log(c.yellow('\n🔍 Running QA validation pass...'));
      qaResult = await this.runQAPass(task, results);
      console.log(c.green(`✅ QA: ${qaResult.slice(0, 150)}...`));
    }

    // Step 4: Summary
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const doneCount = Object.values(results).filter(r => r.status === 'done').length;
    const errorCount = Object.values(results).filter(r => r.status === 'error').length;

    console.log(c.cyan('\n╔═══════════════════════════════════════════════╗'));
    console.log(c.cyan('║       📊 ORCHESTRATION COMPLETE               ║'));
    console.log(c.cyan('╠═══════════════════════════════════════════════╣'));
    console.log(c.white(`║  Tasks: ${doneCount} done, ${errorCount} errors`));
    console.log(c.white(`║  Time: ${elapsed}s`));
    console.log(c.white(`║  Agents spawned: ${plan.subtasks.length}`));
    console.log(c.cyan('╚═══════════════════════════════════════════════╝'));

    return { results, qa: qaResult, plan, elapsed };
  }

  // ═══════════════════════════════════════════════
  // Single Sub-Agent Spawn
  // ═══════════════════════════════════════════════

  /**
   * Spawn a single sub-agent with a specific persona and task
   * @param {Object} subtask - { id, description, persona }
   * @param {Object} options - { tier, provider, model }
   * @returns {Promise<string>} - Agent's response
   */
  async spawnSubAgent(subtask, options = {}) {
    const c = this.chalk;

    // Build system prompt from persona
    let systemPrompt = this.config.agent.systemPrompt;
    const persona = this.personaLoader.load(subtask.persona);
    if (persona) {
      systemPrompt = persona.systemPrompt;
    } else {
      // Inject persona hint into default prompt
      systemPrompt += `\n\nYou are acting as @${subtask.persona}. Focus exclusively on your specialty.`;
    }

    // Add context about being a sub-agent in an orchestrated workflow
    systemPrompt += `\n\n[SKORTEX ORCHESTRATOR CONTEXT]
You are a sub-agent (${subtask.id}) in a multi-agent orchestration.
Your specific task: ${subtask.description}
Focus only on YOUR task. Be concise and produce actionable output.
Do NOT ask questions — execute autonomously.`;

    // Create the sub-agent's own loop (shares router + executor but gets fresh history)
    const subLoop = new AgentLoop({
      router: this.router,
      executor: this.executor,
      config: this.config,
      onToolCall: ({ name, args, step }) => {
        const truncArgs = JSON.stringify(args);
        const display = truncArgs.length > 80 ? truncArgs.slice(0, 80) + '...' : truncArgs;
        console.log(c.dim(`     [${subtask.id}/@${subtask.persona}] ${name}(${display})`));
      },
      onResponse: ({ model, usage, step }) => {
        const tokens = usage?.total_tokens || '?';
        console.log(c.dim(`     [${subtask.id}/@${subtask.persona}] ${model} | ${tokens} tok | step ${step + 1}`));
      },
    });

    // Create SubAgent wrapper
    const agent = new SubAgent({
      id: subtask.id,
      persona: subtask.persona,
      systemPrompt,
      loop: subLoop,
      config: this.config,
      chalk: c,
      onProgress: (info) => {
        this.onProgress(info);
      },
    });

    // Track active agent
    this.activeAgents.set(subtask.id, agent);

    try {
      const result = await agent.execute(subtask.description, {
        tier: options.tier || 'medium',
        provider: options.provider,
        model: options.model,
      });
      
      this.activeAgents.delete(subtask.id);
      this.completedAgents.push(agent.getSummary());
      return result;
    } catch (err) {
      this.activeAgents.delete(subtask.id);
      this.completedAgents.push(agent.getSummary());
      throw err;
    }
  }

  // ═══════════════════════════════════════════════
  // Direct Spawn (single agent, no decomposition)
  // ═══════════════════════════════════════════════

  /**
   * Spawn a single sub-agent directly (no decomposition)
   * @param {string} persona - Agent persona ID
   * @param {string} task - Task description
   * @param {Object} [options] - { tier }
   * @returns {Promise<string>}
   */
  async spawn(persona, task, options = {}) {
    const c = this.chalk;
    console.log(c.cyan(`\n⚡ Spawning @${persona} for: ${task.slice(0, 60)}...`));

    const result = await this.spawnSubAgent(
      { id: `spawn-${Date.now().toString(36)}`, description: task, persona },
      options,
    );

    console.log(c.green(`\n✅ @${persona} completed.`));
    return result;
  }

  // ═══════════════════════════════════════════════
  // QA Validation Pass
  // ═══════════════════════════════════════════════

  /**
   * Run a QA agent to validate all sub-agent results
   */
  async runQAPass(originalTask, results) {
    const resultsSummary = Object.entries(results)
      .map(([id, r]) => `[${id}/@${r.persona}]: ${r.status === 'done' ? r.result?.slice(0, 300) : `ERROR: ${r.error}`}`)
      .join('\n\n');

    const qaTask = `Review the following orchestrated work for quality and completeness.

ORIGINAL TASK: ${originalTask}

SUB-AGENT RESULTS:
${resultsSummary}

Provide a brief quality assessment:
1. Are all sub-tasks properly completed?
2. Any errors or inconsistencies?
3. Overall quality score (1-10)
4. Any gaps that need attention?`;

    return this.spawnSubAgent(
      { id: 'qa-pass', description: qaTask, persona: 'qa' },
      { tier: 'medium' },
    );
  }

  // ═══════════════════════════════════════════════
  // Status
  // ═══════════════════════════════════════════════

  /**
   * Get all active and completed sub-agents
   */
  getStatus() {
    return {
      active: Array.from(this.activeAgents.values()).map(a => a.getSummary()),
      completed: this.completedAgents,
    };
  }

  /**
   * Cancel all active sub-agents
   */
  cancelAll() {
    for (const [id, agent] of this.activeAgents) {
      agent.cancel();
      this.activeAgents.delete(id);
    }
  }
}

export default Orchestrator;
