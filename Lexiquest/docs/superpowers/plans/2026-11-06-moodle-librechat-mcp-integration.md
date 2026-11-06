# Moodle LMS & LibreChat MCP Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrar o Moodle LMS (`lexi-moodle-docker`) e o LibreChat (`my-aida`) no Railway através do `moodle-bridge`, habilitando as personas da AIDA a consultar trilhas e creditar progresso e XP no Moodle de forma transparente.

**Architecture:** O `moodle-bridge` (Node/TypeScript) atua como gateway MCP e REST com especificação OpenAPI e suporte a SSE/HTTP. O LibreChat conecta-se ao `moodle-bridge` e disponibiliza as tools (`moodle_get_user_portal`, `moodle_award_xp`, `moodle_record_chunk_mastery`) para as personas, com resolução de identidade do aluno por e-mail ou identificador de sessão.

**Tech Stack:** Node.js, TypeScript, Model Context Protocol SDK (`@modelcontextprotocol/sdk`), Axios, Zod, Moodle REST WebService API, LibreChat (`librechat.yaml`), Railway Cloud.

**Spec:** [`docs/superpowers/specs/2026-11-06-moodle-librechat-mcp-integration-design.md`](file:///c:/Users/Usuario/Documents/My%20KAIROS/Lexiquest/docs/superpowers/specs/2026-11-06-moodle-librechat-mcp-integration-design.md)  
**Story:** [`docs/stories/1.2.moodle-librechat-mcp-integration.md`](file:///c:/Users/Usuario/Documents/My%20KAIROS/Lexiquest/docs/stories/1.2.moodle-librechat-mcp-integration.md)

## Global Constraints

- Moodle token validado no Railway: `605f8bb52549b3a9266c88d797fc10e7`.
- URL de Moodle interna/pública: `https://lexi-moodle-docker-production.up.railway.app`.
- Porta padrão do `moodle-bridge`: 4051.
- Recasting Natural absoluto: 100% sem caneta vermelha, prompts mantêm o método SPARK sem explicitar erros gramaticais.
- Zero quebra na stack em produção: manter retrocompatibilidade com endpoints já existentes (`/health`, `/tools`, `/api/lead-capture`).

## Review Focus

- Moodle temporariamente fora do ar: o `moodle-bridge` deve falhar graciosamente sem travar a conversa no LibreChat.
- Aluno não encontrado pelo e-mail: fallback automático para usuário demo/convidado com logging estruturado.
- Latência de tool call: queries no Moodle não podem bloquear o streaming de resposta do modelo.
- Formato de schema JSON inválido: schemas Zod e OpenAPI devem ser estritamente tipados.
- CORS e permissões de rede: permitir tráfego privado no Railway (`.railway.internal`) e público (`.up.railway.app`).

---

### Task 1: Exposição de OpenAPI Spec e Endpoint SSE/MCP no `moodle-bridge`

**Files:**
- Modify: `moodle-bridge/src/index.ts`
- Modify: `moodle-bridge/src/tools.ts`
- Create: `moodle-bridge/test/routes.test.ts`

**Interfaces:**
- Consumes: `getMoodleToolsDefinitions()` de `tools.ts`
- Produces: `GET /openapi.json`, `GET /sse`, `POST /messages`

- [ ] **Step 1: Escrever teste automatizado para as novas rotas**
  Criar `moodle-bridge/test/routes.test.ts` verificando que `/openapi.json` retorna schema OpenAPI 3.0 válido com as tools cadastradas, e que `/health` continua respondendo 200.

- [ ] **Step 2: Rodar teste para verificar falha inicial**
  Executar: `npx tsx moodle-bridge/test/routes.test.ts`
  Resultado esperado: FAIL com 404 em `/openapi.json`.

- [ ] **Step 3: Implementar gerador de OpenAPI e rota `/openapi.json` em `src/index.ts`**
  Implementar função `generateOpenAPISpec()` convertendo as definições de tools em OpenAPI 3.0 e registrar o handler HTTP em `GET /openapi.json`.

- [ ] **Step 4: Rodar teste para verificar que passou**
  Executar: `npx tsx moodle-bridge/test/routes.test.ts`
  Resultado esperado: PASS com 200 OK e schema válido.

- [ ] **Step 5: Build TypeScript e commit**
  Executar: `npm --prefix moodle-bridge run build`
  Git: `git add moodle-bridge/src moodle-bridge/test && git commit -m "feat(moodle-bridge): add openapi.json route for LibreChat actions"`

---

### Task 2: Resolução de Identidade por E-mail no `moodle-client.ts`

**Files:**
- Modify: `moodle-bridge/src/moodle-client.ts`
- Modify: `moodle-bridge/src/types.ts`
- Create: `moodle-bridge/test/user-resolution.test.ts`

**Interfaces:**
- Consumes: Moodle WS `core_user_get_users_by_field`
- Produces: `resolveUserId(identifier: string | number): Promise<number>`

- [ ] **Step 1: Escrever teste para resolução de usuário**
  Criar `moodle-bridge/test/user-resolution.test.ts` testando a resolução com ID numérico direto e com string de e-mail (com mock e fallback seguro).

- [ ] **Step 2: Rodar teste para verificar falha inicial**
  Executar: `npx tsx moodle-bridge/test/user-resolution.test.ts`
  Resultado esperado: FAIL (`resolveUserId` is not a function).

- [ ] **Step 3: Implementar `resolveUserId` em `moodle-client.ts`**
  Adicionar método `resolveUserId(identifier: string | number): Promise<number>` que checa se é e-mail, consulta `core_user_get_users_by_field`, armazena em cache LRU in-memory e faz fallback resiliente para ID padrão.

- [ ] **Step 4: Rodar teste para verificar que passou**
  Executar: `npx tsx moodle-bridge/test/user-resolution.test.ts`
  Resultado esperado: PASS.

- [ ] **Step 5: Build TypeScript e commit**
  Executar: `npm --prefix moodle-bridge run build`
  Git: `git add moodle-bridge/src moodle-bridge/test && git commit -m "feat(moodle-bridge): add student email-to-userid resolution"`

---

### Task 3: Configuração de MCP / Tools no `librechat.yaml`

**Files:**
- Modify: `my-aida-agents-hub/librechat.yaml`
- Create: `scripts/validate-librechat-config.js`

**Interfaces:**
- Consumes: Endpoints do `moodle-bridge`
- Produces: Definições de tools atreladas às personas da AIDA

- [ ] **Step 1: Criar validador sintático e semântico de `librechat.yaml`**
  Criar `scripts/validate-librechat-config.js` que carrega `yaml`, valida se `mcpServers` ou `actions` estão bem formatados e se os promptPrefix das personas contêm as diretrizes de tools invisíveis.

- [ ] **Step 2: Executar validador**
  Executar: `node scripts/validate-librechat-config.js`
  Resultado esperado: Indica ausência do bloco de tools.

- [ ] **Step 3: Atualizar `librechat.yaml` com o servidor `moodle` e injeção de tools nas personas**
  Adicionar a configuração do `moodle-bridge` e adicionar as diretrizes operacionais de tools para Jordan, Alexandra, Zack, Miles e Hayes no `librechat.yaml`.

- [ ] **Step 4: Executar validador para confirmar integridade**
  Executar: `node scripts/validate-librechat-config.js`
  Resultado esperado: PASS — YAML sintaticamente e semanticamente válido.

- [ ] **Step 5: Commit da configuração**
  Git: `git add my-aida-agents-hub/librechat.yaml scripts/validate-librechat-config.js && git commit -m "feat(librechat): configure moodle-bridge tools in librechat.yaml"`

---

### Task 4: Integração de Cockpit & Deep Links Bidirecionais

**Files:**
- Modify: `my-aida-agents-hub/librechat.yaml`
- Modify: `moodle-config/README.md`
- Test: `test-bridge.ts`

**Interfaces:**
- Consumes: Moodle URL e LibreChat URL
- Produces: Links de navegação cruzada com parâmetros de contexto

- [ ] **Step 1: Atualizar scripts de deep link no Moodle e no Chat**
  Garantir que o rodapé do LibreChat e as menções nos prompts apontem consistentemente para o Cockpit Moodle (`https://lexi-moodle-docker-production.up.railway.app`). Documentar em `moodle-config/README.md` como criar a atividade URL com template `{user_email}` no Moodle.

- [ ] **Step 2: Validar fluxo de dados com `test-bridge.ts`**
  Executar: `npx tsx moodle-bridge/test-bridge.ts`
  Resultado esperado: As 5 tools executam com sucesso contra o Moodle client.

- [ ] **Step 3: Commit**
  Git: `git add moodle-config/README.md moodle-bridge/test-bridge.ts && git commit -m "docs(integration): document bidirectional deep-linking between Moodle and LibreChat"`

---

### Task 5: QA Gate & Auditoria E2E no Railway (`*qa-gate`)

**Files:**
- Create: `docs/qa/qa-report-moodle-librechat-integration.md`

**Interfaces:**
- Consumes: Logs do Railway, testes de unidade e integridade dos serviços
- Produces: Relatório formal de aprovação QA com veredicto PASS

- [ ] **Step 1: Rodar suíte completa de testes locais e typecheck**
  Executar: `npm --prefix moodle-bridge run typecheck && npm --prefix moodle-bridge test`

- [ ] **Step 2: Verificar status e variáveis no Railway**
  Executar comandos `railway status` e checagem de logs do `moodle-bridge` e `lexi-moodle-docker`.

- [ ] **Step 3: Gerar relatório formal de QA**
  Registrar evidências em `docs/qa/qa-report-moodle-librechat-integration.md` e atualizar o status da story `1.2.moodle-librechat-mcp-integration.md` para Done.

- [ ] **Step 4: Commit final**
  Git: `git commit -m "chore(qa): formal qa-gate approval for moodle-librechat integration"`
