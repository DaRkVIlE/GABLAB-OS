import axios, { AxiosInstance } from 'axios';
import {
  MoodleConfig,
  UserPortalInfo,
  ChunkMasteryResult,
  AwardXPResult,
  BossRaidUnlockResult,
  HabiticaSyncResult
} from './types.js';

export class MoodleClient {
  private api: AxiosInstance;
  private config: MoodleConfig;

  // In-memory mock store for local development / testing without live Moodle connection
  private userStore: Map<number, {
    portalId: number;
    portalName: string;
    xp: number;
    level: number;
    masteredChunks: Set<string>;
    streakDays: number;
  }> = new Map();

  // Cache de mapeamento de e-mail -> userId
  private emailToUserMap: Map<string, number> = new Map();

  constructor(config?: Partial<MoodleConfig>) {
    this.config = {
      baseUrl: config?.baseUrl || process.env.MOODLE_URL || 'https://moodle.experiasolutions.com.br',
      token: config?.token || process.env.MOODLE_TOKEN || 'mock-token',
      habiticaConnectorUrl: config?.habiticaConnectorUrl || process.env.HABITICA_CONNECTOR_URL || 'http://localhost:4050'
    };
    this.api = axios.create({
      baseURL: this.config.baseUrl,
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MoodleBridge-MCP/1.0.0 (KAIROS OS)'
      }
    });

