import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Package2,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Plus,
  Filter,
  MoreVertical
} from "lucide-react";
import { useProductionStore } from "@/stores/productionStore";
import { ProductionBatch } from "@/types/production";
import { cn } from "@/lib/utils";

interface BatchTrackerProps {
  onCreateBatch?: () => void;
}

const BatchTracker = ({ onCreateBatch }: BatchTrackerProps) => {
  const { batches, updateBatchStatus } = useProductionStore();
  const [statusFilter, setStatusFilter] = useState<ProductionBatch['status'] | 'all'>('all');

  const filteredBatches = statusFilter === 'all' 
    ? batches 
    : batches.filter(b => b.status === statusFilter);

  const getStatusStyle = (status: ProductionBatch['status']) => {
    switch (status) {
      case 'completed': return 'bg-success/10 text-success';
      case 'in-progress': return 'bg-warning/10 text-warning';
      case 'planned': return 'bg-primary/10 text-primary';
      case 'discarded': return 'bg-destructive/10 text-destructive';
    }
  };

  const getExpiryStatus = (expiryDate: Date) => {
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { label: 'Expired', style: 'text-destructive' };
    if (daysUntilExpiry === 0) return { label: 'Expires today', style: 'text-destructive' };
    if (daysUntilExpiry === 1) return { label: 'Expires tomorrow', style: 'text-warning' };
    return { label: `${daysUntilExpiry} days left`, style: 'text-muted-foreground' };
  };

  const statusOptions: { value: ProductionBatch['status'] | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'planned', label: 'Planned' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'discarded', label: 'Discarded' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-header mb-0">Production Batches</h2>
          <p className="text-sm text-muted-foreground">Track batch codes, dates, and expiry</p>
        </div>
        <button onClick={onCreateBatch} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          New Batch
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {statusOptions.map(option => (
          <button
            key={option.value}
            onClick={() => setStatusFilter(option.value)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              statusFilter === option.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-secondary"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Batches List */}
      <div className="space-y-3">
        {filteredBatches.length === 0 ? (
          <div className="card-elevated p-8 text-center">
            <Package2 className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">No batches found</p>
          </div>
        ) : (
          filteredBatches.map((batch, index) => {
            const expiry = getExpiryStatus(batch.expiryDate);
            
            return (
              <motion.div
                key={batch.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="card-elevated p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Package2 className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">{batch.recipeName}</p>
                        <span className={cn("text-xs px-2 py-0.5 rounded-full", getStatusStyle(batch.status))}>
                          {batch.status.replace('-', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-primary font-mono">{batch.batchCode}</p>
                    </div>
                  </div>
                  <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Package2 className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Quantity</p>
                      <p className="font-medium">{batch.quantity} {batch.unit}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Produced</p>
                      <p className="font-medium">{batch.productionDate.toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className={cn("w-4 h-4", expiry.style)} />
                    <div>
                      <p className="text-xs text-muted-foreground">Expiry</p>
                      <p className={cn("font-medium", expiry.style)}>{expiry.label}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Produced By</p>
                      <p className="font-medium">{batch.producedBy}</p>
                    </div>
                  </div>
                </div>

                {batch.actualCost && (
                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Actual Cost</p>
                    <p className="font-semibold text-primary">${batch.actualCost.toFixed(2)}</p>
                  </div>
                )}

                {/* Quick Actions */}
                {batch.status !== 'completed' && batch.status !== 'discarded' && (
                  <div className="mt-3 pt-3 border-t border-border flex gap-2">
                    {batch.status === 'planned' && (
                      <button 
                        onClick={() => updateBatchStatus(batch.id, 'in-progress')}
                        className="flex-1 px-3 py-2 rounded-lg bg-warning/10 text-warning text-sm font-medium hover:bg-warning/20 transition-colors"
                      >
                        Start Production
                      </button>
                    )}
                    {batch.status === 'in-progress' && (
                      <button 
                        onClick={() => updateBatchStatus(batch.id, 'completed')}
                        className="flex-1 px-3 py-2 rounded-lg bg-success/10 text-success text-sm font-medium hover:bg-success/20 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4 inline mr-1" />
                        Mark Complete
                      </button>
                    )}
                    <button 
                      onClick={() => updateBatchStatus(batch.id, 'discarded')}
                      className="px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors"
                    >
                      <AlertCircle className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BatchTracker;
