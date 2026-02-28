import { useState, useEffect } from "react";
import { BarChart3, Plus, Wine, Beer, Coffee, Martini } from "lucide-react";
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
import { toast } from "sonner";
import { format } from "date-fns";

const POUR_TYPES = ["standard", "coravin", "draught", "coffee", "comp", "staff_drink"];

const Pours = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const [pours, setPours] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ product_id: "", quantity_ml: 30, pour_type: "standard", sell_price: 0 });

  const load = async () => {
    if (!orgId) return;
    setLoading(true);
    const [poursRes, prodsRes] = await Promise.all([
      (supabase as any).from("bev_pour_events").select("*, bev_products(name)").eq("org_id", orgId).order("created_at", { ascending: false }).limit(50),
      (supabase as any).from("bev_products").select("id, name, purchase_price, bottle_size_ml, pour_size_ml, sell_price").eq("org_id", orgId).order("name"),
    ]);
    setPours(poursRes.data || []);
    setProducts(prodsRes.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [orgId]);

  const logPour = async () => {
    if (!orgId || !form.product_id) return;
    const product = products.find(p => p.id === form.product_id);
    const bottleSize = product?.bottle_size_ml || 750;
    const costPerPour = product ? (product.purchase_price / bottleSize) * form.quantity_ml : 0;
    const sellPrice = form.sell_price || product?.sell_price || 0;
    const gpPerPour = sellPrice - costPerPour;

    const { error } = await (supabase as any).from("bev_pour_events").insert({
      org_id: orgId, product_id: form.product_id, quantity_ml: form.quantity_ml,
      pour_type: form.pour_type, cost_per_pour: costPerPour, sell_price: sellPrice,
      gp_per_pour: gpPerPour, is_coravin_pour: form.pour_type === "coravin",
      shift_date: new Date().toISOString().split("T")[0],
    });
    if (error) { toast.error("Failed to log pour"); return; }
    toast.success("Pour logged!");
    setShowDialog(false);
    setForm({ product_id: "", quantity_ml: 30, pour_type: "standard", sell_price: 0 });
    load();
  };

  const today = new Date().toISOString().split("T")[0];
  const todayPours = pours.filter(p => p.shift_date === today);
  const totalRevenue = todayPours.reduce((s: number, p: any) => s + (p.sell_price || 0), 0);
  const totalCost = todayPours.reduce((s: number, p: any) => s + (p.cost_per_pour || 0), 0);
  const todayGP = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue * 100) : 0;

  const compPours = pours.filter(p => p.pour_type === "comp" || p.pour_type === "staff_drink");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2"><BarChart3 className="w-8 h-8" /> Pours</h1>
          <p className="text-muted-foreground">Pour audit trail, staff accuracy & shift summaries</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Log Pour</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log Pour</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Product</Label>
                <Select value={form.product_id} onValueChange={v => {
                  const p = products.find(x => x.id === v);
                  setForm({ ...form, product_id: v, quantity_ml: p?.pour_size_ml || 30, sell_price: p?.sell_price || 0 });
                }}>
                  <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Quantity (ml)</Label><Input type="number" value={form.quantity_ml} onChange={e => setForm({ ...form, quantity_ml: +e.target.value })} /></div>
                <div><Label>Sell Price ($)</Label><Input type="number" step="0.01" value={form.sell_price} onChange={e => setForm({ ...form, sell_price: +e.target.value })} /></div>
              </div>
              <div>
                <Label>Pour Type</Label>
                <Select value={form.pour_type} onValueChange={v => setForm({ ...form, pour_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{POUR_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button onClick={logPour} className="w-full">Log Pour</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Today summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{todayPours.length}</p><p className="text-xs text-muted-foreground">Today's Pours</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p><p className="text-xs text-muted-foreground">Revenue</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{todayGP.toFixed(1)}%</p><p className="text-xs text-muted-foreground">GP %</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{compPours.length}</p><p className="text-xs text-muted-foreground">Comps/Staff</p></CardContent></Card>
      </div>

      <Tabs defaultValue="trail">
        <TabsList>
          <TabsTrigger value="trail">Audit Trail ({pours.length})</TabsTrigger>
          <TabsTrigger value="comps">Comps & Staff ({compPours.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="trail" className="space-y-2">
          {loading ? (
            <Card><CardContent className="py-6 text-center text-muted-foreground text-sm">Loading...</CardContent></Card>
          ) : pours.length === 0 ? (
            <Card><CardContent className="py-6 text-center text-muted-foreground text-sm">No pours logged yet.</CardContent></Card>
          ) : (
            pours.map(p => (
              <Card key={p.id}>
                <CardContent className="pt-3 pb-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{p.bev_products?.name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.quantity_ml}ml · {p.pour_type.replace("_", " ")} · Cost: ${(p.cost_per_pour || 0).toFixed(2)} · Sell: ${(p.sell_price || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={p.gp_per_pour > 0 ? "default" : "secondary"}>
                      GP ${(p.gp_per_pour || 0).toFixed(2)}
                    </Badge>
                    <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(p.created_at), "dd MMM HH:mm")}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
        <TabsContent value="comps" className="space-y-2">
          {compPours.length === 0 ? (
            <Card><CardContent className="py-6 text-center text-muted-foreground text-sm">No comp or staff drink pours logged.</CardContent></Card>
          ) : (
            compPours.map(p => (
              <Card key={p.id}>
                <CardContent className="pt-3 pb-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{p.bev_products?.name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{p.quantity_ml}ml · {p.pour_type.replace("_", " ")} · Cost: ${(p.cost_per_pour || 0).toFixed(2)}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{format(new Date(p.created_at), "dd MMM HH:mm")}</span>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Pours;
