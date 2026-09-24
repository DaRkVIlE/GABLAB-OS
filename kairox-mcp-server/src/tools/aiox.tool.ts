import { aioxService } from "../services/aiox.service.js";

export const aioxTools = [
  {
    name: "aiox_list_squads",
    description: "Lista todos os squads disponíveis",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "aiox_list_agents",
    description: "Lista todos os agentes disponíveis, opcionalmente filtrados por squad. Omita squad para listar todos.",
    inputSchema: {
      type: "object",
      properties: {
        squad: { type: "string", description: "Nome do squad para filtrar (ex: 'core', 'specialists'). Omita para retornar agentes de todos os squads." },
      },
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "aiox_get_agent",
    description: "Lê todo o conteúdo de um agente específico",
    inputSchema: {
      type: "object",
      properties: {
        squad: { type: "string", description: "Nome do squad ao qual o agente pertence (ex: 'core', 'specialists'). Consulte aiox_list_squads para ver squads disponíveis." },
        agent: { type: "string", description: "Nome ou ID do arquivo do agente sem extensão (ex: 'skortex', 'orchestrator', 'analyst')" },
      },
      required: ["squad", "agent"],
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "aiox_list_skills",
    description: "Lista as integrações (skills) disponíveis em tools/integrations",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "aiox_read_skill",
    description: "Lê a documentação SKILL.md de uma skill específica",
    inputSchema: {
      type: "object",
      properties: { skill_id: { type: "string", description: "Identificador da skill a ler (ex: 'github', 'supabase', 'notion'). Consulte aiox_list_skills para ver skills disponíveis." } },
      required: ["skill_id"],
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
];

export const aioxHandlers: Record<string, Function> = {
  aiox_list_squads: async () => await aioxService.listSquads(),
  aiox_list_agents: async (args: any) => await aioxService.listAgents(args.squad),
  aiox_get_agent: async (args: any) => await aioxService.getAgent(args.squad, args.agent),
  aiox_list_skills: async () => await aioxService.listSkills(),
  aiox_read_skill: async (args: any) => await aioxService.readSkill(args.skill_id),
};
