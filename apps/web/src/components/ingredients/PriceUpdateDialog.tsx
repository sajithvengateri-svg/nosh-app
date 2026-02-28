import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, TrendingDown, Scale, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriceUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ingredientName: string;
  currentPrice: number;
  currentStock: number;
  unit: string;
  onConfirm: (newPrice: number, method: "direct" | "weighted") => void;
}

const PriceUpdateDialog = ({
  open,
  onOpenChange,
  ingredientName,
  currentPrice,
  currentStock,
  unit,
  onConfirm,
}: PriceUpdateDialogProps) => {
  const [newInvoicePrice, setNewInvoicePrice] = useState<number>(currentPrice);
  const [newQty, setNewQty] = useState<number>(0);
  const [useWeighted, setUseWeighted] = useState(false);

  const weightedPrice = useMemo(() => {
    if (!useWeighted || currentStock <= 0 || newQty <= 0) return newInvoicePrice;
    const totalValue = currentPrice * currentStock + newInvoicePrice * newQty;
    const totalQty = currentStock + newQty;
    return Math.round((totalValue / totalQty) * 100) / 100;
  }, [useWeighted, currentPrice, currentStock, newInvoicePrice, newQty]);

  const finalPrice = useWeighted ? weightedPrice : newInvoicePrice;
  const priceDiff = finalPrice - currentPrice;
  const pricePct = currentPrice > 0 ? ((priceDiff / currentPrice) * 100).toFixed(1) : "0";

  const handleConfirm = () => {
    onConfirm(finalPrice, useWeighted ? "weighted" : "direct");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Update Price — {ingredientName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Current Price */}
          <div className="flex items-center justify-between bg-muted rounded-lg px-4 py-3">
            <span className="text-sm text-muted-foreground">Current Price</span>
            <span className="font-semibold">${currentPrice.toFixed(2)} / {unit}</span>
          </div>

          {/* New Invoice Price */}
          <div className="space-y-2">
            <Label>New Invoice Price ($ / {unit})</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={newInvoicePrice || ""}
              onChange={(e) => setNewInvoicePrice(parseFloat(e.target.value) || 0)}
              autoFocus
            />
          </div>

          {/* Weighted Average Toggle */}
          <div className="border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-primary" />
                <Label htmlFor="weighted-toggle" className="font-medium cursor-pointer">
                  Stock-Weighted Average
                </Label>
              </div>
              <Switch
                id="weighted-toggle"
                checked={useWeighted}
                onCheckedChange={setUseWeighted}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Blends existing stock value with new delivery price for a more accurate cost basis.
            </p>

            {useWeighted && (
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Current Stock ({unit})</Label>
                    <div className="bg-muted px-3 py-2 rounded text-sm font-medium">{currentStock}</div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">New Delivery Qty ({unit})</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={newQty || ""}
                      onChange={(e) => setNewQty(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
                {newQty > 0 && (
                  <div className="text-xs text-muted-foreground bg-secondary/50 rounded p-2">
                    ({currentStock} × ${currentPrice.toFixed(2)}) + ({newQty} × ${newInvoicePrice.toFixed(2)}) ÷ {(currentStock + newQty).toFixed(1)} = <span className="font-semibold text-foreground">${weightedPrice.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Result */}
          <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg px-4 py-3">
            <div>
              <span className="text-xs text-muted-foreground block">New Price</span>
              <span className="font-bold text-lg">${finalPrice.toFixed(2)}</span>
              <span className="text-xs text-muted-foreground"> / {unit}</span>
            </div>
            <div className="text-right">
              {priceDiff !== 0 && (
                <Badge
                  variant="outline"
                  className={cn(
                    "gap-1",
                    priceDiff > 0 ? "text-destructive border-destructive/30" : "text-success border-success/30"
                  )}
                >
                  {priceDiff > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {priceDiff > 0 ? "+" : ""}{pricePct}%
                </Badge>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">
                {useWeighted ? "Weighted avg" : "Direct update"}
              </p>
            </div>
          </div>

          <Button onClick={handleConfirm} className="w-full" disabled={finalPrice <= 0}>
            <ArrowRight className="w-4 h-4 mr-2" /> Confirm Price Update
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PriceUpdateDialog;
