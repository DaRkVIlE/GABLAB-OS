/**
 * KAIROS PGT — Roadmap API Server
 * Serve o roadmap.md como JSON estruturado para o pgt-ui
 * Rodar com: node server.js
 * Porta: 3000 (proxied via Vite em /api)
 */

import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Caminho absoluto para o roadmap.md na raiz do KAIROS
const ROADMAP_PATH = path.resolve(__dirname, "../roadmap.md");
const ANAMNESIS_PATH = path.resolve(__dirname, "../docs/anamnesis");

/**
 * Parse the roadmap.md table into structured quest objects
 */
function parseRoadmap() {
  let content;
  try {
    content = fs.readFileSync(ROADMAP_PATH, "utf-8");
  } catch (e) {
    return { p0: [], p1: [], p2: [], completed: [], error: "roadmap.md not found" };
  }

  const lines = content.split("\n");
  const tasks = [];

  for (const line of lines) {
    // Match table rows: | # | Area | Task | Priority | Status | Owner |
    const match = line.match(/^\|\s*(\d+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*(P\d+)\s*\|\s*([^|]+)\s*\|\s*([^|]*)\s*\|/);
    if (match) {
      const [, id, area, task, priority, status, owner] = match;
      tasks.push({
        id: parseInt(id),
        area: area.trim(),
        task: task.trim(),
        priority: priority.trim(),
        status: status.trim(),
        owner: owner.trim(),
        completed: status.includes("✅") || status.includes("Concluído"),
      });
    }

    // Match completed table rows (section "Concluído")
    const completedMatch = line.match(/^\|\s*(C\d+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/);
    if (completedMatch) {
      const [, id, area, task, date] = completedMatch;
      tasks.push({
        id: id.trim(),
        area: area.trim(),
        task: task.trim(),
        priority: "done",
        status: "✅ Concluído",
        completedAt: date.trim(),
        completed: true,
      });
    }
  }

  return {
    p0: tasks.filter(t => t.priority === "P0" && !t.completed),
    p1: tasks.filter(t => t.priority === "P1"),
    p2: tasks.filter(t => t.priority === "P2"),
    completed: tasks.filter(t => t.completed),
    raw: tasks,
  };
}

/**
 * List Anamnesis vault folders as Questlines
 */
function parseAnamnesis() {
  try {
    const entries = fs.readdirSync(ANAMNESIS_PATH, { withFileTypes: true });
    return entries
      .filter(e => e.isDirectory() || e.name.endsWith(".md"))
      .map(e => ({
        name: e.name.replace(".md", ""),
        type: e.isDirectory() ? "folder" : "file",
        path: e.name,
      }));
  } catch (e) {
    return [];
  }
}

/**
 * JARVIS system prompt — injected with live P0 context
 */
function buildJarvisContext() {
  const { p0 } = parseRoadmap();
  const bossesText = p0.map((t, i) => `${i + 1}. [${t.area}] ${t.task}`).join("\n");
  return {
    systemPrompt: `Você é JARVIS, o assistente de Deep Work implacável do Operador Gabriel.

MODO: ISOLATION MODE ATIVO — Deep Work sem distrações.

ALVOS P0 HOJE (Boss Fights):
${bossesText || "Nenhum Boss ativo. Operador em tempo livre."}

REGRAS:
- Responda APENAS sobre os Alvos P0 ou sobre como executá-los
- Decomponha cada Boss em micro-passos executáveis
- Rejeite qualquer assunto fora das Boss Fights com: "Fora do escopo do Isolation Mode."
- Seja direto, cirúrgico e sem rodeios
- Lembre sempre: cada resposta deve mover o operador 1% mais perto de derrotar o Boss`,
    bosses: p0,
  };
}

// ── HTTP Server ──────────────────────────────────────────────

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:3000`);

  if (url.pathname === "/api/quests") {
    res.writeHead(200);
    res.end(JSON.stringify(parseRoadmap()));
    return;
  }

  if (url.pathname === "/api/anamnesis") {
    res.writeHead(200);
    res.end(JSON.stringify({ questlines: parseAnamnesis() }));
    return;
  }

  if (url.pathname === "/api/jarvis/context") {
    res.writeHead(200);
    res.end(JSON.stringify(buildJarvisContext()));
    return;
  }

  if (url.pathname === "/api/health") {
    res.writeHead(200);
    res.end(JSON.stringify({ status: "online", ts: new Date().toISOString() }));
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: "Not found" }));
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`[KAIROS API] ✅ Servidor rodando em http://localhost:${PORT}`);
  console.log(`  → GET /api/quests       — Boss Fights do roadmap.md`);
  console.log(`  → GET /api/anamnesis    — Questlines do Vault Obsidian`);
  console.log(`  → GET /api/jarvis/context — System prompt JARVIS com P0s`);
  console.log(`  → GET /api/health       — Status`);
});
