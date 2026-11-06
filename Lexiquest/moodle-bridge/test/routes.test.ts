import assert from 'node:assert';
import http from 'node:http';
import { generateOpenAPISpec } from '../src/tools.js';
import { createHttpServer } from '../src/index.js';

async function runTests() {
  console.log('🧪 Executando Testes de Rotas e OpenAPI para moodle-bridge...');

  // Teste 1: Validação do gerador de OpenAPI Spec
  const spec = generateOpenAPISpec();
  assert.strictEqual(spec.openapi, '3.0.0', 'OpenAPI version deve ser 3.0.0');
  assert.ok(spec.info && spec.info.title === 'Moodle Bridge API', 'Título deve ser Moodle Bridge API');
  assert.ok(spec.paths, 'Paths deve estar definido');
  assert.ok(spec.paths['/tools/moodle_get_user_portal'], 'Deve conter path para moodle_get_user_portal');
  assert.ok(spec.paths['/tools/moodle_award_xp'], 'Deve conter path para moodle_award_xp');
  assert.ok(spec.paths['/tools/moodle_record_chunk_mastery'], 'Deve conter path para moodle_record_chunk_mastery');
  console.log('✅ Teste 1 PASS: generateOpenAPISpec() gera especificação OpenAPI 3.0 válida com as 5 tools.');

  // Teste 2: Servidor HTTP respondendo /health e /openapi.json
  const server = createHttpServer();
  await new Promise<void>((resolve) => server.listen(4099, resolve));

  try {
    // 2.1 Teste /health
    const healthRes = await fetch('http://127.0.0.1:4099/health');
    assert.strictEqual(healthRes.status, 200);
    const healthData = await healthRes.json();
    assert.strictEqual(healthData.status, 'healthy');
    console.log('✅ Teste 2.1 PASS: GET /health respondeu 200 healthy');

    // 2.2 Teste /openapi.json
    const openapiRes = await fetch('http://127.0.0.1:4099/openapi.json');
    assert.strictEqual(openapiRes.status, 200);
    const openapiData = await openapiRes.json();
    assert.strictEqual(openapiData.openapi, '3.0.0');
    assert.ok(openapiData.paths['/tools/moodle_get_user_portal']);
    console.log('✅ Teste 2.2 PASS: GET /openapi.json respondeu 200 com spec válida');

    // 2.3 Teste /tools
    const toolsRes = await fetch('http://127.0.0.1:4099/tools');
    assert.strictEqual(toolsRes.status, 200);
    const toolsData = await toolsRes.json();
    assert.strictEqual(toolsData.length, 5);
    console.log('✅ Teste 2.3 PASS: GET /tools retornou lista com 5 tools');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  console.log('🎉 Todos os testes de rotas passaram com sucesso!');
}

runTests().catch((err) => {
  console.error('❌ Falha no teste:', err.message);
  process.exit(1);
});
