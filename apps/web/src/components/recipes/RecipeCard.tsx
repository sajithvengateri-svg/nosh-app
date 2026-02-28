import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { 
  ChefHat, 
  Clock, 
  Upload, 
  MoreVertical, 
  Edit, 
  Trash2,
  Camera,
  DollarSign,
  Users,
  Loader2,
  Shield,
  Scale,
  Factory,
  ShoppingCart
} from "lucide-react";
import RecipeActionDialog from "./RecipeActionDialog";
import RecipeScaler from "@/components/production/RecipeScaler";
import { useProductionBatches } from "@/hooks/useProductionBatches";
import { useTodoItems } from "@/hooks/useTodoItems";
import RecipeTypeBadge from "./RecipeTypeBadge";
import type { RecipeType } from "./RecipeTypeSelector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CCPMiniTimeline } from "@/components/ccp/CCPMiniTimeline";
import { CCPDialog } from "@/components/ccp/CCPDialog";
import { useRecipeCCPs } from "@/hooks/useRecipeCCPs";
import { useIsMobile } from "@/hooks/use-mobile";
import { RecipeBottomSheet } from "@/components/recipes/RecipeBottomSheet";

interface RecipeBase {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  cost_per_serving: number;
  sell_price?: number | null;
  image_url?: string | null;
  tasting_notes?: string | null;
  is_batch_recipe?: boolean | null;
  target_food_cost_percent?: number | null;
  recipe_type?: string | null;
}

interface RecipeCardProps {
  recipe: RecipeBase;
  hasEditPermission: boolean;
  isOnActiveMenu?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onImageUpdate: (recipeId: string, imageUrl: string) => void;
}

