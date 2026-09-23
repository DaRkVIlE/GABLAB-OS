import { useState, useEffect } from "react";
import { Shield, Brain, Heart, Wallet, Target, Activity, Zap, Coins, Star, Swords, Flame, Droplet, Sparkles, Compass, Eye, CheckCircle2, Quote } from "lucide-react";
import { useSharedBrain } from "@/hooks/useSharedBrain";
import { cn } from "@/lib/utils";
import * as api from "@/lib/gameApi";
import type { RpgAttribute } from "@/lib/gameApi";

const IconMap: Record<string, any> = {
  Brain, Heart, Wallet, Target, Activity, Zap, Coins, Star, Shield, Swords, Flame, Sparkles, Drop: Droplet
};

const santaTriade = [
  {
    id: "corpo",
    label: "Corpo (Saúde & Estética)",
    sub: "Saúde · Estética · Autocuidado · Alimentação · Treino",
    score: 85,
    icon: Heart,
    color: "text-red-400",
    bg: "bg-red-400"
  },
  {
    id: "mente",
    label: "Mente (Foco & Autocontrole)",
    sub: "Autocontrole · Metacognição · Foco Laser · Disciplina",
    score: 80,
    icon: Brain,
    color: "text-blue-400",
    bg: "bg-blue-400"
  },
  {
    id: "espirito",
    label: "Espírito (Alinhamento & Fé)",
    sub: "Gratidão Diária · Velas Acesas · Padê · Orações · Boas Vibrações",
    score: 90,
    icon: Sparkles,
    color: "text-purple-400",
    bg: "bg-purple-400"
  },
  {
    id: "financas",
    label: "Finanças & Gastronomia",
    sub: "Salário Fixo · Freelas Experia · Aulas de Inglês AIDA",
    score: 75,
    icon: Wallet,
    color: "text-green-400",
    bg: "bg-green-400"
  },
];

const traits = [
  { name: "Autocontrole", desc: "Domínio sobre impulsos e gratificação adiada", icon: "🛡️" },
  { name: "Disciplina", desc: "Execução inabalável independente da motivação", icon: "⚔️" },
  { name: "Organização", desc: "Ordem impecável no Castelo e nos arquivos", icon: "📐" },
  { name: "Planejamento", desc: "Visão estratégica do dia, mês e temporada", icon: "🗺️" },
  { name: "Presença", desc: "Atenção total no aqui e agora (praça ou tela)", icon: "👁️" },
  { name: "Intenção", desc: "Todo ato tem um propósito claro e deliberado", icon: "🎯" },
  { name: "Foco Laser", desc: "Imunidade a distrações e ruídos externos", icon: "⚡" },
  { name: "Metacognição", desc: "Clareza mental e auto-observação contínua", icon: "🧠" },
];

