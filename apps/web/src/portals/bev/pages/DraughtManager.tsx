import { useState, useEffect } from "react";
import { Beer, Droplets, ClipboardCheck, Plus, Gauge, Scan } from "lucide-react";
import BevLabelScanner from "../components/BevLabelScanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { calculateKegYield } from "@/lib/shared/calculations/bevCost";
import { toast } from "sonner";
import { format } from "date-fns";

const DraughtManager = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const [kegs, setKegs] = useState<any[]>([]);
  const [cleaningLogs, setCleaningLogs] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [showTapDialog, setShowTapDialog] = useState(false);
  const [showCleanDialog, setShowCleanDialog] = useState(false);
  const [newKeg, setNewKeg] = useState({ product_id: "", tap_number: 1, theoretical_pours: 120 });
  const [newClean, setNewClean] = useState({ line_number: 1, chemical_used: "BeerClean", cleaned_by: "" });

  const load = async () => {
    if (!orgId) return;
    setLoading(true);
    const [kegsRes, cleanRes, prodsRes] = await Promise.all([
      (supabase as any).from("bev_keg_tracking").select("*, bev_products(name)").eq("org_id", orgId).is("kicked_at", null).order("tapped_at", { ascending: false }),
      (supabase as any).from("bev_line_cleaning_log").select("*").eq("org_id", orgId).order("cleaned_at", { ascending: false }).limit(20),
      (supabase as any).from("bev_products").select("id, name").eq("org_id", orgId).eq("main_category", "beer").order("name"),
    ]);
    setKegs(kegsRes.data || []);
    setCleaningLogs(cleanRes.data || []);
    setProducts(prodsRes.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [orgId]);

  const tapKeg = async () => {
    if (!orgId || !newKeg.product_id) return;
    const { error } = await (supabase as any).from("bev_keg_tracking").insert({
      org_id: orgId, product_id: newKeg.product_id, tap_number: newKeg.tap_number,
      theoretical_pours: newKeg.theoretical_pours, tapped_at: new Date().toISOString(),
    });
    if (error) { toast.error("Failed to tap keg"); return; }
    toast.success("Keg tapped!");
    setShowTapDialog(false);
    setNewKeg({ product_id: "", tap_number: 1, theoretical_pours: 120 });
    load();
  };

  const kickKeg = async (id: string, actualPours: number, theoreticalPours: number) => {
    const yieldPct = calculateKegYield(theoreticalPours, actualPours);
    const { error } = await (supabase as any).from("bev_keg_tracking").update({
      kicked_at: new Date().toISOString(), actual_pours: actualPours, yield_pct: yieldPct,
    }).eq("id", id);
    if (error) { toast.error("Failed to kick keg"); return; }
    toast.success(`Keg kicked — ${yieldPct.toFixed(1)}% yield`);
    load();
  };

  const logCleaning = async () => {
    if (!orgId) return;
    const nextDue = new Date();
    nextDue.setDate(nextDue.getDate() + 7);
    const { error } = await (supabase as any).from("bev_line_cleaning_log").insert({
      org_id: orgId, line_number: newClean.line_number, chemical_used: newClean.chemical_used,
      cleaned_by: newClean.cleaned_by || null, next_due: nextDue.toISOString(),
    });
    if (error) { toast.error("Failed to log cleaning"); return; }
    toast.success("Line cleaning logged");
    setShowCleanDialog(false);
    setNewClean({ line_number: 1, chemical_used: "BeerClean", cleaned_by: "" });
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Beer className="w-8 h-8" /> Draught Manager
          </h1>
          <p className="text-muted-foreground">Keg tracking, line cleaning & yield analysis</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setScannerOpen(true)}>
            <Scan className="w-4 h-4 mr-2" /> Scan Beer Label
          </Button>
          <Dialog open={showCleanDialog} onOpenChange={setShowCleanDialog}>
            <DialogTrigger asChild><Button variant="outline"><ClipboardCheck className="w-4 h-4 mr-2" /> Log Cleaning</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Log Line Cleaning</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Line Number</Label><Input type="number" value={newClean.line_number} onChange={e => setNewClean({ ...newClean, line_number: +e.target.value })} /></div>
                <div><Label>Chemical Used</Label><Input value={newClean.chemical_used} onChange={e => setNewClean({ ...newClean, chemical_used: e.target.value })} /></div>
                <div><Label>Cleaned By</Label><Input value={newClean.cleaned_by} onChange={e => setNewClean({ ...newClean, cleaned_by: e.target.value })} placeholder="Name" /></div>
                <Button onClick={logCleaning} className="w-full">Log Cleaning</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showTapDialog} onOpenChange={setShowTapDialog}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Tap Keg</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Tap a Keg</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Product</Label>
                  <Select value={newKeg.product_id} onValueChange={v => setNewKeg({ ...newKeg, product_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select beer" /></SelectTrigger>
                    <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Tap Number</Label><Input type="number" value={newKeg.tap_number} onChange={e => setNewKeg({ ...newKeg, tap_number: +e.target.value })} /></div>
                <div><Label>Theoretical Pours</Label><Input type="number" value={newKeg.theoretical_pours} onChange={e => setNewKeg({ ...newKeg, theoretical_pours: +e.target.value })} /></div>
                <Button onClick={tapKeg} className="w-full">Tap Keg</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="kegs">
        <TabsList>
          <TabsTrigger value="kegs">Active Kegs ({kegs.length})</TabsTrigger>
          <TabsTrigger value="cleaning">Line Cleaning</TabsTrigger>
        </TabsList>

        <TabsContent value="kegs" className="space-y-4">
          {loading ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card>
          ) : kegs.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No active kegs. Tap a keg to start tracking.</CardContent></Card>
          ) : (
            kegs.map(k => {
              const yieldPct = k.theoretical_pours > 0 ? (k.actual_pours / k.theoretical_pours) * 100 : 0;
              return (
                <Card key={k.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">{k.bev_products?.name || "Unknown"}</p>
                        <p className="text-sm text-muted-foreground">
                          Tap {k.tap_number} · Tapped {format(new Date(k.tapped_at), "dd MMM")} · {k.actual_pours}/{k.theoretical_pours} pours
                        </p>
                      </div>
                      <Button size="sm" variant="destructive" onClick={() => kickKeg(k.id, k.actual_pours, k.theoretical_pours)}>
                        Kick Keg
                      </Button>
                    </div>
                    <Progress value={yieldPct} className="h-2" />
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="cleaning" className="space-y-4">
          {cleaningLogs.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No cleaning logs yet. Log your first line clean.</CardContent></Card>
          ) : (
            cleaningLogs.map(c => (
              <Card key={c.id}>
                <CardContent className="pt-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">Line {c.line_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(c.cleaned_at), "dd MMM yyyy HH:mm")} · {c.chemical_used || "—"} {c.cleaned_by ? `· by ${c.cleaned_by}` : ""}
                    </p>
                  </div>
                  {c.next_due && (
                    <Badge variant={new Date(c.next_due) < new Date() ? "destructive" : "secondary"}>
                      Due {format(new Date(c.next_due), "dd MMM")}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <BevLabelScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        scanType="beer_label"
        title="Beer Label Scanner"
        onDataExtracted={(data) => { console.log("Beer scan:", data); toast.success("Beer label scanned!"); load(); }}
      />
    </div>
  );
};

export default DraughtManager;
