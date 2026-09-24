/**
 * HYDRA Tool — Sovereignty Layer
 *
 * Expõe tools MCP para o Antigravity (Orquestrador) spawnar
 * instâncias headless do SKORTEX (OpenClaude) e enfileirar
 * tasks no Supabase para o Night Shift (HEAD 3 Railway).
 *
 * Tools:
 *   hydra_spawn_agent   — Invoca SKORTEX local via openclaude.bat (headless)
 *   hydra_queue_task    — Enfileira task no Supabase para Night Shift remoto
 *   hydra_list_tasks    — Lista tasks pendentes/em execução do Night Shift
 *   hydra_agent_status  — Retorna status dos spawns ativos (via agent-states.json)
 */

import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { logger } from "../utils/logger.js";
import { env } from "../utils/env.js";

// ─── Supabase Client (lazy, só inicializa se variáveis presentes) ───────────
function getSupabase() {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_KEY || env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_KEY are required for hydra_queue_task");
  return createClient(url, key);
}

// Root do workspace KAIROS
const KAIROS_ROOT = env.KAIROS_ROOT || resolve(process.cwd(), "..", "..");
const OPENCLAUDE_BAT = resolve(KAIROS_ROOT, "openclaude.bat");

// ─── Tool Definitions ────────────────────────────────────────────────────────

export const hydraTools = [
  {
    name: "hydra_spawn_agent",
    description:
      "Spawna um Sub-Agente SKORTEX headless via openclaude.bat para executar uma task autônoma. " +
      "O agente roda em background, commita no Hivemind ao finalizar e retorna o ID do processo.",
    inputSchema: {
      type: "object",
      properties: {
        task: {
          type: "string",
          description: "A task completa que o sub-agente deve executar (seja específico e detalhado)",
        },
        persona: {
          type: "string",
          description: "Persona do agente: dev, architect, qa, analyst, devops (padrão: dev)",
          enum: ["dev", "architect", "qa", "analyst", "devops", "pm"],
        },
        tier: {
          type: "string",
          description: "Tier de complexidade: light (groq), medium (gemini), heavy (opus)",
          enum: ["light", "medium", "heavy"],
        },
        agent_id: {
          type: "string",
          description: "ID único para rastrear este agente (ex: spawn-refactor-dashboard)",
        },
        report_to_hivemind: {
          type: "boolean",
          description: "Se true, o resultado será registrado no Hivemind via log_decision (padrão: true)",
        },
      },
      required: ["task"],
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  },
  {
    name: "hydra_queue_task",
    description:
      "Enfileira uma task no Supabase (tabela kairos_task_claims) para processamento pelo Night Shift " +
      "remoto no Railway (HEAD 3). Ideal para tarefas que não precisam de resposta imediata.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Título curto da task" },
        prompt: { type: "string", description: "Prompt completo para o modelo executar" },
        category: {
          type: "string",
          description: "Categoria: coding, research, analysis, content, ops (padrão: coding)",
          enum: ["coding", "research", "analysis", "content", "ops", "general"],
        },
        priority: {
          type: "string",
          description: "Prioridade: P0, P1, P2 (padrão: P1)",
          enum: ["P0", "P1", "P2"],
        },
        model_override: {
          type: "string",
          description: "Forçar modelo específico (ex: gemini-2.0-flash, groq). Deixe vazio para roteamento automático.",
        },
        context: {
          type: "string",
          description: "Contexto adicional para enriquecer o prompt (ex: trecho de código, documentação)",
        },
      },
      required: ["title", "prompt"],
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  },
  {
    name: "hydra_list_tasks",
    description: "Lista as tasks do Night Shift no Supabase por status (pending, processing, completed, failed).",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          description: "Filtrar por status (padrão: pending)",
          enum: ["pending", "processing", "completed", "failed", "all"],
        },
        limit: { type: "number", description: "Número máximo de tasks a retornar (padrão: 10)" },
      },
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  {
    name: "hydra_agent_status",
    description: "Retorna o status atual de todos os agentes HYDRA: spawns locais ativos e status do Night Shift remoto.",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
];

// ─── Handlers ────────────────────────────────────────────────────────────────

// Registro interno de spawns ativos nesta sessão
const activeSpawns = new Map<string, { pid: number; task: string; startedAt: Date; persona: string }>();
let spawnCounter = 0;

