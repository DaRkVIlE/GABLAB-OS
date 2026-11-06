# Design Document: Integração Moodle LMS & LibreChat via MCP Bridge (Abordagem 1)

**Data:** 2026-11-06  
**Status:** Aguardando Aprovação  
**Autores:** Orion / NOESIS (`@architect`, `@pm`, `@qa`)  
**Contexto do Projeto:** Railway (`Project: Moodle-Libre`), Escola de Idiomas LexiQuest / Método SPARK  

---

## 1. Intent & The Why

O objetivo deste projeto é integrar o **Moodle LMS** e o **LibreChat (`my-aida`)** hospedados no Railway, tornando-os ferramentas complementares que se alimentam mutuamente:
- **Moodle:** Atua como o **Cockpit Formal / LMS** — hospeda a trilha curricular dos Portais da Montanha B2, matrículas, materiais de apoio, agendamento de sessões ao vivo e a gamificação de longo prazo (Level Up! XP, rankings e badges).
- **LibreChat (`my-aida`):** Atua como a **Arena de Imersão Oral e Conversação** — as 5 personas da AIDA (Jordan, Alexandra, Zack, Miles, Hayes) conduzem conversas diárias com os alunos com latência ultrabaixa (Groq LPU), STT Whisper, TTS e Recasting Natural (100% sem caneta vermelha ou exercícios escolares chatos).

A integração unifica essa experiência: o aluno estuda a trilha no Moodle, clica para praticar a conversação correspondente na AIDA, e o LibreChat reporta silenciosamente o progresso, domínio de chunks lexicais e XP de volta para o Moodle via ferramentas MCP.

---

## 2. Goals, Non-Goals & Anti-Goals

### 2.1 Goals
1. **Conexão MCP Nativa:** Habilitar as personas do LibreChat a executarem ferramentas do `moodle-bridge` (Node/TypeScript) via protocolo MCP (`mcpServers` em `librechat.yaml`) ou Custom Actions REST.
2. **Consultar Contexto do Aluno (`moodle_get_user_portal`):** Permitir que a IA saiba em qual Portal/Unidade o aluno está no Moodle e quais chunks lexicais devem ser estimulados na conversa.
3. **Creditar XP no Moodle (`moodle_award_xp`):** Atribuir pontos de experiência diretamente no bloco Level Up! do Moodle quando o aluno atinge marcos de conversação (ex: tempo de prática, vocabulário novo produzido).
4. **Registrar Automaticidade (`moodle_record_chunk_mastery`):** Marcar conclusão de atividades ou mastery de expressões no Moodle sem interromper o fluxo do diálogo.
5. **Identificação Contínua do Estudante:** Estabelecer protocolo unificado para mapear a sessão do LibreChat ao `userId` do Moodle (via perfil do usuário no LibreChat ou parâmetro de deep-link).
6. **Deep Links Bidirecionais:**
   - Link dentro do Moodle: direciona o aluno para a persona correta no LibreChat.
   - Link no LibreChat: botão permanente no rodapé e menções contextuais direcionando para o Cockpit do Moodle (`https://lexi-moodle-docker-production.up.railway.app`).

### 2.2 Non-Goals
- Não criaremos um frontend monolítico novo do zero. Aproveitamos 100% as UIs prontas e responsivas do Moodle e do LibreChat.
- Não faremos autenticação federada complexa (SAML/Enterprise Shibboleth) neste momento; o foco da Turma Alpha é fricção mínima.

### 2.3 Anti-Goals
- **Sem caneta vermelha:** O LibreChat NUNCA deve virar um bot de teste escolar que diz "Você errou a gramática". O Recasting Natural é mantido 100% no prompt; a pontuação pedagógica ocorre nos bastidores via tool call.
- **Sem inferência local pesada:** Nenhum contêiner de Ollama/vLLM no Railway. Manter consumo de memória < 512MB em microsserviços leves.

---

## 3. Constraints & Infraestrutura Verificada (Railway)

Os serviços e credenciais foram auditados diretamente no cluster Railway (`Project: Moodle-Libre`):

| Serviço Railway | Função | URL / Conexão | Status Auditado |
| :--- | :--- | :--- | :--- |
| `my-aida` | LibreChat v1.3.x (Web UI, Personas, Auth, Groq LPU) | `https://my-aida-production.up.railway.app` | **Online** · 5 Personas ativas |
| `moodle-bridge` | Microsserviço Node/TS (Servidor MCP + HTTP REST) | `https://moodle-bridge-production.up.railway.app` | **Online** · Tools prontas em `/tools` e `/tools/:name` |
| `lexi-moodle-docker` | Moodle LMS 4.x (Cursos, Alunos, Level Up!) | `https://lexi-moodle-docker-production.up.railway.app` | **Online & Ativo** · WebService validado (Token `605f8bb52549...`) |
| `MySQL` | Banco relacional do Moodle | `mysql.railway.internal:3306` | **Online** · Persistido em volume |

---

## 4. Approaches Considered

