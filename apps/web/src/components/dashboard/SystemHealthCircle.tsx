import { useOrg } from "@/contexts/OrgContext";
import { useSystemHealth } from "@/hooks/useSystemHealth";
import { cn } from "@/lib/utils";

export default function SystemHealthCircle() {
  const { currentOrg, storeMode } = useOrg();
  const { score, isLoading } = useSystemHealth(currentOrg?.id, storeMode);

  const color = score >= 75 ? "text-success" : score >= 50 ? "text-warning" : "text-destructive";
  const strokeColor = score >= 75 ? "stroke-success" : score >= 50 ? "stroke-warning" : "stroke-destructive";
  const circumference = 2 * Math.PI * 18;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-11 h-11 flex items-center justify-center group-hover:scale-105 transition-transform">
      <svg className="w-11 h-11 -rotate-90" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r="18" fill="none" className="stroke-muted" strokeWidth="3" />
        <circle
          cx="22" cy="22" r="18" fill="none"
          className={cn(strokeColor, "transition-all duration-700")}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={isLoading ? circumference : offset}
        />
      </svg>
      <span className={cn("absolute text-xs font-bold", color)}>
        {isLoading ? "—" : score}
      </span>
    </div>
  );
}
