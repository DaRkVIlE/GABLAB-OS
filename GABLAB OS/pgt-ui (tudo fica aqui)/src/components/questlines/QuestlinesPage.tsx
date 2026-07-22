import { useState, useEffect } from "react";
import { Scroll, ChevronDown, ChevronUp, Trophy, Swords, Sparkles, Crown, Home, FileText, Smartphone, CheckSquare, Circle, Clock, AlertCircle, Dumbbell, Mic, Globe, Store } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuestStep {
  id: string;
  title: string;
  xpReward: number;
  done: boolean;
  deadline?: string;
}

interface Questline {
  id: string;
  name: string;
  description: string;
  lore: string;
  category: "main" | "side" | "castle" | "life";
  priority: "P0" | "P1" | "P2";
  progress: number;
  totalSteps: number;
  icon: typeof Trophy;
  active: boolean;
  steps: QuestStep[];
  reward: string;
  deadline?: string;
}

const allQuestlines: Questline[] = [
  {
    id: "experia",
    name: "⚔️ Experia Empire",
    description: "Fechar 4-5 clientes locais com free tier → MRR R$3K (T1)",
    lore: "O sonho que se torna empresa. A empresa que resolve tudo. Cada cliente fechado é um chefão abatido.",
    category: "main",
    priority: "P0",
    progress: 0,
    totalSteps: 6,
    icon: Trophy,
    active: true,
    reward: "R$3K MRR → Boss do IPTU começa a sangrar",
    deadline: "Jun/2026 (Temporada 1)",
    steps: [
      { id: "e1", title: "📄 PRD da Experia — documento fundador", xpReward: 100, done: false, deadline: "Próxima missão 🔵" },
      { id: "e2", title: "🎨 Design System Experia (tokens, cores, tipografia)", xpReward: 80, done: false },
      { id: "e3", title: "🌐 Presença digital: Landing Page v1 + Instagram grade inicial", xpReward: 120, done: false },
      { id: "e4", title: "📸 3 cases locais documentados (permuta ou free tier)", xpReward: 150, done: false, deadline: "15 dias" },
      { id: "e5", title: "📞 Cold calls iniciadas (com cases como credencial)", xpReward: 100, done: false },
      { id: "e6", title: "💰 Primeiro contrato pago assinado", xpReward: 500, done: false },
    ],
  },
  {
    id: "social-proof",
    name: "📸 Operação Prova Social",
    description: "3+ cases locais antes de cold calls — credencial na mão",
    lore: "Sem prova social, é só papo. Com ela, o pitche se vende sozinho.",
    category: "side",
    priority: "P0",
    progress: 0,
    totalSteps: 3,
    icon: Sparkles,
    active: true,
    reward: "Green light para cold calls",
    deadline: "25 de Abril/2026",
    steps: [
      { id: "sp1", title: "Case 1 — Comércio local (dentista, petshop, bazar...)", xpReward: 50, done: false },
      { id: "sp2", title: "Case 2 — Segundo comércio documentado", xpReward: 50, done: false },
      { id: "sp3", title: "Case 3 — Terceiro documentado + métricas reais", xpReward: 50, done: false },
    ],
  },
  {
    id: "masterpumps",
    name: "🏭 Operação Master Pumps",
    description: "Cunhado → RH → proposta formal → R$10K+",
    lore: "A porta para o industrial. Um contrato muda tudo.",
    category: "side",
    priority: "P1",
    progress: 0,
    totalSteps: 4,
    icon: Swords,
    active: true,
    reward: "R$10-18K/mês · VPS · Infraestrutura Experia completa",
    steps: [
      { id: "mp1", title: "Primeira conversa com o cunhado (Avaliação de Desempenho)", xpReward: 30, done: false },
      { id: "mp2", title: "Proposta inicial de Avaliação de Desempenho (80-150 pessoas)", xpReward: 50, done: false },
      { id: "mp3", title: "Reunião com RH + expansão para Admin/Diretoria", xpReward: 80, done: false },
      { id: "mp4", title: "Contrato enterprise assinado (R$10K+)", xpReward: 500, done: false },
    ],
  },
  {
    id: "credito",
    name: "🧹 Resgate do Crédito",
    description: "Limpar Serasa → cartão físico → mobilidade financeira",
    lore: "O Dragão do Limpa-Nome bloqueia a expansão. Derrotá-lo = acesso a crédito.",
    category: "castle",
    priority: "P1",
    progress: 0,
    totalSteps: 3,
    icon: Crown,
    active: true,
    reward: "Cartão físico + acesso a crédito consciente",
    steps: [
      { id: "cr1", title: "Solicitar cartão físico no banco sem dívida ativa", xpReward: 20, done: false, deadline: "AGORA — custo zero" },
      { id: "cr2", title: "Feirão Limpa Nome / negociação Serasa (60-80% off)", xpReward: 80, done: false },
      { id: "cr3", title: "Serasa zerado — nome limpo confirmado", xpReward: 200, done: false },
    ],
  },
  {
    id: "casa",
    name: "🪣 Operação Base Limpa",
    description: "Dedetização, faxina profunda, guarda-roupa, doações",
    lore: "O Castelo não pode ser um campo de batalha sujo. Ambiente limpo = mente clara.",
    category: "life",
    priority: "P1",
    progress: 0,
    totalSteps: 4,
    icon: Home,
    active: true,
    reward: "Ambiente de trabalho e vida mais limpo",
    steps: [
      { id: "ca1", title: "Doação das roupas da mãe para brechós locais", xpReward: 30, done: false, deadline: "Qualquer tarde livre" },
      { id: "ca2", title: "Faxina + dedetização embaixo da pia (baratas)", xpReward: 30, done: false },
      { id: "ca3", title: "Trocar guarda-roupa amarelo pelo marrom do escritório", xpReward: 20, done: false },
      { id: "ca4", title: "Consertar registro do chuveiro", xpReward: 20, done: false },
    ],
  },
  {
    id: "documentos",
    name: "📄 Missão: Documentação",
    description: "2ª via docs pessoais, certidão, mapear docs do apartamento",
    lore: "Sem documentos, sem mobilidade. A burocracia não vai se resolver sozinha.",
    category: "life",
    priority: "P1",
    progress: 0,
    totalSteps: 3,
    icon: FileText,
    active: true,
    reward: "Autonomia documental completa",
    steps: [
      { id: "do1", title: "2ª via de documento de identidade (RG/CNH)", xpReward: 20, done: false },
      { id: "do2", title: "Mapear documentos do apartamento (CDHU, IPTU)", xpReward: 15, done: false },
      { id: "do3", title: "Certidão de nascimento + documentação completa", xpReward: 20, done: false },
    ],
  },
  {
    id: "saude",
    name: "💪 Saúde & Corpo",
    description: "Academia MMA, hipnose, skincare — o corpo como arma",
    lore: "Guerreiro sem corpo forte é intelectual frágil. Disciplina física = disciplina mental.",
    category: "life",
    priority: "P2",
    progress: 0,
    totalSteps: 5,
    icon: Dumbbell,
    active: true,
    reward: "+30% energia diária · Buff de Disciplina permanente",
    steps: [
      { id: "sa1", title: "Rotina de exercícios em casa (30min/dia × 7 dias)", xpReward: 40, done: false },
      { id: "sa2", title: "Skincare básico iniciado (produtos comprados)", xpReward: 20, done: false },
      { id: "sa3", title: "Primeira sessão de auto-hipnose guiada (5min)", xpReward: 30, done: false },
      { id: "sa4", title: "Matrícula na academia MMA (R$250/mês)", xpReward: 80, done: false },
      { id: "sa5", title: "30 dias consecutivos de treino (qualquer modalidade)", xpReward: 200, done: false },
    ],
  },
  {
    id: "voz",
    name: "🎙️ Voz & Canal",
    description: "YouTube / Podcast / Narração — monetizar a arma primária",
    lore: "A voz do Dragonborn não pode ficar calada. Herdada da mãe locutora, refinada pelo KAIROS.",
    category: "side",
    priority: "P2",
    progress: 0,
    totalSteps: 4,
    icon: Mic,
    active: true,
    reward: "Canal ativo + primeiro conteúdo monetizado",
    steps: [
      { id: "vz1", title: "Gravar demo de narração (30s) para portfolio Experia", xpReward: 30, done: false },
      { id: "vz2", title: "Configurar canal YouTube/podcast (nome + branding)", xpReward: 40, done: false },
      { id: "vz3", title: "Publicar primeiro vídeo/episódio", xpReward: 80, done: false },
      { id: "vz4", title: "3 conteúdos publicados com consistência semanal", xpReward: 100, done: false },
    ],
  },
  {
    id: "idiomas",
    name: "🌐 Idiomas via IA",
    description: "Inglês fluente usando método de imersão com IA",
    lore: "Língua é alavancagem. Inglês = acesso ao mercado global. IA é o professor infinito.",
    category: "life",
    priority: "P2",
    progress: 0,
    totalSteps: 4,
    icon: Globe,
    active: true,
    reward: "Inglês intermediário/avançado · Mercado global desbloqueado",
    steps: [
      { id: "id1", title: "Definir método de imersão (AI Tutor + consumo diário)", xpReward: 20, done: false },
      { id: "id2", title: "30min/dia × 14 dias consecutivos de prática", xpReward: 50, done: false },
      { id: "id3", title: "Primeira conversa inteira em inglês (5min+)", xpReward: 80, done: false },
      { id: "id4", title: "Redação de proposta comercial em inglês", xpReward: 100, done: false },
    ],
  },
  {
    id: "felixcell",
    name: "📱 Felix Cell — Assistente de Loja",
    description: "Bot Clone + formulário de orçamento + copys para a loja de celular",
    lore: "O Felix é o segundo caso real. Se funcionar, é mais um case para o portfolio Experia.",
    category: "main",
    priority: "P1",
    progress: 0,
    totalSteps: 4,
    icon: Store,
    active: true,
    reward: "Case #2 documentado · +1 prova social",
    deadline: "Trial 15 dias",
    steps: [
      { id: "fx1", title: "Onboarding: entrevista com dono (capturar voz/FAQ)", xpReward: 40, done: false },
      { id: "fx2", title: "Setup bot clone no WhatsApp (Evolution API)", xpReward: 60, done: false },
      { id: "fx3", title: "Formulário de orçamento automatizado", xpReward: 40, done: false },
      { id: "fx4", title: "3 posts IG + copys gerados e aprovados pelo dono", xpReward: 50, done: false },
    ],
  },
  {
    id: "celular",
    name: "📱 Consertar Celular",
    description: "Display quebrado → levar na casa do avô → tio conserta",
    lore: "Sem celular funcionando = sem internet móvel = sem mobilidade operacional.",
    category: "life",
    priority: "P1",
    progress: 0,
    totalSteps: 2,
    icon: Smartphone,
    active: true,
    reward: "Mobilidade + Internet móvel desbloqueada",
    steps: [
      { id: "ce1", title: "Levar celular na casa do avô / tio arranjar a tela", xpReward: 20, done: false },
      { id: "ce2", title: "Celular funcionando + chip com dados ativado", xpReward: 30, done: false },
    ],
  },
];

