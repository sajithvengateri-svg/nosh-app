import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Factory,
  Scale,
  Package2,
  ShoppingCart,
  Calendar,
  TrendingUp,
  ArrowRight,
  Loader2,
  Beef,
  AlertTriangle,
  Timer,
  CheckCircle2,
  Clock,
  MoreVertical,
  Plus
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import RecipeScaler from "@/components/production/RecipeScaler";
import BatchTracker from "@/components/production/BatchTracker";
import OrderGenerator from "@/components/production/OrderGenerator";
import YieldTestTracker from "@/components/production/YieldTestTracker";
import ExpiryTracker from "@/components/production/ExpiryTracker";
import BatchRestingTracker from "@/components/production/BatchRestingTracker";
import { useProductionStore } from "@/stores/productionStore";
import { useScalableRecipes } from "@/hooks/useScalableRecipes";
import { useProductionBatches } from "@/hooks/useProductionBatches";
import { useProductionExpiry } from "@/hooks/useProductionExpiry";
import { useOrg } from "@/contexts/OrgContext";
import { isHomeCookMode } from "@/lib/shared/modeConfig";
import { cn } from "@/lib/utils";
import { format, differenceInHours, formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

type ProductionView = 'overview' | 'scaling' | 'batches' | 'orders' | 'yield-tests' | 'expiry' | 'resting';
type HomeCookStep = 'choose' | 'scale' | 'done';

const Production = ({ embedded = false }: { embedded?: boolean }) => {
  const [activeView, setActiveView] = useState<ProductionView>('overview');
  const [showScaler, setShowScaler] = useState(false);
  const { storeMode } = useOrg();
  const isHomeCook = isHomeCookMode(storeMode);
  
  // Load recipes from database into the store
  const { isLoading: recipesLoading } = useScalableRecipes();
  
  const { batches: storeBatches, scalableRecipes, generatedOrders } = useProductionStore();
  const { batches: dbBatches, loading: batchesLoading, createBatch, updateStatus } = useProductionBatches();
  const { entries: expiryEntries, loading: expiryLoading, checkEntry, discardEntry } = useProductionExpiry();
  
  const activeBatches = storeBatches.filter(b => b.status === 'in-progress').length;
  const plannedBatches = storeBatches.filter(b => b.status === 'planned').length;
  const pendingOrders = generatedOrders.filter(o => o.status === 'draft').length;

  // ─── HOME COOK: Simplified Production Workflow ───
  if (isHomeCook) {
    const homeCookContent = (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div>
              <h1 className="page-title font-display">Production</h1>
              <p className="page-subtitle">Scale, bake & track your batches</p>
            </div>
            <button onClick={() => setShowScaler(true)} className="btn-primary">
              <Scale className="w-4 h-4 mr-2" />
              New Batch
            </button>
          </motion.div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="stat-card">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Package2 className="w-4 h-4" />
                <span className="text-xs">Total Batches</span>
              </div>
              <p className="stat-value">{dbBatches.length}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="stat-card">
              <div className="flex items-center gap-2 text-success mb-2">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs">Completed</span>
              </div>
              <p className="stat-value">{dbBatches.filter(b => b.status === 'completed').length}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="stat-card">
              <div className="flex items-center gap-2 text-warning mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs">Expiring Soon</span>
              </div>
              <p className="stat-value">
                {expiryEntries.filter(e => {
                  if (e.status === 'discarded' || !e.expires_at) return false;
                  const hrs = differenceInHours(new Date(e.expires_at), new Date());
                  return hrs > 0 && hrs <= 48;
                }).length}
              </p>
            </motion.div>
          </div>

          {/* Recent Batches */}
          <div className="card-elevated p-5">
            <h2 className="section-header mb-4">Recent Batches</h2>
            {batchesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : dbBatches.length === 0 ? (
              <div className="text-center py-8">
                <Package2 className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground mb-3">No batches yet</p>
                <button onClick={() => setShowScaler(true)} className="btn-primary">
                  <Plus className="w-4 h-4 mr-2" /> Log Your First Batch
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {dbBatches.slice(0, 10).map((batch, idx) => (
                  <motion.div
                    key={batch.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="p-4 rounded-xl bg-muted/50 border border-border"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold">{batch.recipe_name}</p>
                        <p className="text-xs font-mono text-muted-foreground">{batch.batch_code}</p>
                      </div>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        batch.status === 'completed' ? 'bg-success/10 text-success' :
                        batch.status === 'in-progress' ? 'bg-warning/10 text-warning' :
                        batch.status === 'discarded' ? 'bg-destructive/10 text-destructive' :
                        'bg-muted text-muted-foreground'
                      )}>
                        {batch.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Qty</p>
                        <p className="font-medium">{batch.quantity} {batch.unit}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Produced</p>
                        <p className="font-medium">{format(new Date(batch.production_date), "dd MMM")}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Expires</p>
                        <p className={cn("font-medium", batch.expiry_date && differenceInHours(new Date(batch.expiry_date), new Date()) <= 48 ? "text-warning" : "text-muted-foreground")}>
                          {batch.expiry_date ? format(new Date(batch.expiry_date), "dd MMM") : "—"}
                        </p>
                      </div>
                    </div>
                    {batch.actual_cost != null && (
                      <div className="mt-2 pt-2 border-t border-border flex justify-between text-sm">
                        <span className="text-muted-foreground">Cost</span>
                        <span className="font-semibold text-primary">${Number(batch.actual_cost).toFixed(2)}</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Expiry Alerts */}
          {expiryEntries.filter(e => e.status !== 'discarded' && e.expires_at).length > 0 && (
            <div className="card-elevated p-5">
              <h2 className="section-header mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                Expiry Tracker
              </h2>
              <div className="space-y-2">
                {expiryEntries
                  .filter(e => e.status !== 'discarded' && e.expires_at)
                  .slice(0, 5)
                  .map((entry) => {
                    const hrs = differenceInHours(new Date(entry.expires_at!), new Date());
                    const isUrgent = hrs <= 24;
                    const isWarning = hrs <= 48;
                    return (
                      <div key={entry.id} className={cn(
                        "p-3 rounded-lg flex items-center justify-between border",
                        isUrgent ? "bg-destructive/5 border-destructive/20" :
                        isWarning ? "bg-warning/5 border-warning/20" :
                        "bg-muted/50 border-border"
                      )}>
                        <div>
                          <p className="font-medium text-sm">{entry.recipe_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {entry.batch_code} · {hrs <= 0 ? "Expired" : `${formatDistanceToNow(new Date(entry.expires_at!))} left`}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => checkEntry(entry.id, "Checked")}
                            className="px-2 py-1 rounded text-xs bg-primary/10 text-primary hover:bg-primary/20"
                          >
                            ✓ Check
                          </button>
                          <button
                            onClick={() => discardEntry(entry.id)}
                            className="px-2 py-1 rounded text-xs bg-destructive/10 text-destructive hover:bg-destructive/20"
                          >
                            Discard
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Recipe Scaler Modal */}
          <RecipeScaler
            isOpen={showScaler}
            onClose={() => setShowScaler(false)}
            onBatchCreated={createBatch}
          />
        </div>
    );
    if (embedded) return homeCookContent;
    return <AppLayout>{homeCookContent}</AppLayout>;
  }

  // ─── PROFESSIONAL MODE: Original Production Page ───
  const views = [
    { id: 'overview' as const, label: 'Overview', icon: Factory },
    { id: 'scaling' as const, label: 'Recipe Scaling', icon: Scale },
    { id: 'batches' as const, label: 'Batch Tracking', icon: Package2 },
    { id: 'orders' as const, label: 'Order Generation', icon: ShoppingCart },
    { id: 'yield-tests' as const, label: 'Yield Tests', icon: Beef },
    { id: 'expiry' as const, label: 'Expiry Tracker', icon: AlertTriangle },
    { id: 'resting' as const, label: 'Resting Timers', icon: Timer },
  ];

  const professionalContent = (
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="page-title font-display">Production Management</h1>
            <p className="page-subtitle">Scale recipes, track batches, generate orders</p>
          </div>
          <button onClick={() => setShowScaler(true)} className="btn-primary">
            <Scale className="w-4 h-4 mr-2" />
            Scale Recipe
          </button>
        </motion.div>

        {/* View Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
        >
          {views.map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                activeView === view.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-secondary"
              )}
            >
              <view.icon className="w-4 h-4" />
              {view.label}
            </button>
          ))}
        </motion.div>

        {/* Overview View */}
        {activeView === 'overview' && (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="stat-card">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Scale className="w-4 h-4" />
                  <span className="text-xs">Scalable Recipes</span>
                </div>
                <p className="stat-value">{scalableRecipes.length}</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="stat-card">
                <div className="flex items-center gap-2 text-warning mb-2">
                  <Package2 className="w-4 h-4" />
                  <span className="text-xs">Active Batches</span>
                </div>
                <p className="stat-value">{activeBatches}</p>
                <p className="text-xs text-muted-foreground">{plannedBatches} planned</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="stat-card">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <ShoppingCart className="w-4 h-4" />
                  <span className="text-xs">Pending Orders</span>
                </div>
                <p className="stat-value">{pendingOrders}</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="stat-card">
                <div className="flex items-center gap-2 text-success mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs">Today's Production</span>
                </div>
                <p className="stat-value">{storeBatches.filter(b => b.status === 'completed').length}</p>
                <p className="text-xs text-muted-foreground">batches completed</p>
              </motion.div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} onClick={() => setShowScaler(true)} className="card-interactive p-5 text-left">
                <div className="p-3 rounded-xl bg-primary/10 w-fit mb-3"><Scale className="w-6 h-6 text-primary" /></div>
                <h3 className="font-semibold mb-1">Scale a Recipe</h3>
                <p className="text-sm text-muted-foreground mb-3">Calculate ingredients for any batch size with yield factors</p>
                <span className="text-sm text-primary font-medium flex items-center gap-1">Open Scaler <ArrowRight className="w-4 h-4" /></span>
              </motion.button>
              <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} onClick={() => setActiveView('batches')} className="card-interactive p-5 text-left">
                <div className="p-3 rounded-xl bg-warning/10 w-fit mb-3"><Package2 className="w-6 h-6 text-warning" /></div>
                <h3 className="font-semibold mb-1">Track Batches</h3>
                <p className="text-sm text-muted-foreground mb-3">Lot codes, production dates, and expiry tracking</p>
                <span className="text-sm text-primary font-medium flex items-center gap-1">View Batches <ArrowRight className="w-4 h-4" /></span>
              </motion.button>
              <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} onClick={() => setActiveView('orders')} className="card-interactive p-5 text-left">
                <div className="p-3 rounded-xl bg-success/10 w-fit mb-3"><ShoppingCart className="w-6 h-6 text-success" /></div>
                <h3 className="font-semibold mb-1">Generate Orders</h3>
                <p className="text-sm text-muted-foreground mb-3">Auto-create purchase orders from prep lists</p>
                <span className="text-sm text-primary font-medium flex items-center gap-1">Create Order <ArrowRight className="w-4 h-4" /></span>
              </motion.button>
            </div>

            <div className="card-elevated p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-header mb-0">Recent Batches</h2>
                <button onClick={() => setActiveView('batches')} className="text-sm text-primary font-medium">View All</button>
              </div>
              <div className="space-y-3">
                {storeBatches.slice(0, 3).map((batch) => (
                  <div key={batch.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-background"><Package2 className="w-4 h-4 text-muted-foreground" /></div>
                      <div>
                        <p className="font-medium">{batch.recipeName}</p>
                        <p className="text-xs text-muted-foreground font-mono">{batch.batchCode}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{batch.quantity} {batch.unit}</p>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        batch.status === 'completed' ? 'bg-success/10 text-success' :
                        batch.status === 'in-progress' ? 'bg-warning/10 text-warning' :
                        'bg-muted text-muted-foreground'
                      )}>{batch.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeView === 'scaling' && (
          <div className="card-elevated p-6">
            <div className="text-center py-8">
              <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto mb-4"><Scale className="w-8 h-8 text-primary" /></div>
              <h3 className="text-lg font-semibold mb-2">Recipe Scaling Tool</h3>
              <p className="text-muted-foreground mb-4">Scale recipes by servings or yield weight with automatic waste calculations</p>
              <button onClick={() => setShowScaler(true)} className="btn-primary"><Scale className="w-4 h-4 mr-2" />Open Recipe Scaler</button>
            </div>
          </div>
        )}

        {activeView === 'batches' && <BatchTracker onCreateBatch={() => setShowScaler(true)} />}
        {activeView === 'orders' && <OrderGenerator />}
        {activeView === 'yield-tests' && <YieldTestTracker />}
        {activeView === 'expiry' && <ExpiryTracker />}
        {activeView === 'resting' && <BatchRestingTracker />}

        <RecipeScaler isOpen={showScaler} onClose={() => setShowScaler(false)} />
      </div>
  );

  if (embedded) return professionalContent;
  return <AppLayout>{professionalContent}</AppLayout>;
};

export default Production;