const RecipeCard = ({ recipe, hasEditPermission, isOnActiveMenu, onEdit, onDelete, onImageUpdate }: RecipeCardProps) => {
  const [uploading, setUploading] = useState(false);
  const [ccpDialogOpen, setCcpDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [scalerOpen, setScalerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { ccps } = useRecipeCCPs(recipe.id);
  const isMobile = useIsMobile();
  const { createBatch } = useProductionBatches();
  const { addFromRecipeScale } = useTodoItems();

  const handleToList = async () => {
    // Add recipe's base ingredients to shopping list
    try {
      const { data } = await supabase
        .from("recipe_ingredients")
        .select("ingredient_id, quantity, unit, ingredients(name)")
        .eq("recipe_id", recipe.id);
      
      if (data && data.length > 0) {
        const ingredients = data.map((ri: any) => ({
          name: ri.ingredients?.name || "Unknown",
          scaledQuantity: Number(ri.quantity) || 0,
          unit: ri.unit || "",
          grossQuantity: Number(ri.quantity) || 0,
        }));
        await addFromRecipeScale.mutateAsync({
          recipeId: recipe.id,
          recipeName: recipe.name,
          ingredients,
        });
        toast.success("Added to shopping list!");
      } else {
        toast.info("No linked ingredients found");
      }
    } catch {
      toast.error("Failed to add to list");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${recipe.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('recipe-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('recipe-images')
        .getPublicUrl(filePath);

      // Update recipe with image URL
      const { error: updateError } = await supabase
        .from('recipes')
        .update({ image_url: publicUrl })
        .eq('id', recipe.id);

      if (updateError) throw updateError;

      onImageUpdate(recipe.id, publicUrl);
      toast.success('Image uploaded');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const calculateFoodCostPercent = () => {
    if (!recipe.sell_price || recipe.sell_price === 0) return null;
    return ((recipe.cost_per_serving / recipe.sell_price) * 100).toFixed(1);
  };

  const foodCostPercent = calculateFoodCostPercent();
  const targetPercent = recipe.target_food_cost_percent || 30;

  return (
    <div className="card-interactive p-4 cursor-pointer" onClick={() => { if (!actionDialogOpen && !scalerOpen && !sheetOpen) setActionDialogOpen(true); }}>
      {/* Recipe Image */}
      <div className="aspect-video rounded-lg bg-muted mb-4 flex items-center justify-center relative overflow-hidden group">
        {recipe.image_url ? (
          <img 
            src={recipe.image_url} 
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground/50">
            <ChefHat className="w-10 h-10 mb-2" />
            <span className="text-xs">No image</span>
          </div>
        )}
        
        {/* Upload overlay */}
        {hasEditPermission && (
          <div className={cn(
            "absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity",
            recipe.image_url ? "opacity-0 group-hover:opacity-100" : "opacity-0 group-hover:opacity-100"
          )}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Camera className="w-4 h-4 mr-2" />
                  {recipe.image_url ? "Change" : "Upload"}
                </>
              )}
            </Button>
          </div>
        )}

        {/* Recipe type badge */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          <RecipeTypeBadge type={(recipe.recipe_type as RecipeType) || (recipe.is_batch_recipe ? "batch_prep" : "dish")} />
          {isOnActiveMenu && (
            <Badge className="bg-success/90 text-success-foreground text-[10px] px-1.5 py-0.5">
              On Menu
            </Badge>
          )}
        </div>
      </div>

      {/* Recipe Info */}
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{recipe.name}</h3>
            <span className="text-xs text-muted-foreground">{recipe.category}</span>
          </div>
          {hasEditPermission && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 rounded-lg hover:bg-muted transition-colors flex-shrink-0">
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit()}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete()}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Tasting notes preview */}
        {recipe.tasting_notes && (
          <p className="text-xs text-muted-foreground italic line-clamp-2 bg-muted/50 p-2 rounded">
            "{recipe.tasting_notes}"
          </p>
        )}

        {/* Key Stats Row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-muted/50 rounded-lg p-2">
            <Clock className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-xs font-medium">{recipe.prep_time + recipe.cook_time}m</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2">
            <Users className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-xs font-medium">{recipe.servings}</p>
          </div>
          <div className={cn(
            "rounded-lg p-2",
            foodCostPercent && Number(foodCostPercent) <= targetPercent 
              ? "bg-success/10" 
              : foodCostPercent && Number(foodCostPercent) > targetPercent 
                ? "bg-warning/10" 
                : "bg-muted/50"
          )}>
            <DollarSign className={cn(
              "w-4 h-4 mx-auto mb-1",
              foodCostPercent && Number(foodCostPercent) <= targetPercent 
                ? "text-success" 
                : foodCostPercent && Number(foodCostPercent) > targetPercent 
                  ? "text-warning" 
                  : "text-muted-foreground"
            )} />
            <p className="text-xs font-medium">
              {foodCostPercent ? `${foodCostPercent}%` : "--"}
            </p>
          </div>
        </div>

        {/* CCP Mini Timeline */}
        <div className="pt-3 border-t border-border">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">Control Points</span>
          </div>
          <CCPMiniTimeline 
            ccps={ccps} 
            onClick={() => setCcpDialogOpen(true)}
          />
        </div>

      {/* Pricing */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div>
              <p className="text-xs text-muted-foreground">Cost/Serving</p>
              <p className="font-semibold text-foreground">
                ${Number(recipe.cost_per_serving).toFixed(2)}
              </p>
            </div>
          </div>
      </div>

      {/* Sticky Action Footer */}
      <div className="flex items-center gap-2 pt-3 mt-auto border-t border-border" onClick={(e) => e.stopPropagation()}>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs gap-1.5"
          onClick={() => { setActionDialogOpen(false); setScalerOpen(true); }}
        >
          <Scale className="w-3.5 h-3.5" />
          Scale
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs gap-1.5"
          onClick={() => { setActionDialogOpen(false); setScalerOpen(true); }}
        >
          <Factory className="w-3.5 h-3.5" />
          Produce
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs gap-1.5"
          onClick={handleToList}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          To List
        </Button>
      </div>

      {/* CCP Dialog */}
      <CCPDialog
        open={ccpDialogOpen}
        onOpenChange={setCcpDialogOpen}
        recipeId={recipe.id}
        recipeName={recipe.name}
        hasEditPermission={hasEditPermission}
      />

      {/* Mobile Bottom Sheet */}
      {isMobile && (
        <RecipeBottomSheet
          recipeId={recipe.id}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
        />
      )}

      {/* Recipe Action Dialog */}
      <RecipeActionDialog
        recipeId={recipe.id}
        recipeName={recipe.name}
        open={actionDialogOpen}
        onOpenChange={setActionDialogOpen}
        hasEditPermission={hasEditPermission}
        onScale={() => setScalerOpen(true)}
        onProduce={() => setScalerOpen(true)}
        onOpenBottomSheet={() => setSheetOpen(true)}
        onToList={handleToList}
        onDelete={onDelete}
      />

      {/* Recipe Scaler */}
      <RecipeScaler
        isOpen={scalerOpen}
        onClose={() => setScalerOpen(false)}
        recipeId={recipe.id}
        onBatchCreated={createBatch}
      />
    </div>
  );
};

export default RecipeCard;
