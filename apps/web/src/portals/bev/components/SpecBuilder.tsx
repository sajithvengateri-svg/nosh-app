import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Calculator, AlertTriangle, CheckCircle2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useOrg } from "@/contexts/OrgContext";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  purchase_price: number;
  bottle_size_ml: number | null;
  pour_size_ml: number | null;
  pours_per_unit: number | null;
}

interface SpecIngredient {
  id?: string;
  product_id: string | null;
  quantity_ml: number;
  unit: string;
  cost: number;
  product?: Product;
}

interface SpecBuilderProps {
  specId: string;
  sellPrice: number;
  targetBevCostPercent?: number;
  onCostUpdate?: (totalCost: number) => void;
}

const units = ["ml", "dash", "barspoon", "each", "drop", "rinse", "top", "splash"];

const SpecBuilder = ({ specId, sellPrice, targetBevCostPercent = 22, onCostUpdate }: SpecBuilderProps) => {
  const { currentOrg } = useOrg();
  const [products, setProducts] = useState<Product[]>([]);
  const [specIngredients, setSpecIngredients] = useState<SpecIngredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [newIng, setNewIng] = useState({ product_id: "", quantity_ml: 0, unit: "ml" });

  useEffect(() => { fetchData(); }, [specId]);

  const fetchData = async () => {
    setLoading(true);
    const [prodRes, ingRes] = await Promise.all([
      (supabase as any).from("bev_products").select("id, name, purchase_price, bottle_size_ml, pour_size_ml, pours_per_unit")
        .eq("org_id", currentOrg?.id).order("name"),
      (supabase as any).from("bev_cocktail_ingredients").select("*").eq("spec_id", specId),
    ]);
    const prods = (prodRes.data || []) as Product[];
    setProducts(prods);

    const enriched = (ingRes.data || []).map((ri: any) => {
      const prod = prods.find(p => p.id === ri.product_id);
      return { ...ri, product: prod, cost: ri.cost || calcCost(prod, ri.quantity_ml) };
    });
    setSpecIngredients(enriched);
    setLoading(false);
  };

  const calcCost = (prod: Product | undefined, qty: number) => {
    if (!prod || !prod.bottle_size_ml || prod.bottle_size_ml === 0) return 0;
    return (Number(prod.purchase_price) / prod.bottle_size_ml) * qty;
  };

  const calculations = useMemo(() => {
    const totalCost = specIngredients.reduce((s, ri) => s + (ri.cost || 0), 0);
    const bevCostPercent = sellPrice > 0 ? (totalCost / sellPrice) * 100 : 0;
    const margin = sellPrice - totalCost;
    const marginPercent = sellPrice > 0 ? (margin / sellPrice) * 100 : 0;
    let alertStatus: "ok" | "high" | "critical" = "ok";
    if (bevCostPercent > targetBevCostPercent + 5) alertStatus = "critical";
    else if (bevCostPercent > targetBevCostPercent) alertStatus = "high";
    return { totalCost, bevCostPercent, margin, marginPercent, alertStatus };
  }, [specIngredients, sellPrice, targetBevCostPercent]);

  useEffect(() => { onCostUpdate?.(calculations.totalCost); }, [calculations.totalCost]);

  const addIngredient = async () => {
    if (!newIng.product_id || newIng.quantity_ml <= 0) { toast.error("Select a product and enter quantity"); return; }
    const prod = products.find(p => p.id === newIng.product_id);
    const cost = calcCost(prod, newIng.quantity_ml);

    const { error } = await (supabase as any).from("bev_cocktail_ingredients").insert({
      spec_id: specId, product_id: newIng.product_id, quantity_ml: newIng.quantity_ml,
      unit: newIng.unit, cost, org_id: currentOrg?.id,
    });
    if (error) { toast.error("Failed to add product"); return; }
    toast.success("Product added to spec");
    setNewIng({ product_id: "", quantity_ml: 0, unit: "ml" });
    fetchData();
  };

  const removeIngredient = async (id: string) => {
    const { error } = await (supabase as any).from("bev_cocktail_ingredients").delete().eq("id", id);
    if (error) { toast.error("Failed to remove"); return; }
    toast.success("Removed");
    fetchData();
  };

  const alertStyles = {
    ok: { bg: "bg-emerald-500/10", border: "border-emerald-500", text: "text-emerald-600", label: "On Target" },
    high: { bg: "bg-amber-500/10", border: "border-amber-500", text: "text-amber-600", label: "Above Target" },
    critical: { bg: "bg-destructive/10", border: "border-destructive", text: "text-destructive", label: "Over Budget" },
  };
  const alert = alertStyles[calculations.alertStatus];

  return (
    <div className="space-y-6">
      {/* Cost Summary */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className={cn("card-elevated p-5 border-l-4", alert.border)}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2"><Calculator className="w-5 h-5" /> Bev Cost Analysis</h3>
          <div className={cn("flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium", alert.bg, alert.text)}>
            {calculations.alertStatus === "critical" ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            {alert.label}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Total Cost</p>
            <p className="text-xl font-bold">${calculations.totalCost.toFixed(2)}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Sell Price</p>
            <p className="text-xl font-bold">${sellPrice.toFixed(2)}</p>
          </div>
          <div className={cn("p-3 rounded-lg", alert.bg)}>
            <p className="text-xs text-muted-foreground">Bev Cost %</p>
            <p className={cn("text-xl font-bold", alert.text)}>{calculations.bevCostPercent.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Target: {targetBevCostPercent}%</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10">
            <p className="text-xs text-muted-foreground">GP Margin</p>
            <p className="text-xl font-bold text-primary">${calculations.margin.toFixed(2)} ({calculations.marginPercent.toFixed(1)}%)</p>
          </div>
        </div>
      </motion.div>

      {/* Ingredients Table */}
      <div className="card-elevated overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">Product Breakdown</h3>
          <p className="text-sm text-muted-foreground">Prices linked to cellar products</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium w-24">Qty</th>
                <th className="px-4 py-3 font-medium w-24">Unit</th>
                <th className="px-4 py-3 font-medium w-28">Cost</th>
                <th className="px-4 py-3 font-medium w-20">% Total</th>
                <th className="px-4 py-3 font-medium w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {specIngredients.map(ri => {
                const pct = calculations.totalCost > 0 ? ((ri.cost || 0) / calculations.totalCost) * 100 : 0;
                return (
                  <tr key={ri.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{ri.product?.name || "Unknown"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">{ri.quantity_ml}</td>
                    <td className="px-4 py-3 text-sm">{ri.unit}</td>
                    <td className="px-4 py-3 font-mono text-sm">${(ri.cost || 0).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-10">{pct.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => removeIngredient(ri.id!)}
                        className="p-1 rounded hover:bg-destructive/10 transition-colors">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {/* Add Row */}
              <tr className="bg-muted/20">
                <td className="px-4 py-3">
                  <Select value={newIng.product_id} onValueChange={v => setNewIng({ ...newIng, product_id: v })}>
                    <SelectTrigger className="h-8"><SelectValue placeholder="Select product" /></SelectTrigger>
                    <SelectContent>
                      {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3">
                  <Input type="number" className="h-8 w-20" value={newIng.quantity_ml || ""}
                    onChange={e => setNewIng({ ...newIng, quantity_ml: Number(e.target.value) })} placeholder="30" />
                </td>
                <td className="px-4 py-3">
                  <Select value={newIng.unit} onValueChange={v => setNewIng({ ...newIng, unit: v })}>
                    <SelectTrigger className="h-8 w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </td>
                <td colSpan={3} className="px-4 py-3">
                  <Button size="sm" onClick={addIngredient} className="h-8">
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SpecBuilder;
