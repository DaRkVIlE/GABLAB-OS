import { useState, useEffect } from "react";
import { CurrentQuestPanel } from "./CurrentQuestPanel";
import { DataMatrix } from "./DataMatrix";
import { useKAIROS } from "@/hooks/useKAIROS";
import { useSharedBrain } from "@/hooks/useSharedBrain";
import {
  Cpu, Activity, Flame, Target, Zap, TrendingUp,
  AlertCircle, ChevronRight, Calendar, Bot, Loader2,
  Wifi, WifiOff, Skull, Shield, RotateCcw, Trophy
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardProps {
  onQuestlineClick?: (questlineId: string) => void;
}

const coldCallDeadline = new Date("2026-04-26");

export function Dashboard({ onQuestlineClick }: DashboardProps = {}) {
  const brain = useSharedBrain();
  const {
    xp, focoGems, streak, realCoins, availableAttributePoints, level, growSeeds,
    skyrosScore, skyrosScoreColor, skyrosScoreBorderColor, streakBroken,
    revenueProgress, revenueGoal, questsCompletedToday, bossesCompleted, bossesTotal,
  } = brain;
  const kairos = useKAIROS(30000);
  const [daysUntilCalls, setDaysUntilCalls] = useState(0);

  useEffect(() => {
    const diff = Math.ceil((coldCallDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    setDaysUntilCalls(Math.max(0, diff));
  }, []);

  const xpInLevel = xp % 100;
  const seasonStart = new Date("2026-04-10");
  const seasonDay = Math.max(1, Math.floor((Date.now() - seasonStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  // Bosses from roadmap.md via API (dynamic)
  const activeBosses = kairos.bosses.filter(b => !b.status.includes("✅"));
  const completedBosses = kairos.bosses.filter(b => b.status.includes("✅"));

  // ── BADGES ──
  const badges = [
    { id: "first-blood", emoji: "🔥", name: "First Blood", desc: "Completou ≥1 quest", unlocked: xp > 0 },
    { id: "deep-worker", emoji: "⚡", name: "Deep Worker", desc: "Streak ≥ 3 dias", unlocked: streak >= 3 },
    { id: "boss-slayer", emoji: "💀", name: "Boss Slayer", desc: "≥1 P0 eliminado", unlocked: completedBosses.length > 0 || bossesCompleted > 0 },
    { id: "first-coin", emoji: "💰", name: "First Coin", desc: "Primeiro R$ faturado", unlocked: realCoins > 0 },
    { id: "war-machine", emoji: "🏆", name: "War Machine", desc: "Streak ≥ 7 dias", unlocked: streak >= 7 },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P0': return 'text-red-400 border-red-500/40 bg-red-500/5';
      case 'P1': return 'text-orange-400 border-orange-500/40 bg-orange-500/5';
      case 'P2': return 'text-yellow-400 border-yellow-500/40 bg-yellow-500/5';
      default: return 'text-muted-foreground border-border bg-muted/10';
    }
  };

  const getStatusEmoji = (status: string) => {
    if (status.includes('🔥')) return '🔥';
    if (status.includes('✅')) return '✅';
    if (status.includes('🧊')) return '🧊';
    if (status.includes('🔧')) return '🔧';
    return '📋';
  };

  return (
    <div className="space-y-6">
      {/* ══ LOSS AVERSION ALERT ══ */}
      {streakBroken && (
        <div className="glass-card p-4 border-2 border-red-500/50 bg-red-500/10 animate-pulse">
          <div className="flex items-center gap-3">
            <Skull className="w-6 h-6 text-red-400" />
            <div>
              <p className="font-mono text-sm text-red-400 font-bold">💀 STREAK QUEBRADO · -50 XP</p>
              <p className="text-xs text-red-400/60 font-mono">Você perdeu a consistência. Reconstrua hoje ou afunde.</p>
            </div>
          </div>
        </div>
      )}

      {/* War Banner */}
      <div className={cn(
        "glass-card p-8 relative overflow-hidden animate-fade-in",
        skyrosScore <= 30 && "border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.1)]"
      )}>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `linear-gradient(hsl(var(--neon-cyan) / 0.15) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--neon-cyan) / 0.15) 1px, transparent 1px)`,
          backgroundSize: "20px 20px"
        }} />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-neon-magenta/10" />

        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Cpu className="w-6 h-6 text-primary" />
              <span className="text-sm font-mono text-primary">
                GABRIEL OS v4.2 // LVL {level} // T1-2026 · DIA {seasonDay}/90
              </span>
              <Activity className="w-4 h-4 text-neon-green animate-pulse" />
              {/* Backend status indicator */}
              {kairos.backendOnline ? (
                <span className="flex items-center gap-1 text-[10px] font-mono text-neon-green">
                  <Wifi className="w-3 h-3" /> LIVE
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-mono text-red-400">
                  <WifiOff className="w-3 h-3" /> OFFLINE
                </span>
              )}
            </div>

            <h2 className="font-display text-4xl text-primary glow-cyan mb-2 uppercase tracking-wider">
              Gabriel Lima
            </h2>
            <p className="text-muted-foreground font-mono text-sm mb-4">
              &gt; Arquiteto-Comunicador · Voice of the Dragonborn
            </p>

            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 w-fit">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-sm font-mono text-red-400">
                {kairos.isolationActive ? '🔴 ISOLATION MODE — DEEP WORK ATIVO' : 'T1 FUNDAÇÃO — MODO DE GUERRA ATIVO'}
              </span>
            </div>

            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <StatPill icon={Flame} value={`${streak}d`} label="streak" color={streakBroken ? "text-red-400" : "text-neon-orange"} borderColor={streakBroken ? "border-red-500/30" : "border-neon-orange/30"} bgColor={streakBroken ? "bg-red-500/10" : "bg-neon-orange/10"} />
              <StatPill icon={Zap} value={`${focoGems} GEMS`} label="foco" color="text-blue-400" borderColor="border-blue-400/30" bgColor="bg-blue-500/10" />
              <StatPill icon={Target} value={`R$ ${realCoins.toLocaleString("pt-BR")}`} label="faturado" color="text-green-400" borderColor="border-green-500/30" bgColor="bg-green-500/10" />
              {availableAttributePoints > 0 && (
                <StatPill icon={TrendingUp} value={`${availableAttributePoints} pts`} label="skill pts" color="text-yellow-400" borderColor="border-yellow-500/30" bgColor="bg-yellow-500/10" />
              )}
            </div>

            {/* ══ REVENUE PROGRESS BAR (Meta R$ 30k) ══ */}
            <div className="mt-4 w-full max-w-md">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Meta Faturamento</span>
                <span className="text-[10px] font-mono text-primary">
                  R$ {realCoins.toLocaleString("pt-BR")} / R$ {revenueGoal.toLocaleString("pt-BR")} — {Math.round(revenueProgress)}%
                </span>
              </div>
              <div className="h-2.5 w-full bg-muted/20 rounded-full overflow-hidden border border-border/30">
                <div
                  className={cn(
                    "h-full bg-gradient-to-r from-primary via-primary/80 to-primary/50 transition-all duration-1000 ease-out rounded-full",
                    revenueProgress > 50 && "shadow-[0_0_15px_rgba(201,168,76,0.6)]"
                  )}
                  style={{ width: `${revenueProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* ══ SKYROS SCORE ORB (replaces old XP Orb) ══ */}
          <div className="hidden xl:block relative text-center flex-shrink-0">
            <div className={cn(
              "w-32 h-32 border-2 rounded-full flex items-center justify-center relative transition-all duration-500",
              skyrosScoreBorderColor,
              skyrosScore <= 30 && "animate-pulse"
            )}>
              <div className="text-center">
                <span className={cn("font-display text-3xl block", skyrosScoreColor)}>{skyrosScore}</span>
                <div className="text-[10px] text-muted-foreground uppercase font-mono">SKYROS</div>
                <div className={cn("text-[10px] font-mono", skyrosScoreColor)}>
                  {skyrosScore >= 80 ? "ELITE" : skyrosScore >= 50 ? "EM RISCO" : "CRÍTICO"}
                </div>
              </div>
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-muted/20" />
                <circle
                  cx="64" cy="64" r="60"
                  stroke="currentColor" strokeWidth="4" fill="transparent"
                  strokeDasharray="377"
                  strokeDashoffset={377 - (377 * (skyrosScore / 100))}
                  className={cn("transition-all duration-1000", skyrosScoreColor)}
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* ══ SPRINT / BATTLE PASS MINI WIDGET ══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* OP 1 */}
        <div className="glass-card p-4 border border-blue-500/20 bg-blue-500/5 hover:border-blue-500/40 transition-all cursor-pointer" onClick={() => onQuestlineClick?.("experia")}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-blue-400" />
              <span className="font-mono text-xs uppercase tracking-wide text-blue-400">OP1: Experia MVP</span>
            </div>
            <span className="font-mono text-xs text-blue-400">33%</span>
          </div>
          <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: "33%" }} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">1/3 Trials Entregues</p>
        </div>

        {/* OP 2 */}
        <div className="glass-card p-4 border border-green-500/20 bg-green-500/5 hover:border-green-500/40 transition-all cursor-pointer" onClick={() => onQuestlineClick?.("english")}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-green-400" />
              <span className="font-mono text-xs uppercase tracking-wide text-green-400">OP2: AI English Classes</span>
            </div>
            <span className="font-mono text-xs text-green-400">0%</span>
          </div>
          <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: "0%" }} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">R$ 0 / R$ 3.000 (Caixa Rápido)</p>
        </div>
      </div>

      {/* ══ BOSS FIGHTS — Dynamic from roadmap.md ══ */}
      <div className="glass-card p-6 border border-red-500/20 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Skull className="w-5 h-5 text-red-400" />
            <div>
              <h3 className="font-display text-lg text-red-400 uppercase tracking-wide">
                Boss Fights Ativas (P0)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {kairos.backendOnline
                  ? `${activeBosses.length} boss(es) ativos · lido do roadmap.md`
                  : 'Backend offline — inicie: node scripts/dashboard.js'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => kairos.refetch()}
              className="icon-btn w-7 h-7 text-muted-foreground hover:text-primary"
              title="Sincronizar roadmap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-2 text-xs text-orange-400 bg-orange-500/10 border border-orange-500/30 px-3 py-1.5 rounded-lg">
              <Calendar className="w-3 h-3" />
              <span className="font-mono">{daysUntilCalls}d até cold calls</span>
            </div>
          </div>
        </div>

        {kairos.loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-primary animate-spin mr-2" />
            <span className="text-sm text-muted-foreground font-mono">Carregando roadmap...</span>
          </div>
        ) : activeBosses.length === 0 ? (
          <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
            <Shield className="w-5 h-5 text-neon-green" />
            <span className="font-mono text-sm">Nenhum boss ativo — área limpa! 🏆</span>
          </div>
        ) : (
          <div className="space-y-3">
            {activeBosses.map((boss, i) => (
              <div
                key={boss.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-red-500/20 bg-red-500/5 hover:border-red-500/40 transition-all"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex-shrink-0 text-xl">{getStatusEmoji(boss.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={cn('text-[10px] font-mono font-bold px-2 py-0.5 rounded border', getPriorityColor(boss.priority))}>
                      {boss.priority}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">{boss.project}</span>
                    {boss.owner && (
                      <span className="text-[10px] text-muted-foreground/50 font-mono">{boss.owner}</span>
                    )}
                  </div>
                  <p className="text-sm text-foreground leading-tight">{boss.description}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 font-mono">{boss.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quests P1/P2 in pipeline */}
        {kairos.quests.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground font-mono mb-2">PIPELINE (P1–P3)</p>
            <div className="flex flex-wrap gap-2">
              {kairos.quests.slice(0, 5).map(q => (
                <span
                  key={q.id}
                  className={cn('text-[10px] font-mono px-2 py-1 rounded border', getPriorityColor(q.priority))}
                >
                  [{q.priority}] {q.project}: {q.description.substring(0, 40)}{q.description.length > 40 ? '...' : ''}
                </span>
              ))}
              {kairos.quests.length > 5 && (
                <span className="text-[10px] font-mono text-muted-foreground px-2 py-1">
                  +{kairos.quests.length - 5} mais
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ══ DATA MATRIX — 4 Charts ══ */}
      <DataMatrix
        skyrosScore={skyrosScore}
        streak={streak}
        xp={xp}
        realCoins={realCoins}
        focoGems={focoGems}
        growSeeds={growSeeds}
        questsCompletedToday={questsCompletedToday}
        bossesCompleted={bossesCompleted}
        bossesTotal={bossesTotal}
        revenueGoal={revenueGoal}
      />

      {/* Main Content */}
      <div className="w-full">
        {/* Quest Panel */}
        <CurrentQuestPanel />
      </div>

      {/* ══ BADGES / CONQUISTAS ══ */}
      <div className="glass-card p-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-display text-lg text-primary uppercase tracking-wide">Conquistas</h3>
            <p className="text-xs text-muted-foreground">{badges.filter(b => b.unlocked).length}/{badges.length} desbloqueadas</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all",
                badge.unlocked
                  ? "bg-primary/5 border-primary/30 shadow-[0_0_15px_rgba(201,168,76,0.08)]"
                  : "bg-muted/5 border-border/30 opacity-30 grayscale"
              )}
            >
              <span className="text-lg">{badge.emoji}</span>
              <div>
                <p className={cn("text-xs font-mono font-bold", badge.unlocked ? "text-primary" : "text-muted-foreground")}>
                  {badge.name}
                </p>
                <p className="text-[9px] text-muted-foreground">{badge.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Nav Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Questlines", emoji: "📜", desc: "7 ativas · 2 P0", section: "questlines" },
          { label: "Skill Tree", emoji: "🌳", desc: `${availableAttributePoints} pontos disponíveis`, section: "skills" },
          { label: "Boss Room", emoji: "💀", desc: `${activeBosses.length} boss(es) ativos`, section: "bosses" },
        ].map((card) => (
          <button
            key={card.section}
            onClick={() => onQuestlineClick?.(card.section === "questlines" ? "experia" : "")}
            className="glass-card p-4 text-left hover:border-primary/50 transition-all group"
          >
            <div className="text-2xl mb-2">{card.emoji}</div>
            <div className="font-medium group-hover:text-primary transition-colors">{card.label}</div>
            <div className="text-xs text-muted-foreground">{card.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function StatPill({
  icon: Icon, value, label, color, borderColor, bgColor
}: {
  icon: typeof Flame;
  value: string;
  label: string;
  color: string;
  borderColor: string;
  bgColor: string;
}) {
  return (
    <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border", borderColor, bgColor)}>
      <Icon className={cn("w-4 h-4", color)} />
      <span className={cn("text-sm font-mono", color)}>{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
