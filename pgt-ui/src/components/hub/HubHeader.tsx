import { useState, useEffect } from "react";
import { Clock, Cpu, ArrowLeft, Flame, Shield } from "lucide-react";
import { useSharedBrain } from "@/hooks/useSharedBrain";
import { useKAIROS } from "@/hooks/useKAIROS";
import { cn } from "@/lib/utils";

interface HubHeaderProps {
  activeSection: string;
  onBack: () => void;
  sectionLabel?: string;
}

export function HubHeader({ activeSection, onBack, sectionLabel }: HubHeaderProps) {
  const [time, setTime] = useState(new Date());
  const { xp, streak, focoGems, realCoins, level } = useSharedBrain();
  const kairos = useKAIROS(60000);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isHub = activeSection === "hub";

  const seasonStart = new Date("2026-04-10");
  const seasonDay = Math.max(1, Math.floor((Date.now() - seasonStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  return (
    <header className="hub-header">
      {/* Left: Back + Title or Logo */}
      <div className="flex items-center gap-3">
        {!isHub ? (
          <button onClick={onBack} className="section-back">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Hub</span>
          </button>
        ) : (
          <Cpu className="w-4 h-4 text-primary" />
        )}
        <div className="flex items-center gap-2">
          <span className="font-display text-sm text-primary tracking-wider uppercase">
            {isHub ? "Gabriel OS" : sectionLabel ?? activeSection}
          </span>
          <span className="text-[9px] font-mono text-muted-foreground">
            LVL {level} · T1 · D{seasonDay}
          </span>
        </div>
      </div>

      {/* Right: Clock + Mode */}
      <div className="flex items-center gap-3">
        {kairos.isolationActive && (
          <span className="text-[9px] font-mono text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">
            🔴 ISOLATION
          </span>
        )}
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-primary" />
          <span className="font-mono text-sm text-primary glow-cyan">
            {time.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>
    </header>
  );
}
