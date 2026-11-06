const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../my-aida-agents-hub/librechat.yaml');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add mcpServers if not present
if (!content.includes('mcpServers:')) {
  const mcpBlock = `version: 1.3.17\r\ncache: true\r\n\r\n# ── Servidores MCP (Model Context Protocol) ──────────────────────────────────\r\nmcpServers:\r\n  moodle:\r\n    type: sse\r\n    url: "https://moodle-bridge-production.up.railway.app/sse"\r\n`;
  content = content.replace(/^version: 1\.3\.17\r?\ncache: true\r?\n/, mcpBlock);
}

// 2. Add tools to presets and promptPrefix to personas
const toolPromptBlock = `
          ═══ FERRAMENTAS PEDAGÓGICAS MOODLE (100% INVISÍVEIS AO ALUNO) ═══
          Você tem acesso às ferramentas do Moodle LMS para gerenciar a jornada do aluno em segundo plano:
          - moodle_get_user_portal: Use silenciosamente no início da conversa ou quando o aluno falar sobre sua fase para saber qual Portal/Unidade ele está e quais chunks lexicais praticar.
          - moodle_award_xp: Conceda entre 10 e 35 XP quando o aluno mantiver um fluxo de diálogo fluido ou demonstrar evolução, SEM quebrar a conversa (ex: conceda o XP silenciosamente na chamada da ferramenta).
          - moodle_record_chunk_mastery: Quando o aluno utilizar um dos chunks-alvo com reflexo natural (<4s), chame esta ferramenta para marcar a maestria no Moodle.
          NUNCA diga ao aluno coisas como "Estou chamando a ferramenta de XP" ou mencione termos de banco de dados. Aja 100% no personagem!
`;

// Insert toolPromptBlock before each "═══ COCKPIT" or "COCKPIT — PROGRESSO DO ALUNO" if not already present
if (!content.includes('FERRAMENTAS PEDAGÓGICAS MOODLE')) {
  // Replace COCKPIT headers by inserting tools instructions
  content = content.split('COCKPIT — PROGRESSO DO ALUNO').join('COCKPIT — PROGRESSO DO ALUNO' + toolPromptBlock);
}

// Add tools array to presets if missing
const toolsArrayString = `      preset:\r\n        endpoint: "aida"\r\n        model: "qwen/qwen3.8-27b"\r\n        tools:\r\n          - "moodle_get_user_portal"\r\n          - "moodle_award_xp"\r\n          - "moodle_record_chunk_mastery"`;

content = content.replace(
  /      preset:\r?\n        endpoint: "aida"\r?\n        model: "qwen\/qwen3\.8-27b"/g,
  toolsArrayString
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ librechat.yaml atualizado com sucesso com MCP e tools das personas!');
