import { useState, useEffect } from "react";
import { Coffee, Gauge, Timer, Plus } from "lucide-react";
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
import { format, differenceInDays } from "date-fns";

const CoffeeProgram = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const [dialIns, setDialIns] = useState<any[]>([]);
  const [coffeeProducts, setCoffeeProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialInDialog, setShowDialInDialog] = useState(false);
  const [form, setForm] = useState({ product_id: "", dose_g: 18, yield_ml: 36, time_s: 28, grinder_setting: "", tds: "", notes: "" });

  const load = async () => {
    if (!orgId) return;
    setLoading(true);
    const [dialRes, prodsRes] = await Promise.all([
      (supabase as any).from("bev_coffee_dialing").select("*, bev_products(name)").eq("org_id", orgId).order("created_at", { ascending: false }).limit(30),
      (supabase as any).from("bev_products").select("id, name, bev_coffee_details(*)").eq("org_id", orgId).eq("main_category", "coffee").order("name"),
    ]);
    setDialIns(dialRes.data || []);
    setCoffeeProducts(prodsRes.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [orgId]);

  const logDialIn = async () => {
    if (!orgId || !form.product_id) return;
    const { error } = await (supabase as any).from("bev_coffee_dialing").insert({
      org_id: orgId, product_id: form.product_id, dose_g: form.dose_g, yield_ml: form.yield_ml,
      time_s: form.time_s, grinder_setting: form.grinder_setting || null,
      tds: form.tds ? +form.tds : null, notes: form.notes || null,
    });
    if (error) { toast.error("Failed to log dial-in"); return; }
    toast.success("Dial-in logged!");
    setShowDialInDialog(false);
    setForm({ product_id: "", dose_g: 18, yield_ml: 36, time_s: 28, grinder_setting: "", tds: "", notes: "" });
    load();
  };

  // Roast freshness
  const freshness = coffeeProducts
    .filter(p => p.bev_coffee_details?.length && p.bev_coffee_details[0]?.roast_date)
    .map(p => {
      const d = p.bev_coffee_details[0];
      const days = differenceInDays(new Date(), new Date(d.roast_date));
      const status = days <= 7 ? "resting" : days <= 21 ? "optimal" : days <= 35 ? "fading" : "stale";
      return { ...p, days, status, detail: d };
    });

  const FRESHNESS_COLORS: Record<string, string> = { resting: "bg-blue-500", optimal: "bg-green-500", fading: "bg-amber-500", stale: "bg-red-500" };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Coffee className="w-8 h-8" /> Coffee Program
          </h1>
          <p className="text-muted-foreground">Espresso dial-in, roast freshness & brew specs</p>
        </div>
        <Dialog open={showDialInDialog} onOpenChange={setShowDialInDialog}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Log Dial-In</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Espresso Dial-In</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Bean</Label>
                <Select value={form.product_id} onValueChange={v => setForm({ ...form, product_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select bean" /></SelectTrigger>
                  <SelectContent>{coffeeProducts.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Dose (g)</Label><Input type="number" step="0.1" value={form.dose_g} onChange={e => setForm({ ...form, dose_g: +e.target.value })} /></div>
                <div><Label>Yield (ml)</Label><Input type="number" step="0.1" value={form.yield_ml} onChange={e => setForm({ ...form, yield_ml: +e.target.value })} /></div>
                <div><Label>Time (s)</Label><Input type="number" value={form.time_s} onChange={e => setForm({ ...form, time_s: +e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Grinder Setting</Label><Input value={form.grinder_setting} onChange={e => setForm({ ...form, grinder_setting: e.target.value })} /></div>
                <div><Label>TDS</Label><Input type="number" step="0.01" value={form.tds} onChange={e => setForm({ ...form, tds: e.target.value })} placeholder="e.g. 1.35" /></div>
              </div>
              <div><Label>Notes</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Tasting notes..." /></div>
              <Button onClick={logDialIn} className="w-full">Log Dial-In</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="dialin">
        <TabsList>
          <TabsTrigger value="dialin">Dial-In Log ({dialIns.length})</TabsTrigger>
          <TabsTrigger value="freshness">Roast Freshness ({freshness.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="dialin" className="space-y-3">
          {loading ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card>
          ) : dialIns.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No dial-in logs. Log your first espresso extraction.</CardContent></Card>
          ) : (
            dialIns.map(d => {
              const ratio = d.dose_g > 0 ? (d.yield_ml / d.dose_g).toFixed(1) : "—";
              return (
                <Card key={d.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{d.bev_products?.name || "Unknown"}</p>
                        <p className="text-sm text-muted-foreground">
                          {d.dose_g}g → {d.yield_ml}ml in {d.time_s}s · 1:{ratio}
                          {d.grinder_setting ? ` · Grind: ${d.grinder_setting}` : ""}
                          {d.tds ? ` · TDS: ${d.tds}` : ""}
                        </p>
                        {d.notes && <p className="text-xs text-muted-foreground mt-1">{d.notes}</p>}
                      </div>
                      <span className="text-xs text-muted-foreground">{format(new Date(d.created_at), "dd MMM HH:mm")}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="freshness" className="space-y-3">
          {freshness.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Add coffee products with roast dates to track freshness.</CardContent></Card>
          ) : (
            freshness.map(f => (
              <Card key={f.id}>
                <CardContent className="pt-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{f.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {f.detail.roaster || "Unknown roaster"} · Roasted {format(new Date(f.detail.roast_date), "dd MMM yyyy")} · {f.days} days ago
                    </p>
                  </div>
                  <Badge className={`${FRESHNESS_COLORS[f.status]} text-white capitalize`}>{f.status}</Badge>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CoffeeProgram;
