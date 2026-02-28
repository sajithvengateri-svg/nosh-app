import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Check, Plus, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { IngredientMatch, inferCategory, inferUnit } from "@/lib/ingredientMatcher";

interface NewIngredientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ingredientName: string;
  similarMatches: IngredientMatch[];
  onSelectExisting: (ingredientId: string) => void;
  onCreateNew: (ingredient: {
    name: string;
    unit: string;
    category: string;
    cost_per_unit: number;
  }) => void;
}

const categories = [
  "Protein",
  "Dairy",
  "Produce",
  "Fruit",
  "Pantry",
  "Spices",
  "Seafood",
  "Bakery",
  "Beverages",
  "Other",
];

const units = ["g", "kg", "ml", "L", "each", "lb", "oz", "bunch", "tbsp", "tsp", "cup"];

const NewIngredientDialog = ({
  open,
  onOpenChange,
  ingredientName,
  similarMatches,
  onSelectExisting,
  onCreateNew,
}: NewIngredientDialogProps) => {
  const inferredCategory = inferCategory(ingredientName);
  const inferredUnit = inferUnit(ingredientName);

  const [newIngredient, setNewIngredient] = useState({
    name: ingredientName,
    unit: inferredUnit,
    category: inferredCategory,
    cost_per_unit: 0,
  });

  // Reset form when dialog opens with new ingredient name
  useState(() => {
    setNewIngredient({
      name: ingredientName,
      unit: inferUnit(ingredientName),
      category: inferCategory(ingredientName),
      cost_per_unit: 0,
    });
  });

  const handleCreate = () => {
    if (!newIngredient.name.trim()) return;
    onCreateNew(newIngredient);
    onOpenChange(false);
  };

  const handleSelectExisting = (id: string) => {
    onSelectExisting(id);
    onOpenChange(false);
  };

  const hasExactMatch = similarMatches.some(m => m.matchType === "exact");
  const hasSimilarMatches = similarMatches.length > 0 && !hasExactMatch;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Ingredient: "{ingredientName}"
          </DialogTitle>
          <DialogDescription>
            {hasExactMatch
              ? "An exact match was found in your ingredients database."
              : hasSimilarMatches
              ? "Similar ingredients found. Did you mean one of these?"
              : "This ingredient doesn't exist yet. Create it?"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Similar matches */}
          {similarMatches.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                Existing Ingredients
              </Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {similarMatches.slice(0, 5).map((match) => (
                  <button
                    key={match.id}
                    onClick={() => handleSelectExisting(match.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-lg border transition-colors text-left",
                      "hover:bg-primary/5 hover:border-primary",
                      match.matchType === "exact" && "border-success bg-success/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{match.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={match.matchType === "exact" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {match.matchType === "exact"
                          ? "Exact Match"
                          : match.matchType === "alias"
                          ? "Variation"
                          : match.matchType === "partial"
                          ? "Contains"
                          : `${Math.round(match.similarity * 100)}% Similar`}
                      </Badge>
                      <Check className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Divider */}
          {similarMatches.length > 0 && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or create new
                </span>
              </div>
            </div>
          )}

          {/* New ingredient form */}
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newIngredient.name}
                  onChange={(e) =>
                    setNewIngredient({ ...newIngredient, name: e.target.value })
                  }
                  placeholder="Ingredient name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newIngredient.category}
                  onValueChange={(v) =>
                    setNewIngredient({ ...newIngredient, category: v })
                  }
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="unit">Default Unit</Label>
                <Select
                  value={newIngredient.unit}
                  onValueChange={(v) =>
                    setNewIngredient({ ...newIngredient, unit: v })
                  }
                >
                  <SelectTrigger id="unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Cost per Unit ($)</Label>
                <Input
                  id="cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newIngredient.cost_per_unit || ""}
                  onChange={(e) =>
                    setNewIngredient({
                      ...newIngredient,
                      cost_per_unit: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Create & Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewIngredientDialog;
