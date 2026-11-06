import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { MoodleClient } from './moodle-client.js';
import {
  GetUserPortalSchema,
  RecordChunkMasterySchema,
  AwardXPSchema,
  UnlockBossRaidSchema,
  SyncHabiticaSchema
} from './types.js';

export function getMoodleToolsDefinitions(): Tool[] {
  const userIdProperty = {
    oneOf: [{ type: 'number' }, { type: 'string' }],
    description: 'ID numérico ou e-mail do estudante no Moodle LMS'
  };

  return [
    {
      name: 'moodle_get_user_portal',
      description: 'Consulta o Portal ativo do aluno na Montanha B2, chunks liberados, porcentagem de progresso e nível atual no Moodle LMS.',
      inputSchema: {
        type: 'object',
        properties: {
          userId: userIdProperty,
          courseId: {
            type: 'number',
            description: 'ID do curso/portal específico (opcional)'
          }
        },
        required: ['userId']
      }
    },
    {
      name: 'moodle_record_chunk_mastery',
      description: 'Registra a automaticidade de um chunk lexical no Moodle. O tempo de reflexo < 4.0s é sinal de automaticidade (meta de treino sem nota, PRD §8.5), concedendo XP e atualizando o status de domínio.',
      inputSchema: {
        type: 'object',
        properties: {
          userId: userIdProperty,
          chunkId: {
            type: 'string',
            description: 'Identificador único do chunk lexical (ex: chunk_p2_012)'
          },
          reactionTimeSeconds: {
            type: 'number',
            description: 'Tempo medido de resposta/reflexo do aluno em segundos (ex: 2.5)'
          },
          cmid: {
            type: 'number',
            description: 'Course Module ID no Moodle (opcional)'
          }
        },
        required: ['userId', 'chunkId', 'reactionTimeSeconds']
      }
    },
    {
      name: 'moodle_award_xp',
      description: 'Concede pontos de experiência (XP) ao aluno no bloco Level Up! do Moodle por participação ativa e resposta oral (100% invisível no chat, PRD §9.1).',
      inputSchema: {
        type: 'object',
        properties: {
          userId: userIdProperty,
          xpAmount: {
            type: 'number',
            description: 'Quantidade de XP a conceder (10-100)'
          },
          reason: {
            type: 'string',
            description: 'Justificativa pedagógica da premiação de XP'
          }
        },
        required: ['userId', 'xpAmount', 'reason']
      }
    },
    {
      name: 'moodle_unlock_boss_raid',
      description: 'Verifica a elegibilidade para a Boss Raid (sessão 1-on-1 de 30 min com Gabe): rotina mínima >= 10 de 14 dias (PRD §8.3), Transfer Task e No-Assist concluídos. O sign-off final é humano com Boss Score >= 70 e >= 5 chunks.',
      inputSchema: {
        type: 'object',
        properties: {
          userId: userIdProperty,
          currentStreakDays: {
            type: 'number',
            description: 'Total de dias consecutivos de rotina diária ativa'
          }
        },
        required: ['userId', 'currentStreakDays']
      }
    },
    {
      name: 'moodle_sync_habitica',
      description: '[DEPRECATED PRD §4.3] Sincronização legado Habitica. O Habitica foi descartado no PRD v1.0 Turma Alpha; a gamificação opera 100% no Moodle LMS + Level Up!.',
      inputSchema: {
        type: 'object',
        properties: {
          userId: userIdProperty,
          habiticaUserId: {
            type: 'string',
            description: 'UUID do usuário no Habitica (opcional)'
          },
          xpAwarded: {
            type: 'number',
            description: 'XP a ser convertido em progresso de Quest'
          },
          streakDays: {
            type: 'number',
            description: 'Dias de streak a validar'
          },
          taskAlias: {
            type: 'string',
            description: 'Identificador da tarefa (padrão: aida-daily-immersion)'
          }
        },
        required: ['userId']
      }
    }
  ];
}

export async function handleMoodleToolCall(
  name: string,
  args: any,
  client: MoodleClient
): Promise<any> {
  switch (name) {
    case 'moodle_get_user_portal': {
      const parsed = GetUserPortalSchema.parse(args);
      return await client.getUserPortal(parsed.userId, parsed.courseId);
    }
    case 'moodle_record_chunk_mastery': {
      const parsed = RecordChunkMasterySchema.parse(args);
      return await client.recordChunkMastery(
        parsed.userId,
        parsed.chunkId,
        parsed.reactionTimeSeconds,
        parsed.cmid
      );
    }
    case 'moodle_award_xp': {
      const parsed = AwardXPSchema.parse(args);
      return await client.awardXP(parsed.userId, parsed.xpAmount, parsed.reason);
    }
    case 'moodle_unlock_boss_raid': {
      const parsed = UnlockBossRaidSchema.parse(args);
      return await client.unlockBossRaid(parsed.userId, parsed.currentStreakDays);
    }
    case 'moodle_sync_habitica': {
      const parsed = SyncHabiticaSchema.parse(args);
      return await client.syncHabitica(
        parsed.userId,
        parsed.habiticaUserId,
        parsed.xpAwarded,
        parsed.streakDays,
        parsed.taskAlias
      );
    }
    default:
      throw new Error(`Ferramenta desconhecida: ${name}`);
  }
}

export function generateOpenAPISpec(baseUrl?: string): Record<string, any> {
  const tools = getMoodleToolsDefinitions();
  const paths: Record<string, any> = {};

  for (const tool of tools) {
    paths[`/tools/${tool.name}`] = {
      post: {
        summary: tool.description,
        operationId: tool.name,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: tool.inputSchema
            }
          }
        },
        responses: {
          '200': {
            description: 'Execução com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { type: 'object' }
                  }
                }
              }
            }
          },
          '500': {
            description: 'Erro na execução da ferramenta',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    error: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    };
  }

  return {
    openapi: '3.0.0',
    info: {
      title: 'Moodle Bridge API',
      version: '1.0.0',
      description: 'API de ferramentas pedagógicas do Moodle LMS para LibreChat / AIDA (Método SPARK)'
    },
    servers: [
      {
        url: baseUrl || (process.env.RAILWAY_PUBLIC_DOMAIN 
          ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` 
          : 'https://moodle-bridge-production.up.railway.app'),
        description: 'Moodle Bridge Production'
      }
    ],
    paths
  };
}

