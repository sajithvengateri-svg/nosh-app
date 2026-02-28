import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ChefHat,
  DollarSign,
  CheckCircle2
} from "lucide-react";
import { RecipeCostImpact } from "@/types/costing";
import { cn } from "@/lib/utils";

interface PriceUpdateAlertProps {
  isOpen: boolean;
  onClose: () => void;
  ingredientName: string;
  oldPrice: number;
  newPrice: number;
  impacts: RecipeCostImpact[];
  onConfirm: () => void;
}

const PriceUpdateAlert = ({
  isOpen,
  onClose,
  ingredientName,
  oldPrice,
  newPrice,
  impacts,
  onConfirm,
}: PriceUpdateAlertProps) => {
  const priceChange = newPrice - oldPrice;
  const priceChangePercent = ((newPrice - oldPrice) / oldPrice) * 100;
  const isPriceIncrease = priceChange > 0;
  const overBudgetCount = impacts.filter(i => i.isNowOverBudget).length;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-card rounded-2xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2.5 rounded-xl",
                isPriceIncrease ? "bg-destructive/10" : "bg-success/10"
              )}>
                {isPriceIncrease ? (
                  <TrendingUp className="w-5 h-5 text-destructive" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-success" />
                )}
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold">Price Update</h2>
                <p className="text-sm text-muted-foreground">{ingredientName}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Price Change Summary */}
          <div className="p-5 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Old Price</p>
                <p className="text-xl font-bold text-muted-foreground line-through">
                  ${oldPrice.toFixed(2)}
                </p>
              </div>
              <div className={cn(
                "px-3 py-1 rounded-full flex items-center gap-1",
                isPriceIncrease ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"
              )}>
                {isPriceIncrease ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span className="font-medium">
                  {isPriceIncrease ? "+" : ""}{priceChangePercent.toFixed(1)}%
                </span>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">New Price</p>
                <p className="text-xl font-bold text-foreground">
                  ${newPrice.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Impact Alert */}
          {overBudgetCount > 0 && (
            <div className="p-4 bg-warning/10 border-b border-warning/20">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">
                    {overBudgetCount} recipe{overBudgetCount > 1 ? "s" : ""} will exceed food cost target
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Consider adjusting portion sizes or sell prices
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Affected Recipes */}
          <div className="p-5">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Affected Recipes ({impacts.length})
            </h3>
            <div className="space-y-2">
              {impacts.map((impact) => (
                <div 
                  key={impact.recipeId}
                  className={cn(
                    "p-3 rounded-lg border",
                    impact.isNowOverBudget 
                      ? "bg-destructive/5 border-destructive/20" 
                      : "bg-muted/50 border-border"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ChefHat className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">{impact.recipeName}</span>
                    </div>
                    {impact.isNowOverBudget && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                        Over Budget
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Cost Change</p>
                      <p className={cn(
                        "font-medium",
                        impact.costChange > 0 ? "text-destructive" : "text-success"
                      )}>
                        {impact.costChange > 0 ? "+" : ""}${impact.costChange.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">New Cost</p>
                      <p className="font-medium">${impact.newCost.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Food Cost %</p>
                      <p className={cn(
                        "font-medium",
                        impact.isNowOverBudget ? "text-destructive" : "text-foreground"
                      )}>
                        {impact.newFoodCostPercent.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="p-5 border-t border-border flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-input bg-background hover:bg-muted transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 btn-primary"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Update Price
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PriceUpdateAlert;