export const hydraHandlers: Record<string, Function> = {

  // ── hydra_spawn_agent ──────────────────────────────────────────────────────
  hydra_spawn_agent: async (args: {
    task: string;
    persona?: string;
    tier?: string;
    agent_id?: string;
    report_to_hivemind?: boolean;
  }) => {
    const {
      task,
      persona = "dev",
      tier = "medium",
      report_to_hivemind = true,
    } = args;

    spawnCounter++;
    const agentId = args.agent_id || `hydra-spawn-${spawnCounter}-${Date.now()}`;

    logger.info(`[HYDRA] Spawning agent: ${agentId}`, { persona, tier });

    // Montar o prompt do sub-agente com injeção de contexto KAIROS
    const agentPrompt = [
      `/init --persona ${persona}`,
      ``,
      `# HYDRA SUB-AGENT MISSION`,
      `Agent ID: ${agentId}`,
      `Tier: ${tier}`,
      ``,
      `## TASK`,
      task,
      ``,
      `## COMPLETION PROTOCOL`,
      report_to_hivemind
        ? `Ao finalizar, use a tool MCP 'hivemind_log_decision' com:\n  - agent: "${agentId}"\n  - type: "artifact"\n  - summary: [resumo do que foi feito]\n  - affects: ["code", "architecture"]`
        : `Finalize sem reportar ao Hivemind.`,
    ].join("\n");

    return new Promise<object>((resolve) => {
      // Verificar se openclaude.bat existe
      const batPath = OPENCLAUDE_BAT;

      const child = spawn("cmd.exe", ["/c", batPath, "--print", agentPrompt, "--no-interactive"], {
        cwd: KAIROS_ROOT,
        detached: true,
        stdio: "ignore",
        env: {
          ...process.env,
          SKORTEX_AGENT_ID: agentId,
          SKORTEX_PERSONA: persona,
          SKORTEX_TIER: tier,
        },
      });

      const pid = child.pid;

      if (!pid) {
        logger.error(`[HYDRA] Falha ao spawnar agente ${agentId}`);
        resolve({
          success: false,
          agent_id: agentId,
          error: "Falha ao iniciar processo openclaude.bat — verifique se o arquivo existe e o God Pool está ativo.",
        });
        return;
      }

      child.unref(); // Libera o processo pai — roda em background
      activeSpawns.set(agentId, { pid, task, startedAt: new Date(), persona });

      logger.info(`[HYDRA] Agente ${agentId} spawned com PID ${pid}`);
      resolve({
        success: true,
        agent_id: agentId,
        pid,
        persona,
        tier,
        status: "running",
        message: `Sub-agente SKORTEX iniciado em background. PID: ${pid}. Task: "${task.slice(0, 80)}..."`,
        openclaude_bat: batPath,
        report_to_hivemind,
      });
    });
  },

  // ── hydra_queue_task ──────────────────────────────────────────────────────
  hydra_queue_task: async (args: {
    title: string;
    prompt: string;
    category?: string;
    priority?: string;
    model_override?: string;
    context?: string;
  }) => {
    const supabase = getSupabase();
    const { title, prompt, category = "coding", priority = "P1", model_override, context } = args;

    const taskPayload = {
      title,
      category,
      priority,
      status: "pending",
      input_data: {
        prompt: context ? `Contexto:\n${context}\n\nTask:\n${prompt}` : prompt,
        model_override: model_override || null,
      },
      created_at: new Date().toISOString(),
      agent_id: "antigravity-orchestrator",
    };

    logger.info(`[HYDRA] Enfileirando task no Night Shift: ${title}`);

    const { data, error } = await supabase
      .from("kairos_task_claims")
      .insert(taskPayload)
      .select("id, title, status, created_at")
      .single();

    if (error) {
      logger.error(`[HYDRA] Erro ao enfileirar task: ${error.message}`);
      return { success: false, error: error.message };
    }

    logger.info(`[HYDRA] Task enfileirada com ID: ${data.id}`);
    return {
      success: true,
      task_id: data.id,
      title: data.title,
      status: data.status,
      priority,
      category,
      queued_at: data.created_at,
      message: `✅ Task "${title}" enfileirada para o Night Shift (Railway HEAD 3). Prioridade: ${priority}.`,
    };
  },

  // ── hydra_list_tasks ──────────────────────────────────────────────────────
  hydra_list_tasks: async (args: { status?: string; limit?: number }) => {
    const supabase = getSupabase();
    const { status = "pending", limit = 10 } = args;

    let query = supabase
      .from("kairos_task_claims")
      .select("id, title, category, priority, status, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) return { success: false, error: error.message };

    return {
      success: true,
      total: data?.length || 0,
      status_filter: status,
      tasks: data || [],
    };
  },

  // ── hydra_agent_status ────────────────────────────────────────────────────
  hydra_agent_status: async () => {
    // Spawns locais ativos nesta sessão
    const localSpawns = Array.from(activeSpawns.entries()).map(([id, info]) => ({
      agent_id: id,
      pid: info.pid,
      persona: info.persona,
      task_preview: info.task.slice(0, 100),
      started_at: info.startedAt.toISOString(),
      elapsed_seconds: Math.round((Date.now() - info.startedAt.getTime()) / 1000),
    }));

    // Status do Night Shift remoto (Supabase)
    let remoteStatus: object = { note: "SUPABASE_URL não configurado — Night Shift remoto não disponível" };
    try {
      const supabase = getSupabase();
      const { data } = await supabase
        .from("kairos_task_claims")
        .select("status")
        .neq("status", "completed");

      const counts = (data || []).reduce((acc: Record<string, number>, row: { status: string }) => {
        acc[row.status] = (acc[row.status] || 0) + 1;
        return acc;
      }, {});

      remoteStatus = {
        railway_head3: "active",
        task_queue: counts,
      };
    } catch {
      // SUPABASE não configurado — silencioso
    }

    return {
      hydra_version: "1.0.0",
      local_spawns: {
        active: localSpawns.length,
        agents: localSpawns,
      },
      remote_night_shift: remoteStatus,
      openclaude_bat: OPENCLAUDE_BAT,
      kairos_root: KAIROS_ROOT,
    };
  },
};
