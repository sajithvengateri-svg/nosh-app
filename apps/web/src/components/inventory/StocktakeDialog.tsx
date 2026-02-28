import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ClipboardList,
  Check,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Package,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgId } from "@/hooks/useOrgId";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface StocktakeItem {
  id: string;
  ingredient_id: string | null;
  inventory_id: string | null;
  ingredient_name: string;
  expected_quantity: number;
  counted_quantity: number | null;
  variance: number;
  unit: string;
  location: string | null;
  notes: string | null;
}

interface StocktakeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

const StocktakeDialog = ({ open, onOpenChange, onComplete }: StocktakeDialogProps) => {
  const { profile } = useAuth();
  const orgId = useOrgId();
  const [step, setStep] = useState<"setup" | "counting" | "review">("setup");
  const [loading, setLoading] = useState(false);
  const [stocktakeId, setStocktakeId] = useState<string | null>(null);
  const [items, setItems] = useState<StocktakeItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Setup form
  const [setupForm, setSetupForm] = useState({
    name: `Stocktake - ${format(new Date(), "MMM d, yyyy")}`,
    stocktake_type: "full",
    notes: "",
  });

  // Current item being counted
  const currentItem = items[currentIndex];
  const progress = items.length > 0 ? ((currentIndex + 1) / items.length) * 100 : 0;

  const startStocktake = async () => {
    setLoading(true);
    
    try {
      // Fetch all inventory/ingredients
      const { data: ingredients, error: ingError } = await supabase
        .from("ingredients")
        .select("id, name, current_stock, unit")
        .order("name");

      if (ingError) throw ingError;

      // Create stocktake record
      const { data: stocktake, error: stError } = await supabase
        .from("stocktakes")
        .insert({
          name: setupForm.name,
          stocktake_type: setupForm.stocktake_type,
          notes: setupForm.notes || null,
          total_items: ingredients?.length || 0,
          created_by: profile?.user_id,
          org_id: orgId,
        })
        .select()
        .single();

      if (stError) throw stError;

      // Create stocktake items
      const stocktakeItems = (ingredients || []).map((ing) => ({
        stocktake_id: stocktake.id,
        ingredient_id: ing.id,
        ingredient_name: ing.name,
        expected_quantity: Number(ing.current_stock) || 0,
        unit: ing.unit,
        location: "Main Storage",
      }));

      const { data: createdItems, error: itemsError } = await supabase
        .from("stocktake_items")
        .insert(stocktakeItems)
        .select();

      if (itemsError) throw itemsError;

      setStocktakeId(stocktake.id);
      setItems(
        (createdItems || []).map((item) => ({
          ...item,
          variance: 0,
          counted_quantity: null,
        })) as StocktakeItem[]
      );
      setStep("counting");
      toast.success("Stocktake started");
    } catch (error) {
      console.error("Failed to start stocktake:", error);
      toast.error("Failed to start stocktake");
    } finally {
      setLoading(false);
    }
  };

  const updateCount = async (count: number | null) => {
    if (!currentItem) return;

    const updatedItems = [...items];
    updatedItems[currentIndex] = {
      ...currentItem,
      counted_quantity: count,
      variance: (count ?? 0) - currentItem.expected_quantity,
    };
    setItems(updatedItems);

    // Save to database
    await supabase
      .from("stocktake_items")
      .update({
        counted_quantity: count,
        counted_at: new Date().toISOString(),
        counted_by: profile?.user_id,
      })
      .eq("id", currentItem.id);
  };

  const nextItem = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setStep("review");
    }
  };

  const previousItem = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const completeStocktake = async () => {
    if (!stocktakeId) return;
    setLoading(true);

    try {
      // Calculate total variance value
      const totalVariance = items.reduce((sum, item) => {
        return sum + Math.abs(item.variance);
      }, 0);

      // Update stocktake status
      await supabase
        .from("stocktakes")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          items_counted: items.filter((i) => i.counted_quantity !== null).length,
          total_variance_value: totalVariance,
        })
        .eq("id", stocktakeId);

      // Update ingredient stock levels and create stock movements
      for (const item of items) {
        if (item.counted_quantity !== null && item.ingredient_id) {
          // Update ingredient current_stock
          await supabase
            .from("ingredients")
            .update({ current_stock: item.counted_quantity })
            .eq("id", item.ingredient_id);

          // Create stock movement record
          await supabase.from("stock_movements").insert({
            ingredient_id: item.ingredient_id,
            movement_type: "stocktake",
            quantity_change: item.variance,
            quantity_before: item.expected_quantity,
            quantity_after: item.counted_quantity,
            source: "stocktake",
            source_reference: stocktakeId,
            notes: item.variance !== 0 ? `Variance: ${item.variance > 0 ? "+" : ""}${item.variance} ${item.unit}` : null,
            recorded_by: profile?.user_id,
            recorded_by_name: profile?.full_name,
            org_id: orgId,
          });
        }
      }

      toast.success("Stocktake completed and inventory updated");
      onComplete?.();
      onOpenChange(false);
      resetDialog();
    } catch (error) {
      console.error("Failed to complete stocktake:", error);
      toast.error("Failed to complete stocktake");
    } finally {
      setLoading(false);
    }
  };

  const resetDialog = () => {
    setStep("setup");
    setStocktakeId(null);
    setItems([]);
    setCurrentIndex(0);
    setSetupForm({
      name: `Stocktake - ${format(new Date(), "MMM d, yyyy")}`,
      stocktake_type: "full",
      notes: "",
    });
  };

  const itemsWithVariance = items.filter((i) => i.counted_quantity !== null && i.variance !== 0);
  const positiveVariance = itemsWithVariance.filter((i) => i.variance > 0);
  const negativeVariance = itemsWithVariance.filter((i) => i.variance < 0);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetDialog(); onOpenChange(o); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            {step === "setup" && "Start Stocktake"}
            {step === "counting" && "Count Inventory"}
            {step === "review" && "Review & Complete"}
          </DialogTitle>
          <DialogDescription>
            {step === "setup" && "Configure your stocktake settings"}
            {step === "counting" && `Item ${currentIndex + 1} of ${items.length}`}
            {step === "review" && "Review variances and complete stocktake"}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Setup Step */}
          {step === "setup" && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4 py-4"
            >
              <div className="space-y-2">
                <Label>Stocktake Name</Label>
                <Input
                  value={setupForm.name}
                  onChange={(e) => setSetupForm({ ...setupForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={setupForm.stocktake_type}
                  onValueChange={(v) => setSetupForm({ ...setupForm, stocktake_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full Stocktake</SelectItem>
                    <SelectItem value="spot">Spot Check</SelectItem>
                    <SelectItem value="category">Category Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  value={setupForm.notes}
                  onChange={(e) => setSetupForm({ ...setupForm, notes: e.target.value })}
                  placeholder="Any notes about this stocktake..."
                />
              </div>
            </motion.div>
          )}

          {/* Counting Step */}
          {step === "counting" && currentItem && (
            <motion.div
              key={`counting-${currentIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 py-4"
            >
              <Progress value={progress} className="h-2" />

              <div className="card-elevated p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-1">{currentItem.ingredient_name}</h3>
                <p className="text-muted-foreground mb-4">
                  Expected: {currentItem.expected_quantity} {currentItem.unit}
                </p>

                <div className="space-y-2">
                  <Label className="text-lg">Counted Quantity</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={currentItem.counted_quantity ?? ""}
                    onChange={(e) => updateCount(e.target.value ? parseFloat(e.target.value) : null)}
                    className="text-center text-2xl h-14 max-w-[200px] mx-auto"
                    placeholder="0"
                    autoFocus
                  />
                  <p className="text-sm text-muted-foreground">{currentItem.unit}</p>
                </div>

                {currentItem.counted_quantity !== null && currentItem.variance !== 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                      "mt-4 p-3 rounded-lg inline-flex items-center gap-2",
                      currentItem.variance > 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                    )}
                  >
                    {currentItem.variance > 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span className="font-medium">
                      Variance: {currentItem.variance > 0 ? "+" : ""}{currentItem.variance.toFixed(1)} {currentItem.unit}
                    </span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* Review Step */}
          {step === "review" && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 py-4"
            >
              <div className="grid grid-cols-3 gap-4">
                <div className="card-elevated p-4 text-center">
                  <p className="text-2xl font-bold">{items.length}</p>
                  <p className="text-sm text-muted-foreground">Items Counted</p>
                </div>
                <div className="card-elevated p-4 text-center border-success">
                  <p className="text-2xl font-bold text-success">+{positiveVariance.length}</p>
                  <p className="text-sm text-muted-foreground">Over Stock</p>
                </div>
                <div className="card-elevated p-4 text-center border-destructive">
                  <p className="text-2xl font-bold text-destructive">-{negativeVariance.length}</p>
                  <p className="text-sm text-muted-foreground">Under Stock</p>
                </div>
              </div>

              {itemsWithVariance.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    Items with Variance
                  </h4>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {itemsWithVariance.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <span className="font-medium">{item.ingredient_name}</span>
                        <Badge
                          variant={item.variance > 0 ? "default" : "destructive"}
                          className="gap-1"
                        >
                          {item.variance > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {item.variance > 0 ? "+" : ""}{item.variance.toFixed(1)} {item.unit}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {itemsWithVariance.length === 0 && (
                <div className="text-center py-8">
                  <Check className="w-12 h-12 text-success mx-auto mb-2" />
                  <p className="font-medium text-success">Perfect Match!</p>
                  <p className="text-sm text-muted-foreground">No variances found</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <DialogFooter className="gap-2">
          {step === "setup" && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={startStocktake} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ClipboardList className="w-4 h-4 mr-2" />}
                Start Counting
              </Button>
            </>
          )}

          {step === "counting" && (
            <>
              <Button variant="outline" onClick={previousItem} disabled={currentIndex === 0}>
                Previous
              </Button>
              <Button onClick={nextItem}>
                {currentIndex < items.length - 1 ? (
                  <>
                    Next <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  "Review"
                )}
              </Button>
            </>
          )}

          {step === "review" && (
            <>
              <Button variant="outline" onClick={() => setStep("counting")}>
                Back to Counting
              </Button>
              <Button onClick={completeStocktake} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                Complete Stocktake
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StocktakeDialog;
