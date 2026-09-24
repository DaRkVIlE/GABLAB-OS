import fs from "node:fs/promises";
import path from "node:path";
import { logger } from "../utils/logger.js";
import { env } from "../utils/env.js";

const KAIROS_ROOT = env.KAIROS_ROOT || path.resolve(process.cwd(), "..", "..");
const HIVEMIND_LOG_FILE = path.join(KAIROS_ROOT, "engine", "hivemind", "decisions.jsonl");
const HIVEMIND_STATES_FILE = path.join(KAIROS_ROOT, "engine", "hivemind", "agent-states.json");
const HANDOFFS_DIR = path.join(KAIROS_ROOT, ".aiox", "handoffs");

export class HivemindService {
  async ensureDirs() {
    await fs.mkdir(path.dirname(HIVEMIND_LOG_FILE), { recursive: true });
  }

  async readDecisions(limit = 20, filterAgent?: string, filterType?: string) {
    try {
      const data = await fs.readFile(HIVEMIND_LOG_FILE, "utf-8");
      const lines = data.split("\n").filter(Boolean).map((l) => JSON.parse(l));
      
      let filtered = lines.reverse();
      if (filterAgent) filtered = filtered.filter((l) => l.agent === filterAgent);
      if (filterType) filtered = filtered.filter((l) => l.type === filterType);
      
      return filtered.slice(0, limit);
    } catch {
      return [];
    }
  }

  async logDecision(agent: string, type: string, summary: string, context?: string, affects?: string[]) {
    await this.ensureDirs();
    const entry = JSON.stringify({
      timestamp: new Date().toISOString(),
      agent,
      type,
      summary,
      context,
      affects
    });
    await fs.appendFile(HIVEMIND_LOG_FILE, entry + "\n", "utf-8");
    logger.info(`Hivemind log adicionado: ${summary} por ${agent}`);
    return { success: true, timestamp: JSON.parse(entry).timestamp };
  }

  async assignTask(fromAgent: string, toAgent: string, task: string, priority = "P1") {
    return await this.logDecision(fromAgent, "task", `Task for ${toAgent}: ${task}`, "", [toAgent, priority]);
  }

  async readStates() {
    try {
      const data = await fs.readFile(HIVEMIND_STATES_FILE, "utf-8");
      return JSON.parse(data);
    } catch {
      return {};
    }
  }

  async updateState(agentId: string, status: string, focus: string, chatId?: string, machine?: string) {
    await this.ensureDirs();
    const states = await this.readStates();
    
    states[agentId] = {
      status,
      focus,
      last_updated: new Date().toISOString(),
      chat_id: chatId || states[agentId]?.chat_id,
      machine: machine || states[agentId]?.machine
    };

    await fs.writeFile(HIVEMIND_STATES_FILE, JSON.stringify(states, null, 2), "utf-8");
    logger.debug(`Hivemind estado de ${agentId} atualizado para ${status}`);
    return { success: true, agentId, updatedState: states[agentId] };
  }

  async ensureHandoffDir() {
    await fs.mkdir(HANDOFFS_DIR, { recursive: true });
  }

  async listHandoffs(includeConsumed = false) {
    await this.ensureHandoffDir();
    try {
      const files = await fs.readdir(HANDOFFS_DIR);
      const handoffs = await Promise.all(
        files.filter(f => f.endsWith(".md") || f.endsWith(".yaml") || f.endsWith(".json")).map(async f => {
          const filePath = path.join(HANDOFFS_DIR, f);
          const stat = await fs.stat(filePath);
          const content = await fs.readFile(filePath, "utf-8");
          return { filename: f, created_at: stat.birthtime, content, consumed: content.includes("consumed: true") };
        })
      );
      return includeConsumed ? handoffs : handoffs.filter(h => !h.consumed);
    } catch {
      return [];
    }
  }

  async createHandoff(fromAgent: string, toAgent: string, context: string, lastCommand?: string) {
    await this.ensureHandoffDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `handoff-${fromAgent}-to-${toAgent}-${timestamp}.md`;
    const filePath = path.join(HANDOFFS_DIR, filename);
    const content = `# Handoff de ${fromAgent} para ${toAgent}
Data: ${new Date().toISOString()}
from_agent: ${fromAgent}
to_agent: ${toAgent}
last_command: ${lastCommand || ""}
consumed: false

## Contexto
${context}`;
    await fs.writeFile(filePath, content, "utf-8");
    logger.info(`Handoff criado: ${filename}`);
    return { success: true, filename, filepath: filePath };
  }

  async readHandoff(filename: string) {
    await this.ensureHandoffDir();
    const filePath = path.join(HANDOFFS_DIR, filename);
    return await fs.readFile(filePath, "utf-8");
  }

  async markHandoffConsumed(filename: string) {
    await this.ensureHandoffDir();
    const filePath = path.join(HANDOFFS_DIR, filename);
    let content = await fs.readFile(filePath, "utf-8");
    content = content.replace("consumed: false", "consumed: true");
    await fs.writeFile(filePath, content, "utf-8");
    logger.info(`Handoff marcado como consumido: ${filename}`);
    return { success: true, filename };
  }
}

export const hivemindService = new HivemindService();
