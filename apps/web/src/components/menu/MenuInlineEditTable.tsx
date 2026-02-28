import { useState, useEffect, useCallback } from "react";
import { MenuItem, Allergen } from "@/types/menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  Star,
  TrendingUp,
  Puzzle,
  AlertTriangle,
  Save,
  X,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface MenuInlineEditTableProps {
  items: MenuItem[];
  onSaveAll: (items: MenuItem[]) => void;
  onDeleteItem: (itemId: string) => void;
  onCancel: () => void;
}

const profitabilityOptions = [
  { value: "star", label: "Star", icon: Star, color: "text-warning" },
  { value: "plow-horse", label: "Plow Horse", icon: TrendingUp, color: "text-primary" },
  { value: "puzzle", label: "Puzzle", icon: Puzzle, color: "text-success" },
  { value: "dog", label: "Dog", icon: AlertTriangle, color: "text-destructive" },
];

const categoryOptions = [
  "Mains",
  "Starters",
  "Desserts",
  "Sides",
  "Drinks",
  "Specials",
  "Breakfast",
  "Lunch",
  "Dinner",
  "Uncategorized",
];

export default function MenuInlineEditTable({
  items,
  onSaveAll,
  onDeleteItem,
  onCancel,
}: MenuInlineEditTableProps) {
  const [editedItems, setEditedItems] = useState<MenuItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setEditedItems(items.map(item => ({ ...item })));
  }, [items]);

  const GST_RATE = 0.10; // 10% GST

  const updateItem = useCallback((id: string, field: keyof MenuItem, value: any) => {
    setEditedItems(prev => {
      const updated = prev.map(item => {
        if (item.id !== id) return item;
        
        const newItem = { ...item, [field]: value };
        
        // Auto-calculate derived fields when sell price or food cost changes
        // GST is factored in: sell price is GST-inclusive, so we calculate ex-GST revenue
        if (field === "sellPrice" || field === "foodCost") {
          const sellPriceIncGST = field === "sellPrice" ? Number(value) : item.sellPrice;
          const foodCost = field === "foodCost" ? Number(value) : item.foodCost;
          
          // Calculate ex-GST sell price
          const sellPriceExGST = sellPriceIncGST / (1 + GST_RATE);
          
          // Contribution margin is ex-GST revenue minus food cost
          newItem.contributionMargin = sellPriceExGST - foodCost;
          // Food cost % is based on ex-GST sell price
          newItem.foodCostPercent = sellPriceExGST > 0 ? (foodCost / sellPriceExGST) * 100 : 0;
        }
        
        return newItem;
      });
      return updated;
    });
    setHasChanges(true);
  }, []);

  const handleSaveAll = () => {
    onSaveAll(editedItems);
    setHasChanges(false);
    toast.success(`Saved ${editedItems.length} items`);
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === editedItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(editedItems.map(i => i.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedItems.size === 0) return;
    selectedItems.forEach(id => onDeleteItem(id));
    setSelectedItems(new Set());
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedItems.size === editedItems.length && editedItems.length > 0}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-sm text-muted-foreground">
              {selectedItems.size > 0 
                ? `${selectedItems.size} selected` 
                : `${editedItems.length} items`}
            </span>
          </div>
          {selectedItems.size > 0 && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleDeleteSelected}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" />
            Exit Edit Mode
          </Button>
          <Button 
            size="sm" 
            onClick={handleSaveAll}
            disabled={!hasChanges}
          >
            <Save className="w-4 h-4 mr-2" />
            Save All Changes
          </Button>
        </div>
      </div>

      {/* Editable Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-10"></TableHead>
                <TableHead className="min-w-[180px]">Name</TableHead>
                <TableHead className="min-w-[120px]">Category</TableHead>
                <TableHead className="w-28 text-right">Sell Price</TableHead>
                <TableHead className="w-28 text-right">Food Cost</TableHead>
                <TableHead className="w-24 text-right">Cost %</TableHead>
                <TableHead className="w-24 text-right">Margin</TableHead>
                <TableHead className="w-24 text-right">Sales</TableHead>
                <TableHead className="min-w-[130px]">Status</TableHead>
                <TableHead className="w-16 text-center">Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {editedItems.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30">
                  <TableCell className="p-2">
                    <Checkbox
                      checked={selectedItems.has(item.id)}
                      onCheckedChange={() => toggleSelectItem(item.id)}
                    />
                  </TableCell>
                  <TableCell className="p-2">
                    <Input
                      value={item.name}
                      onChange={(e) => updateItem(item.id, "name", e.target.value)}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell className="p-2">
                    <Select
                      value={item.category}
                      onValueChange={(val) => updateItem(item.id, "category", val)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="p-2">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.sellPrice}
                        onChange={(e) => updateItem(item.id, "sellPrice", parseFloat(e.target.value) || 0)}
                        className="h-8 w-20 text-right"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="p-2">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.foodCost}
                        onChange={(e) => updateItem(item.id, "foodCost", parseFloat(e.target.value) || 0)}
                        className="h-8 w-20 text-right"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="p-2 text-right">
                    <Badge 
                      variant="outline"
                      className={cn(
                        "font-mono",
                        item.foodCostPercent > 30 ? "text-destructive border-destructive" : "text-success border-success"
                      )}
                    >
                      {item.foodCostPercent.toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="p-2 text-right">
                    <span className="font-medium text-success">
                      ${item.contributionMargin.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell className="p-2">
                    <Input
                      type="number"
                      min="0"
                      value={item.popularity}
                      onChange={(e) => updateItem(item.id, "popularity", parseInt(e.target.value) || 0)}
                      className="h-8 w-20 text-right"
                    />
                  </TableCell>
                  <TableCell className="p-2">
                    <Select
                      value={item.profitability}
                      onValueChange={(val) => updateItem(item.id, "profitability", val as MenuItem["profitability"])}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {profitabilityOptions.map((opt) => {
                          const Icon = opt.icon;
                          return (
                            <SelectItem key={opt.value} value={opt.value}>
                              <div className="flex items-center gap-2">
                                <Icon className={cn("w-4 h-4", opt.color)} />
                                {opt.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="p-2 text-center">
                    <Checkbox
                      checked={item.isActive}
                      onCheckedChange={(checked) => updateItem(item.id, "isActive", !!checked)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Bottom Save Bar */}
      {hasChanges && (
        <div className="sticky bottom-4 flex justify-center">
          <div className="bg-primary text-primary-foreground px-6 py-3 rounded-full shadow-lg flex items-center gap-4">
            <span className="text-sm">You have unsaved changes</span>
            <Button 
              size="sm" 
              variant="secondary"
              onClick={handleSaveAll}
            >
              <Save className="w-4 h-4 mr-2" />
              Save All
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
