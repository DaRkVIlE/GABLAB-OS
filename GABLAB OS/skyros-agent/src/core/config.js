/**
 * SKYROS Agent — Configuration Loader
 * Reads god-kairos/*.yaml and .env for API keys and routing config
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse as parseYaml } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..', '..', '..');

/**
 * Load a YAML file, return parsed object or empty object on failure
 */
function loadYaml(relativePath) {
  const fullPath = resolve(PROJECT_ROOT, relativePath);
  if (!existsSync(fullPath)) return {};
  try {
    return parseYaml(readFileSync(fullPath, 'utf-8'));
  } catch (e) {
    console.error(`⚠️  Failed to parse ${relativePath}: ${e.message}`);
    return {};
  }
}

/**
 * Load .env file as key=value pairs into an object
 */
function loadEnv() {
  const envPath = resolve(PROJECT_ROOT, '.env');
  if (!existsSync(envPath)) return {};
  const env = {};
  const lines = readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    // Remove surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

/**
 * Build the complete SKYROS config from all sources
 */
export function loadConfig() {
  const apiKeys = loadYaml('god-kairos/api-keys.yaml');
  const godConfig = loadYaml('god-kairos/config.yaml');
  const env = loadEnv();

  // Extract provider keys
  const geminiKeys = (apiKeys.gemini?.keys || []).map(k => k.key);
  const groqKeys = (apiKeys.groq?.keys || []).map(k => k.key);
  
  // Extra checks for HuggingFace and Red Hat
  let hfToken = env.HF_TOKEN || '';
  if (!hfToken && apiKeys.huggingface?.keys?.length > 0) {
    hfToken = apiKeys.huggingface.keys[0].key || '';
  }

  let redhatKeys = (apiKeys.redhat?.keys || []).map(k => k.key).filter(k => !!k);
  const redhatEndpoint = apiKeys.redhat?.endpoint || env.REDHAT_ENDPOINT || '';

  // Fallback to env vars if no keys in yaml
  if (geminiKeys.length === 0 && env.GEMINI_API_KEY) {
    geminiKeys.push(env.GEMINI_API_KEY);
  }
  if (groqKeys.length === 0 && env.GROQ_API_KEY) {
    groqKeys.push(env.GROQ_API_KEY);
  }

  // Global provider override for testing or sovereign mode
  const globalProvider = env.SKORTEX_PROVIDER || null;

  return {
    projectRoot: PROJECT_ROOT,
    
    providers: {
      gemini: {
        keys: geminiKeys,
        model: apiKeys.gemini?.model_default || 'gemini-2.5-pro',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
        rpmPerKey: apiKeys.gemini?.rate_limits?.per_key_rpm || 15,
      },
      groq: {
        keys: groqKeys,
        model: apiKeys.groq?.model_default || 'llama-3.1-8b-instant',
        modelHeavy: apiKeys.groq?.model_heavy || 'llama-3.3-70b-versatile',
        baseUrl: 'https://api.groq.com/openai/v1',
        rpmPerKey: apiKeys.groq?.rate_limits?.per_key_rpm || 30,
      },
      huggingface: {
        keys: hfToken ? [hfToken] : [],
        model: 'Jackrong/Qwen3.5-27B-Claude-4.6-Opus-Reasoning-Distilled',
        baseUrl: 'https://router.huggingface.co/hf-inference/v1',
        rpmPerKey: 10,
        models: {
          reasoning: 'Jackrong/Qwen3.5-27B-Claude-4.6-Opus-Reasoning-Distilled',
          aggressive: 'HauhauCS/Qwen3.5-35B-A3B-Uncensored-HauhauCS-Aggressive',
          thinking: 'DavidAU/Qwen3.5-40B-Claude-4.6-Opus-Deckard-Heretic-Uncensored-Thinking',
        },
      },
      redhat: {
        keys: redhatKeys.length > 0 ? redhatKeys : ['internal'],
        model: apiKeys.redhat?.model_default || 'qwen3.5-40b-thinking',
        baseUrl: redhatEndpoint,
        rpmPerKey: 60,
      }
    },

    routing: {
      light: { provider: globalProvider || 'groq', model: apiKeys.groq?.model_default || 'llama-3.1-8b-instant' },
      medium: { provider: globalProvider || 'gemini', model: apiKeys.gemini?.model_default || 'gemini-2.5-pro' },
      heavy: { provider: globalProvider || 'groq', model: apiKeys.groq?.model_heavy || 'llama-3.3-70b-versatile' },
      supreme: { provider: globalProvider || 'huggingface', model: 'Jackrong/Qwen3.5-27B-Claude-4.6-Opus-Reasoning-Distilled' },
      god: { provider: globalProvider || 'huggingface', model: 'DavidAU/Qwen3.5-40B-Claude-4.6-Opus-Deckard-Heretic-Uncensored-Thinking' },
      night: { provider: globalProvider || 'redhat', model: apiKeys.redhat?.model_default || 'qwen3.5-40b-thinking' },
    },

    agent: {
      maxSteps: 25,
      maxTokens: 8192,
      temperature: 0.1,
      systemPrompt: 'You are SKYROS Agent, an autonomous AI assistant for the KAIROS OS ecosystem. You can execute commands, read/write files, and use MCP tools. Be concise and action-oriented.',
    },

    paths: {
      root: PROJECT_ROOT,
      agents: resolve(PROJECT_ROOT, '.aiox-core', 'development', 'agents'),
      selfContext: resolve(PROJECT_ROOT, 'SELF_CONTEXT.md'),
      status: resolve(PROJECT_ROOT, 'STATUS.md'),
      reasoningPackages: resolve(PROJECT_ROOT, 'reasoning-packages'),
      sessions: resolve(PROJECT_ROOT, 'skyros-agent', 'sessions'),
      mcpServer: resolve(PROJECT_ROOT, 'scripts', 'mcp-server.js'),
    },

    sync: {
      supabaseUrl: env.SUPABASE_URL || '',
      supabaseKey: env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY || '',
      machineId: process.env.COMPUTERNAME || process.env.HOSTNAME || env.MACHINE_ID || 'unknown',
      agentId: `skortex-${Date.now().toString(36)}`,
    },
  };
}

export default loadConfig;
