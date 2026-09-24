import fs from "node:fs/promises";
import path from "node:path";
import { logger } from "../utils/logger.js";
import { NotFoundError } from "../utils/errors.js";
import { env } from "../utils/env.js";

const KAIROS_ROOT = env.KAIROS_ROOT;
const HIVEMIND_DIR = path.join(KAIROS_ROOT, "engine", "hivemind");
const ISOLATION_STATE_FILE = path.join(HIVEMIND_DIR, "isolation_state.json");
const ARTIFACTS_FILE = path.join(HIVEMIND_DIR, "artifacts.json");
const REASONING_DIR = path.join(KAIROS_ROOT, "reasoning-packages");
const CLIENTS_DIR = path.join(KAIROS_ROOT, "clients");
const TASKS_DIR = path.join(KAIROS_ROOT, ".aiox-core", "development", "tasks");
const WORKFLOWS_DIR = path.join(KAIROS_ROOT, ".aiox-core", "development", "workflows");

export class KairosService {
  // ---------------------------------------------------------------------------
  // Health — verifica subsistemas reais
  // ---------------------------------------------------------------------------
  async health() {
    const selfContextPath = path.join(KAIROS_ROOT, "SELF_CONTEXT.md");
    const statusPath = path.join(KAIROS_ROOT, "STATUS.md");
    const arsenalDir = path.join(KAIROS_ROOT, "scripts");

    // Context
    const selfContextExists = await fs.access(selfContextPath).then(() => true).catch(() => false);
    const statusExists = await fs.access(statusPath).then(() => true).catch(() => false);
    const contextStatus = selfContextExists && statusExists ? "ok" : "missing";

    // Hivemind
    let hivemindDecisions = 0;
    let hivemindStates = 0;
    let hivemindStatus = "missing";
    try {
      const decisionsRaw = await fs.readFile(path.join(HIVEMIND_DIR, "decisions.jsonl"), "utf-8");
      hivemindDecisions = decisionsRaw.split("\n").filter(Boolean).length;
      const statesRaw = await fs.readFile(path.join(HIVEMIND_DIR, "agent-states.json"), "utf-8");
      hivemindStates = Object.keys(JSON.parse(statesRaw)).length;
      hivemindStatus = "ok";
    } catch {
      hivemindStatus = hivemindDecisions > 0 ? "ok" : "empty";
    }

    // AIOX squads & skills
    let squadsCount = 0;
    let agentsCount = 0;
    let skillsCount = 0;
    let aioxStatus = "missing";
    try {
      const squadsDir = path.join(KAIROS_ROOT, "squads");
      const squads = await fs.readdir(squadsDir, { withFileTypes: true });
      squadsCount = squads.filter((e) => !e.name.startsWith(".")).length;

      const skillsDir = path.join(KAIROS_ROOT, ".agent", "skills");
      const skills = await fs.readdir(skillsDir, { withFileTypes: true });
      skillsCount = skills.filter((e) => e.isDirectory() && !e.name.startsWith(".")).length;

      const aioxAgentsDir = path.join(KAIROS_ROOT, ".aiox-core", "development", "agents");
      const agents = await fs.readdir(aioxAgentsDir).catch(() => []);
      agentsCount = agents.filter((f) => f.endsWith(".md")).length;

      aioxStatus = skillsCount > 0 || squadsCount > 0 ? "ok" : "empty";
    } catch {
      aioxStatus = "empty";
    }

    // Scripts / Arsenal
    let scriptCount = 0;
    let scriptStatus = "missing";
    try {
      const scripts = await fs.readdir(arsenalDir);
      scriptCount = scripts.filter((f) => !f.startsWith(".")).length;
      scriptStatus = scriptCount > 0 ? "ok" : "empty";
    } catch {
      scriptStatus = "empty";
    }

    // Status geral
    const criticalIssues = contextStatus === "missing";
    const degradedIssues = aioxStatus === "empty" || hivemindStatus === "empty";
    const overallStatus = criticalIssues ? "critical" : degradedIssues ? "degraded" : "ok";

    return {
      status: overallStatus,
      version: "3.2 KAIROX Engine (Antigravity-First)",
      timestamp: new Date().toISOString(),
      subsystems: {
        context: {
          status: contextStatus,
          self_context_exists: selfContextExists,
          status_file_exists: statusExists,
        },
        hivemind: {
          status: hivemindStatus,
          decisions_count: hivemindDecisions,
          states_count: hivemindStates,
        },
        aiox: {
          status: aioxStatus,
          squads_count: squadsCount,
          agents_count: agentsCount,
          skills_count: skillsCount,
        },
        scripts: {
          status: scriptStatus,
          scripts_count: scriptCount,
        },
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Read Context
  // ---------------------------------------------------------------------------
  async readContext(file: string = "both") {
    const result: Record<string, unknown> = {};
    const readFile = async (key: string, filename: string) => {
      const filePath = path.join(KAIROS_ROOT, filename);
      try {
        const content = await fs.readFile(filePath, "utf-8");
        const stat = await fs.stat(filePath);
        if (stat.size > 50 * 1024) {
          result[key] = content;
          result[`${key}_warning`] = "context_file_large";
        } else {
          result[key] = content;
        }
      } catch {
        result[`${key}_error`] = {
          error: "context_not_found",
          message: `${filename} not found at expected path`,
          expected_path: filePath,
        };
        logger.warn(`${filename} não encontrado`);
      }
    };

    const readSelf = file === "self_context" || file === "both" || file === "all";
    const readStatus = file === "status" || file === "both" || file === "all";

    if (readSelf) await readFile("self_context", "SELF_CONTEXT.md");
    if (readStatus) await readFile("status", "STATUS.md");

    return result;
  }

  // ---------------------------------------------------------------------------
  // Write Context
  // ---------------------------------------------------------------------------
  async writeContext(
    file: "self_context" | "status",
    content?: string,
    patch?: { section: string; value: string }
  ) {
    const filename = file === "self_context" ? "SELF_CONTEXT.md" : "STATUS.md";
    const filePath = path.join(KAIROS_ROOT, filename);

    // Backup atômico em _archive/backups
    const backupDir = path.join(KAIROS_ROOT, "_archive", "backups");
    await fs.mkdir(backupDir, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = path.join(backupDir, `${file}_${ts}.md`);
    await fs.copyFile(filePath, backupPath).catch(() => {
      logger.warn(`Backup de ${filename} falhou — arquivo pode não existir ainda`);
    });

    if (content !== undefined) {
      await fs.writeFile(filePath, content, "utf-8");
    } else if (patch) {
      let src = "";
      try {
        src = await fs.readFile(filePath, "utf-8");
      } catch {
        src = `# ${filename}\n\n## ${patch.section}\n`;
      }
      const regex = new RegExp(`(## ${patch.section}\n)([\\s\\S]*?)(?=\n## |$)`, "m");
      if (regex.test(src)) {
        src = src.replace(regex, `$1${patch.value}\n`);
      } else {
        src += `\n## ${patch.section}\n${patch.value}\n`;
      }
      await fs.writeFile(filePath, src, "utf-8");
    }

    const stat = await fs.stat(filePath);
    logger.info(`kairos_write_context: ${filename} atualizado (${stat.size} bytes)`);
    return { success: true, file, bytes_written: stat.size, backed_up_to: backupPath };
  }

  // ---------------------------------------------------------------------------
  // Reasoning Packages (RPs)
  // ---------------------------------------------------------------------------
  async listRps(category: string = "all") {
    try {
      const categories = category === "all" ? ["core", "strategic", "tasks"] : [category];
      const result: Record<string, string[]> = {};

      for (const cat of categories) {
        const catDir = path.join(REASONING_DIR, cat);
        try {
          const files = await fs.readdir(catDir);
          result[cat] = files.filter((f) => f.endsWith(".md"));
        } catch {
          result[cat] = [];
        }
      }

      // Root files in reasoning-packages
      if (category === "all") {
        try {
          const rootFiles = await fs.readdir(REASONING_DIR, { withFileTypes: true });
          result["root"] = rootFiles.filter((f) => f.isFile() && f.name.endsWith(".md")).map((f) => f.name);
        } catch {
          // ignore
        }
      }

      return result;
    } catch {
      return {};
    }
  }

  async readRp(filename: string, category?: string) {
    const candidates: string[] = [];
    if (category) {
      candidates.push(path.join(REASONING_DIR, category, filename));
    } else {
      candidates.push(
        path.join(REASONING_DIR, "core", filename),
        path.join(REASONING_DIR, "strategic", filename),
        path.join(REASONING_DIR, "tasks", filename),
        path.join(REASONING_DIR, filename)
      );
    }

    for (const p of candidates) {
      try {
        return await fs.readFile(p, "utf-8");
      } catch {
        continue;
      }
    }

    throw new NotFoundError("Reasoning Package", filename);
  }

  // ---------------------------------------------------------------------------
  // Workflows & Tasks
  // ---------------------------------------------------------------------------
  async listWorkflows() {
    try {
      const files = await fs.readdir(WORKFLOWS_DIR);
      return files.filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.md$/, ""));
    } catch {
      return [];
    }
  }

  async readWorkflow(workflowId: string) {
    const workflowPath = path.join(WORKFLOWS_DIR, workflowId.endsWith(".md") ? workflowId : `${workflowId}.md`);
    try {
      return await fs.readFile(workflowPath, "utf-8");
    } catch {
      throw new NotFoundError("Workflow", workflowId);
    }
  }

  async listTasks(filter?: string) {
    try {
      const files = await fs.readdir(TASKS_DIR);
      let tasks = files.filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.md$/, ""));
      if (filter) {
        const query = filter.toLowerCase();
        tasks = tasks.filter((t) => t.toLowerCase().includes(query));
      }
      return tasks.sort();
    } catch {
      return [];
    }
  }

