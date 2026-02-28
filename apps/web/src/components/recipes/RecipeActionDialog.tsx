import { useNavigate } from "react-router-dom";
import { Eye, Edit, Scale, Factory, ShoppingCart, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface RecipeActionDialogProps {
  recipeId: string;
  recipeName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasEditPermission: boolean;
  onScale: () => void;
  onProduce: () => void;
  onOpenBottomSheet?: () => void;
  onToList?: () => void;
  onDelete?: () => void;
}

const actions: Array<{ key: string; label: string; icon: typeof Eye; description: string; requiresEdit?: boolean; destructive?: boolean }> = [
  { key: "view", label: "View", icon: Eye, description: "View full recipe" },
  { key: "edit", label: "Edit", icon: Edit, description: "Edit recipe", requiresEdit: true },
  { key: "scale", label: "Scale", icon: Scale, description: "Scale ingredients" },
  { key: "produce", label: "Produce", icon: Factory, description: "Log a batch" },
  { key: "tolist", label: "To List", icon: ShoppingCart, description: "Add to shopping list" },
  { key: "delete", label: "Delete", icon: Trash2, description: "Delete recipe", requiresEdit: true, destructive: true },
];

const RecipeActionDialog = ({
  recipeId,
  recipeName,
  open,
  onOpenChange,
  hasEditPermission,
  onScale,
  onProduce,
  onOpenBottomSheet,
  onToList,
  onDelete,
}: RecipeActionDialogProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleAction = (key: string) => {
    onOpenChange(false);
    // Defer action so Radix Dialog fully unmounts before next UI opens
    setTimeout(() => {
      switch (key) {
        case "view":
          if (isMobile && onOpenBottomSheet) {
            onOpenBottomSheet();
          } else {
            navigate(`/recipes/${recipeId}`);
          }
          break;
        case "edit":
          navigate(`/recipes/${recipeId}/edit`);
          break;
        case "scale":
          onScale();
          break;
        case "produce":
          onProduce();
          break;
        case "tolist":
          onToList?.();
          break;
        case "delete":
          onDelete?.();
          break;
      }
    }, 150);
  };

  const visibleActions = actions.filter(
    (a) => !a.requiresEdit || hasEditPermission
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">What would you like to do?</DialogTitle>
          <p className="text-sm text-muted-foreground text-center truncate">{recipeName}</p>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 pt-2">
          {visibleActions.map((action) => (
            <button
              key={action.key}
              onClick={() => handleAction(action.key)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-center",
                action.destructive
                  ? "bg-destructive/5 hover:bg-destructive/10 border-destructive/20 hover:border-destructive/40"
                  : "bg-muted/50 hover:bg-muted border-border hover:border-primary/30"
              )}
            >
              <div className={cn(
                "p-2.5 rounded-xl",
                action.destructive ? "bg-destructive/10" : "bg-primary/10"
              )}>
                <action.icon className={cn(
                  "w-5 h-5",
                  action.destructive ? "text-destructive" : "text-primary"
                )} />
              </div>
              <span className={cn(
                "text-sm font-medium",
                action.destructive ? "text-destructive" : ""
              )}>{action.label}</span>
              <span className="text-xs text-muted-foreground">{action.description}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecipeActionDialog;
