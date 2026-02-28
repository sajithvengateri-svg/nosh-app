import { cn } from "@/lib/utils";
import { Utensils, Puzzle, Beaker, Scale } from "lucide-react";

export type RecipeType = "dish" | "component" | "batch_prep" | "portion_prep";

interface RecipeTypeOption {
  value: RecipeType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}

const recipeTypes: RecipeTypeOption[] = [
  {
    value: "dish",
    label: "Dish",
    description: "A menu item with components",
    icon: <Utensils className="w-6 h-6" />,
    color: "text-foreground",
    bgColor: "bg-muted/50",
    borderColor: "border-foreground/20",
  },
  {
    value: "component",
    label: "Component",
    description: "A building block for dishes",
    icon: <Puzzle className="w-6 h-6" />,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
  },
  {
    value: "batch_prep",
    label: "Batch Prep",
    description: "Stocks, sauces, bases made in bulk",
    icon: <Beaker className="w-6 h-6" />,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
  },
  {
    value: "portion_prep",
    label: "Portion Prep",
    description: "Proteins and items with yield loss",
    icon: <Scale className="w-6 h-6" />,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
  },
];

interface RecipeTypeSelectorProps {
  value: RecipeType;
  onChange: (type: RecipeType) => void;
  disabled?: boolean;
  variant?: "cards" | "compact";
}

export const recipeTypeConfig: Record<RecipeType, RecipeTypeOption> = Object.fromEntries(
  recipeTypes.map((t) => [t.value, t])
) as Record<RecipeType, RecipeTypeOption>;

const RecipeTypeSelector = ({ value, onChange, disabled, variant = "cards" }: RecipeTypeSelectorProps) => {
  if (variant === "compact") {
    return (
      <div className="flex gap-1.5 flex-wrap">
        {recipeTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => !disabled && onChange(type.value)}
            disabled={disabled}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border",
              value === type.value
                ? cn(type.bgColor, type.borderColor, type.color)
                : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <span className="w-4 h-4 [&>svg]:w-4 [&>svg]:h-4">{type.icon}</span>
            {type.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {recipeTypes.map((type) => (
        <button
          key={type.value}
          onClick={() => !disabled && onChange(type.value)}
          disabled={disabled}
          className={cn(
            "group relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-center",
            value === type.value
              ? cn(type.bgColor, type.borderColor, "ring-2 ring-offset-2 ring-offset-background", type.borderColor.replace("border-", "ring-"))
              : "border-border hover:border-foreground/20 hover:bg-muted/50",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
            value === type.value ? type.bgColor : "bg-muted",
            type.color
          )}>
            {type.icon}
          </div>
          <p className="font-semibold text-sm">{type.label}</p>
          <p className="text-xs text-muted-foreground leading-tight">{type.description}</p>
        </button>
      ))}
    </div>
  );
};

export default RecipeTypeSelector;
