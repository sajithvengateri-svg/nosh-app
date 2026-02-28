import { useState } from "react";
import { motion } from "framer-motion";
import { 
  AlertTriangle,
  Check,
  X,
  Search,
  ChefHat,
  ShieldAlert,
  ShieldCheck,
  Info
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { useMenuStore } from "@/stores/menuStore";
import { ALLERGENS, Allergen } from "@/types/menu";
import { cn } from "@/lib/utils";

const AllergenDashboard = () => {
  const [selectedAllergens, setSelectedAllergens] = useState<Allergen[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { filterDishesByAllergens, getActiveMenu } = useMenuStore();
  const activeMenu = getActiveMenu();
  
  const { safe, unsafe } = filterDishesByAllergens(selectedAllergens);

  const toggleAllergen = (allergen: Allergen) => {
    setSelectedAllergens(prev => 
      prev.includes(allergen)
        ? prev.filter(a => a !== allergen)
        : [...prev, allergen]
    );
  };

  const clearAll = () => setSelectedAllergens([]);

  const filteredSafe = safe.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredUnsafe = unsafe.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="page-title font-display">Allergen Checker</h1>
            <p className="page-subtitle">Select customer allergens to find safe dishes instantly</p>
          </div>
          {selectedAllergens.length > 0 && (
            <button 
              onClick={clearAll}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-input bg-background hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
              Clear All
            </button>
          )}
        </motion.div>

        {/* Allergen Selection */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-elevated p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="w-5 h-5 text-warning" />
            <h2 className="font-semibold">Customer Allergens</h2>
            {selectedAllergens.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-warning/10 text-warning text-xs font-medium">
                {selectedAllergens.length} selected
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-2">
            {ALLERGENS.map(allergen => {
              const isSelected = selectedAllergens.includes(allergen.id);
              
              return (
                <button
                  key={allergen.id}
                  onClick={() => toggleAllergen(allergen.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all",
                    isSelected
                      ? "border-destructive bg-destructive/10"
                      : "border-transparent bg-muted hover:bg-secondary"
                  )}
                >
                  <span className="text-2xl">{allergen.icon}</span>
                  <span className={cn(
                    "text-xs font-medium text-center",
                    isSelected ? "text-destructive" : "text-muted-foreground"
                  )}>
                    {allergen.name}
                  </span>
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 p-0.5 rounded-full bg-destructive">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Results */}
        {selectedAllergens.length > 0 && (
          <>
            {/* Summary */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="grid sm:grid-cols-2 gap-4"
            >
              <div className="card-elevated p-5 border-l-4 border-l-success">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-5 h-5 text-success" />
                  <h3 className="font-semibold">Safe to Order</h3>
                </div>
                <p className="text-3xl font-bold text-success">{safe.length}</p>
                <p className="text-sm text-muted-foreground">dishes available</p>
              </div>
              <div className="card-elevated p-5 border-l-4 border-l-destructive">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <h3 className="font-semibold">Contains Allergens</h3>
                </div>
                <p className="text-3xl font-bold text-destructive">{unsafe.length}</p>
                <p className="text-sm text-muted-foreground">dishes to avoid</p>
              </div>
            </motion.div>

            {/* Search */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search dishes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </motion.div>

            {/* Safe Dishes */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="card-elevated overflow-hidden"
            >
              <div className="p-5 border-b border-border bg-success/5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-success" />
                  <h2 className="font-semibold">Safe Dishes</h2>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  These dishes do not contain any of the selected allergens
                </p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
                {filteredSafe.length === 0 ? (
                  <div className="col-span-full p-8 text-center bg-card">
                    <ChefHat className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground">No safe dishes found</p>
                  </div>
                ) : (
                  filteredSafe.map(item => (
                    <div key={item.id} className="p-4 bg-card hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{item.category}</p>
                        </div>
                        <p className="font-semibold">${item.sellPrice.toFixed(2)}</p>
                      </div>
                      {item.allergens.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.allergens.map(a => {
                            const allergenInfo = ALLERGENS.find(al => al.id === a);
                            return (
                              <span key={a} className="text-sm" title={allergenInfo?.name}>
                                {allergenInfo?.icon}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Unsafe Dishes */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card-elevated overflow-hidden"
            >
              <div className="p-5 border-b border-border bg-destructive/5">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <h2 className="font-semibold">Dishes to Avoid</h2>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  These dishes contain one or more of the selected allergens
                </p>
              </div>
              <div className="divide-y divide-border">
                {filteredUnsafe.length === 0 ? (
                  <div className="p-8 text-center">
                    <Check className="w-12 h-12 text-success/50 mx-auto mb-3" />
                    <p className="text-muted-foreground">All dishes are safe!</p>
                  </div>
                ) : (
                  filteredUnsafe.map(item => {
                    const dangerousAllergens = item.allergens.filter(a => selectedAllergens.includes(a));
                    
                    return (
                      <div key={item.id} className="p-4 flex items-center justify-between hover:bg-destructive/5 transition-colors">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-muted-foreground">{item.category}</span>
                            <span className="text-sm text-destructive">
                              Contains: {dangerousAllergens.map(a => {
                                const info = ALLERGENS.find(al => al.id === a);
                                return `${info?.icon} ${info?.name}`;
                              }).join(', ')}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">${item.sellPrice.toFixed(2)}</p>
                          <div className="p-1.5 rounded-full bg-destructive/10">
                            <X className="w-4 h-4 text-destructive" />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}

        {/* Empty State */}
        {selectedAllergens.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-elevated p-12 text-center"
          >
            <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto mb-4">
              <Info className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Select Customer Allergens</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Click on the allergens above that your customer needs to avoid. 
              We'll instantly show which dishes are safe and which to avoid.
            </p>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
};

export default AllergenDashboard;