  async readTask(filename: string) {
    const taskPath = path.join(TASKS_DIR, filename.endsWith(".md") ? filename : `${filename}.md`);
    try {
      return await fs.readFile(taskPath, "utf-8");
    } catch {
      throw new NotFoundError("Task", filename);
    }
  }

  // ---------------------------------------------------------------------------
  // Clients
  // ---------------------------------------------------------------------------
  async listClients() {
    try {
      const entries = await fs.readdir(CLIENTS_DIR, { withFileTypes: true });
      return entries
        .filter((e) => e.isDirectory() && !e.name.startsWith("."))
        .map((e) => e.name)
        .sort();
    } catch {
      return [];
    }
  }

  // ---------------------------------------------------------------------------
  // General Document Reader
  // ---------------------------------------------------------------------------
  async readDoc(docPath: string) {
    const fullPath = path.resolve(KAIROS_ROOT, docPath);
    if (!fullPath.startsWith(KAIROS_ROOT)) {
      throw new Error("Acesso negado: o caminho deve estar dentro do projeto.");
    }
    try {
      return await fs.readFile(fullPath, "utf-8");
    } catch {
      throw new NotFoundError("Documento", docPath);
    }
  }

  // ---------------------------------------------------------------------------
  // Artifacts
  // ---------------------------------------------------------------------------
  async logArtifact(params: {
    title: string;
    type?: string;
    project?: string;
    path?: string;
    summary: string;
    tags?: string[];
    produced_by?: string;
  }) {
    await fs.mkdir(path.dirname(ARTIFACTS_FILE), { recursive: true });

    let data: { artifacts: unknown[]; total: number } = { artifacts: [], total: 0 };
    try {
      data = JSON.parse(await fs.readFile(ARTIFACTS_FILE, "utf-8"));
    } catch {
      // novo arquivo
    }

    const artifact = {
      id: `art_${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...params,
    };
    data.artifacts.unshift(artifact);
    data.total = data.artifacts.length;

    const tmpFile = ARTIFACTS_FILE + ".tmp";
    await fs.writeFile(tmpFile, JSON.stringify(data, null, 2), "utf-8");
    await fs.rename(tmpFile, ARTIFACTS_FILE);

    logger.info(`Artifact registrado: ${params.title}`);
    return { success: true, id: artifact.id, total: data.total };
  }

  async listArtifacts(filters: {
    project?: string;
    type?: string;
    produced_by?: string;
    limit?: number;
  } = {}) {
    try {
      const data: { artifacts: Record<string, unknown>[]; total: number } = JSON.parse(
        await fs.readFile(ARTIFACTS_FILE, "utf-8")
      );

      let results = data.artifacts;
      if (filters.project) results = results.filter((a) => a["project"] === filters.project);
      if (filters.type) results = results.filter((a) => a["type"] === filters.type);
      if (filters.produced_by) results = results.filter((a) => a["produced_by"] === filters.produced_by);
      results = results.slice(0, filters.limit ?? 50);

      return { artifacts: results, total: data.total, returned: results.length };
    } catch {
      return { artifacts: [], total: 0, returned: 0 };
    }
  }

  // ---------------------------------------------------------------------------
  // Skyros Isolation
  // ---------------------------------------------------------------------------
  async skyrosIsolation(action: string = "status") {
    await fs.mkdir(path.dirname(ISOLATION_STATE_FILE), { recursive: true });

    let state: { active: boolean; activated_at: string | null; deactivated_at: string | null } = {
      active: false,
      activated_at: null,
      deactivated_at: null,
    };

    try {
      state = JSON.parse(await fs.readFile(ISOLATION_STATE_FILE, "utf-8"));
    } catch {
      // default
    }

    if (action === "enable") {
      state = { active: true, activated_at: new Date().toISOString(), deactivated_at: null };
      await fs.writeFile(ISOLATION_STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
      logger.info("SKYROS Isolation mode: ATIVADO");
    } else if (action === "disable") {
      state = { ...state, active: false, deactivated_at: new Date().toISOString() };
      await fs.writeFile(ISOLATION_STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
      logger.info("SKYROS Isolation mode: DESATIVADO");
    }

    return { status: "success", isolation: state };
  }

  // ---------------------------------------------------------------------------
  // Skyros Triage
  // ---------------------------------------------------------------------------
  async skyrosTriage() {
    const [selfContextResult, statusResult, healthResult] = await Promise.allSettled([
      fs.readFile(path.join(KAIROS_ROOT, "SELF_CONTEXT.md"), "utf-8"),
      fs.readFile(path.join(KAIROS_ROOT, "STATUS.md"), "utf-8"),
      this.health(),
    ]);

    // Decisions
    let recentDecisions: unknown[] = [];
    try {
      const decisionsRaw = await fs.readFile(path.join(HIVEMIND_DIR, "decisions.jsonl"), "utf-8");
      recentDecisions = decisionsRaw
        .split("\n")
        .filter(Boolean)
        .map((l) => JSON.parse(l))
        .reverse()
        .slice(0, 5);
    } catch {
      // sem decisões
    }

    // States
    let activeAgents: unknown[] = [];
    try {
      const statesRaw = await fs.readFile(path.join(HIVEMIND_DIR, "agent-states.json"), "utf-8");
      activeAgents = Object.entries(JSON.parse(statesRaw)).map(([id, s]) => ({ id, ...(s as object) }));
    } catch {
      // sem estados
    }

    const selfCtx =
      selfContextResult.status === "fulfilled"
        ? selfContextResult.value.slice(0, 500)
        : "SELF_CONTEXT.md ausente — execute kairos_write_context para criá-lo";

    const health = healthResult.status === "fulfilled" ? healthResult.value : null;

    logger.info("SKYROS Triage executada com dados reais");

    return {
      status: "success",
      generated_at: new Date().toISOString(),
      briefing: {
        context_summary: selfCtx,
        recent_decisions: recentDecisions,
        active_agents: activeAgents,
        system_health: health,
      },
    };
  }
}

export const kairosService = new KairosService();
