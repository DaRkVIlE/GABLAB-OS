import { hivemindService } from "../services/hivemind.service.js";

export const hivemindTools = [
  {
    name: "hivemind_read_decisions",
    description: "Lê as últimas decisões da memória compartilhada",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Número máximo de decisões a retornar (padrão: 20)", default: 20 },
        filter_agent: { type: "string", description: "Filtrar por ID de agente (opcional, ex: 'skortex-main')" },
        filter_type: { type: "string", description: "Filtrar por tipo de entrada no log (opcional, ex: 'decision', 'artifact', 'event')" }
      }
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  {
    name: "hivemind_log_decision",
    description: "Registra uma decisão, artefato ou evento no log da Hivemind",
    inputSchema: {
      type: "object",
      properties: {
        agent: { type: "string", description: "ID do agente que está registrando a entrada (ex: 'skortex-main', 'spawn-qa-001')" },
        type: { type: "string", enum: ["decision", "artifact", "event", "task", "config", "other"], description: "Categoria da entrada no log. Use 'decision' para escolhas arquiteturais, 'artifact' para artefatos produzidos, 'event' para eventos relevantes" },
        summary: { type: "string", description: "Descrição concisa da decisão, artefato ou evento (1-2 frases objetivas)" },
        context: { type: "string", description: "Contexto adicional, markdown aceito. Use para detalhes que não cabem no summary (opcional)" },
        affects: { type: "array", items: { type: "string" }, description: "Lista de módulos, arquivos ou sistemas afetados (opcional, ex: ['auth.ts', 'supabase'])" }
      },
      required: ["agent", "type", "summary"]
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
  },
  {
    name: "hivemind_assign_task",
    description: "Designa uma tarefa a um agente",
    inputSchema: {
      type: "object",
      properties: {
        from_agent: { type: "string", description: "ID do agente que está delegando a tarefa (ex: 'skortex-main', 'orchestrator')" },
        to_agent: { type: "string", description: "ID do agente que receberá e executará a tarefa (ex: 'spawn-qa-001', 'analyst-01')" },
        task: { type: "string", description: "Descrição detalhada da tarefa a ser executada pelo agente destinatário" },
        priority: { type: "string", enum: ["P0", "P1", "P2"], description: "Prioridade da tarefa: P0 (crítico/urgente), P1 (normal, padrão), P2 (baixo)", default: "P1" }
      },
      required: ["from_agent", "to_agent", "task"]
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
  },
  {
    name: "hivemind_read_states",
    description: "Lê o estado atual de todos os agentes",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  {
    name: "hivemind_update_state",
    description: "Atualiza o estado atual de um agente",
    inputSchema: {
      type: "object",
      properties: {
        agent_id: { type: "string", description: "Identificador único do agente a atualizar (ex: 'skortex-main', 'spawn-refactor-001')" },
        status: { type: "string", description: "Estado atual do agente. Valores convencionais: 'idle' | 'working' | 'blocked' | 'done'" },
        focus: { type: "string", description: "Descrição concisa da tarefa atual do agente (ex: 'Refactoring auth module', 'idle')" },
        chat_id: { type: "string", description: "ID da conversa Claude associada a este agente (opcional)" },
        machine: { type: "string", description: "Identificador da máquina onde o agente roda (opcional, ex: 'win-main', 'railway')" }
      },
      required: ["agent_id", "status", "focus"]
    },
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false }
  },
  {
    name: "hivemind_list_handoffs",
    description: "Lista os handoffs pendentes ou consumidos entre sessões/agentes",
    inputSchema: {
      type: "object",
      properties: { include_consumed: { type: "boolean", default: false } }
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  {
    name: "hivemind_create_handoff",
    description: "Cria um handoff para transferir contexto para a próxima sessão ou agente",
    inputSchema: {
      type: "object",
      properties: {
        from_agent: { type: "string", required: true, description: "ID do agente que está criando o handoff" },
        to_agent: { type: "string", required: true, description: "ID do agente que receberá o handoff" },
        context: { type: "string", required: true, description: "Contexto completo para o próximo agente/sessão" },
        last_command: { type: "string", required: false, description: "Último comando executado (se houver)" }
      },
      required: ["from_agent", "to_agent", "context"]
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
  },
  {
    name: "hivemind_read_handoff",
    description: "Lê um arquivo de handoff específico",
    inputSchema: {
      type: "object",
      properties: { filename: { type: "string", description: "Nome do arquivo de handoff para ler" } },
      required: ["filename"]
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  {
    name: "hivemind_mark_handoff_consumed",
    description: "Marca um handoff como consumido",
    inputSchema: {
      type: "object",
      properties: { filename: { type: "string", description: "Nome do arquivo de handoff para marcar como consumido" } },
      required: ["filename"]
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  }
];

export const hivemindHandlers: Record<string, Function> = {
  hivemind_read_decisions: async (args: any) => await hivemindService.readDecisions(args.limit, args.filter_agent, args.filter_type),
  hivemind_log_decision: async (args: any) => await hivemindService.logDecision(args.agent, args.type, args.summary, args.context, args.affects),
  hivemind_assign_task: async (args: any) => await hivemindService.assignTask(args.from_agent, args.to_agent, args.task, args.priority),
  hivemind_read_states: async () => await hivemindService.readStates(),
  hivemind_update_state: async (args: any) => await hivemindService.updateState(args.agent_id, args.status, args.focus, args.chat_id, args.machine),
  hivemind_list_handoffs: async (args: any) => await hivemindService.listHandoffs(args.include_consumed),
  hivemind_create_handoff: async (args: any) => await hivemindService.createHandoff(args.from_agent, args.to_agent, args.context, args.last_command),
  hivemind_read_handoff: async (args: any) => await hivemindService.readHandoff(args.filename),
  hivemind_mark_handoff_consumed: async (args: any) => await hivemindService.markHandoffConsumed(args.filename)
};
