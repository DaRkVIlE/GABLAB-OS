# 🚀 Moodle LMS & LibreChat Integration Guide

**Status:** Ativo / Produção (Cluster Railway `Project: Moodle-Libre`)  
**Story Relacionada:** [Story 1.2: Integração Complementar Moodle LMS & LibreChat via MCP Bridge](file:///c:/Users/Usuario/Documents/My%20KAIROS/Lexiquest/docs/stories/1.2.moodle-librechat-mcp-integration.md)  
**Spec Técnica:** [moodle-librechat-mcp-integration-design.md](file:///c:/Users/Usuario/Documents/My%20KAIROS/Lexiquest/docs/superpowers/specs/2026-11-06-moodle-librechat-mcp-integration-design.md)  

---

## 1. Topologia da Integração

```mermaid
flowchart LR
    Moodle["Moodle LMS 4.x\n(lexi-moodle-docker)\nCockpit de Trilhas e XP"]
    Bridge["moodle-bridge\n(Node/TS MCP + REST)\nResolução de Aluno"]
    Libre["my-aida (LibreChat)\n5 Personas AIDA\n(Whisper + Groq sub-500ms)"]

    Moodle -->|Deep Link com Aluno Contextual| Libre
    Libre -->|Tool Call MCP (award_xp, get_portal)| Bridge
    Bridge -->|WebService REST API (wstoken)| Moodle
```

---

## 2. Configuração de Deep Links no Moodle

Para adicionar o botão de acesso direto ao tutor em qualquer tópico ou Portal:

1. No curso desejado no Moodle (`https://lexi-moodle-docker-production.up.railway.app/course/view.php?id=2`), ative o **Modo de Edição**.
2. Clique em **Adicionar uma atividade ou recurso** $\rightarrow$ **URL**.
3. Preencha os campos:
   - **Nome:** `💬 Praticar Conversação com a AIDA (Tutor Imersivo)`
   - **URL externa:** `https://my-aida-production.up.railway.app`
4. Na seção **Parâmetros da URL**, adicione:
   - Parâmetro: `email` $\rightarrow$ Variável: `Email do usuário`
   - Parâmetro: `portal` $\rightarrow$ Variável: `Número do curso/portal`
5. Na seção **Aparência**:
   - Exibir: **Em nova janela** ou **Pop-up**.

---

## 3. Configuração de Retorno no LibreChat

O LibreChat está configurado para ancorar o aluno de volta ao Cockpit:
- **Custom Footer permanente:** Rodapé com link para `https://lexi-moodle-docker-production.up.railway.app`.
- **Menções nos Prompts das Personas:**
  Ao atingir milestones de XP ou quando o aluno perguntar sobre sua evolução, a IA lembra naturalmente:
  > *"Você acabou de subir de nível! Dá uma olhada no seu Cockpit do Moodle para ver seu progresso: https://lexi-moodle-docker-production.up.railway.app"*

---

## 4. Endpoints Operacionais do `moodle-bridge`

| Endpoint | Método | Descrição |
| :--- | :--- | :--- |
| `/health` | `GET` | Healthcheck (retorna 200 e status healthy) |
| `/openapi.json` | `GET` | Especificação OpenAPI 3.0 para Actions do LibreChat |
| `/tools` | `GET` | Lista das 5 ferramentas com schemas Zod |
| `/sse` | `GET` | Conexão SSE nativa para MCP Client |
| `/messages` | `POST` | Mensagens de ida e volta do protocolo MCP |
| `/tools/:name` | `POST` | Execução direta via HTTP REST de qualquer tool |

---

## 5. Ferramentas Disponíveis para as Personas

1. `moodle_get_user_portal` (userId/email): Consulta o portal atual e chunks liberados.
2. `moodle_record_chunk_mastery` (userId/email, chunkId, reactionTimeSeconds): Grava automaticidade e conclusão.
3. `moodle_award_xp` (userId/email, xpAmount, reason): Credita pontos no Level Up! XP.
4. `moodle_unlock_boss_raid` (userId/email, currentStreakDays): Destrava simulação especial com Gabe se streak $\ge$ 21 dias.
5. `moodle_sync_habitica` (userId/email, xpAwarded, streakDays): Conexão opcional com Habitica.
