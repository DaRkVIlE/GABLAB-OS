import { z } from "zod";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fallback canônico para a raiz do My KAIROS
const defaultKairosRoot = path.resolve(__dirname, "../../..");

// Carrega .env do servidor MCP e da raiz KAIROS silenciosamente (sem poluir stdout)
dotenv.config({ path: path.join(__dirname, "../../.env"), quiet: true } as any);
dotenv.config({ path: path.join(defaultKairosRoot, ".env"), quiet: true } as any);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().optional(),
  API_BASE_URL: z.string().url().optional(),
  API_KEY: z.string().optional(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_KEY: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  KAIROS_ROOT: z.string().default(defaultKairosRoot),
});

export const env = envSchema.parse(process.env);
