// Quick test: validate Groq and Gemini API keys
import OpenAI from 'openai';

const tests = [
  {
    name: 'Groq #1',
    key: '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',
    baseURL: 'https://api.groq.com/openai/v1',
    model: 'llama-3.1-8b-instant',
  },
  {
    name: 'Gemini #1 (lemellomodel)',
    key: 'AIzaSyAiEkpxe5nZLEB_wtOkuJ1E7PJBWT97Ncg',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: 'gemini-2.0-flash',
  },
];

for (const t of tests) {
  const client = new OpenAI({ apiKey: t.key, baseURL: t.baseURL });
  try {
    const r = await client.chat.completions.create({
      model: t.model,
      messages: [{ role: 'user', content: 'Reply with PONG' }],
      max_tokens: 10,
    });
    console.log(`✅ ${t.name}: ${r.choices[0].message.content}`);
  } catch (e) {
    console.log(`❌ ${t.name}: ${e.status} — ${e.message?.slice(0, 100)}`);
  }
}
