import { BookOpen, Scale, ClipboardCheck, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PrepTaskActionsProps {
  taskName: string;
  recipeId?: string | null;
  onCheckRecipe?: () => void;
  onScale?: () => void;
  onLogProduction?: () => void;
  onPostToWall?: () => void;
  compact?: boolean;
}

export function PrepTaskActions({
  taskName,
  onCheckRecipe,
  onScale,
  onLogProduction,
  onPostToWall,
  compact = true,
}: PrepTaskActionsProps) {
  const actions = [
    { icon: BookOpen, label: "Recipe", onClick: onCheckRecipe, color: "text-blue-500 hover:bg-blue-500/10" },
    { icon: Scale, label: "Scale", onClick: onScale, color: "text-purple-500 hover:bg-purple-500/10" },
    { icon: ClipboardCheck, label: "Log", onClick: onLogProduction, color: "text-emerald-500 hover:bg-emerald-500/10" },
    { icon: Share2, label: "Wall", onClick: onPostToWall, color: "text-orange-500 hover:bg-orange-500/10" },
  ];

  if (compact) {
    return (
      <div className="flex gap-0.5" onClick={e => e.stopPropagation()}>
        {actions.map((action, i) => (
          <button
            key={i}
            onClick={action.onClick}
            className={cn("p-1.5 rounded-lg transition-colors", action.color)}
            title={action.label}
          >
            <action.icon className="w-3.5 h-3.5" />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
      {actions.map((action, i) => (
        <Button key={i} variant="outline" size="sm" onClick={action.onClick} className="gap-1.5 text-xs">
          <action.icon className="w-3.5 h-3.5" />
          {action.label}
        </Button>
      ))}
    </div>
  );
}
