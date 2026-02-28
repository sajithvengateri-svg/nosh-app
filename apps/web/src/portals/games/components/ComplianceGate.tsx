import { Thermometer, ClipboardList, Trash2, Lock, Unlock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ComplianceGateProps {
  progress: { temps: boolean; prep: boolean; wastage: boolean };
  isUnlocked: boolean;
}

const TASKS = [
  { key: "temps" as const, label: "Temps Logged", icon: Thermometer },
  { key: "prep" as const, label: "Prep Done", icon: ClipboardList },
  { key: "wastage" as const, label: "Wastage Checked", icon: Trash2 },
];

export default function ComplianceGate({ progress, isUnlocked }: ComplianceGateProps) {
  const doneCount = TASKS.filter((t) => progress[t.key]).length;
  const pct = Math.round((doneCount / TASKS.length) * 100);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
          Daily Compliance
        </h3>
        {isUnlocked ? (
          <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
            <Unlock className="w-3.5 h-3.5" /> Unlocked
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-zinc-500 font-medium">
            <Lock className="w-3.5 h-3.5" /> {doneCount}/{TASKS.length}
          </span>
        )}
      </div>

      <Progress value={pct} className="h-2 bg-zinc-800 [&>div]:bg-emerald-500" />

      <div className="flex gap-2">
        {TASKS.map(({ key, label, icon: Icon }) => {
          const done = progress[key];
          return (
            <div
              key={key}
              className={cn(
                "flex-1 flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium border transition-colors",
                done
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-zinc-700 bg-zinc-800/50 text-zinc-500"
              )}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
