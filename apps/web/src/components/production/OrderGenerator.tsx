import { useState } from "react";
import { motion } from "framer-motion";
import { 
  ShoppingCart,
  Package,
  AlertTriangle,
  CheckCircle2,
  Download,
  Send,
  Plus,
  TrendingUp,
  Truck
} from "lucide-react";
import { useProductionStore } from "@/stores/productionStore";
import { useCostingStore } from "@/stores/costingStore";
import { PrepTaskWithIngredients, OrderLineItem } from "@/types/production";
import { cn } from "@/lib/utils";

interface OrderGeneratorProps {
  prepListId?: string;
  tasks?: PrepTaskWithIngredients[];
}

const OrderGenerator = ({ prepListId, tasks = [] }: OrderGeneratorProps) => {
  const { aggregateIngredientsFromTasks, generateOrderFromPrepList, generatedOrders } = useProductionStore();
  const { ingredients } = useCostingStore();
  const [showGenerated, setShowGenerated] = useState(false);
  
  // Sample tasks for demo if none provided
  const sampleTasks: PrepTaskWithIngredients[] = tasks.length > 0 ? tasks : [
    {
      id: "task-1",
      task: "Prep Duck Breasts",
      recipeId: "rec-1",
      recipeName: "Pan-Seared Duck Breast",
      quantity: 24,
      unit: "portions",
      scaleFactor: 24,
      assignee: "Maria",
      dueTime: "10:00 AM",
      status: "pending",
      priority: "high",
      ingredients: [
        { ingredientId: "ing-7", name: "Duck Breast", requiredQuantity: 0.5, unit: "lb" },
        { ingredientId: "ing-6", name: "Shallots", requiredQuantity: 0.1, unit: "lb" },
        { ingredientId: "ing-2", name: "Butter", requiredQuantity: 0.05, unit: "lb" },
      ]
    },
    {
      id: "task-2",
      task: "Make Risotto Base",
      recipeId: "rec-3",
      recipeName: "Mushroom Risotto",
      quantity: 32,
      unit: "portions",
      scaleFactor: 8,
      assignee: "James",
      dueTime: "11:00 AM",
      status: "pending",
      priority: "medium",
      ingredients: [
        { ingredientId: "ing-12", name: "Arborio Rice", requiredQuantity: 1, unit: "lb" },
        { ingredientId: "ing-14", name: "Mixed Mushrooms", requiredQuantity: 1, unit: "lb" },
        { ingredientId: "ing-13", name: "Parmesan", requiredQuantity: 0.5, unit: "lb" },
        { ingredientId: "ing-2", name: "Butter", requiredQuantity: 0.25, unit: "lb" },
      ]
    },
  ];

  const aggregated = aggregateIngredientsFromTasks(sampleTasks);

  const handleGenerateOrder = () => {
    const order = generateOrderFromPrepList(prepListId || 'demo', sampleTasks);
    setShowGenerated(true);
  };

  const getUrgencyStyle = (urgency: OrderLineItem['urgency']) => {
    switch (urgency) {
      case 'critical': return 'bg-destructive/10 text-destructive border-destructive/30';
      case 'needed': return 'bg-warning/10 text-warning border-warning/30';
      case 'buffer': return 'bg-muted text-muted-foreground border-border';
    }
  };

  const latestOrder = generatedOrders[generatedOrders.length - 1];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-header mb-0">Order Generator</h2>
          <p className="text-sm text-muted-foreground">Auto-generate orders from prep lists</p>
        </div>
      </div>

      {/* Aggregated Ingredients Preview */}
      <div className="card-elevated overflow-hidden">
        <div className="p-4 bg-muted/50 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium">Aggregated Ingredients from Prep</span>
          </div>
          <span className="text-sm text-muted-foreground">{aggregated.length} items</span>
        </div>

        <div className="divide-y divide-border max-h-72 overflow-y-auto">
          {aggregated.map((item, idx) => {
            const shortfallPercent = item.shortfall > 0 ? (item.shortfall / item.totalRequired) * 100 : 0;
            
            return (
              <div key={idx} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    item.shortfall > 0 ? "bg-warning/10" : "bg-success/10"
                  )}>
                    {item.shortfall > 0 ? (
                      <AlertTriangle className="w-4 h-4 text-warning" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.supplier}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{item.totalRequired.toFixed(2)} {item.unit}</p>
                  {item.shortfall > 0 && (
                    <p className="text-xs text-warning">Need {item.shortfall.toFixed(2)} more</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 bg-muted/30 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">Estimated Order Cost</p>
            <p className="text-lg font-bold text-primary">
              ${aggregated.reduce((sum, i) => sum + i.estimatedCost, 0).toFixed(2)}
            </p>
          </div>
          <button 
            onClick={handleGenerateOrder}
            className="w-full btn-primary"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Generate Purchase Order
          </button>
        </div>
      </div>

      {/* Generated Order Display */}
      {showGenerated && latestOrder && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-elevated overflow-hidden border-2 border-primary/20"
        >
          <div className="p-4 bg-primary/5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ShoppingCart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Generated Order</p>
                <p className="text-xs text-muted-foreground">
                  {latestOrder.items.length} items • {latestOrder.suppliersInvolved.length} supplier(s)
                </p>
              </div>
            </div>
            <span className={cn(
              "px-3 py-1 rounded-full text-xs font-medium",
              latestOrder.status === 'draft' ? "bg-muted text-muted-foreground" : "bg-success/10 text-success"
            )}>
              {latestOrder.status}
            </span>
          </div>

          {/* Order Items */}
          <div className="divide-y divide-border">
            {latestOrder.items.map((item, idx) => (
              <div key={idx} className={cn("p-4 border-l-4", getUrgencyStyle(item.urgency))}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.ingredientName}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Truck className="w-3 h-3" />
                      <span>{item.supplier}</span>
                      <span>•</span>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded",
                        item.urgency === 'critical' ? 'bg-destructive/10 text-destructive' :
                        item.urgency === 'needed' ? 'bg-warning/10 text-warning' :
                        'bg-muted text-muted-foreground'
                      )}>
                        {item.urgency}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{item.orderQuantity.toFixed(2)} {item.unit}</p>
                    <p className="text-sm text-muted-foreground">${item.lineCost.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="p-4 bg-muted/30 border-t border-border">
            <div className="flex items-center justify-between mb-4">
              <p className="font-medium">Total Order Value</p>
              <p className="text-2xl font-bold text-primary">${latestOrder.totalCost.toFixed(2)}</p>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 px-4 py-2.5 rounded-lg border border-input bg-background hover:bg-muted transition-colors font-medium">
                <Download className="w-4 h-4 inline mr-2" />
                Export
              </button>
              <button className="flex-1 btn-primary">
                <Send className="w-4 h-4 mr-2" />
                Send to Supplier
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default OrderGenerator;
