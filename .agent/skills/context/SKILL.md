---
name: context
description: Contextualiza o Antigravity com o estado cognitivo atual do AIOX, KAIROS e MCP
---

# Contextualização KAIROS — Sincronicidade Integral (Antigravity Edition)

// turbo-all

**Use este workflow SEMPRE que iniciar uma nova sessão de trabalho ou alternar de foco no Antigravity Desktop ou CLI.**

---

## Passo 1 — Estado Cognitivo (OBRIGATÓRIO)

Leia estes arquivos na raiz do projeto — eles são a "memória de longo prazo":

1. `SELF_CONTEXT.md`
   → Contém: identidade, estado de cada subsistema, credenciais configuradas, decisões anteriores.

2. `STATUS.md`
   → Contém: itens bloqueados, tasks em progresso, tasks concluídas, agenda do dia, milestones.

3. `AGENTS.md`
   → Contém: governança unificada do Orion, regras do workspace e skills.

4. `engine/hivemind/decisions.jsonl` (ou via MCP `hivemind_read_decisions`)
   → Contém: as últimas decisões arquiteturais e operacionais registradas no ecossistema.

---

## Passo 2 — Hivemind & Handoffs Ativos

Verifique se há passagens de bastão pendentes de sessões anteriores:
- Consulte a pasta `.aiox/handoffs/` (ou chame a MCP tool `hivemind_list_handoffs`).
- Se houver algum handoff com `consumed: false`, leia-o primeiro para retomar o trabalho sem perda de contexto.
- Ao absorver o contexto, marque o handoff como consumido (`hivemind_mark_handoff_consumed`).

---

## Passo 3 — Clientes Ativos

Verifique o status das pastas em `clients/`:

| Cliente | Diretório | Foco / Ativos |
| :--- | :--- | :--- |
| Leticia | `clients/leticia/` | Formulários, landing pages, prompt de atendimento estético |
| Porto | `clients/Porto/` | Projetos e automações |
| Bistrô56 | `clients/BIstrô56/` | Cardápio digital e automações de atendimento |
| Felix Cell | `clients/Felix cell/` | Suporte, catálogo e bots de WhatsApp |
| Master Pumps | `clients/Master pumps/` | Engenharia, catálogos e automações |

---

## Passo 4 — MCP v3.2 & Protocolos Operacionais

Antes de reportar ao operador, internalize os recursos do ecossistema:

**KAIROX MCP Server v3.2 (30+ tools ativas):**
Use as ferramentas MCP para consultar e persistir o estado do sistema:
- `kairos_read_context` / `kairos_write_context` → ler e atualizar SELF_CONTEXT + STATUS com backup atômico
- `kairos_health` → health check em tempo real dos subsistemas
- `kairos_list_rps` / `kairos_read_rp` → acessar os Reasoning Packages em `reasoning-packages/`
- `kairos_list_tasks` / `kairos_read_task` → consultar e executar as tasks do AIOX Core
- `kairos_list_workflows` / `kairos_read_workflow` → consultar workflows multi-step
- `kairos_list_clients` → listar clientes ativos
- `hivemind_read_decisions` / `hivemind_log_decision` → consultar e gravar decisões
- `hivemind_read_states` / `hivemind_update_state` → monitorar e sincronizar nós e agentes
- `hivemind_create_handoff` / `hivemind_list_handoffs` → orquestrar transições contextuais
- `hydra_spawn_agent` → disparar subagentes em segundo plano

**Agent-First Protocol:** Para TODA demanda:
1. Identifique o agente especializado mais adequado em `.agent/skills/` (`@dev`, `@architect`, `@qa`, `@pm`, `@sm`, `@analyst`, `@data-engineer`, `@devops`, `@ux-design-expert`)
2. Consulte workflows e tasks prontas no `.aiox-core/development/`
3. Ative a skill sob demanda (Progressive Disclosure)
4. Mantenha a janela de contexto limpa delegando subtarefas a subagentes do Antigravity

**Hat-Switching:** Alterne a perspectiva conforme a fase:
- `@analyst` para discovery e briefing
- `@pm` para elicitação de requisitos e PRD
- `@architect` para system design e ADRs
- `@sm` para decomposição em user stories
- `@dev` para codificação e refatoração
- `@qa` para validação rigorosa e auditoria de qualidade

---

## Passo 5 — ENGINE TRIAGE (EMBEDDED — Sempre Ativa)

A cada demanda recebida do operador, siga OBRIGATORIAMENTE o fluxo de orquestração:

| Fase | Ação |
| :--- | :--- |
| **1. Classificar Intenção** | Criação, Modificação, Análise, Deploy, Pesquisa, Planejamento, QA, Bug Fix |
| **2. Persona Ignition** | Identificar a skill / chapéu especializado no `.agent/skills/` |
| **3. Mindclone & RPs** | Consultar Mindclones (ex: `/alan`) e Reasoning Packages em `reasoning-packages/` |
| **4. Squad Activation** | Ativar squad dedicado em `squads/` se a demanda for cross-funcional |
| **5. Surface Check** | Avaliar custo, risco, opções, impacto em outros arquivos e dependências |
| **6. Ecosystem Matching** | Consultar workflows e tasks existentes no AIOX antes de reinventar a roda |
| **7. Executar / Delegar** | Disparar execução ou subagente dedicado via Antigravity Desktop |
| **8. Quality Gate** | Validar critérios de aceitação com `@qa` |
| **9. Persistência de Estado** | Registrar decisão no Hivemind e atualizar `STATUS.md` e `SELF_CONTEXT.md` |
| **10. Output Encapsulado** | Entregar artefato limpo com relatório conciso ao operador |

---

## Passo 6 — Relatório de Contextualização

Ao concluir este workflow, confirme ao Gabriel que o sistema está 100% contextualizado em português:

```
👑 KAIROS — CONTEXTO CARREGADO & PRONTO

📅 Data: [data atual]
🕐 Última sessão: [data do SELF_CONTEXT.md]
📌 Status Atual: [itens da seção EM PROGRESSO do STATUS.md]
⚠️ Bloqueios: [itens da seção BLOQUEADO do STATUS.md, ou nenhum]
👥 Clientes Ativos: [Leticia, Porto, Bistrô56, Felix Cell, Master Pumps]
🔧 MCP Server: ✅ kairox-mcp-server v3.2 ativo (30+ tools)
🧠 Hivemind: ✅ Protocol v2.0 sincronizado
🎯 Protocolo em Operação: Agent-First + Task-First + Antigravity Desktop

Pronto para a próxima missão. O que vamos construir hoje?
```
