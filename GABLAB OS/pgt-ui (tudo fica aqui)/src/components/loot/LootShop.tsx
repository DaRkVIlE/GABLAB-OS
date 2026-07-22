import { Lock, Unlock, ShoppingBag, Gem, Calculator, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import * as api from "@/lib/gameApi";
import type { RpgLootItem } from "@/lib/gameApi";
import * as LucideIcons from "lucide-react";

const IconMap: Record<string, any> = LucideIcons as any;
function DynIcon({ name, className }: { name: string; className?: string }) {
  const Icon = IconMap[name] || LucideIcons.Gem;
  return <Icon className={className} />;
}

const categoryColors: Record<string, string> = {
  work:     "from-blue-500/20 to-blue-600/5",
  castle:   "from-orange-500/20 to-orange-600/5",
  personal: "from-purple-500/20 to-purple-600/5",
  dopamine: "from-red-500/10 to-red-600/5",
  utility:  "from-green-500/20 to-green-600/5",
};
const categoryLabels: Record<string, string> = {
  work: "⚙️ Trabalho", castle: "🏠 Castelo", personal: "🧍 Pessoal",
  dopamine: "🔥 Dopamina", utility: "🔧 Utilidade",
};
const currencyColors: Record<string, string> = {
  REAL: "text-green-400", GEMS: "text-blue-400", SEEDS: "text-yellow-400", XP: "text-purple-400",
};

type FilterCat = "all" | "work" | "castle" | "personal" | "dopamine" | "utility";

export function LootShop() {
  const [items, setItems] = useState<RpgLootItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterCat>("all");
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [calcPrice, setCalcPrice] = useState<string>("");
  const [calcStock, setCalcStock] = useState<string>("1");
  const [calcType, setCalcType] = useState<number>(0.5);

  const load = async () => { setLoading(true); setItems(await api.getLootItems()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const handleToggleUnlock = async (item: RpgLootItem) => {
    setUnlocking(item.id);
    await api.updateLootItem(item.id, { unlocked: !item.unlocked });
    await load();
    setUnlocking(null);
  };

  const calculateRP = () => {
    const price = parseFloat(calcPrice || "0");
    const stock = parseInt(calcStock || "1") || 1;
    if (price <= 0) return 0;
    return Math.ceil((Math.ceil(price / 10) * 10 * calcType) / stock);
  };

  const filtered = items.filter(i => filter === "all" || i.category === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <h2 className="font-serif text-2xl text-secondary glow-gold flex items-center gap-3">
            <ShoppingBag className="w-8 h-8" />Arsenal de Recompensas
          </h2>
          <p className="text-muted-foreground text-sm mt-1">Cada item custa realização — não dinheiro fácil</p>
          <div className="flex gap-3 flex-wrap mt-4">
            {Object.entries(currencyColors).map(([cur, color]) => (
              <div key={cur} className="flex items-center gap-1 text-xs font-mono">
                <Gem className={cn("w-3 h-3", color)} /><span className={color}>{cur}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-card p-4 border-yellow-500/20 md:max-w-[400px] w-full">
          <h3 className="text-xs font-mono text-yellow-400 mb-3 flex items-center gap-2">
            <Calculator className="w-4 h-4" /> Calculadora de Precificação (RP Pricer)
          </h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-[10px] uppercase text-muted-foreground mb-1">Custo Real (R$)</label>
              <input type="number" min={0} placeholder="Ex: 399.99"
                className="w-full bg-background border border-border rounded px-2 py-1 text-sm outline-none"
                value={calcPrice} onChange={e => setCalcPrice(e.target.value)} />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-muted-foreground mb-1">Estoque</label>
              <input type="number" min={1}
                className="w-full bg-background border border-border rounded px-2 py-1 text-sm outline-none"
                value={calcStock} onChange={e => setCalcStock(e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] uppercase text-muted-foreground mb-1">Tipologia</label>
              <select className="w-full bg-background border border-border rounded px-2 py-1 text-sm outline-none"
                value={calcType} onChange={e => setCalcType(Number(e.target.value))}>
                <option value={0.5}>Tipo I (Útil, Não distrai) — 0.5x</option>
                <option value={1.0}>Tipo II (Útil, Distrai) — 1.0x</option>
                <option value={1.0}>Tipo III (Inútil, Não distrai) — 1.0x</option>
                <option value={2.0}>Tipo IV (Inútil, Distrai muito) — 2.0x</option>
              </select>
            </div>
          </div>
          <div className="bg-background/50 rounded p-2 text-center border border-border/50">
            <span className="block text-[10px] uppercase text-muted-foreground">Preço Justo (Unitário)</span>
            <span className="font-mono text-xl text-cyan-400 font-bold">{calculateRP()} GEMS</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["all","work","castle","personal","dopamine","utility"] as FilterCat[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn("px-3 py-1 rounded-lg text-xs font-mono transition-all",
              filter === f ? "bg-primary/20 border border-primary/50 text-primary" : "bg-muted/50 hover:bg-muted text-muted-foreground")}>
            {f === "all" ? "Todos" : categoryLabels[f]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" />Carregando arsenal...
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.length === 0 && <p className="text-sm text-muted-foreground col-span-3">Nenhum item nesta categoria.</p>}
          {filtered.map((item, index) => (
            <div key={item.id}
              className={cn("relative overflow-hidden rounded-xl border transition-all duration-300 animate-fade-in",
                item.unlocked ? "loot-item-unlocked cursor-pointer hover:scale-[1.02]" : "loot-item-locked")}
              style={{ animationDelay: `${index * 60}ms` }}>
              <div className={cn("absolute inset-0 bg-gradient-to-br", categoryColors[item.category])} />
              <div className="relative p-5">
                <div className="absolute top-3 right-3">
                  {item.unlocked ? <Unlock className="w-4 h-4 text-secondary" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
                </div>
                <div className="w-12 h-12 rounded-xl bg-card/80 flex items-center justify-center mb-3 mx-auto">
                  <DynIcon name={item.icon} className={cn("w-6 h-6", item.unlocked ? "text-secondary" : "text-muted-foreground")} />
                </div>
                <div className="flex justify-center mb-2">
                  <span className="text-xs font-mono bg-muted/50 px-2 py-0.5 rounded">TIER {item.tier}</span>
                </div>
                <h3 className={cn("font-serif text-sm text-center mb-1 leading-tight", item.unlocked ? "text-foreground" : "text-muted-foreground")}>
                  {item.name}
                </h3>
                <p className="text-xs text-muted-foreground text-center mb-3 leading-relaxed">{item.description}</p>
                <div className="text-center mb-3">
                  <span className={cn("font-mono text-lg font-bold", currencyColors[item.currency])}>
                    {item.cost.toLocaleString("pt-BR")} {item.currency}
                  </span>
                </div>
                {item.requirement && (
                  <div className="px-2 py-2 bg-muted/50 rounded-lg mb-3">
                    <p className="text-xs text-muted-foreground text-center leading-relaxed">{item.requirement}</p>
                  </div>
                )}
                <button onClick={() => handleToggleUnlock(item)} disabled={unlocking === item.id}
                  className={cn("w-full py-2 rounded-lg font-medium text-sm transition-colors",
                    item.unlocked ? "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted")}>
                  {unlocking === item.id
                    ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" />
                    : item.unlocked ? "✅ Resgatar" : "🔒 Bloqueado"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