export function CharSheetPage() {
  const { skyrosScore, level, xp, streak, focoGems } = useSharedBrain();
  const [attributes, setAttributes] = useState<RpgAttribute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAttrs() {
      setLoading(true);
      const data = await api.getAttributes();
      setAttributes(data);
      setLoading(false);
    }
    fetchAttrs();
  }, []);

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-6 border-b border-border/50 pb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-xl border-2 border-primary/50 bg-muted/20 flex items-center justify-center overflow-hidden">
              <Shield className="w-10 h-10 text-primary opacity-70" />
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent" />
            </div>
            <div className="absolute -bottom-3 -right-3 bg-background border-2 border-primary text-primary font-mono font-bold text-xs px-2 py-0.5 rounded shadow-[0_0_10px_rgba(201,168,76,0.3)]">
              LVL {level}
            </div>
          </div>
          <div>
            <h2 className="font-serif text-3xl text-primary glow-cyan uppercase tracking-wider">
              Gabe · LIFELAB OS
            </h2>
            <p className="text-muted-foreground font-mono text-sm mt-1">
              Protagonista · Santa Tríade & IA Ops · {xp} XP · 🔥 {streak}d streak
            </p>
          </div>
        </div>

        <div className="md:ml-auto text-left md:text-right flex md:flex-col justify-between items-center md:items-end">
          <div>
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              Life Score Global
            </div>
            <div className="text-4xl md:text-5xl font-display text-primary glow-cyan">
              {skyrosScore}
            </div>
          </div>
          <div className="text-xs text-cyan-400 font-mono mt-1">
            {focoGems} 💎 Gemas de Foco
          </div>
        </div>
      </div>

      {/* Afirmação do Protagonista & Mindset */}
      <div className="glass-card p-6 border-primary/30 relative overflow-hidden bg-gradient-to-r from-primary/5 via-transparent to-primary/5">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <Quote className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-primary/20 text-primary uppercase">
                Afirmação Diária do Protagonista
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                Batman Alter Ego · Lei da Atração · Meta-Perspectiva
              </span>
            </div>
            <p className="text-foreground font-serif text-base italic leading-relaxed">
              "Eu sou único. Minha disciplina molda minha realidade. Minha mente governa meu corpo. 
              Meu espírito sustenta minha vitória. Não há espaço para o devaneio quando o propósito está traçado."
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Santa Tríade & Dimensões de Vida */}
        <div className="glass-card p-6 border-primary/20">
          <h3 className="font-serif text-xl mb-2 text-foreground flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Santa Tríade & Pilares
          </h3>
          <p className="text-xs text-muted-foreground mb-6 font-mono">
            Equilíbrio sagrado entre fisiologia, intelecto e espiritualidade
          </p>

          <div className="space-y-6">
            {santaTriade.map(dim => (
              <div key={dim.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <dim.icon className={cn("w-4 h-4", dim.color)} />
                    <span className="font-mono text-sm font-semibold uppercase">{dim.label}</span>
                  </div>
                  <span className={cn("font-bold font-mono text-sm", dim.color)}>{dim.score}/100</span>
                </div>
                <p className="text-[11px] text-muted-foreground font-mono">{dim.sub}</p>
                <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-1000", dim.bg)}
                    style={{ width: `${dim.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Atributos do Sistema Supabase */}
        <div className="glass-card p-6 border-blue-500/20">
          <h3 className="font-serif text-xl mb-2 text-blue-400 flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Atributos Dinâmicos
          </h3>
          <p className="text-xs text-muted-foreground mb-6 font-mono">
            Pools de energia e estatísticas em tempo real
          </p>

          <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
            {loading ? (
              <div className="text-muted-foreground text-sm">Carregando atributos...</div>
            ) : attributes.length === 0 ? (
              <div className="text-muted-foreground text-sm italic">
                Nenhum atributo ativo no momento.
              </div>
            ) : (
              attributes.map(attr => {
                const IconComponent = IconMap[attr.icon] || Star;
                return (
                  <div key={attr.id} className="flex flex-col p-3 rounded-lg border border-border/50 bg-muted/10">
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn("font-mono font-medium text-sm flex items-center gap-2", attr.color)}>
                        <IconComponent className="w-4 h-4" />
                        {attr.name}
                      </span>
                      <span className="font-bold text-base font-mono">
                        {attr.value}{attr.max_value ? ` / ${attr.max_value}` : ""}
                      </span>
                    </div>
                    {attr.type === "pool" && attr.max_value && (
                      <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden mt-1.5">
                        <div
                          className={cn("h-full rounded-full transition-all duration-500", attr.color.replace('text-', 'bg-'))}
                          style={{ width: `${(attr.value / attr.max_value) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Traços de Maestria (8 Traços) */}
      <div className="glass-card p-6 border-border/50">
        <h3 className="font-serif text-xl mb-2 text-foreground flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-400" />
          Traços de Maestria Mental & Comportamento
        </h3>
        <p className="text-xs text-muted-foreground mb-6 font-mono">
          Os 8 pilares comportamentais que governam a execução diária de Gabe
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {traits.map((trait, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-border/40 bg-muted/10 hover:border-primary/40 transition-all">
              <div className="text-2xl mb-2">{trait.icon}</div>
              <h4 className="font-serif text-sm font-semibold text-foreground mb-1">{trait.name}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{trait.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

