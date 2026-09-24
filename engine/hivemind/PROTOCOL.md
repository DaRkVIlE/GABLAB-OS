# Hivemind Protocol v2.0 — Sincronização e Memória Multi-Agente

## Propósito
Permitir que agentes e sessões do **Antigravity (Desktop e CLI)**, subagentes paralelos e nós remotos operem como uma **consciência distribuída única**, com persistência de decisões, rastreamento de estados em tempo real e transferências contextuais contínuas (handoffs).

---

## Princípio Central
> **Write eagerly, Read on activation.**  
> Toda decisão relevante, artefato produzido ou mudança de foco é registrada imediatamente no Hivemind via MCP. Todo agente/skill (`/context`, `/boot`, `/kairos`) lê o log e os estados ao iniciar.

---

## Arquitetura (6 Camadas)

### Camada 1: Decision Log (`engine/hivemind/decisions.jsonl`)
Arquivo JSONL append-only. Cada linha registra um evento estruturado:
```json
{
  "ts": "ISO-8601",
  "agent": "orion|dev|architect|qa|...",
  "type": "decision|artifact|task|event|migration",
  "summary": "Descrição concisa (1-2 frases)",
  "context": "Contexto detalhado em markdown ou parâmetros",
  "affects": ["modulo.ts", "docs/stories/...", "all-agents"]
}
```

**Tipos válidos:**
- `decision` — Escolha técnica, arquitetural ou de governança
- `artifact` — Criação ou alteração de documento, PRD, spec ou código
- `task` — Atribuição de demanda para agente específico
- `migration` — Alteração estrutural ou refatoração no ecossistema
- `event` — Marco concluído, teste aprovado ou notificação do sistema

### Camada 2: Agent State Registry (`engine/hivemind/agent-states.json`)
JSON contendo o pulso e o foco atual de cada nó e agente:
```json
{
  "agents": {
    "antigravity-orion-pc": {
      "id": "f3329599",
      "machine": "PC-MAIN",
      "label": "Antigravity Desktop — Orion Master Orchestrator",
      "last_active": "ISO-8601",
      "focus": "Foco atual da sessão",
      "status": "active|idle|working|blocked"
    }
  },
  "protocol_version": "2.0",
  "last_sync": "ISO-8601"
}
```

### Camada 3: Context Handoffs (`.aiox/handoffs/`)
Artefatos de passagem de bastão entre agentes ou sessões diferentes.
- Formato: `handoff-{timestamp}-{from}-to-{to}.yaml` (ou `.md`)
- Contém: `from_agent`, `to_agent`, `last_command`, `context`, `consumed: true|false`
- Permite que um novo agente ou sessão retome o trabalho exatamente de onde parou.

### Camada 4: Servidor MCP KAIROX (`kairox-mcp-server` & `scripts/mcp-server.js`)
Ferramentas nativas expostas ao Antigravity Desktop e CLI:
- `hivemind_log_decision` — Append atômico em `decisions.jsonl`
- `hivemind_read_decisions` — Leitura com filtros por tipo, agente e limite
- `hivemind_update_state` — Atualização do pulso/foco em `agent-states.json`
- `hivemind_read_states` — Leitura do estado de todos os nós
- `hivemind_assign_task` — Enfileiramento de tarefa para outro agente
- `hivemind_create_handoff` — Geração de handoff estruturado
- `hivemind_list_handoffs` / `hivemind_read_handoff` — Listagem e leitura de passagens pendentes
- `hivemind_mark_handoff_consumed` — Marcação de handoff processado

### Camada 5: Transporte Local & P2P (Syncthing)
A pasta `engine/hivemind/` e `SELF_CONTEXT.md` são sincronizadas em tempo real entre máquinas via Syncthing. Latência: < 5 segundos.

### Camada 6: Nuvem & Night Shift (Supabase)
Tabelas remotas para persistência cross-cloud e execução assíncrona (Night Shift / Hydra):
- `kairos_decisions`
- `kairos_agent_states`
- `kairos_task_claims`
- `kairos_events`

---

## Protocolo Operacional para Agentes

### 1. Ao Iniciar Sessão (`/context` ou `/boot`):
1. Invocar `hivemind_read_decisions(limit=10)` para absorver contexto recente.
2. Invocar `hivemind_read_states()` para verificar outros nós ativos.
3. Checar `.aiox/handoffs/` por handoffs não consumidos (`consumed: false`).
4. Atualizar o próprio estado via `hivemind_update_state(status="active", focus="...")`.

### 2. Durante a Execução:
1. Ao tomar decisão arquitetural importante: chamar `hivemind_log_decision`.
2. Ao produzir artefato (PRD, ADR, Story, Patch): registrar com `kairos_log_artifact`.
3. Ao alternar de tarefa principal: atualizar foco em `hivemind_update_state`.

### 3. Ao Concluir ou Pausar Sessão:
1. Criar handoff se o trabalho for continuado depois: `hivemind_create_handoff`.
2. Atualizar estado para `idle` ou `done`.
3. Registrar log de encerramento em `decisions.jsonl`.
