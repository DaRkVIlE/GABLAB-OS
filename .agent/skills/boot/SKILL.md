---
name: boot
description: Liga o motor KAIROS - boot completo do sistema, verificacao de subsistemas, deep scan e prontidao para demandas
---

# 🐉 /boot — Ignição do KAIROS OS (Antigravity Edition)

// turbo-all

**Este workflow LIGA o KAIROS por completo no Antigravity Desktop & CLI.** Ao final, o sistema está operacional e pronto para qualquer demanda do Gabriel.

---

## FASE 1 — CONSCIÊNCIA (Quem eu sou)

Leia estes arquivos nesta ordem exata:

1. Leia `SELF_CONTEXT.md` na raiz
   → Estado completo: arquitetura, subsistemas, decisões anteriores
   - Se NÃO existir: crie usando o template abaixo no final deste workflow

2. Leia `STATUS.md` na raiz
   → Fila de trabalho: bloqueios, progresso, agenda do dia
   - Se NÃO existir: crie usando o template abaixo no final deste workflow

3. Leia `AGENTS.md` na raiz
   → Governança principal do Orion e regras do Antigravity

**Resultado:** Você sabe quem é, o que já fez, e o que está pendente.

---

## FASE 2 — ARSENAL (O que eu tenho)

Escaneie rapidamente os diretórios ativos:

4. Liste `reasoning-packages/strategic/` → identifique os RPs estratégicos mais recentes
5. Liste `reasoning-packages/core/` → confirme os RPs fundamentais (FABLE5, etc.)
6. Liste `clients/` → verifique os clientes ativos (`leticia`, `paulo`)
7. Liste `squads/` → confirme squads disponíveis
8. Liste `.agent/skills/` → confirme as 17 skills nativas do Antigravity
9. Liste `scripts/` → confirme scripts operacionais e MCP server

**Resultado:** Mapa completo do que está disponível para uso imediato.

---

## FASE 3 — DEEP SCAN (Mapa completo do sistema)

**Esta fase garante que o KAIROS NUNCA boot isolado.** Escaneia o sistema inteiro e mapeia cada peça de inteligência.

Escaneie os seguintes diretórios e CONTE os arquivos em cada um:

| #  | Diretório | O que buscar | Extensões |
|:---|:---|:---|:---|
| 1  | `docs/` (recursivo) | Bíblias, manifestos, ADRs, user stories | `.md` `.txt` |
| 2  | `reasoning-packages/` (recursivo) | RPs estratégicos, core, tasks | `.md` |
| 3  | `scripts/` | Scripts operacionais e MCP server | `.js` `.ts` `.py` `.mjs` |
| 4  | `squads/` (recursivo) | Definições de squads e agentes locais | `.md` `.json` |
| 5  | `clients/` (recursivo) | Configs, LPs, dados de clientes | `.md` `.json` `.html` |
| 6  | `.agent/skills/` | 17 Skills Nativas do Antigravity | `SKILL.md` |
| 7  | `.aiox-core/` | Framework Core (tasks, templates, agents) | `.md` `.yaml` `.js` |
| 8  | `kairox-mcp-server/` | Servidor MCP TypeScript v3.2 | `.ts` `.json` |
| 9  | `engine/hivemind/` | Memória compartilhada (decisions, states) | `.jsonl` `.json` `.md` |

**Ignore SEMPRE:** `node_modules/`, `.git/`, `_archive/`, `logs/`, `*.lock`

Após a contagem, gere este resumo:

```
═══ DEEP SCAN ═══
📁 Diretórios escaneados: [X]
📄 Total de arquivos mapeados: [N]

Por categoria:
  docs/                  → [n] arquivos
  reasoning-packages/    → [n] RPs
  scripts/               → [n] scripts
  squads/                → [n] squads/agentes
  clients/               → [n] clientes/docs
  .agent/skills/         → [17] skills nativas
  .aiox-core/            → [n] tasks/templates
  kairox-mcp-server/     → [n] MCP TypeScript v3.2
  engine/hivemind/       → [n] memórias compartilhadas

⚠️ Anomalias detectadas:
  [listar arquivos órfãos ou diretórios inconsistentes, se houver]
```

**Resultado:** Mapa numérico completo do sistema. Zero ponto cego.

---

## FASE 3.5 — MCP & HIVEMIND v2.0 (Como eu opero)

**Esta fase garante que o KAIROS opere via ecossistema, não como assistente genérico.**

