import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calculator, 
  DollarSign, 
  Percent, 
  Target,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  X,
  HelpCircle,
  Settings2,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Lightbulb,
} from "lucide-react";
import { calculateReverseCost, calculateSellPriceFromCost, calculateFoodCostPercent } from "@/stores/costingStore";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCalcStore } from "@/stores/calcStore";
import { useCurrencySymbol } from "@/hooks/useCurrencySymbol";

interface FoodCostCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  initialSellPrice?: number;
  initialTargetPercent?: number;
  initialCost?: number;
  embedded?: boolean;
}

type CalculationMode = "reverse" | "forward" | "target";

const HowToUseGuide = () => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const sections = [
    {
      id: "overview",
      icon: Calculator,
      title: "What is this?",
      content: "The Food Cost Calculator helps you work out pricing, margins, and ingredient budgets for your dishes. It has three modes — pick the one that matches what you're trying to figure out.",
    },
    {
      id: "max-cost",
      icon: Target,
      emoji: "🎯",
      title: "Max Cost Mode",
      content: "Use when you already know your sell price and target food cost %. Enter both values and the calculator tells you the maximum you can spend on ingredients per serve. Great for recipe development — set your budget before you start costing.",
      example: "Sell price $32, target 30% → Max ingredient cost = $9.60 per serve",
    },
    {
      id: "set-price",
      icon: DollarSign,
      emoji: "💰",
      title: "Set Price Mode",
      content: "Use when you know your ingredient cost and want to find the right sell price. Enter your actual cost and target %, and the calculator recommends a sell price that hits your margin goal.",
      example: "Ingredient cost $8.50, target 28% → Recommended sell price = $30.36",
    },
    {
      id: "check-percent",
      icon: Percent,
      emoji: "📊",
      title: "Check % Mode",
      content: "Use to verify an existing dish. Enter both the ingredient cost and sell price to see your actual food cost percentage. The calculator tells you if you're on target or over budget, and by how much.",
      example: "Cost $9.20, sell price $28 → Actual food cost = 32.9% (over a 30% target)",
    },
    {
      id: "gst",
      icon: Settings2,
      emoji: "💡",
      title: "GST / Tax",
      content: "Toggle GST on to calculate margins based on ex-GST revenue — the way your accountant sees it. You can customise the GST rate (default 10%). When enabled, all calculations strip tax before computing percentages.",
    },
    {
      id: "servings",
      icon: TrendingUp,
      emoji: "📦",
      title: "Batch / Servings",
      content: "In Max Cost mode, set the number of servings your recipe makes. The calculator shows both the per-serve budget and the total recipe ingredient budget — useful when scaling recipes up or down.",
    },
    {
      id: "sync",
      icon: RefreshCw,
      emoji: "🔄",
      title: "Synced Across Pages",
      content: "Your calculator values are saved automatically and stay in sync wherever you open the calculator — Recipes, Menu Engineering, or the Costing page. Pick up right where you left off.",
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="w-4 h-4 text-primary" />
        <h4 className="font-semibold text-sm">How to Use the Food Cost Calculator</h4>
      </div>
      {sections.map((section) => (
        <button
          key={section.id}
          onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
          className="w-full text-left"
        >
          <div className={cn(
            "p-3 rounded-lg transition-colors",
            expandedSection === section.id ? "bg-primary/10" : "bg-muted/50 hover:bg-muted"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {section.emoji && <span className="text-sm">{section.emoji}</span>}
                <span className="text-sm font-medium text-foreground">{section.title}</span>
              </div>
              {expandedSection === section.id 
                ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> 
                : <ChevronDown className="w-4 h-4 text-muted-foreground" />
              }
            </div>
            {expandedSection === section.id && (
              <div className="mt-2 space-y-2">
                <p className="text-xs text-muted-foreground leading-relaxed">{section.content}</p>
                {section.example && (
                  <div className="p-2 rounded bg-card border border-border">
                    <p className="text-xs font-mono text-primary">{section.example}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </button>
      ))}
      <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 mt-3">
        <div className="flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Pro tip:</span> Open the calculator from any recipe detail page to pre-fill values from that recipe's costing data.
          </p>
        </div>
      </div>
    </div>
  );
};

const FoodCostCalculator = ({ 
  isOpen, 
  onClose,
  initialSellPrice,
  initialTargetPercent,
  initialCost,
  embedded = false,
}: FoodCostCalculatorProps) => {
  const store = useCalcStore();
  const sym = useCurrencySymbol();
  const [showHelp, setShowHelp] = useState(false);
  const [showFullGuide, setShowFullGuide] = useState(false);

  // Sync initial values from props (e.g. from RecipeDetail) into the store when opening
  useEffect(() => {
    if (isOpen) {
      if (initialSellPrice !== undefined && initialSellPrice > 0) store.setSellPrice(initialSellPrice);
      if (initialTargetPercent !== undefined && initialTargetPercent > 0) store.setTargetPercent(initialTargetPercent);
      if (initialCost !== undefined && initialCost > 0) store.setActualCost(initialCost);
    }
  }, [isOpen]);

  const { mode, sellPrice, targetPercent, actualCost, servings, includeGST, gstRate } = store;

  // Calculate ex-GST sell price
  const exGSTSellPrice = includeGST && gstRate > 0 
    ? sellPrice / (1 + gstRate / 100) 
    : sellPrice;
  
  // Calculations based on mode - using ex-GST price
  const reverseResult = calculateReverseCost(exGSTSellPrice, targetPercent, servings);
  const forwardSellPrice = calculateSellPriceFromCost(actualCost, targetPercent);
  const forwardSellPriceWithGST = includeGST && gstRate > 0 
    ? forwardSellPrice * (1 + gstRate / 100) 
    : forwardSellPrice;
  const actualFoodCostPercent = exGSTSellPrice > 0 ? calculateFoodCostPercent(actualCost, exGSTSellPrice) : 0;

  const isOverBudget = actualCost > reverseResult.maxAllowedCost && actualCost > 0;
  const costVariance = actualCost - reverseResult.maxAllowedCost;

  const modes = [
    { id: "reverse" as const, label: "Max Cost", icon: Target, description: "Set price & target % → Get max cost" },
    { id: "forward" as const, label: "Set Price", icon: DollarSign, description: "Set cost & target % → Get sell price" },
    { id: "target" as const, label: "Check %", icon: Percent, description: "Set cost & price → Get actual %" },
  ];

  if (!isOpen) return null;

  const content = (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={cn(
            "bg-card rounded-2xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto",
            embedded && "shadow-none max-h-none"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Calculator className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold">Food Cost Calculator</h2>
                <p className="text-sm text-muted-foreground">Synced across all pages</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Quick Help Popover */}
              <Popover open={showHelp} onOpenChange={setShowHelp}>
                <PopoverTrigger asChild>
                  <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                    <HelpCircle className="w-5 h-5 text-muted-foreground" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Quick Reference</h4>
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="p-2 rounded bg-muted/50">
                        <p className="font-medium text-foreground mb-1">🎯 Max Cost</p>
                        <p>Price + target % → max ingredient spend</p>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <p className="font-medium text-foreground mb-1">💰 Set Price</p>
                        <p>Cost + target % → recommended sell price</p>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <p className="font-medium text-foreground mb-1">📊 Check %</p>
                        <p>Cost + price → actual food cost %</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => { setShowHelp(false); setShowFullGuide(true); }}
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Full Guide
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              {!embedded && (
                <button 
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* Full Guide (expandable) */}
          <AnimatePresence>
            {showFullGuide && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-b border-border"
              >
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">How to Use Guide</span>
                    <button 
                      onClick={() => setShowFullGuide(false)}
                      className="p-1 rounded hover:bg-muted"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                  <HowToUseGuide />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* GST Settings Bar */}
          <div className="px-5 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Switch
                  checked={includeGST}
                  onCheckedChange={store.setIncludeGST}
                  id="gst-toggle"
                />
                <label htmlFor="gst-toggle" className="text-sm font-medium cursor-pointer">
                  Include GST in calculations
                </label>
              </div>
              {includeGST && (
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Settings2 className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Customize GST rate</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={gstRate}
                      onChange={(e) => store.setGstRate(parseFloat(e.target.value) || 0)}
                      className="w-16 h-7 text-sm text-center"
                      min="0"
                      max="50"
                      step="0.5"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
              )}
            </div>
            {includeGST && sellPrice > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Ex-GST price: {sym}{exGSTSellPrice.toFixed(2)} | GST component: {sym}{(sellPrice - exGSTSellPrice).toFixed(2)}
              </p>
            )}
          </div>

          {/* Mode Selector */}
          <div className="p-5 border-b border-border">
            <div className="grid grid-cols-3 gap-2">
              {modes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => store.setMode(m.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-xl transition-all text-center",
                    mode === m.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-secondary text-muted-foreground"
                  )}
                >
                  <m.icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{m.label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">
              {modes.find(m => m.id === mode)?.description}
            </p>
          </div>

          {/* Inputs */}
          <div className="p-5 space-y-4">
            {/* Sell Price Input */}
            {(mode === "reverse" || mode === "target") && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Sell Price (per serving)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="number"
                    value={sellPrice || ""}
                    onChange={(e) => store.setSellPrice(parseFloat(e.target.value) || 0)}
                    placeholder="28.00"
                    className="input-field pl-10 text-lg font-semibold"
                    step="0.01"
                  />
                </div>
              </div>
            )}

            {/* Target Food Cost % */}
            {(mode === "reverse" || mode === "forward") && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Target Food Cost %
                </label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="number"
                    value={targetPercent || ""}
                    onChange={(e) => store.setTargetPercent(parseFloat(e.target.value) || 0)}
                    placeholder="30"
                    className="input-field pl-10 text-lg font-semibold"
                    min="1"
                    max="100"
                    step="0.5"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  {[22, 25, 28, 30, 32, 35].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => store.setTargetPercent(pct)}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium transition-all",
                        targetPercent === pct
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-secondary"
                      )}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actual Cost Input */}
            {(mode === "forward" || mode === "target") && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Actual Ingredient Cost
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="number"
                    value={actualCost || ""}
                    onChange={(e) => store.setActualCost(parseFloat(e.target.value) || 0)}
                    placeholder="8.50"
                    className="input-field pl-10 text-lg font-semibold"
                    step="0.01"
                  />
                </div>
              </div>
            )}

            {/* Servings (for reverse mode) */}
            {mode === "reverse" && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Servings per Recipe
                </label>
                <input
                  type="number"
                  value={servings}
                  onChange={(e) => store.setServings(parseInt(e.target.value) || 1)}
                  min="1"
                  className="input-field text-lg font-semibold"
                />
              </div>
            )}
          </div>

          {/* Results */}
          <div className="p-5 bg-muted/30 border-t border-border space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
              <RefreshCw className="w-4 h-4" />
              <span>Calculated Results</span>
            </div>

            {/* Reverse Mode Results */}
            {mode === "reverse" && sellPrice > 0 && (
              <>
                <div className="card-elevated p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Maximum Allowed Cost</span>
                    <Target className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-3xl font-bold text-primary">
                    {sym}{reverseResult.maxAllowedCost.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    per serving to hit {targetPercent}% food cost
                  </p>
                </div>

                {servings > 1 && (
                  <div className="card-elevated p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Total Recipe Budget</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {sym}{reverseResult.maxIngredientBudget.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      for {servings} servings
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="card-elevated p-3">
                    <p className="text-xs text-muted-foreground">Target Margin</p>
                    <p className="text-lg font-bold text-success">{sym}{reverseResult.targetMargin.toFixed(2)}</p>
                  </div>
                  <div className="card-elevated p-3">
                    <p className="text-xs text-muted-foreground">Margin %</p>
                    <p className="text-lg font-bold text-success">{reverseResult.targetMarginPercent.toFixed(1)}%</p>
                  </div>
                </div>
              </>
            )}

            {/* Forward Mode Results */}
            {mode === "forward" && actualCost > 0 && (
              <>
                <div className="card-elevated p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      Recommended Sell Price {includeGST && "(inc. GST)"}
                    </span>
                    <DollarSign className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-3xl font-bold text-primary">
                    {sym}{forwardSellPriceWithGST.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    to achieve {targetPercent}% food cost
                    {includeGST && ` (ex-GST: ${sym}${forwardSellPrice.toFixed(2)})`}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="card-elevated p-3">
                    <p className="text-xs text-muted-foreground">Your Margin</p>
                    <p className="text-lg font-bold text-success">
                      {sym}{(forwardSellPrice - actualCost).toFixed(2)}
                    </p>
                  </div>
                  <div className="card-elevated p-3">
                    <p className="text-xs text-muted-foreground">Margin %</p>
                    <p className="text-lg font-bold text-success">
                      {(100 - targetPercent).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Target Mode Results */}
            {mode === "target" && sellPrice > 0 && actualCost > 0 && (
              <>
                <div className={cn(
                  "card-elevated p-4 border-2",
                  isOverBudget ? "border-destructive" : "border-success"
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Actual Food Cost %</span>
                    <Percent className={cn("w-4 h-4", isOverBudget ? "text-destructive" : "text-success")} />
                  </div>
                  <p className={cn(
                    "text-3xl font-bold",
                    isOverBudget ? "text-destructive" : "text-success"
                  )}>
                    {actualFoodCostPercent.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isOverBudget ? "Over budget!" : "Within target range"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="card-elevated p-3">
                    <p className="text-xs text-muted-foreground">Actual Margin</p>
                    <p className="text-lg font-bold text-foreground">
                      {sym}{(sellPrice - actualCost).toFixed(2)}
                    </p>
                  </div>
                  <div className="card-elevated p-3">
                    <p className="text-xs text-muted-foreground">Margin %</p>
                    <p className="text-lg font-bold text-foreground">
                      {(100 - actualFoodCostPercent).toFixed(1)}%
                    </p>
                  </div>
                </div>

                {isOverBudget && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm font-medium text-destructive">
                      Cost is {sym}{Math.abs(costVariance).toFixed(2)} over target
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Reduce ingredients or increase sell price to {sym}{calculateSellPriceFromCost(actualCost, targetPercent).toFixed(2)}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
  );

  if (embedded) return content;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        {content}
      </motion.div>
    </AnimatePresence>
  );
};

export default FoodCostCalculator;
