/**
 * SKORTEX — Task Decomposer
 * Uses an LLM call to break a complex task into sub-tasks with persona assignments.
 * Pattern: S03 (Planning) + S04 (Sub-Agents) from SKYROS-ARCHITECTURE-GOLD RP
 * 
 * Flow:
 *   1. Receive complex task in natural language
 *   2. Call LLM to decompose into structured sub-tasks
 *   3. Return dependency graph for optimized parallel execution
 */

const DECOMPOSE_PROMPT = `You are SKORTEX Task Decomposer — part of the KAIROS autonomous agent system.

Your job: Break a complex task into smaller, executable sub-tasks that can be assigned to specialized agents.

Available agent personas:
- dev: Software development, coding, bug fixes, refactoring
- architect: System design, architecture decisions, technical planning  
- qa: Testing, validation, code review, quality gates
- devops: Infrastructure, deployment, CI/CD, Docker
- analyst: Research, data analysis, competitive analysis
- pm: Project management, planning, progress tracking
- po: Product ownership, requirements, acceptance criteria
- ux-design-expert: UI/UX design, user experience, accessibility

Rules:
1. Each sub-task must be self-contained and actionable
2. Assign the most appropriate persona to each sub-task
3. Identify dependencies between sub-tasks (which must finish before others start)
4. Tasks with no dependencies can run in parallel
5. Keep sub-tasks focused — one clear objective each
6. Maximum 6 sub-tasks per decomposition
7. Always include a QA validation sub-task at the end

Respond ONLY with valid JSON in this exact format:
{
  "subtasks": [
    {
      "id": "t1",
      "description": "Clear, actionable task description",
      "persona": "dev",
      "dependencies": [],
      "priority": 1
    }
  ],
  "summary": "One-line summary of the decomposition strategy",
  "parallel_groups": [["t1", "t2"], ["t3"]]
}

The parallel_groups array groups tasks that can execute simultaneously. Each group must wait for the previous group to complete.`;

export class TaskDecomposer {
  /**
   * @param {Object} options
   * @param {import('../providers/router.js').ProviderRouter} options.router
   * @param {string} [options.tier] - LLM tier for decomposition (default: 'heavy')
   */
  constructor({ router, tier }) {
    this.router = router;
    this.tier = tier || 'heavy';
  }

  /**
   * Decompose a complex task into sub-tasks
   * @param {string} task - The complex task description
   * @param {Object} [context] - Optional context (current files, project state, etc.)
   * @returns {Object} - { subtasks, summary, parallel_groups }
   */
  async decompose(task, context = {}) {
    const contextStr = context.files
      ? `\n\nRelevant project context:\n${JSON.stringify(context, null, 2)}`
      : '';

    const messages = [
      { role: 'system', content: DECOMPOSE_PROMPT },
      { role: 'user', content: `Decompose this task into sub-tasks:\n\n${task}${contextStr}` },
    ];

    const response = await this.router.complete(messages, [], {
      tier: this.tier,
      maxTokens: 2048,
      temperature: 0.2,
    });

    // Extract JSON from response
    const text = response.text || '';
    return this.parseDecomposition(text);
  }

  /**
   * Parse LLM response into structured decomposition
   */
  parseDecomposition(text) {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*"subtasks"[\s\S]*\}/);
    if (!jsonMatch) {
      // Fallback: single task, no decomposition needed
      return {
        subtasks: [{
          id: 't1',
          description: text.trim(),
          persona: 'dev',
          dependencies: [],
          priority: 1,
        }],
        summary: 'Task too simple for decomposition — executing directly',
        parallel_groups: [['t1']],
      };
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);

      // Validate structure
      if (!Array.isArray(parsed.subtasks) || parsed.subtasks.length === 0) {
        throw new Error('No subtasks in decomposition');
      }

      // Ensure parallel_groups exist
      if (!parsed.parallel_groups) {
        parsed.parallel_groups = [parsed.subtasks.map(t => t.id)];
      }

      return parsed;
    } catch (err) {
      // Fallback: treat entire response as single task
      return {
        subtasks: [{
          id: 't1',
          description: text.trim().slice(0, 500),
          persona: 'dev',
          dependencies: [],
          priority: 1,
        }],
        summary: `Decomposition parse failed: ${err.message}`,
        parallel_groups: [['t1']],
      };
    }
  }
}

export default TaskDecomposer;
