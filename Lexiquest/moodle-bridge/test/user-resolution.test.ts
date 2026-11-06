import assert from 'node:assert';
import { MoodleClient } from '../src/moodle-client.js';

async function runTests() {
  console.log('🧪 Executando Testes de Resolução de Usuário no MoodleClient...');

  const client = new MoodleClient({
    baseUrl: 'https://lexi-moodle-docker-production.up.railway.app',
    token: 'mock-token'
  });

  // 1. Resolução com ID numérico direto
  const idFromNum = await client.resolveUserId(42);
  assert.strictEqual(idFromNum, 42, 'ID numérico deve ser retornado diretamente');
  console.log('✅ Teste 1 PASS: ID numérico 42 resolvido como 42');

  // 2. Resolução com string numérica
  const idFromStringNum = await client.resolveUserId('105');
  assert.strictEqual(idFromStringNum, 105, 'String numérica deve ser convertida para number');
  console.log('✅ Teste 2 PASS: String "105" resolvida como 105');

  // 3. Resolução com e-mail (mock fallback)
  const idFromEmail = await client.resolveUserId('student.alpha@lexiquest.com');
  assert.ok(typeof idFromEmail === 'number', 'Resolução de e-mail deve retornar um number');
  assert.ok(idFromEmail > 0, 'ID resolvido deve ser > 0');
  console.log(`✅ Teste 3 PASS: E-mail resolvido para userId ${idFromEmail}`);

  // 4. Cache hit
  const idCached = await client.resolveUserId('student.alpha@lexiquest.com');
  assert.strictEqual(idCached, idFromEmail, 'Segunda chamada para mesmo e-mail deve vir do cache');
  console.log('✅ Teste 4 PASS: Cache de resolução de e-mail validado');
}

runTests().catch((err) => {
  console.error('❌ Falha no teste:', err.message);
  process.exit(1);
});
