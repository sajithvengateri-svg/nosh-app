import { useState, useEffect } from "react";
import { Droplets, DollarSign, Clock, Wine, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useCurrencySymbol } from "@/hooks/useCurrencySymbol";
import { calculateCoravinPourCost, calculatePourCost, calculateCoravinROI } from "@/lib/shared/calculations/bevCost";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";

const CoravinManager = () => {
  const { currentOrg } = useOrg();
  const sym = useCurrencySymbol();
  const orgId = currentOrg?.id;
  const [capsules, setCapsules] = useState<any[]>([]);
  const [openBottles, setOpenBottles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCapsuleDialog, setShowCapsuleDialog] = useState(false);
  const [newCapsule, setNewCapsule] = useState({ capsule_type: "Standard", cost_per_capsule: 12, pours_per_capsule: 15, quantity_in_stock: 6 });

  const load = async () => {
    if (!orgId) return;
    setLoading(true);
    const [capRes, bottleRes] = await Promise.all([
      (supabase as any).from("bev_coravin_capsules").select("*").eq("org_id", orgId),
      (supabase as any).from("bev_open_bottles").select("*, bev_products(name, purchase_price, bottle_size_ml, pour_size_ml, sell_price)").eq("org_id", orgId).eq("is_coravin", true).order("opened_at", { ascending: false }),
    ]);
    setCapsules(capRes.data || []);
    setOpenBottles(bottleRes.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [orgId]);

  const addCapsule = async () => {
    if (!orgId) return;
    const { error } = await (supabase as any).from("bev_coravin_capsules").insert({ org_id: orgId, ...newCapsule });
    if (error) { toast.error("Failed to add capsule"); return; }
    toast.success("Capsule inventory updated");
    setShowCapsuleDialog(false);
    load();
  };

  const totalCapsules = capsules.reduce((s: number, c: any) => s + c.quantity_in_stock, 0);
  const avgCostPerCapsule = capsules.length > 0 ? capsules.reduce((s: number, c: any) => s + c.cost_per_capsule, 0) / capsules.length : 0;
  const avgPoursPerCapsule = capsules.length > 0 ? capsules.reduce((s: number, c: any) => s + c.pours_per_capsule, 0) / capsules.length : 15;

  // ROI: compare standard pour cost vs coravin pour cost across all open bottles
  let totalSavings = 0;
  const bottleAnalysis = openBottles.map((b: any) => {
    const p = b.bev_products;
    if (!p) return { ...b, savings: 0, standardCost: 0, coravinCost: 0 };
    const bottleSize = p.bottle_size_ml || 750;
    const pourSize = p.pour_size_ml || 150;
    const standardCost = calculatePourCost(p.purchase_price, bottleSize, pourSize);
    const coravinCost = calculateCoravinPourCost(p.purchase_price, bottleSize, pourSize, avgCostPerCapsule, avgPoursPerCapsule);
    // Savings only if we served BTG without opening — estimate 3 pours per bottle
    const savings = calculateCoravinROI(standardCost, coravinCost, 3);
    totalSavings += savings;
    const daysOpen = differenceInDays(new Date(), new Date(b.opened_at));
    return { ...b, savings, standardCost, coravinCost, daysOpen };
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Droplets className="w-8 h-8" /> Coravin Manager
          </h1>
          <p className="text-muted-foreground">Gas tracking, ROI analysis & bottle freshness</p>
        </div>
        <Dialog open={showCapsuleDialog} onOpenChange={setShowCapsuleDialog}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Add Capsules</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Gas Capsules</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Type</Label><Input value={newCapsule.capsule_type} onChange={e => setNewCapsule({ ...newCapsule, capsule_type: e.target.value })} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Qty</Label><Input type="number" value={newCapsule.quantity_in_stock} onChange={e => setNewCapsule({ ...newCapsule, quantity_in_stock: +e.target.value })} /></div>
                <div><Label>Cost ({sym})</Label><Input type="number" step="0.01" value={newCapsule.cost_per_capsule} onChange={e => setNewCapsule({ ...newCapsule, cost_per_capsule: +e.target.value })} /></div>
                <div><Label>Pours/cap</Label><Input type="number" value={newCapsule.pours_per_capsule} onChange={e => setNewCapsule({ ...newCapsule, pours_per_capsule: +e.target.value })} /></div>
              </div>
              <Button onClick={addCapsule} className="w-full">Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <Droplets className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
          <p className="text-2xl font-bold">{totalCapsules}</p>
          <p className="text-xs text-muted-foreground">Capsules in stock</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Wine className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
          <p className="text-2xl font-bold">{openBottles.length}</p>
          <p className="text-xs text-muted-foreground">Coravin bottles open</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <DollarSign className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
          <p className="text-2xl font-bold">{sym}{avgCostPerCapsule.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Avg capsule cost</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <DollarSign className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
          <p className="text-2xl font-bold text-primary">{sym}{totalSavings.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Est. ROI savings</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="capsules">
        <TabsList>
          <TabsTrigger value="capsules">Gas Capsules</TabsTrigger>
          <TabsTrigger value="bottles">Open Bottles ({openBottles.length})</TabsTrigger>
          <TabsTrigger value="roi">ROI Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="capsules" className="space-y-3">
          {capsules.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No capsules tracked. Add your Coravin capsule inventory.</CardContent></Card>
          ) : (
            capsules.map(c => (
              <Card key={c.id}>
                <CardContent className="pt-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{c.capsule_type}</p>
                    <p className="text-sm text-muted-foreground">{sym}{c.cost_per_capsule}/capsule · {c.pours_per_capsule} pours/capsule</p>
                  </div>
                  <Badge>{c.quantity_in_stock} in stock</Badge>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="bottles" className="space-y-3">
          {bottleAnalysis.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No Coravin bottles open.</CardContent></Card>
          ) : (
            bottleAnalysis.map((b: any) => (
              <Card key={b.id}>
                <CardContent className="pt-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{b.bev_products?.name || "Unknown"}</p>
                    <p className="text-sm text-muted-foreground">
                      {b.remaining_ml}ml remaining · Opened {format(new Date(b.opened_at), "dd MMM")} · {b.daysOpen}d ago
                    </p>
                  </div>
                  <Badge variant={b.daysOpen > 30 ? "destructive" : b.daysOpen > 14 ? "secondary" : "default"}>
                    {b.daysOpen}d
                  </Badge>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="roi" className="space-y-3">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5" /> Cost Comparison</CardTitle></CardHeader>
            <CardContent>
              {bottleAnalysis.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Open bottles via Coravin to see cost comparison.</p>
              ) : (
                <div className="space-y-3">
                  {bottleAnalysis.filter((b: any) => b.bev_products).map((b: any) => (
                    <div key={b.id} className="flex items-center justify-between border-b border-border pb-2">
                      <div>
                        <p className="font-medium text-sm">{b.bev_products.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Standard: {sym}{b.standardCost.toFixed(2)}/pour · Coravin: {sym}{b.coravinCost.toFixed(2)}/pour
                        </p>
                      </div>
                      <span className={`text-sm font-medium ${b.savings > 0 ? "text-green-600" : "text-muted-foreground"}`}>
                        {b.savings > 0 ? `+${sym}${b.savings.toFixed(2)}` : `${sym}0.00`}
                      </span>
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

export default CoravinManager;
