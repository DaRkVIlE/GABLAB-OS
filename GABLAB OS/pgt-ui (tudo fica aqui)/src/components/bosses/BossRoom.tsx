import { useState } from "react";
import { Skull, Swords, Shield, Crown, ChevronDown, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";

interface Boss {
  id: string;
  name: string;
  description: string;
  lore: string;
  totalHp: number;
  currentHp: number;
  priority: "critical" | "high" | "medium" | "low";
  defeated: boolean;
  strategy: string;
}

// v4.0 — Bosses reais baseados nas dívidas atuais do Gabriel
const initialBosses: Boss[] = [
  {
    id: "iptu",
    name: "GOLEM DO IPTU",
    description: "Impostos municipais em aberto há +1 ano",
    lore: "O Golem mais pesado da masmorra. Ignorá-lo virou rotina, mas ele cresce silencioso.",
    totalHp: 12000,
    currentHp: 12000,
    priority: "critical",
    defeated: false,
    strategy: "Acordo com entrada mínima. O leiloeiro ainda não bateu. Negocia ASSIM QUE tiver R$.",
  },
  {
    id: "aguaeluz",
    name: "SENHOR DAS CONTAS",
    description: "Sabesp + Enel — +1 ano sem pagar",
    lore: "Água e luz ainda fluem por milagre. O Senhor é paciente, mas não eterno.",
    totalHp: 3200,
    currentHp: 3200,
    priority: "high",
    defeated: false,
    strategy: "Parcelamento com a Enel. Sabesp também permite acordo. Prioridade após primeiro R$.",
  },
  {
    id: "serasa",
    name: "DRAGÃO DO LIMPA-NOME",
    description: "Serasa: bancos + dívidas → nome sujo",
    lore: "Bloqueia acesso a crédito, contas e cartões. Derrota parcial = cartão físico desbloqueado.",
    totalHp: 5000,
    currentHp: 5000,
    priority: "high",
    defeated: false,
    strategy: "Feirão Limpa Nome. Negociar com desconto (~60-80% off). Prioridade para acesso bancário.",
  },
  {
    id: "financiamento",
    name: "ESPECTRO DO CDHU",
    description: "Financiamento habitacional restante",
    lore: "O Castelo não é completamente seu enquanto este espectro existir. Mas tem prazo.",
    totalHp: 5000,
    currentHp: 5000,
    priority: "medium",
    defeated: false,
    strategy: "Quitar de uma vez com sobra do faturamento. Libera o imóvel definitivamente.",
  },
];

const priorityConfig: Record<string, { color: string; label: string; hpColor: string }> = {
  critical: { color: "text-red-500", label: "CRÍTICO", hpColor: "bg-red-500" },
  high: { color: "text-orange-400", label: "ALTO", hpColor: "bg-orange-400" },
  medium: { color: "text-yellow-400", label: "MÉDIO", hpColor: "bg-yellow-400" },
  low: { color: "text-blue-400", label: "BAIXO", hpColor: "bg-blue-400" },
};

export function BossRoom() {
  const [bosses, setBosses] = useState<Boss[]>(initialBosses);
  const [expandedBoss, setExpandedBoss] = useState<string | null>(null);
  const [attackAmount, setAttackAmount] = useState(500);

  const totalDebt = bosses.reduce((acc, b) => acc + b.currentHp, 0);
  const totalPaid = bosses.reduce((acc, b) => acc + (b.totalHp - b.currentHp), 0);

  const attackBoss = async (bossId: string, amount: number) => {
    let bossName = "";
    setBosses(prev => prev.map(boss => {
      if (boss.id === bossId) {
        const newHp = Math.max(0, boss.currentHp - amount);
        bossName = boss.name;
        return { ...boss, currentHp: newHp, defeated: newHp === 0 };
      }
      return boss;
    }));

    // Persist payment event
    await supabase.from("kairos_events").insert({
      event_type: "boss_attacked",
      agent_id: "gabriel-os",
      machine: "pgt-ui",
      payload: { bossId, bossName, amount, timestamp: new Date().toISOString() },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl text-secondary glow-gold flex items-center gap-3">
            <Skull className="w-8 h-8" />
            The Boss Room
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Derrote seus inimigos financeiros — cada R$ é dano real
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="glass-card px-4 py-2 text-center">
            <p className="text-xs text-muted-foreground">Total em Aberto</p>
            <p className="font-mono text-xl text-destructive">R$ {totalDebt.toLocaleString("pt-BR")}</p>
          </div>
          {totalPaid > 0 && (
            <div className="glass-card-gold px-4 py-2 text-center">
              <p className="text-xs text-muted-foreground">Total Pago</p>
              <p className="font-mono text-xl text-secondary">R$ {totalPaid.toLocaleString("pt-BR")}</p>
            </div>
          )}
        </div>
      </div>

      {/* Boss Grid */}
      <div className="grid grid-cols-2 gap-6">
        {bosses.map((boss, index) => {
          const hpPercentage = (boss.currentHp / boss.totalHp) * 100;
          const isExpanded = expandedBoss === boss.id;
          const prio = priorityConfig[boss.priority];

          return (
            <div
              key={boss.id}
              className={cn(
                "boss-card transition-all duration-500 animate-fade-in",
                boss.defeated && "opacity-50 grayscale"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Boss Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    boss.defeated ? "bg-secondary/20" : "bg-destructive/20"
                  )}>
                    {boss.defeated ? (
                      <Crown className="w-6 h-6 text-secondary animate-float" />
                    ) : (
                      <Skull className={cn("w-6 h-6", prio.color)} />
                    )}
                  </div>
                  <div>
                    <h3 className={cn(
                      "font-serif text-lg leading-tight",
                      boss.defeated ? "text-secondary line-through" : "text-foreground"
                    )}>
                      {boss.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">{boss.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Shield className={cn("w-4 h-4", prio.color)} />
                  <span className={cn("text-xs font-mono uppercase", prio.color)}>{prio.label}</span>
                </div>
              </div>

              {/* Lore */}
              <p className="text-xs text-muted-foreground italic mb-3 border-l-2 border-muted pl-2">
                {boss.lore}
              </p>

              {/* HP Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground text-xs">HP</span>
                  <span className={cn("font-mono text-xs", boss.defeated ? "text-secondary" : "text-destructive")}>
                    R$ {boss.currentHp.toLocaleString("pt-BR")} / R$ {boss.totalHp.toLocaleString("pt-BR")}
                  </span>
                </div>
                <div className="progress-bar h-3">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      boss.defeated ? "bg-secondary" : prio.hpColor
                    )}
                    style={{ width: `${hpPercentage}%` }}
                  />
                </div>
              </div>

              {/* Strategy */}
              <div className="mb-3 px-3 py-2 bg-muted/20 rounded-lg">
                <p className="text-xs text-muted-foreground"><span className="text-primary font-mono">ESTRATÉGIA:</span> {boss.strategy}</p>
              </div>

              {/* Attack Controls */}
              {!boss.defeated && (
                <>
                  <button
                    onClick={() => setExpandedBoss(isExpanded ? null : boss.id)}
                    className="w-full flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Swords className="w-4 h-4" />
                    Registrar Pagamento
                    <ChevronDown className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-180")} />
                  </button>

                  {isExpanded && (
                    <div className="mt-3 p-4 bg-muted/30 rounded-lg animate-fade-in">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setAttackAmount(a => Math.max(50, a - 50))}
                          className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <div className="flex-1 text-center">
                          <span className="font-mono text-xl">R$ {attackAmount.toLocaleString("pt-BR")}</span>
                        </div>
                        <button
                          onClick={() => setAttackAmount(a => a + 50)}
                          className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => attackBoss(boss.id, attackAmount)}
                        className="w-full mt-3 py-3 rounded-lg bg-destructive hover:bg-destructive/80 transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        <Swords className="w-5 h-5" />
                        ATACAR! (-R$ {attackAmount.toLocaleString("pt-BR")})
                      </button>
                    </div>
                  )}
                </>
              )}

              {boss.defeated && (
                <div className="text-center py-4">
                  <p className="text-secondary font-serif text-lg glow-gold">✦ DERROTADO ✦</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