1. **Abordagem 1: Ponte Bidirecional por MCP / Tools (ESCOLHIDA):**
   - O LibreChat consome o `moodle-bridge` como MCP Server. A IA chama ferramentas de leitura e escrita diretamente no Moodle REST API.
   - *Por que foi escolhida:* Desacoplamento arquitetural, reutilização do código já existente em `moodle-bridge`, estabilidade contra oscilações de container e preservação da UX nativa de ambas as plataformas.
2. **Abordagem 2: Iframe Embutido + SSO OAuth2:**
   - Embutir o LibreChat dentro das páginas do Moodle com login único.
   - *Por que foi descartada/postergada:* Restrições de permissão do navegador para microfone (STT) dentro de iframes cross-origin e overhead de configuração do Moodle como provedor OIDC na fase Alpha.
3. **Abordagem 3: Event Broker com Redis/Webhooks:**
   - Filas assíncronas para sincronização de eventos.
   - *Por que foi descartada:* Complexidade desnecessária para o volume da Turma Alpha.

---

## 5. Arquitetura Detalhada da Solução

```mermaid
flowchart TD
    subgraph Aluno["Jornada do Aluno"]
        Portal["1. Acessa Moodle LMS\n(Vê Portal, Chunks & Missão)"]
        Chat["2. Abre LibreChat (AIDA)\n(Pratica Conversação e Fala)"]
        Dashboard["3. Retorna ao Cockpit Moodle\n(Visualiza XP ganho e Nível)"]
    end

    subgraph StackRailway["Railway Project: Moodle-Libre"]
        Moodle["lexi-moodle-docker\n(Moodle LMS 4.x + MySQL)"]
        Bridge["moodle-bridge\n(MCP Server & REST Bridge)"]
        Libre["my-aida\n(LibreChat + Groq Whisper/Qwen)"]
    end

    Portal -->|Deep Link com User Context| Chat
    Chat -->|1. Interação do Aluno| Libre
    Libre -->|2. Tool Call MCP invisível\nmoodle_award_xp / record_mastery| Bridge
    Bridge -->|3. Moodle REST WebService API\n(wstoken)| Moodle
    Moodle -->|4. Atualiza Level Up! XP & Conclusões| Dashboard
```

### 5.1 Protocolo de Identificação do Aluno
Para que o `moodle-bridge` saiba a qual estudante creditar XP:
1. **Opção Primária (Deep-link / Parâmetro de Conversa):** O botão no Moodle abre o LibreChat com URL parametrizada:
   `https://my-aida-production.up.railway.app/c/new?user_id=123&course_id=2`
2. **Opção Secundária (E-mail Matching):** Como os alunos se cadastram no LibreChat com o mesmo e-mail do Moodle, o `moodle-bridge` implementa resolução por e-mail:
   `core_user_get_users_by_field(field="email", value=user_email)`.

### 5.2 Ferramentas MCP Ativas no `moodle-bridge`
1. `moodle_get_user_portal`: Retorna curso ativo, porcentagem concluída e lista de chunks recomendados para o diálogo.
2. `moodle_award_xp`: Credita de 10 a 50 XP no bloco Level Up! por marcos atingidos no diálogo.
3. `moodle_record_chunk_mastery`: Registra conclusão da competência lexical no histórico de atividades do aluno.

### 5.3 Configuração no `librechat.yaml`
Inclusão do bloco `mcpServers`:
```yaml
mcpServers:
  moodle:
    type: sse # ou streamable http
    url: "https://moodle-bridge-production.up.railway.app/sse"
    # ou comando local / proxy REST
```
E vinculação das tools às 5 personas da AIDA.

---

## 6. Plano de Execução via Tasks AIOX (Tier 2 SDC)

Seguindo o protocolo KAIROS de Story Development Cycle:

1. **Task 1 (`*create-doc`):** Formalização desta especificação técnica e contrato de API (`moodle-bridge-spec.md`).
2. **Task 2 (`*create-next-story`):** Geração da User Story estruturada com Critérios de Aceitação (AC1 a AC4) em `docs/stories/`.
3. **Task 3 (`*dev-develop-story`):** 
   - Atualização do `moodle-bridge` para suportar SSE/HTTP MCP e resolução de usuário por e-mail.
   - Ajuste cirúrgico no `librechat.yaml` com injeção de tools nas personas.
   - Validação da conectividade com o Moodle WebService.
4. **Task 4 (`*qa-gate`):** Teste E2E disparando tool calls simuladas e verificando integridade no Railway.

---

## 7. What's Left to the Builder

O construtor (implementador) tem autonomia técnica para:
- Escolher entre MCP via SSE ou Custom Action REST/OpenAPI se o LibreChat v1.3 na Railway preferir plugins OpenAPI para tools remotas.
- Definir o threshold exato de turnos de diálogo necessários para disparar a concessão de XP (ex: a cada 4 turnos substantivos em inglês).
- Tratar fallbacks gracioso caso o WebService do Moodle esteja temporariamente inacessível.
