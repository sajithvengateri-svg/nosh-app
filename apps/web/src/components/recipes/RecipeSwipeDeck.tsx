import { useState, useCallback } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { ChefHat, Clock, DollarSign, Users, Eye, ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";
import RecipeActionDialog from "./RecipeActionDialog";
import RecipeScaler from "@/components/production/RecipeScaler";
import { useProductionBatches } from "@/hooks/useProductionBatches";
import { cn } from "@/lib/utils";

interface SwipeRecipe {
  id: string;
  name: string;
  category: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  cost_per_serving: number;
  image_url?: string | null;
  recipe_type?: string | null;
}

interface RecipeSwipeDeckProps {
  recipes: SwipeRecipe[];
  hasEditPermission: boolean;
  onNavigateToRecipe: (id: string) => void;
}

const SWIPE_THRESHOLD = 100;
const SWIPE_UP_THRESHOLD = 80;

const RecipeSwipeDeck = ({ recipes, hasEditPermission, onNavigateToRecipe }: RecipeSwipeDeckProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragDirection, setDragDirection] = useState<"left" | "right" | "up" | null>(null);
  const [exitDirection, setExitDirection] = useState<number>(0);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [scalerOpen, setScalerOpen] = useState(false);
  const { createBatch } = useProductionBatches();

  const currentRecipe = recipes[currentIndex];
  const nextRecipe = recipes[currentIndex + 1];
  const thirdRecipe = recipes[currentIndex + 2];

  const handleDrag = useCallback((_: any, info: PanInfo) => {
    if (Math.abs(info.offset.y) > Math.abs(info.offset.x) && info.offset.y < -30) {
      setDragDirection("up");
    } else if (info.offset.x > 30) {
      setDragDirection("right");
    } else if (info.offset.x < -30) {
      setDragDirection("left");
    } else {
      setDragDirection(null);
    }
  }, []);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    setDragDirection(null);
    if (!currentRecipe) return;

    if (info.offset.y < -SWIPE_UP_THRESHOLD && Math.abs(info.offset.y) > Math.abs(info.offset.x)) {
      // Swipe up → action dialog
      setActionDialogOpen(true);
      return;
    }

    if (info.offset.x > SWIPE_THRESHOLD) {
      // Swipe right → view
      setExitDirection(1);
      setTimeout(() => {
        onNavigateToRecipe(currentRecipe.id);
      }, 200);
      return;
    }

    if (info.offset.x < -SWIPE_THRESHOLD) {
      // Swipe left → skip
      setExitDirection(-1);
      setTimeout(() => {
        setCurrentIndex(prev => Math.min(prev + 1, recipes.length - 1));
        setExitDirection(0);
      }, 300);
    }
  }, [currentRecipe, recipes.length, onNavigateToRecipe]);

  if (!currentRecipe) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <ChefHat className="w-16 h-16 mb-4 opacity-30" />
        <p className="font-medium">No more recipes!</p>
        <button
          onClick={() => setCurrentIndex(0)}
          className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
        >
          Start Over
        </button>
      </div>
    );
  }

  const renderCard = (recipe: SwipeRecipe, index: number) => {
    const isTop = index === 0;
    const depth = index;

    return (
      <motion.div
        key={`${recipe.id}-${currentIndex + index}`}
        className="absolute inset-0"
        style={{
          zIndex: 3 - depth,
        }}
        initial={false}
        animate={{
          scale: 1 - depth * 0.05,
          y: depth * 8,
          opacity: 1 - depth * 0.15,
        }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        {isTop ? (
          <motion.div
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.8}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            animate={exitDirection !== 0 ? { x: exitDirection * 400, opacity: 0, rotate: exitDirection * 15 } : {}}
            onClick={() => setActionDialogOpen(true)}
            className="w-full h-full rounded-2xl overflow-hidden bg-card border border-border shadow-lg cursor-grab active:cursor-grabbing"
          >
            <CardContent recipe={recipe} dragDirection={dragDirection} />
          </motion.div>
        ) : (
          <div className="w-full h-full rounded-2xl overflow-hidden bg-card border border-border shadow-md pointer-events-none">
            <CardContent recipe={recipe} dragDirection={null} />
          </div>
        )}
      </motion.div>
    );
  };

  const visibleCards = [thirdRecipe, nextRecipe, currentRecipe].filter(Boolean);

  return (
    <div className="space-y-4">
      {/* Card Stack */}
      <div className="relative w-full aspect-[3/4] max-h-[60vh]">
        {thirdRecipe && renderCard(thirdRecipe, 2)}
        {nextRecipe && renderCard(nextRecipe, 1)}
        {renderCard(currentRecipe, 0)}
      </div>

      {/* Hint labels */}
      <div className="flex justify-between items-center px-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><ArrowLeft className="w-3 h-3" /> Skip</span>
        <span className="flex items-center gap-1"><ArrowUp className="w-3 h-3" /> Actions</span>
        <span className="flex items-center gap-1">View <ArrowRight className="w-3 h-3" /></span>
      </div>

      {/* Counter */}
      <p className="text-center text-sm text-muted-foreground">
        {currentIndex + 1} of {recipes.length}
      </p>

      {/* Action Dialog */}
      <RecipeActionDialog
        recipeId={currentRecipe.id}
        recipeName={currentRecipe.name}
        open={actionDialogOpen}
        onOpenChange={setActionDialogOpen}
        hasEditPermission={hasEditPermission}
        onScale={() => setScalerOpen(true)}
        onProduce={() => setScalerOpen(true)}
      />

      {/* Scaler */}
      <RecipeScaler
        isOpen={scalerOpen}
        onClose={() => setScalerOpen(false)}
        recipeId={currentRecipe.id}
        onBatchCreated={createBatch}
      />
    </div>
  );
};

// Inner card content component
const CardContent = ({ recipe, dragDirection }: { recipe: SwipeRecipe; dragDirection: "left" | "right" | "up" | null }) => (
  <div className="relative w-full h-full flex flex-col">
    {/* Image */}
    <div className="flex-1 bg-muted relative overflow-hidden">
      {recipe.image_url ? (
        <img src={recipe.image_url} alt={recipe.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <ChefHat className="w-20 h-20 text-muted-foreground/20" />
        </div>
      )}

      {/* Direction overlays */}
      <AnimatePresence>
        {dragDirection === "right" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-success/20 flex items-center justify-center"
          >
            <div className="px-6 py-3 rounded-xl bg-success/90 text-success-foreground font-bold text-lg rotate-[-15deg]">
              VIEW
            </div>
          </motion.div>
        )}
        {dragDirection === "left" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-muted/40 flex items-center justify-center"
          >
            <div className="px-6 py-3 rounded-xl bg-muted-foreground/80 text-background font-bold text-lg rotate-[15deg]">
              SKIP
            </div>
          </motion.div>
        )}
        {dragDirection === "up" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-primary/20 flex items-center justify-center"
          >
            <div className="px-6 py-3 rounded-xl bg-primary/90 text-primary-foreground font-bold text-lg">
              ACTIONS
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

    {/* Info bar */}
    <div className="p-4 space-y-2">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-lg text-foreground">{recipe.name}</h3>
          <span className="text-xs text-muted-foreground">{recipe.category}</span>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
          ${Number(recipe.cost_per_serving).toFixed(2)}/srv
        </span>
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {recipe.prep_time + recipe.cook_time}m</span>
        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {recipe.servings} srv</span>
      </div>
    </div>
  </div>
);

export default RecipeSwipeDeck;
