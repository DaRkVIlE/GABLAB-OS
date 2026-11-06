const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

function validateLibrechatConfig() {
  console.log('🧪 Validando my-aida-agents-hub/librechat.yaml...');

  const configPath = path.resolve(__dirname, '../my-aida-agents-hub/librechat.yaml');
  if (!fs.existsSync(configPath)) {
    throw new Error(`Arquivo não encontrado: ${configPath}`);
  }

  const rawYaml = fs.readFileSync(configPath, 'utf8');
  let config;
  try {
    config = YAML.parse(rawYaml);
  } catch (err) {
    throw new Error(`Erro de sintaxe YAML: ${err.message}`);
  }

  // 1. Validar mcpServers.moodle
  if (!config.mcpServers || !config.mcpServers.moodle) {
    throw new Error('Bloco "mcpServers.moodle" não configurado em librechat.yaml');
  }

  const moodleServer = config.mcpServers.moodle;
  if (!moodleServer.url || !moodleServer.url.includes('moodle-bridge')) {
    throw new Error(`URL de moodle-bridge inválida: ${moodleServer.url}`);
  }
  console.log('✅ Bloco mcpServers.moodle validado com sucesso:', moodleServer.url);

  // 2. Validar personas e presença das tools pedagógicas
  const personas = config.modelSpecs?.list || [];
  const expectedPersonas = ['jordan', 'alexandra', 'zack', 'miles', 'hayes'];

  for (const name of expectedPersonas) {
    const persona = personas.find(p => p.name === name);
    if (!persona) {
      throw new Error(`Persona obrigatória "${name}" não encontrada no modelSpecs`);
    }

    const prompt = persona.preset?.promptPrefix || '';
    if (!prompt.includes('moodle_get_user_portal') || !prompt.includes('moodle_award_xp')) {
      throw new Error(`Persona "${name}" não contém as diretrizes operacionais de tools do Moodle no promptPrefix`);
    }
  }

  console.log(`✅ Todas as ${expectedPersonas.length} personas contêm as diretrizes de tools MCP do Moodle!`);
  console.log('🎉 Validação completa do librechat.yaml concluída com SUCESSO!');
  return true;
}

try {
  validateLibrechatConfig();
} catch (e) {
  console.error('❌ Falha na validação do librechat.yaml:', e.message);
  process.exit(1);
}
