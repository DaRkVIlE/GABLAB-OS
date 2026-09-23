import { Wallet, TrendingUp, TrendingDown, Target, Skull, CheckCircle2 } from "lucide-react";
import { useSharedBrain } from "@/hooks/useSharedBrain";
import { cn } from "@/lib/utils";

const debts = [
  { id: 1, name: "Cartão Nubank", amount: 1500, priority: "P0", status: "pending" },
  { id: 2, name: "Empréstimo BB", amount: 8000, priority: "P1", status: "pending" },
  { id: 3, name: "Equipamento", amount: 450, priority: "P2", status: "paid" },
];

export function FinancesPage() {
  const brain = useSharedBrain();
  const { realCoins, revenueGoal, revenueProgress } = brain;
  
  const totalDebt = debts.filter(d => d.status === "pending").reduce((acc, d) => acc + d.amount, 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <Wallet className="w-8 h-8 text-green-400" />
        <div>
          <h2 className="font-display text-3xl text-green-400 uppercase tracking-wide glow-cyan">
            Finances & War Chest
          </h2>
          <p className="text-muted-foreground font-mono text-sm">
            Cashflow, Debt Burning & Empire Building
          </p>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-6 border-green-500/20 bg-green-500/5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <span className="text-sm font-mono text-green-400 uppercase">Receita Líquida</span>
          </div>
          <div className="text-3xl font-display text-foreground">
            R$ {realCoins.toLocaleString("pt-BR")}
          </div>
        </div>

        <div className="glass-card p-6 border-red-500/20 bg-red-500/5">
          <div className="flex items-center gap-2 mb-2">
            <Skull className="w-5 h-5 text-red-400" />
            <span className="text-sm font-mono text-red-400 uppercase">Dívida Ativa</span>
          </div>
          <div className="text-3xl font-display text-foreground">
            R$ {totalDebt.toLocaleString("pt-BR")}
          </div>
        </div>

        <div className="glass-card p-6 border-blue-500/20 bg-blue-500/5">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-mono text-blue-400 uppercase">Meta da Season</span>
          </div>
          <div className="text-3xl font-display text-foreground">
            R$ {revenueGoal.toLocaleString("pt-BR")}
          </div>
        </div>
      </div>

      {/* Revenue Progress */}
      <div className="glass-card p-6 mt-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Progresso da Meta (R$ 30k)</span>
          <span className="text-xs font-mono text-primary">
            {Math.round(revenueProgress)}%
          </span>
        </div>
        <div className="h-3 w-full bg-muted/20 rounded-full overflow-hidden border border-border/30">
          <div
            className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-1000 ease-out rounded-full"
            style={{ width: `${revenueProgress}%` }}
          />
        </div>
      </div>

      {/* Debt Burn Tracker */}
      <div className="glass-card p-6 border-red-500/10">
        <div className="flex items-center gap-2 mb-6">
          <TrendingDown className="w-5 h-5 text-red-400" />
          <h3 className="font-display text-xl text-red-400 uppercase tracking-wide">Debt Burn Tracker</h3>
        </div>

        <div className="space-y-3">
          {debts.map(debt => (
            <div 
              key={debt.id}
              className={cn(
                "flex items-center justify-between p-4 rounded-xl border transition-all",
                debt.status === "paid" 
                  ? "bg-green-500/5 border-green-500/20 opacity-60 grayscale" 
                  : "bg-red-500/5 border-red-500/20 hover:border-red-500/40"
              )}
            >
              <div className="flex items-center gap-4">
                {debt.status === "paid" ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-red-500/50 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-red-500/50 animate-pulse" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[10px] font-mono px-2 py-0.5 rounded border",
                      debt.priority === "P0" ? "text-red-400 border-red-500/40 bg-red-500/10" :
                      debt.priority === "P1" ? "text-orange-400 border-orange-500/40 bg-orange-500/10" :
                      "text-yellow-400 border-yellow-500/40 bg-yellow-500/10"
                    )}>
                      {debt.priority}
                    </span>
                    <span className={cn("font-medium", debt.status === "paid" ? "line-through text-muted-foreground" : "text-foreground")}>
                      {debt.name}
                    </span>
                  </div>
                </div>
              </div>
              <div className={cn("font-mono font-bold", debt.status === "paid" ? "text-muted-foreground" : "text-red-400")}>
                R$ {debt.amount.toLocaleString("pt-BR")}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
