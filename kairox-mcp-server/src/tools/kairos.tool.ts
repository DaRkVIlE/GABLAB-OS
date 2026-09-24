import { kairosService } from "../services/kairos.service.js";

export const kairosTools = [
  {
    name: "kairos_health",
    description: "Full KAIROS system health check — verifica subsistemas reais (context, hivemind, aiox, scripts)",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  {
    name: "kairos_read_context",
    description: "Lê SELF_CONTEXT.md e/ou STATUS.md. Parâmetro file: 'self_context' | 'status' | 'both' | 'all'",
    inputSchema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          enum: ["self_context", "status", "both", "all"],
          description: "Qual arquivo ler. 'all' é alias de 'both'",
        },
      },
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "kairos_write_context",
    description: "Escreve ou atualiza SELF_CONTEXT.md ou STATUS.md. Faz backup automático antes de sobrescrever. Suporta substituição total (content) ou patch por seção H2 (patch).",
    inputSchema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          enum: ["self_context", "status"],
          description: "Qual arquivo atualizar",
        },
        content: {
          type: "string",
          description: "Substituição completa do arquivo (opcional — use patch para mudanças parciais)",
        },
        patch: {
          type: "object",
          description: "Atualização parcial de uma seção H2 específica",
          properties: {
            section: { type: "string", description: "Nome da seção H2 (sem o ##)" },
            value: { type: "string", description: "Novo conteúdo da seção" },
          },
          required: ["section", "value"],
        },
      },
      required: ["file"],
    },
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
  },
  {
    name: "kairos_list_rps",
    description: "Lista todos os Reasoning Packages (RPs) consolidados em reasoning-packages/ organizados por categoria (core, strategic, tasks ou all)",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: ["core", "strategic", "tasks", "all"],
          description: "Categoria de RPs a filtrar (padrão: all)",
          default: "all",
        },
      },
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "kairos_read_rp",
    description: "Lê o conteúdo completo de um Reasoning Package (RP) específico pelo nome do arquivo",
    inputSchema: {
      type: "object",
      properties: {
        filename: { type: "string", description: "Nome do arquivo do RP (ex: 'RP-FABLE5-HARNESS-v1.0.md')" },
        category: {
          type: "string",
          enum: ["core", "strategic", "tasks"],
          description: "Categoria opcional (core, strategic, tasks). Se omitido, busca em todas.",
        },
      },
      required: ["filename"],
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "kairos_list_workflows",
    description: "Lista todos os workflows multi-step disponíveis no AIOX Core (.aiox-core/development/workflows)",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "kairos_read_workflow",
    description: "Lê a especificação completa de um workflow do AIOX pelo nome ou ID",
    inputSchema: {
      type: "object",
      properties: {
        workflow_id: { type: "string", description: "ID ou nome do arquivo do workflow (ex: 'greenfield-full-stack', 'brownfield-service')" },
      },
      required: ["workflow_id"],
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "kairos_list_tasks",
    description: "Lista todas as tasks executáveis do AIOX (.aiox-core/development/tasks) com filtro opcional por palavra-chave",
    inputSchema: {
      type: "object",
      properties: {
        filter: { type: "string", description: "Filtro opcional por palavra-chave (ex: 'story', 'qa', 'prd', 'deploy')" },
      },
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "kairos_read_task",
    description: "Lê a especificação completa de uma task executável do AIOX pelo nome do arquivo",
    inputSchema: {
      type: "object",
      properties: {
        filename: { type: "string", description: "Nome do arquivo da task (ex: 'create-doc.md', 'execute-story.md')" },
      },
      required: ["filename"],
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "kairos_list_clients",
    description: "Lista todos os clientes e projetos ativos na pasta clients/",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "kairos_read_doc",
    description: "Lê qualquer documento de documentação ou governança a partir do caminho relativo à raiz",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Caminho relativo do arquivo (ex: 'AGENTS.md', 'docs/stories/story-1.0-paulo-deploy.md')" },
      },
      required: ["path"],
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "kairos_log_artifact",
    description: "Registra um artefato produzido na sessão no hivemind (engine/hivemind/artifacts.json)",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Nome do artefato" },
        type: {
          type: "string",
          enum: ["code", "doc", "spec", "decision", "config", "other"],
          description: "Tipo do artefato",
        },
        project: { type: "string", description: "Projeto relacionado (opcional)" },
        path: { type: "string", description: "Caminho no filesystem se existir (opcional)" },
        summary: { type: "string", description: "Descrição do que é o artefato" },
        tags: { type: "array", items: { type: "string" }, description: "Tags livres (opcional)" },
        produced_by: { type: "string", description: "Ferramenta ou agente que produziu (ex: 'antigravity', 'orion', 'dev')" },
      },
      required: ["title", "summary"],
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  },
  {
    name: "kairos_list_artifacts",
    description: "Lista artefatos registrados no hivemind/artifacts.json com filtros opcionais",
    inputSchema: {
      type: "object",
      properties: {
        project: { type: "string", description: "Filtrar por nome do projeto relacionado ao artefato" },
        type: { type: "string", enum: ["code", "doc", "spec", "decision", "config", "other"], description: "Filtrar por tipo de artefato" },
        produced_by: { type: "string", description: "Filtrar por ferramenta/agente produtor" },
        limit: { type: "number", description: "Máximo de resultados a retornar (padrão: 50)", default: 50 },
      },
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "skyros_isolation",
    description: "Gerencia o Modo Deep Work. action: 'enable' | 'disable' | 'status' (padrão: status — apenas consulta)",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["enable", "disable", "status"],
          description: "Ação a executar. 'status' apenas consulta o estado atual.",
        },
      },
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "skyros_triage",
    description: "Executa a Triage Matinal — consolida dados reais de SELF_CONTEXT.md, STATUS.md, hivemind decisions/states e saúde do sistema em um briefing estruturado",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
];

export const kairosHandlers: Record<string, Function> = {
  kairos_health: async () => await kairosService.health(),
  kairos_read_context: async (args: any) => await kairosService.readContext(args.file),
  kairos_write_context: async (args: any) => await kairosService.writeContext(args.file, args.content, args.patch),
  kairos_list_rps: async (args: any) => await kairosService.listRps(args.category),
  kairos_read_rp: async (args: any) => await kairosService.readRp(args.filename, args.category),
  kairos_list_workflows: async () => await kairosService.listWorkflows(),
  kairos_read_workflow: async (args: any) => await kairosService.readWorkflow(args.workflow_id),
  kairos_list_tasks: async (args: any) => await kairosService.listTasks(args.filter),
  kairos_read_task: async (args: any) => await kairosService.readTask(args.filename),
  kairos_list_clients: async () => await kairosService.listClients(),
  kairos_read_doc: async (args: any) => await kairosService.readDoc(args.path),
  kairos_log_artifact: async (args: any) => await kairosService.logArtifact(args),
  kairos_list_artifacts: async (args: any) => await kairosService.listArtifacts(args),
  skyros_isolation: async (args: any) => await kairosService.skyrosIsolation(args.action),
  skyros_triage: async () => await kairosService.skyrosTriage(),
};
