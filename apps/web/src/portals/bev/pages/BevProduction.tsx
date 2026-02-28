import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FlaskConical, Plus, Beaker, TrendingUp, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { calculatePrebatchCostPerServe, calculateFreshJuiceYield } from "@/lib/shared/calculations/bevCost";
import { toast } from "sonner";
import { format } from "date-fns";

const BevProduction = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const [batches, setBatches] = useState<any[]>([]);
  const [specs, setSpecs] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [batchForm, setBatchForm] = useState({ spec_id: "", volume_ml: 1000, cost: 0, batch_number: "", expires_at: "" });

  // Yield test state
  const [yieldForm, setYieldForm] = useState({ fruitKg: 0, yieldMl: 0 });
  const [yieldResult, setYieldResult] = useState<number | null>(null);

  const load = async () => {
    if (!orgId) return;
    setLoading(true);
    const [batchRes, specRes, prodRes] = await Promise.all([
      (supabase as any).from("bev_prebatch_logs").select("*, bev_cocktail_specs(name, cost_price, sell_price)").eq("org_id", orgId).order("created_at", { ascending: false }).limit(30),
      (supabase as any).from("bev_cocktail_specs").select("id, name, cost_price, sell_price, batch_yield_ml").eq("org_id", orgId).order("name"),
      (supabase as any).from("bev_products").select("id, name, purchase_price, par_level").eq("org_id", orgId).order("name"),
    ]);
    setBatches(batchRes.data || []);
    setSpecs(specRes.data || []);
    setProducts(prodRes.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [orgId]);

  const logBatch = async () => {
    if (!orgId || !batchForm.spec_id) return;
    const { error } = await (supabase as any).from("bev_prebatch_logs").insert({
      org_id: orgId, spec_id: batchForm.spec_id, volume_ml: batchForm.volume_ml,
      cost: batchForm.cost, batch_number: batchForm.batch_number || null,
      expires_at: batchForm.expires_at || null,
    });
    if (error) { toast.error("Failed to log batch"); return; }
    toast.success("Batch logged!");
    setShowBatchDialog(false);
    setBatchForm({ spec_id: "", volume_ml: 1000, cost: 0, batch_number: "", expires_at: "" });
    load();
  };

  const calcYield = () => {
    if (yieldForm.fruitKg > 0 && yieldForm.yieldMl > 0) {
      setYieldResult(calculateFreshJuiceYield(yieldForm.fruitKg, yieldForm.yieldMl));
    }
  };

  // Products below par
  const belowPar = products.filter(p => p.par_level && p.par_level > 0);

  return (
    <div className="p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Production & Scaling</h1>
          <p className="text-sm text-muted-foreground">Pre-batch tracking, spec scaling, and yield tests</p>
        </div>
        <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Log Batch</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log Pre-Batch</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Cocktail Spec</Label>
                <Select value={batchForm.spec_id} onValueChange={v => setBatchForm({ ...batchForm, spec_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select spec" /></SelectTrigger>
                  <SelectContent>{specs.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Volume (ml)</Label><Input type="number" value={batchForm.volume_ml} onChange={e => setBatchForm({ ...batchForm, volume_ml: +e.target.value })} /></div>
                <div><Label>Cost ($)</Label><Input type="number" step="0.01" value={batchForm.cost} onChange={e => setBatchForm({ ...batchForm, cost: +e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Batch #</Label><Input value={batchForm.batch_number} onChange={e => setBatchForm({ ...batchForm, batch_number: e.target.value })} placeholder="e.g. B-001" /></div>
                <div><Label>Expires</Label><Input type="date" value={batchForm.expires_at} onChange={e => setBatchForm({ ...batchForm, expires_at: e.target.value })} /></div>
              </div>
              {batchForm.cost > 0 && batchForm.volume_ml > 0 && (
                <p className="text-sm text-muted-foreground">
                  Cost per 90ml serve: ${calculatePrebatchCostPerServe(batchForm.cost, batchForm.volume_ml, 90).toFixed(2)}
                </p>
              )}
              <Button onClick={logBatch} className="w-full">Log Batch</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <Tabs defaultValue="prebatch">
        <TabsList>
          <TabsTrigger value="prebatch"><Beaker className="w-4 h-4 mr-1" /> Pre-Batches ({batches.length})</TabsTrigger>
          <TabsTrigger value="yield"><TrendingUp className="w-4 h-4 mr-1" /> Yield Tests</TabsTrigger>
          <TabsTrigger value="orders"><ShoppingCart className="w-4 h-4 mr-1" /> Order Suggestions</TabsTrigger>
        </TabsList>

        <TabsContent value="prebatch" className="space-y-3">
          {loading ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card>
          ) : batches.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No batches logged yet. Log your first pre-batch cocktail, syrup, or infusion.</CardContent></Card>
          ) : (
            batches.map(b => {
              const costPerServe = b.volume_ml > 0 ? calculatePrebatchCostPerServe(b.cost, b.volume_ml, 90) : 0;
              const isExpired = b.expires_at && new Date(b.expires_at) < new Date();
              return (
                <Card key={b.id} className={isExpired ? "border-destructive/50" : ""}>
                  <CardContent className="pt-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{b.bev_cocktail_specs?.name || "Batch"} {b.batch_number ? `#${b.batch_number}` : ""}</p>
                      <p className="text-xs text-muted-foreground">
                        {b.volume_ml}ml · ${b.cost.toFixed(2)} total · ${costPerServe.toFixed(2)}/serve
                        {b.expires_at ? ` · Exp: ${format(new Date(b.expires_at), "dd MMM")}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isExpired && <Badge variant="destructive">Expired</Badge>}
                      <span className="text-xs text-muted-foreground">{format(new Date(b.created_at), "dd MMM")}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="yield">
          <Card>
            <CardHeader><CardTitle>Fresh Juice Yield Calculator</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Calculate ml of juice per kg of fruit to track yield consistency.</p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Fruit (kg)</Label><Input type="number" step="0.1" value={yieldForm.fruitKg || ""} onChange={e => setYieldForm({ ...yieldForm, fruitKg: +e.target.value })} placeholder="e.g. 2.5" /></div>
                <div><Label>Juice Yield (ml)</Label><Input type="number" value={yieldForm.yieldMl || ""} onChange={e => setYieldForm({ ...yieldForm, yieldMl: +e.target.value })} placeholder="e.g. 800" /></div>
              </div>
              <Button onClick={calcYield} variant="secondary">Calculate</Button>
              {yieldResult !== null && (
                <div className="p-3 rounded-lg bg-primary/10">
                  <p className="font-medium">Yield: {yieldResult.toFixed(0)} ml/kg</p>
                  <p className="text-xs text-muted-foreground">Industry benchmark for citrus: ~400-500 ml/kg</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-3">
          <Card>
            <CardHeader><CardTitle>Order Suggestions</CardTitle></CardHeader>
            <CardContent>
              {belowPar.length === 0 ? (
                <p className="text-sm text-muted-foreground">Set par levels on your cellar products to see order suggestions.</p>
              ) : (
                <div className="space-y-3">
                  {belowPar.map(p => (
                    <div key={p.id} className="flex items-center justify-between border-b border-border pb-2">
                      <div>
                        <p className="font-medium text-sm">{p.name}</p>
                        <p className="text-xs text-muted-foreground">Par: {p.par_level} · ${p.purchase_price.toFixed(2)}/unit</p>
                      </div>
                      <Badge variant="outline">Order {p.par_level}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BevProduction;
