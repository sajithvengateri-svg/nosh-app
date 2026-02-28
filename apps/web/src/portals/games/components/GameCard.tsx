import { useNavigate } from "react-router-dom";
import { Lock, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface GameCardProps {
  title: string;
  subtitle: string;
  route: string;
  icon: React.ReactNode;
  isUnlocked: boolean;
  isComingSoon?: boolean;
  accentColor?: string;
}

export default function GameCard({
  title,
  subtitle,
  route,
  icon,
  isUnlocked,
  isComingSoon = false,
  accentColor = "emerald",
}: GameCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (isUnlocked && !isComingSoon) {
      navigate(route);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={!isUnlocked || isComingSoon}
      className={cn(
        "relative flex flex-col items-center justify-center gap-2 rounded-2xl p-6 min-h-[140px] border-2 transition-all touch-manipulation",
        isComingSoon
          ? "border-zinc-800 bg-zinc-900/30 text-zinc-600 cursor-default"
          : isUnlocked
          ? `border-${accentColor}-500/30 bg-zinc-900 hover:bg-zinc-800 hover:border-${accentColor}-500/60 active:scale-95 cursor-pointer text-white`
          : "border-zinc-800 bg-zinc-900/50 text-zinc-600 cursor-not-allowed"
      )}
    >
      {/* Lock / Coming Soon overlay */}
      {isComingSoon && (
        <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] text-zinc-600 font-medium">
          <Clock className="w-3 h-3" /> Soon
        </div>
      )}
      {!isComingSoon && !isUnlocked && (
        <div className="absolute top-2 right-2">
          <Lock className="w-4 h-4 text-zinc-600" />
        </div>
      )}

      {/* Icon */}
      <div
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center",
          isComingSoon
            ? "bg-zinc-800 text-zinc-600"
            : isUnlocked
            ? `bg-${accentColor}-500/20 text-${accentColor}-400`
            : "bg-zinc-800 text-zinc-600"
        )}
      >
        {icon}
      </div>

      {/* Text */}
      <div className="text-center">
        <div className="font-bold text-sm">{title}</div>
        <div className="text-[11px] text-zinc-500 mt-0.5">{subtitle}</div>
      </div>
    </button>
  );
}
