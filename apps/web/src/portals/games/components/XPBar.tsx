import { Progress } from "@/components/ui/progress";
import { getLevelForXP, getLevelProgress, getNextLevelXP } from "../data/levels";

interface XPBarProps {
  xp: number;
}

export default function XPBar({ xp }: XPBarProps) {
  const level = getLevelForXP(xp);
  const progress = getLevelProgress(xp);
  const nextXP = getNextLevelXP(xp);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold" style={{ color: level.color }}>
          {level.title}
        </span>
        <span className="text-zinc-500">
          {nextXP !== null ? `${xp} / ${nextXP} XP` : `${xp} XP (MAX)`}
        </span>
      </div>
      <Progress
        value={progress}
        className="h-1.5 bg-zinc-800"
        style={{ ["--progress-color" as string]: level.color }}
      />
    </div>
  );
}
