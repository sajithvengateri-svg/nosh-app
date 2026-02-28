import { Utensils, Puzzle, Beaker, Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RecipeType } from "./RecipeTypeSelector";

interface RecipeTypeBadgeProps {
  type: RecipeType;
  className?: string;
}

const badgeConfig: Record<RecipeType, { label: string; icon: React.ReactNode; className: string }> = {
  dish: {
    label: "Dish",
    icon: <Utensils className="w-3 h-3" />,
    className: "bg-muted text-foreground",
  },
  component: {
    label: "Component",
    icon: <Puzzle className="w-3 h-3" />,
    className: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  },
  batch_prep: {
    label: "Batch",
    icon: <Beaker className="w-3 h-3" />,
    className: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
  },
  portion_prep: {
    label: "Portion",
    icon: <Scale className="w-3 h-3" />,
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
};

const RecipeTypeBadge = ({ type, className }: RecipeTypeBadgeProps) => {
  // Don't show badge for dishes (they're the default)
  if (type === "dish") return null;

  const config = badgeConfig[type];

  return (
    <div className={cn(
      "text-xs px-2 py-1 rounded-full flex items-center gap-1 font-medium",
      config.className,
      className
    )}>
      {config.icon}
      {config.label}
    </div>
  );
};

export default RecipeTypeBadge;