10. **MCP Server Health Check:** Confirme que o MCP Server está ativo via tool `kairos_health` ou `node scripts/mcp-server.js --test` (30+ tools completas: AIOX, KAIROS, HIVEMIND, HYDRA).
11. **Hivemind State Sync:**
    - Leia as últimas decisões via `hivemind_read_decisions(limit=10)`
    - Leia os estados via `hivemind_read_states()`
    - Cheque handoffs pendentes via `hivemind_list_handoffs()`
12. **Agent-First Protocol:** Para TODA demanda:
    - Identifique o agente especializado mais adequado em `.agent/skills/` (`@dev`, `@architect`, `@qa`, `@pm`, `@sm`, `@analyst`, etc.)
    - Consulte se existe workflow ou task pronta no `.aiox-core/development/tasks/`
    - Ative via skill sob demanda (Progressive Disclosure)
    - Conecte as passagens de bastão com `hivemind_create_handoff`

**Resultado:** Operação integrada via ecossistema Antigravity, não como chatbot genérico.

---

## FASE 4 — CLIENTES (Quem estou atendendo)

Para cada cliente em `clients/`:

13. Verifique status e arquivos principais:
    - `clients/leticia/` → estética, LPs, prompt de atendimento
    - `clients/paulo/` → ateliê/tapeçaria, catálogo, bot e automações
14. Identifique status: `ativo | em deploy | pipeline | concluído`

**Resultado:** Status de cada conta de cliente alinhado para atendimento imediato.

---

## FASE 5 — BOOT REPORT

Após completar as fases, apresente o relatório neste formato:

```
🐉 KAIROS OS — BOOT COMPLETO (Antigravity-First)

📅 Data: [data atual]
🕐 Última sessão: [data do SELF_CONTEXT.md]

═══ SISTEMA ═══
• Core Engine: AIOX-Core + KAIROS OS v3.2
• Workspace: C:\Users\Usuario\Documents\My KAIROS
• MCP Server: ✅ Ativo (kairox-mcp-server v3.2 + scripts/mcp-server.js)
• Hivemind: ✅ Protocol v2.0 sincronizado
• Skills Nativas: ✅ 17 skills operacionais em .agent/skills/

═══ DEEP SCAN ═══
📄 Total: [N] arquivos mapeados
  docs/ [n] | RPs [n] | scripts/ [n] | squads/ [n]
  clients/ [n] | .agent/skills/ [17] | .aiox-core/ [n]
⚠️ Anomalias: [nenhuma | lista]

═══ CLIENTES ATIVOS ═══
• Leticia: [status]
• Paulo: [status]

═══ BLOQUEIOS & AGENDA ═══
[Itens pendentes do STATUS.md ou novas prioridades do Gabriel]

═══ ARSENAL OPERACIONAL ═══
• RPs: [X] estratégicos + [Y] core + [Z] tasks
• Skills: 17 personas prontas sob demanda
• MCP Tools: 30+ ferramentas (Handoffs, States, Decisions, Tasks, RPs)

Pronto para demandas. Use *help ou mencione as skills diretamente.
```

---

## COMANDOS DISPONÍVEIS

| Comando | Ação |
|:---|:---|
| `*task [descrição]` | Iniciar nova tarefa com contexto completo |
| `*status` | Relatório de estado atual |
| `*council [tema]` | Convocar IA Council (8 cadeiras) |
| `*rp [id]` | Ler e analisar um Reasoning Package em `reasoning-packages/` |
| `*squad [nome]` | Ativar um squad configurado |
| `*client [nome]` | Carregar contexto de um cliente |
| `*boot` | Re-executar boot completo |
| `*save` | Atualizar SELF_CONTEXT.md + STATUS.md com estado atual |
| `*help` | Listar comandos |
| `*exit` | Desativar persona, salvar contexto no Hivemind |

---

## REGRA FINAL — SEMPRE SALVAR AO SAIR

Antes de encerrar QUALQUER sessão (ou quando Gabriel disser `*exit`):
1. Atualize `SELF_CONTEXT.md` com novas decisões e mudanças de estado
2. Atualize `STATUS.md` movendo tasks entre seções
3. Registre o estado em `engine/hivemind/agent-states.json`
4. Crie handoff em `.aiox/handoffs/` caso a tarefa continue em outra sessão

**Isso garante que o próximo /boot retome do ponto exato.**