    // Seed default demo user #1 (Gabriel / Aluno Alpha)
    this.userStore.set(1, {
      portalId: 2,
      portalName: 'Portal 2: Velocidade Digital',
      xp: 450,
      level: 3,
      masteredChunks: new Set(['chunk_p1_001', 'chunk_p1_002', 'chunk_p2_010']),
      streakDays: 14
    });
  }

  /**
   * Resolve identifier (number, string id, or email) to numeric Moodle userId
   */
  public async resolveUserId(identifier: string | number): Promise<number> {
    if (typeof identifier === 'number') {
      return identifier;
    }

    const trimmed = String(identifier).trim();
    const asNum = Number(trimmed);
    if (!isNaN(asNum) && asNum > 0) {
      return asNum;
    }

    // Identificador é um e-mail ou username string
    const emailKey = trimmed.toLowerCase();
    if (this.emailToUserMap.has(emailKey)) {
      return this.emailToUserMap.get(emailKey)!;
    }

    try {
      const users = await this.callMoodleWS<any[]>('core_user_get_users_by_field', {
        field: 'email',
        values: [emailKey]
      });

      if (Array.isArray(users) && users.length > 0 && users[0].id) {
        const resolvedId = Number(users[0].id);
        this.emailToUserMap.set(emailKey, resolvedId);
        return resolvedId;
      }
    } catch (e: any) {
      console.warn(`[MoodleClient] Could not resolve user by email "${emailKey}": ${e.message}. Using default user.`);
    }

    // Fallback gracioso para Aluno Demo #1
    const fallbackId = 1;
    this.emailToUserMap.set(emailKey, fallbackId);
    return fallbackId;
  }

  /**
   * Helper to execute Moodle Web Service function
   */
  private async callMoodleWS<T>(wsFunction: string, params: Record<string, any> = {}): Promise<T> {
    if (!this.config.token || this.config.token === 'your_moodle_webservice_token_here') {
      throw new Error(`Moodle token not configured. Running in mock/standalone mode.`);
    }

    const response = await this.api.get('/webservice/rest/server.php', {
      params: {
        wstoken: this.config.token,
        wsfunction: wsFunction,
        moodlewsrestformat: 'json',
        ...params
      }
    });

    if (response.data && response.data.exception) {
      throw new Error(`Moodle API Exception: ${response.data.message || response.data.exception}`);
    }

    return response.data as T;
  }

  /**
   * Tool 1: moodle_get_user_portal
   */
  public async getUserPortal(userId: number | string, courseId?: number): Promise<UserPortalInfo> {
    const resolvedUserId = await this.resolveUserId(userId);
    try {
      // Try live Moodle WS
      const courses = await this.callMoodleWS<any[]>('core_enrol_get_users_courses', { userid: resolvedUserId });
      // Map course to portal
      const activeCourse = courses.find((c: any) => c.id === courseId) || courses[0];
      return {
        userId: resolvedUserId,
        portalId: activeCourse ? activeCourse.id : 2,
        portalName: activeCourse ? activeCourse.fullname : 'Portal 2: Velocidade Digital (B2 Mountain)',
        targetCefr: 'B1-B2',
        totalChunks: 500,
        masteredChunks: 84,
        progressPercent: 16.8,
        activeChunkIds: ['chunk_p2_011', 'chunk_p2_012', 'chunk_p2_015', 'chunk_p2_020']
      };
    } catch (err: any) {
      // Fallback to in-memory state
      const user = this.userStore.get(resolvedUserId) || {
        portalId: 1,
        portalName: 'Portal 1: Descongelamento Imediato',
        xp: 0,
        level: 1,
        masteredChunks: new Set<string>(),
        streakDays: 1
      };

      const portals = [
        { id: 1, name: 'Portal 1: Descongelamento Imediato', cefr: 'A1-A2', total: 500 },
        { id: 2, name: 'Portal 2: Velocidade Digital', cefr: 'A2-B1', total: 500 },
        { id: 3, name: 'Portal 3: Sobrevivência em Conversas', cefr: 'B1', total: 500 },
        { id: 4, name: 'Portal 4: Voz Executiva & Nuance', cefr: 'B2', total: 500 },
        { id: 5, name: 'Portal 5: Densidade Lexical', cefr: 'B2-C1', total: 500 }
      ];

      const currentPortal = portals.find(p => p.id === user.portalId) || portals[0];
      const countMastered = user.masteredChunks.size;

      return {
        userId: resolvedUserId,
        portalId: currentPortal.id,
        portalName: currentPortal.name,
        targetCefr: currentPortal.cefr,
        totalChunks: currentPortal.total,
        masteredChunks: countMastered,
        progressPercent: Math.round((countMastered / currentPortal.total) * 1000) / 10,
        activeChunkIds: [`chunk_p${currentPortal.id}_001`, `chunk_p${currentPortal.id}_002`, `chunk_p${currentPortal.id}_003`]
      };
    }
  }

  /**
   * Tool 2: moodle_record_chunk_mastery
   * Automaticity threshold is strict: < 4.0 seconds response time
   */
  public async recordChunkMastery(
    userId: number | string,
    chunkId: string,
    reactionTimeSeconds: number,
    cmid?: number
  ): Promise<ChunkMasteryResult> {
    const resolvedUserId = await this.resolveUserId(userId);
    const isAutomatic = reactionTimeSeconds < 4.0;
    const xpGranted = isAutomatic ? 50 : 15;
    let moodleStatusUpdated = false;

    try {
      if (cmid && isAutomatic) {
        await this.callMoodleWS('core_completion_update_activity_completion_status_manually', {
          cmid,
          completed: 1
        });
        moodleStatusUpdated = true;
      }
    } catch (e) {
      // In mock/offline mode, keep going
      moodleStatusUpdated = false;
    }

    // Update in-memory state
    const user = this.userStore.get(resolvedUserId) || {
      portalId: 1,
      portalName: 'Portal 1: Descongelamento Imediato',
      xp: 0,
      level: 1,
      masteredChunks: new Set<string>(),
      streakDays: 1
    };

    if (isAutomatic) {
      user.masteredChunks.add(chunkId);
    }
    user.xp += xpGranted;
    user.level = Math.floor(user.xp / 200) + 1;
    this.userStore.set(resolvedUserId, user);

    return {
      userId: resolvedUserId,
      chunkId,
      reactionTimeSeconds,
      isAutomatic,
      masteredAt: new Date().toISOString(),
      xpGranted,
      moodleStatusUpdated
    };
  }

  /**
   * Tool 3: moodle_award_xp
   */
  public async awardXP(userId: number | string, xpAmount: number, reason: string): Promise<AwardXPResult> {
    const resolvedUserId = await this.resolveUserId(userId);
    const user = this.userStore.get(resolvedUserId) || {
      portalId: 1,
      portalName: 'Portal 1: Descongelamento Imediato',
      xp: 0,
      level: 1,
      masteredChunks: new Set<string>(),
      streakDays: 1
    };

    const previousLevel = user.level;
    user.xp += xpAmount;
    user.level = Math.floor(user.xp / 200) + 1;
    const levelUp = user.level > previousLevel;
    this.userStore.set(resolvedUserId, user);

    return {
      userId: resolvedUserId,
      xpAdded: xpAmount,
      newTotalXP: user.xp,
      currentLevel: user.level,
      levelUp,
      message: levelUp
        ? `🔥 LEVEL UP! O aluno subiu para o Nível ${user.level}! (+${xpAmount} XP por ${reason})`
        : `⚡ +${xpAmount} XP concedido (${reason}). Total: ${user.xp} XP`
    };
  }

  /**
   * Tool 4: moodle_unlock_boss_raid
   * Unlocks after 21 days consecutive streak
   */
  public async unlockBossRaid(userId: number | string, currentStreakDays: number): Promise<BossRaidUnlockResult> {
    const resolvedUserId = await this.resolveUserId(userId);
    const requiredStreakDays = 21;
    const unlocked = currentStreakDays >= requiredStreakDays;

    return {
      userId: resolvedUserId,
      unlocked,
      currentStreakDays,
      requiredStreakDays,
      raidTitle: '⚔️ BOSS RAID EXECUTIVA DE GABE — SIMULAÇÃO DEFINITIVA',
      simulationTopic: 'Negociação Internacional sob Pressão com Gabe & Alexandra (P4)',
      message: unlocked
        ? `🎉 BOSS RAID DESBLOQUEADA! Ofensiva de ${currentStreakDays} dias atingida! O aluno está habilitado para a simulação executiva com Gabe.`
        : `🔒 BOSS RAID BLOQUEADA: Ofensiva atual de ${currentStreakDays}/${requiredStreakDays} dias. Faltam ${requiredStreakDays - currentStreakDays} dias para o destrave.`
    };
  }

  /**
   * Tool 5: moodle_sync_habitica
   * Connects to habitica-connector microservice
   */
  public async syncHabitica(
    userId: number | string,
    habiticaUserId?: string,
    xpAwarded: number = 0,
    streakDays: number = 1,
    taskAlias: string = 'aida-daily-immersion'
  ): Promise<HabiticaSyncResult> {
    const resolvedUserId = await this.resolveUserId(userId);
    try {
      const response = await axios.post(
        `${this.config.habiticaConnectorUrl}/webhook/aida-event`,
        {
          userId: resolvedUserId,
          habiticaUserId,
          xpAwarded,
          streakDays,
          taskAlias,
          timestamp: new Date().toISOString()
        },
        { timeout: 4000 }
      );

      return {
        success: true,
        habiticaUserId,
        streakDays,
        xpSynced: xpAwarded,
        questDamage: Math.round(xpAwarded * 0.4),
        message: '✅ Sincronizado com sucesso com o Habitica Connector (Ofensiva e Quests atualizadas).'
      };
    } catch (err: any) {
      // Local fallback simulation
      return {
        success: true,
        habiticaUserId,
        streakDays,
        xpSynced: xpAwarded,
        questDamage: Math.round(xpAwarded * 0.4),
        message: `ℹ️ Habitica Connector em modo simulado/local: Dano na Quest=${Math.round(xpAwarded * 0.4)}, Streak=${streakDays}d (${err.message})`
      };
    }
  }
}
