import { useAiUsage } from "@/hooks/useAiUsage";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Small pill showing "X% AI" in the app header.
 * Green < 50%, Amber 50-80%, Red > 80%.
 * Hidden when no quota is configured (tokensLimit = 0).
 */
export function AiUsagePill() {
  const { pctUsed, tokensLimit, isLoading } = useAiUsage();

  if (isLoading || tokensLimit === 0) return null;

  const pct = Math.round(pctUsed);
  const color =
    pct < 50
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      : pct < 80
        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`${color} border-0 text-xs font-medium cursor-default`}
          >
            {pct}% AI
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {pct >= 100
              ? "Monthly AI limit reached. Resets on the 1st."
              : `You've used ${pct}% of your monthly AI allowance`}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
