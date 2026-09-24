import fs from "node:fs/promises";
import path from "node:path";
import { logger } from "../utils/logger.js";
import { NotFoundError } from "../utils/errors.js";
import { env } from "../utils/env.js";

const KAIROS_ROOT = env.KAIROS_ROOT;

const memCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

function getCached<T>(key: string): T | null {
  const cached = memCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  return null;
}

function setCache(key: string, data: any) {
  memCache.set(key, { data, timestamp: Date.now() });
}

export class AioxService {
  async listSquads(): Promise<string[]> {
    const cacheKey = "listSquads";
    const cached = getCached<string[]>(cacheKey);
    if (cached) return cached;

    const squadsDir = path.join(KAIROS_ROOT, "squads");
    logger.debug(`Lendo squads de ${squadsDir}`);

    try {
      await fs.access(squadsDir);
      const entries = await fs.readdir(squadsDir, { withFileTypes: true });
      const squadNames = entries
        .filter((e) => !e.name.startsWith("."))
        .map((e) => (e.isDirectory() ? e.name : e.name.replace(/\.md$/, "")))
        .filter(Boolean);

      const uniqueSquads = Array.from(new Set(squadNames));
      setCache(cacheKey, uniqueSquads);
      return uniqueSquads;
    } catch {
      logger.warn(`Pasta squads não acessível em ${squadsDir}`);
      return [];
    }
  }

  async listAgents(squad?: string): Promise<string[]> {
    const cacheKey = `listAgents_${squad || "all"}`;
    const cached = getCached<string[]>(cacheKey);
    if (cached) return cached;

    const agents = new Set<string>();

    // 1. Agentes canônicos do AIOX Core
    const aioxAgentsDir = path.join(KAIROS_ROOT, ".aiox-core", "development", "agents");
    try {
      const files = await fs.readdir(aioxAgentsDir);
      files.filter((f) => f.endsWith(".md")).forEach((f) => agents.add(f.replace(".md", "")));
    } catch {
      // aiox-core agents dir optional
    }

    // 2. Skills ativas do Antigravity
    const skillsDir = path.join(KAIROS_ROOT, ".agent", "skills");
    try {
      const entries = await fs.readdir(skillsDir, { withFileTypes: true });
      entries.filter((e) => e.isDirectory() && !e.name.startsWith(".")).forEach((e) => agents.add(e.name));
    } catch {
      // skills dir optional
    }

    // 3. Se especificado squad, busca também em squads/<squad>/agents
    if (squad) {
      const squadAgentsDir = path.join(KAIROS_ROOT, "squads", squad, "agents");
      try {
        const files = await fs.readdir(squadAgentsDir);
        files.filter((f) => f.endsWith(".md")).forEach((f) => agents.add(f.replace(".md", "")));
      } catch {
        // squad agents opcional
      }
    }

    const result = Array.from(agents).sort();
    setCache(cacheKey, result);
    return result;
  }

  async getAgent(squad: string | undefined, agentId: string): Promise<string> {
    const cacheKey = `getAgent_${agentId}`;
    const cached = getCached<string>(cacheKey);
    if (cached) return cached;

    const possiblePaths = [
      path.join(KAIROS_ROOT, ".agent", "skills", agentId, "SKILL.md"),
      path.join(KAIROS_ROOT, ".aiox-core", "development", "agents", `${agentId}.md`),
      path.join(KAIROS_ROOT, "squads", squad || "", "agents", `${agentId}.md`),
    ];

    for (const p of possiblePaths) {
      try {
        await fs.access(p);
        const content = await fs.readFile(p, "utf-8");
        setCache(cacheKey, content);
        return content;
      } catch {
        continue;
      }
    }

    throw new NotFoundError("Agente", agentId);
  }

  async listSkills(): Promise<string[]> {
    const cacheKey = "listSkills";
    const cached = getCached<string[]>(cacheKey);
    if (cached) return cached;

    const skillsDir = path.join(KAIROS_ROOT, ".agent", "skills");
    try {
      await fs.access(skillsDir);
      const entries = await fs.readdir(skillsDir, { withFileTypes: true });
      const skills = entries
        .filter((e) => e.isDirectory() && !e.name.startsWith("."))
        .map((e) => e.name)
        .sort();

      setCache(cacheKey, skills);
      return skills;
    } catch {
      logger.warn(`Diretório de skills não encontrado em ${skillsDir}`);
      return [];
    }
  }

  async readSkill(skillId: string): Promise<string> {
    const cacheKey = `readSkill_${skillId}`;
    const cached = getCached<string>(cacheKey);
    if (cached) return cached;

    const skillPath = path.join(KAIROS_ROOT, ".agent", "skills", skillId, "SKILL.md");
    try {
      await fs.access(skillPath);
      const content = await fs.readFile(skillPath, "utf-8");
      setCache(cacheKey, content);
      return content;
    } catch {
      throw new NotFoundError("Skill", skillId);
    }
  }
}

export const aioxService = new AioxService();
