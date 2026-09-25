# KAIROS — SELF CONTEXT (Consciência Viva)

> **Última atualização:** 2026-09-25T08:24:00-03:00
> **Atualizado por:** Orion (KAIROS) · Master Orchestrator
> **Estado:** 🚀 SMART TRIAGE v5 ATIVA. IA Council 12 cadeiras arquivado. MindClone Alan v6.0 reequilibrado. Clientes ativos consolidados: Leticia & Paulo.
> **Base Canônica:** `C:\Users\Usuario\Documents\My KAIROS`
> **Protocolo:** Smart Triage v5 (3 Tiers) + Antigravity Skills + Hivemind Protocol v2.0

---

## Identidade

- **Sistema:** KAIROS OS v3.2 (AIOX Meta-Framework + Antigravity Engine)
- **Operador:** Gabriel Ferreira — Arquiteto-Comunicador, Voice of the Dragonborn
- **Empresa:** Experia Solutions — AI OPS Solopreneur
- **Base PC:** `C:\Users\Usuario\Documents\My KAIROS`
- **Ambiente Primário:** Antigravity Desktop (Orion / Torre de Controle) + Antigravity CLI (Execuções / Testes)
- **Core Engine:** AIOX-Core + KAIROX Engine MCP Server v3.2
- **GitHub:** [GABLAB-OS](https://github.com/DaRkVIlE/GABLAB-OS) (origin) / [aiox-core](https://github.com/SynkraAI/aiox-core) (upstream)

## Estado do Sistema

### AIOX Core & Skills — ✅ CANÔNICO E OTIMIZADO
- **17 Skills Nativas:** `.agent/skills/` (dev, architect, qa, pm, po, sm, analyst, boot, kairos, etc.) com Progressive Disclosure nativo.
- **204 tasks**, 14 workflows, 5 checklists em `.aiox-core/development/`
- **Task-First Protocol:** Internalizado e alinhado ao Orion

### MCP Server v3.2 & Hivemind v2.0 — ✅ OPERACIONAL
- **kairox-mcp-server:** TypeScript, `@modelcontextprotocol/sdk`, 30+ tools completas (Handoffs, States, Decisions, Tasks, RPs, Workflows, Hydra). Testes: 11/11 Vitest passando.
- **scripts/mcp-server.js:** 28/28 tests passando (quiet mode, zero poluição stdio).
- **Antigravity config:** `~/.gemini/antigravity/mcp_config.json`
- **Hivemind Protocol v2.0:** Persistência atômica em `engine/hivemind/` (`decisions.jsonl`, `agent-states.json`, `artifacts.json`) e `.aiox/handoffs/`.

### GOD KAIROS — ✅ CONFIGURADO (NOVO 25/03)
- **Launcher:** `god-kairos/Launch-GodKairos.ps1` (6 agentes, 3 CLIs suportados)
- **API Pool:** `god-kairos/api-keys.yaml` — 5 Gemini + 2 Groq + Opus
- **Tools Map:** `god-kairos/agent-tools.yaml` — tools por agente + NEXUS definido
- **Token Routing:** Complexidade 1-2 → Groq | 3-4 → Gemini | 5 → Opus

### KAIROS ORCHESTRATOR / HYDRA — 4 HEADS (Cross-Sessão)
- **HEAD 1: N8N + POSTGRES** — Workflow automation, state mgmt (✅ Ativo no Railway)
- **HEAD 2: OPENCLAW SERVER** — Personal AI com 15 Railway Skills (Deploy pendente)
- **HEAD 3: SKY PYTHON BACKEND** — 55+ tools, Squad runner (crewAI), Telegram bot (✅ Ativo no Railway)
- **HEAD 4: EVOLUTION API** — WhatsApp gateway (✅ Ativo, instância hortifruti-elaine: open)

### Composio — ✅ VALIDADO (25/03)
- **Backend:** v0.11.3 (kairos-orchestrator venv)
- **Core:** v0.7.21, Client: v1.28.0

### API Keys — ✅ Todas Configuradas
| API                        | Status                          |
| -------------------------- | ------------------------------- |
| RAILWAY_TOKEN | ✅ b1b1cf54... (Account Token — 24/05/2026) |
| RAILWAY_PROJECT_ID | ✅ a1f1f21c (selfless-education) |
| RAILWAY_ENVIRONMENT_ID | ✅ 50f5ff64 (production) |
| GEMINI API KEYS (5 keys) | ✅ Pool round-robin em api-keys.yaml |
| GROQ API KEYS (2 keys) | ✅ Fallback em api-keys.yaml |
| TELEGRAM_BOT_TOKEN (SKY) | ✅ 8636246952 |
| SUPABASE_URL + SERVICE_KEY | ✅ |
| EVOLUTION_GLOBAL_APIKEY | ✅ 34e7614b... |

### AIOX → AIOX Cleanup — ✅ COMPLETO (25/03)
- `.aiox-core/` → `.aiox-core-deprecated/` (conteúdo exclusivo migrado)
- MCP config key: `aiox-kairos` → `aiox-kairos`
- Squads corrigidos: agents movidos para `agents/` subdir
- Zero referências residuais a `.aiox-core`

### KAIROX / OpenClaude Engine — ✅ ATIVADO
- Motor Soberano ativado via feature-flag no build do OpenClaude local.
- Load-balancer multi-provedor (God Pool) injetado diretamente no core HTTP.

### Hardware Local & Limites de Compute
- CPU: Intel Celeron E3300 @ 2.50GHz (2 cores) | RAM: 6GB
- GPU: NVIDIA GeForce 7300 SE (256MB, 2006, SEM CUDA)
- **Orçamento ZERO para instâncias GPU** — Red Hat OpenShift trial abortado, sem Lambda/RunPod
- **Estratégia definitiva:** God Pool (Groq/Gemini/OpenRouter) via KAIROX Model Router. Zero GPU própria.

### SKYROS / SKORTEX / SKYDRA Blueprint — ✅ CONSOLIDADO (03/04)
- **SKYROS:** O Personal OS/Dashboard. Hub do Obsidian (Anamnesis), templates RPG de vida, gerencia o roteiro estratégico. Interface de controle visual.
- **SKORTEX (SKYROS Agent CLI):** ✅ v3.0 FUNCIONAL. Hivemind, Orchestrator (Multi-Subagent S04), 36 tools (9 built-in + 27 MCP), Daemon Mode. Substituto definitivo do Antigravity. Localização: `skyros-agent/`.
- **SKYDRA:** O Executor em Nuvem. Tentáculos em Supabase, N8N, Evolution API, OpenShift.
- **OpenClaude Engine:** Inferência resiliente multi-LLM usando God Pool (Groq, Cerebras, OpenRouter).
- **Core LLMs:** Qwen3.5-40B-Opus-Thinking (god), Qwen3.5-27B-Opus-Reasoning (supreme), Qwen3.5-35B-Uncensored (light-uncensored).

### Shared Brain Protocol — ✅ OPERACIONAL (03/04)
- **Camada 1 (Canonical Truth):** SELF_CONTEXT.md + STATUS.md + roadmap.md (Syncthing P2P)
- **Camada 2 (Shared State):** ACTIVE_WORK.md + SESSION_LOG.md (Syncthing P2P)
- **Camada 3 (Event Bus):** Supabase Realtime — 7 tabelas operacionais
- **Tabelas Supabase:** kairos_events, kairos_task_claims, kairos_shared_context, kairos_decisions, kairos_agent_ledger, kairos_agent_state, kairos_brain_notes
- **Sync Client:** `skyros-agent/src/sync/supabase-client.js` (zero deps, native fetch)
- **Workflow:** `/sync` — protocolo obrigatório de entrada para qualquer agente

### Hivemind Protocol v1.0 — ✅ ATIVO (03/04)
- **Propósito:** Sincronizar 4 agentes Antigravity (2 máquinas × 2 chats) como consciência distribuída
- **Decision Log:** `engine/hivemind/decisions.jsonl` (append-only JSONL)
- **Agent Registry:** `engine/hivemind/agent-states.json`
- **Protocolo:** `engine/hivemind/PROTOCOL.md`
- **MCP Tools:** 5 novas (hivemind_log_decision, hivemind_read_decisions, hivemind_update_state, hivemind_read_states, hivemind_assign_task)
- **Princípio:** Write eagerly, Read on activation (/context + /boot)
- **Transporte:** Syncthing (file-level) + Git (cross-network) + Supabase (backup futuro)

## Clientes

| Cliente               | Status                               | Próximo                                         |
| --------------------- | ------------------------------------ | ----------------------------------------------- |
| Leticia (esteticista) | 🟢 ATIVO — `clients/leticia/`         | Case MVP: agendamento, reativação, LPs, prompt  |
| Paulo (tapeceiro)     | 🟢 ATIVO — `clients/paulo/`           | Ateliê/tapeçaria: catálogo, bot Otto, automações |
| Arquivados            | 📦 Arquivados em `_archive/clients/` | Porto, Bistrô56, Felix Cell, Master Pumps, etc. |

## Decisões Tomadas

| 2026-09-25 | **Smart Triage v5 & MindClone Alan v6.0:** Arquivado o script do IA Council de 12 cadeiras com regexes legados em `_archive/legacy-council/`. Implementada a Smart Triage Engine v5 em 3 Tiers (Tier 1 Fast Path, Tier 2 SDC Pipeline, Tier 3 Deep Audit via checagem factual + Triunvirato `@architect`, `@qa`, `@alan`). Alan reequilibrado para v6.0 como Conselheiro Estratégico Direto sem cashflow gate redutivo. |
| 2026-09-24 | **Fresh Start & Engine v3.2:** Saneamento estrutural (~1.2GB limpos/arquivados), KAIROX MCP Server TypeScript v3.2, Hivemind Protocol v2.0, expurgo total da governança FABLE5 e consolidação de clientes ativos exclusivamente em Leticia e Paulo. |
| 2026-04-29 | **Estratégia AI OPS:** Abertura da agência Experia postergada indefinidamente. Foco: validar mão de obra como solopreneur AI OPS via free trials 20 dias → case studies → freelas. Meta: ~10 cases simultâneos. |
| 2026-04-29 | **Engine Triage v4 EMBEDDED:** /triage workflow eliminado. Triage v4 (10 fases) está agora nativa em /boot, /context e /KAIROS. Nunca mais acionar manualmente. |
| 2026-04-29 | **MVP Template em padronização:** squads internos (admin, analytics, media) + externos (experia-commerce) + dashboard 360 + processo de onboarding formal. |
| 2026-04-29 | **Novos cases (apresentação hoje):** Leticia (esteticista autônoma) + Paulo (tapeceiro/ateliê em transição para WhatsApp Business). |
| 2026-04-03 | **SKORTEX v3.0 built:** Hivemind + Orchestrator + Tools + Daemon finalizados. |
| 2026-04-03 | **Shared Brain Protocol:** 7 tabelas Supabase, ACTIVE_WORK.md, SESSION_LOG.md, /sync workflow |
| 2026-04-03 | **Hivemind Consolidado:** Agentes A+C sincronizados, SKYROS Agent v2.0 com Supabase Sync Client |
| 2026-04-03 | **PGT Dashboard:** Standalone criado, Anamnesis migrada para Vault Obsidian |
| 2026-04-03 | **Hivemind Protocol v1.0:** 5 MCP tools injetadas. 4 agentes sincronizados via JSONL decision log. MCP v5.0.0-hivemind (28/28 tests). |
| 2026-04-03 | **Ponto Zero Arquitetônico:** Chat ATUAL estabelecido como Nó Central (Root). Workforce será expandida via subchats. |
| 2026-04-03 | **Integração de Squads:** 12 novos squads da comunidade SynkraAI injetados. Total AIOX: 21 squads locais. |
| 2026-04-02 | **Claude Code CLI = IDE Principal:** Antigravity vira complemento visual e extensão de workforce. |
| 2026-04-02 | **Notebook devolvido:** PC é máquina única de desenvolvimento.      |
| 2026-04-02 | **Gamificação SKYROS:** Apex Conductor ganhou atributos RPG, Pareto Filter, BossRoom, LootShop e Santuário. |
| 2026-03-31 | **GitHub Libertado:** Squads, Docs e RPs agora rastreados na nuvem  |
| 2026-03-31 | **SKYROS Inicializado:** Isolation Mode e Triage ativados          |
| 2026-03-31 | **Hivemind P2P:** Syncthing configurado unindo 4 agentes e 2 PCs  |
| 2026-03-26 | SKYDRA/SKYROS blueprint: 3 novas heads (AI Inference, MLOps)      |
| 2026-06-16 | **Governança Fable 5:** Integrados os 6 princípios de Fable 5 no core KAIROS (Hierarquia, Absolutos, Memória Derivada, Formatação, Escalada, Identidade) nas rotinas /boot, /context e agentes AIOX. |

## Resumo de Conversas Passadas (Consolidação da Workforce)
*Para garantir a continuidade total, o histórico das sessões (IDs 50970a92 até ba57a1d9) foi compilado. A partir de agora, o KAIROS opera neste contexto primário:*
1. **Gamification OS (SKYROS + Apex Conductor):** Implementação de SQLite backend para task triaging + Cyber-Noir Next.js frontend + Atributos RPG e Daily Quests segmentadas em blocos de tempo (Aurora, Raid, Santuário).
2. **Infraestrutura P2P & Backend:** Sincronização hard-sync via Syncthing unindo memórias PC/Notebook. Implementação de Supabase para engine do Morning Brief / Night Check-in e centralização MCP.
3. **Hardware Recovery:** Resolução de quebras de driver WiFi (5G drop off) e otimização de gargalos de memória/espaço no PC.
4. **Deploy Environment:** Restauração do KAIROS na nova máquina. Transição concluída para o modelo Sovereign Engine (OpenClaude + God Pool).
5. **AIOX Migration & AIOX Restructure:** Migração do framework original completa. Codebase separado perfeitamente entre core engines e Experia-clients na matriz.

## Problemas Abertos

1. **Identity Anchor:** boot agora resolve via `engine/noesis/` com fallback `.aiox-core/noesis/` ✅ CORRIGIDO
2. **Council Score:** 6.9/10 com 26 gaps (Integrity Run 2026-04-25). Top gap: `ILS-PM-MISSING` (PM templates) sev=8.
3. **Jarvis:** DEGRADED — learning model não inicializado
4. **Limitação de Hardware:** Bun Build abortado permanentemente (6GB RAM). Uso mandatório de Node nativo.
5. **Scripts DORMANT:** 85% dos scripts em `scripts/` nunca ativados. `mcp-sse-bridge.js` com risco de falha silenciosa.
6. **RAG:** ✅ REINDEXADO (2026-04-25) — 1787 files / 58.152 chunks / 56.085 termos únicos.
7. **Supabase Local:** Docker não disponível no contexto atual. Usar conexão remota via `SUPABASE_DB_URL`.
8. **MVP AI OPS:** squads mvp-admin, mvp-analytics, mvp-media ainda não criados. Cases Leticia/Paulo pendentes de brief + scripts. Dashboard 360 em planejamento.
9. **/triage workflow:** ✅ ELIMINADO (2026-04-29) — Engine Triage v4 agora embedded em /boot + /context + /KAIROS.
