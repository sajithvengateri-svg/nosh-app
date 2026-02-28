import { useState, useEffect } from "react";
import { MenuItem } from "@/types/menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";

interface MenuItemEditDialogProps {
  item: MenuItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (item: MenuItem) => void;
  onDelete?: (itemId: string) => void;
}

const categories = ["Starters", "Mains", "Desserts", "Sides", "Drinks", "Specials"];

const MenuItemEditDialog = ({
  item,
  open,
  onOpenChange,
  onSave,
  onDelete,
}: MenuItemEditDialogProps) => {
  const [formData, setFormData] = useState<Partial<MenuItem>>({});

  useEffect(() => {
    if (item) {
      setFormData({ ...item });
    }
  }, [item]);

  const handleChange = (field: keyof MenuItem, value: string | number) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      
      // Recalculate derived fields
      if (field === "sellPrice" || field === "foodCost") {
        const sellPrice = field === "sellPrice" ? Number(value) : Number(prev.sellPrice || 0);
        const foodCost = field === "foodCost" ? Number(value) : Number(prev.foodCost || 0);
        
        updated.foodCostPercent = sellPrice > 0 ? (foodCost / sellPrice) * 100 : 0;
        updated.contributionMargin = sellPrice - foodCost;
      }
      
      return updated;
    });
  };

  const handleSave = () => {
    if (!formData.name || !formData.sellPrice) return;
    
    // Determine profitability (simplified - normally based on averages)
    const foodCostPercent = formData.foodCostPercent || 0;
    const popularity = formData.popularity || 0;
    
    let profitability: MenuItem["profitability"] = "puzzle";
    if (foodCostPercent <= 30 && popularity >= 100) profitability = "star";
    else if (foodCostPercent > 30 && popularity >= 100) profitability = "plow-horse";
    else if (foodCostPercent <= 30 && popularity < 100) profitability = "puzzle";
    else profitability = "dog";

    onSave({
      ...formData,
      profitability,
    } as MenuItem);
    onOpenChange(false);
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Menu Item</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Item Name</Label>
            <Input
              id="name"
              value={formData.name || ""}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category || ""}
              onValueChange={(value) => handleChange("category", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sellPrice">Sell Price ($)</Label>
              <Input
                id="sellPrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.sellPrice || ""}
                onChange={(e) => handleChange("sellPrice", parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="foodCost">Food Cost ($)</Label>
              <Input
                id="foodCost"
                type="number"
                step="0.01"
                min="0"
                value={formData.foodCost || ""}
                onChange={(e) => handleChange("foodCost", parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="popularity">Sales (Period)</Label>
              <Input
                id="popularity"
                type="number"
                min="0"
                value={formData.popularity || ""}
                onChange={(e) => handleChange("popularity", parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>Food Cost %</Label>
              <div className="h-10 px-3 flex items-center rounded-md border bg-muted">
                <span className={formData.foodCostPercent && formData.foodCostPercent > 30 ? "text-destructive" : "text-success"}>
                  {(formData.foodCostPercent || 0).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Contribution Margin</Label>
            <div className="h-10 px-3 flex items-center rounded-md border bg-muted">
              <span className="text-success font-semibold">
                ${(formData.contributionMargin || 0).toFixed(2)}
              </span>
            </div>
          </div>

          {formData.allergens && formData.allergens.length > 0 && (
            <div className="space-y-2">
              <Label>Allergens</Label>
              <div className="flex flex-wrap gap-1">
                {formData.allergens.map((allergen) => (
                  <Badge key={allergen} variant="outline" className="text-xs">
                    {allergen}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          {onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                onDelete(item.id);
                onOpenChange(false);
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MenuItemEditDialog;