const categoryColors: Record<string, string> = {
  main: "border-yellow-500/50 bg-yellow-500/5",
  side: "border-blue-500/30 bg-blue-500/5",
  castle: "border-orange-500/30 bg-orange-500/5",
  life: "border-gray-500/30 bg-gray-500/5",
};

const categoryLabels: Record<string, string> = {
  main: "🏆 MAIN",
  side: "⚔️ SIDE",
  castle: "🏰 CASTELO",
  life: "🧍 VIDA",
};

const priorityColors: Record<string, string> = {
  P0: "text-red-400 border-red-500/30 bg-red-500/10",
  P1: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
  P2: "text-blue-400 border-blue-500/30 bg-blue-500/10",
};

type FilterCat = "all" | "main" | "side" | "castle" | "life";

interface QuestlinesPageProps {
  expandedId?: string | null;
}

export function QuestlinesPage({ expandedId }: QuestlinesPageProps) {
  const [questlines, setQuestlines] = useState<Questline[]>(allQuestlines);
  const [expanded, setExpanded] = useState<string | null>(expandedId ?? null);
  const [filter, setFilter] = useState<FilterCat>("all");

  useEffect(() => {
    if (expandedId) setExpanded(expandedId);
  }, [expandedId]);

  const toggleStep = (questlineId: string, stepId: string) => {
    setQuestlines(prev => prev.map(q => {
      if (q.id !== questlineId) return q;
      const newSteps = q.steps.map(s =>
        s.id === stepId ? { ...s, done: !s.done } : s
      );
      const progress = newSteps.filter(s => s.done).length;
      return { ...q, steps: newSteps, progress };
    }));
  };

  const filtered = questlines.filter(q => q.active && (filter === "all" || q.category === filter));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl text-secondary glow-gold flex items-center gap-3">
            <Scroll className="w-8 h-8" />
            Questlines
          </h2>
          <p className="text-muted-foreground text-sm mt-1">T1-2026 FUNDAÇÃO · Clique para expandir e acompanhar etapas</p>
        </div>
        <div className="text-xs font-mono text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 px-3 py-2 rounded">
          {questlines.filter(q => q.priority === "P0").length} quests P0 ativas
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "main", "side", "castle", "life"] as FilterCat[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1 rounded text-xs font-mono uppercase transition-all",
              filter === f
                ? "bg-primary/20 border border-primary/50 text-primary"
                : "bg-muted/30 text-muted-foreground hover:text-foreground"
            )}
          >
            {f === "all" ? "Todos" : categoryLabels[f]}
          </button>
        ))}
      </div>

      {/* Questlines */}
      <div className="space-y-3">
        {filtered.map(questline => {
          const Icon = questline.icon;
          const isExpanded = expanded === questline.id;
          const progressPct = questline.totalSteps > 0
            ? (questline.progress / questline.totalSteps) * 100 : 0;

          return (
            <div
              key={questline.id}
              className={cn("rounded-xl border transition-all duration-300", categoryColors[questline.category])}
            >
              {/* Header row — always visible */}
              <button
                onClick={() => setExpanded(isExpanded ? null : questline.id)}
                className="w-full p-4 flex items-center gap-4 text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-secondary" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{questline.name}</h3>
                    <span className={cn("text-xs font-mono px-2 py-0.5 rounded border", priorityColors[questline.priority])}>
                      {questline.priority}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground bg-muted/30 px-2 py-0.5 rounded">
                      {categoryLabels[questline.category]}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{questline.description}</p>

                  {/* Progress bar */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-secondary rounded-full transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">
                      {questline.progress}/{questline.totalSteps}
                    </span>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Expanded detail panel */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-border/50 animate-fade-in">
                  {/* Lore */}
                  <p className="text-xs text-muted-foreground italic mt-4 mb-4 border-l-2 border-muted pl-3">
                    {questline.lore}
                  </p>

                  {/* Deadline + Reward */}
                  <div className="flex gap-3 mb-4 flex-wrap">
                    {questline.deadline && (
                      <div className="flex items-center gap-1 text-xs text-orange-400">
                        <Clock className="w-3 h-3" />
                        {questline.deadline}
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-xs text-secondary">
                      <Trophy className="w-3 h-3" />
                      {questline.reward}
                    </div>
                  </div>

                  {/* Steps checklist */}
                  <div className="space-y-2">
                    <div className="text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">Etapas</div>
                    {questline.steps.map((step, i) => (
                      <button
                        key={step.id}
                        onClick={() => toggleStep(questline.id, step.id)}
                        className={cn(
                          "w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all",
                          step.done
                            ? "bg-secondary/10 border-secondary/30"
                            : "bg-muted/20 border-border hover:border-primary/30"
                        )}
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          {step.done ? (
                            <CheckSquare className="w-4 h-4 text-secondary" />
                          ) : (
                            <Circle className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={cn(
                            "text-sm",
                            step.done && "line-through text-muted-foreground"
                          )}>
                            {step.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-neon-purple font-mono">+{step.xpReward} XP</span>
                            {step.deadline && (
                              <span className="text-xs text-orange-400 font-mono">
                                <AlertCircle className="w-3 h-3 inline mr-0.5" />
                                {step.deadline}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs font-mono text-muted-foreground flex-shrink-0 mt-0.5">
                          #{i + 1}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
