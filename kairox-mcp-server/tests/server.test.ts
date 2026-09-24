import { describe, it, expect } from "vitest";
import { aioxService } from "../src/services/aiox.service.js";
import { kairosService } from "../src/services/kairos.service.js";
import { hivemindService } from "../src/services/hivemind.service.js";

describe("KAIROX MCP Server — Integration & Handlers Test", () => {
  it("aioxService.listSkills deve retornar as skills nativas do .agent/skills", async () => {
    const skills = await aioxService.listSkills();
    expect(Array.isArray(skills)).toBe(true);
    expect(skills.length).toBeGreaterThan(10);
    expect(skills).toContain("dev");
    expect(skills).toContain("architect");
    expect(skills).toContain("qa");
  });

  it("aioxService.readSkill deve ler o SKILL.md de uma skill válida", async () => {
    const content = await aioxService.readSkill("dev");
    expect(typeof content).toBe("string");
    expect(content).toContain("name: dev");
  });

  it("aioxService.listAgents deve retornar agentes canônicos e skills", async () => {
    const agents = await aioxService.listAgents();
    expect(Array.isArray(agents)).toBe(true);
    expect(agents).toContain("dev");
    expect(agents).toContain("qa");
  });

  it("kairosService.health deve retornar status do sistema e subsistemas ok", async () => {
    const health = await kairosService.health();
    expect(health).toHaveProperty("status");
    expect(health).toHaveProperty("subsystems");
    expect(health.subsystems.context.self_context_exists).toBe(true);
    expect(health.subsystems.hivemind.status).toBe("ok");
    expect(health.subsystems.aiox.status).toBe("ok");
  });

  it("kairosService.readContext deve ler SELF_CONTEXT e STATUS", async () => {
    const ctx = await kairosService.readContext("both");
    expect(ctx).toHaveProperty("self_context");
    expect(ctx).toHaveProperty("status");
  });

  it("kairosService.listRps deve listar Reasoning Packages consolidados", async () => {
    const rps = await kairosService.listRps("all");
    expect(rps).toHaveProperty("core");
    expect(rps).toHaveProperty("strategic");
    expect(rps).toHaveProperty("tasks");
    expect(rps.strategic.length).toBeGreaterThan(0);
  });

  it("kairosService.listWorkflows deve listar workflows do AIOX Core", async () => {
    const workflows = await kairosService.listWorkflows();
    expect(Array.isArray(workflows)).toBe(true);
    expect(workflows.length).toBeGreaterThan(0);
  });

  it("kairosService.listTasks deve listar tasks do AIOX Core", async () => {
    const tasks = await kairosService.listTasks();
    expect(Array.isArray(tasks)).toBe(true);
    expect(tasks.length).toBeGreaterThan(20);
  });

  it("kairosService.listClients deve listar os clientes", async () => {
    const clients = await kairosService.listClients();
    expect(Array.isArray(clients)).toBe(true);
    expect(clients.length).toBeGreaterThan(0);
  });

  it("hivemindService deve ler decisões e estados", async () => {
    const decisions = await hivemindService.readDecisions(5);
    expect(Array.isArray(decisions)).toBe(true);

    const states = await hivemindService.readStates();
    expect(typeof states).toBe("object");
  });

  it("hivemindService.listHandoffs deve listar handoffs sem erro", async () => {
    const handoffs = await hivemindService.listHandoffs(true);
    expect(Array.isArray(handoffs)).toBe(true);
  });
});
