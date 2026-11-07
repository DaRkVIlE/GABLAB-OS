import { z } from 'zod';

export interface MoodleConfig {
  baseUrl: string;
  token: string;
  habiticaConnectorUrl: string;
}

export interface UserPortalInfo {
  userId: number;
  portalId: number;
  portalName: string;
  targetCefr: string;
  totalChunks: number;
  masteredChunks: number;
  progressPercent: number;
  activeChunkIds: string[];
}

export interface ChunkMasteryResult {
  userId: number;
  chunkId: string;
  reactionTimeSeconds: number;
  isAutomatic: boolean; // < 4s threshold
  masteredAt: string;
  xpGranted: number;
  moodleStatusUpdated: boolean;
}

export interface AwardXPResult {
  userId: number;
  xpAdded: number;
  newTotalXP: number;
  currentLevel: number;
  levelUp: boolean;
  message: string;
}

export interface BossRaidUnlockResult {
  userId: number;
  unlocked: boolean;
  currentStreakDays: number;
  requiredStreakDays: number;
  raidTitle: string;
  simulationTopic: string;
  message: string;
}

export interface HabiticaSyncResult {
  success: boolean;
  habiticaUserId?: string;
  streakDays: number;
  xpSynced: number;
  questDamage: number;
  message: string;
}

// Zod schemas for tool parameters
export const GetUserPortalSchema = z.object({
  userId: z.union([z.number(), z.string()]).describe('ID numérico ou e-mail do estudante no Moodle LMS'),
  courseId: z.number().optional().describe('ID do curso correspondente ao Portal ativo (opcional)')
});

export const RecordChunkMasterySchema = z.object({
  userId: z.union([z.number(), z.string()]).describe('ID numérico ou e-mail do estudante no Moodle LMS'),
  chunkId: z.string().describe('Identificador único do chunk lexical (ex: chunk_p1_042)'),
  reactionTimeSeconds: z.number().positive().describe('Tempo de reflexo/latência de resposta em segundos medido pela AIDA'),
  cmid: z.number().optional().describe('ID do Course Module no Moodle associado ao chunk (se aplicável)')
});

export const AwardXPSchema = z.object({
  userId: z.union([z.number(), z.string()]).describe('ID numérico ou e-mail do estudante no Moodle LMS'),
  xpAmount: z.number().int().positive().describe('Quantidade de XP a conceder (padrão: 10 a 50 XP por interação de qualidade)'),
  reason: z.string().describe('Justificativa pedagógica do ganho de XP (ex: "Uso espontâneo de chunk no Portal 2")')
});

export const UnlockBossRaidSchema = z.object({
  userId: z.union([z.number(), z.string()]).describe('ID numérico ou e-mail do estudante no Moodle LMS'),
  currentStreakDays: z.number().int().min(0).describe('Contagem de dias consecutivos de ofensiva ativa')
});

export const SyncHabiticaSchema = z.object({
  userId: z.union([z.number(), z.string()]).describe('ID numérico ou e-mail do estudante no Moodle LMS'),
  habiticaUserId: z.string().optional().describe('UUID do usuário no Habitica (se mapeado)'),
  xpAwarded: z.number().default(0).describe('XP a ser creditado no personagem Habitica'),
  streakDays: z.number().default(1).describe('Dias consecutivos de ofensiva'),
  taskAlias: z.string().default('aida-daily-immersion').describe('Alias da tarefa ou habit no Habitica')
});
