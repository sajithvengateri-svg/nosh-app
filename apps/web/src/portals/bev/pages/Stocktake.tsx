import { useState, useEffect, useMemo } from "react";
import { Layers, Plus, AlertTriangle, Trash2, Scan, TrendingDown, DollarSign, Martini, Calculator } from "lucide-react";
import { Link } from "react-router-dom";
import BevCostCalculator from "../components/BevCostCalculator";
import BevLabelScanner from "../components/BevLabelScanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";
import { format } from "date-fns";

const LOCATIONS = ["Back Bar", "Under Bar", "Cellar", "Walk-in", "Store Room"];
const WASTE_REASONS = ["breakage", "spillage", "expired", "quality", "comp", "staff_drink", "over_pour"];
const DEAD_STOCK_WARNING_DAYS = 30;
const DEAD_STOCK_CRITICAL_DAYS = 60;

const Stocktake = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const [stocktakes, setStocktakes] = useState<any[]>([]);
  const [wasteEvents, setWasteEvents] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [pourEvents, setPourEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [showWasteDialog, setShowWasteDialog] = useState(false);
  const [newSt, setNewSt] = useState({ location: "Back Bar", count_type: "full", notes: "" });
  const [newWaste, setNewWaste] = useState({ product_id: "", quantity_ml: 0, reason: "breakage", cost: 0 });

  const load = async () => {
    if (!orgId) return;
    setLoading(true);
    const [stRes, wasteRes, prodsRes, poursRes] = await Promise.all([
      (supabase as any).from("bev_stocktakes").select("*").eq("org_id", orgId).order("date", { ascending: false }).limit(20),
      (supabase as any).from("bev_waste_events").select("*, bev_products(name)").eq("org_id", orgId).order("created_at", { ascending: false }).limit(20),
      (supabase as any).from("bev_products").select("id, name, purchase_price, main_category").eq("org_id", orgId).order("name"),
      (supabase as any).from("bev_pour_events").select("product_id, created_at").eq("org_id", orgId).order("created_at", { ascending: false }),
    ]);
    setStocktakes(stRes.data || []);
    setWasteEvents(wasteRes.data || []);
    setProducts(prodsRes.data || []);
    setPourEvents(poursRes.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [orgId]);

  const createStocktake = async () => {
    if (!orgId) return;
    const { error } = await (supabase as any).from("bev_stocktakes").insert({
      org_id: orgId, location: newSt.location, count_type: newSt.count_type,
      notes: newSt.notes || null, status: "in_progress",
    });
    if (error) { toast.error("Failed to create stocktake"); return; }
    toast.success("Stocktake started!");
    setShowNewDialog(false);
    setNewSt({ location: "Back Bar", count_type: "full", notes: "" });
    load();
  };

  const logWaste = async () => {
    if (!orgId || !newWaste.product_id) return;
    const product = products.find(p => p.id === newWaste.product_id);
    const cost = newWaste.cost || (product ? (product.purchase_price / 750) * newWaste.quantity_ml : 0);
    const { error } = await (supabase as any).from("bev_waste_events").insert({
      org_id: orgId, product_id: newWaste.product_id, quantity_ml: newWaste.quantity_ml,
      reason: newWaste.reason, cost,
    });
    if (error) { toast.error("Failed to log waste"); return; }
    toast.success("Waste event logged");
    setShowWasteDialog(false);
    setNewWaste({ product_id: "", quantity_ml: 0, reason: "breakage", cost: 0 });
    load();
  };

  const totalWasteCost = wasteEvents.reduce((sum: number, w: any) => sum + (w.cost || 0), 0);

  // Dead stock calculation
  const deadStockItems = useMemo(() => {
    const now = new Date();
    // Build map of latest pour per product
    const latestPourMap = new Map<string, Date>();
    for (const pe of pourEvents) {
      const existing = latestPourMap.get(pe.product_id);
      const d = new Date(pe.created_at);
      if (!existing || d > existing) latestPourMap.set(pe.product_id, d);
    }
    return products.map(p => {
      const lastPour = latestPourMap.get(p.id);
      const daysSinceLastPour = lastPour
        ? Math.floor((now.getTime() - lastPour.getTime()) / (1000 * 60 * 60 * 24))
        : Infinity;
      const severity: "ok" | "warning" | "critical" =
        daysSinceLastPour >= DEAD_STOCK_CRITICAL_DAYS ? "critical"
        : daysSinceLastPour >= DEAD_STOCK_WARNING_DAYS ? "warning"
        : "ok";
      return { ...p, lastPour, daysSinceLastPour, severity };
    }).filter(p => p.severity !== "ok").sort((a, b) => b.daysSinceLastPour - a.daysSinceLastPour);
  }, [products, pourEvents]);

  const totalDeadStockValue = deadStockItems.reduce((s, p) => s + (p.purchase_price || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Layers className="w-8 h-8" /> Stocktake
          </h1>
          <p className="text-muted-foreground">Guided counts, variance reporting & waste logging</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setScannerOpen(true)}>
            <Scan className="w-4 h-4 mr-2" /> Scan Barcode
          </Button>
          <Dialog open={showWasteDialog} onOpenChange={setShowWasteDialog}>
            <DialogTrigger asChild><Button variant="outline"><Trash2 className="w-4 h-4 mr-2" /> Log Waste</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Log Waste / Breakage</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Product</Label>
                  <Select value={newWaste.product_id} onValueChange={v => setNewWaste({ ...newWaste, product_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                    <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Quantity (ml)</Label><Input type="number" value={newWaste.quantity_ml} onChange={e => setNewWaste({ ...newWaste, quantity_ml: +e.target.value })} /></div>
                <div>
                  <Label>Reason</Label>
                  <Select value={newWaste.reason} onValueChange={v => setNewWaste({ ...newWaste, reason: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{WASTE_REASONS.map(r => <SelectItem key={r} value={r}>{r.replace("_", " ")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button onClick={logWaste} className="w-full">Log Waste</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> New Stocktake</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Start Stocktake</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Location</Label>
                  <Select value={newSt.location} onValueChange={v => setNewSt({ ...newSt, location: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{LOCATIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Count Type</Label>
                  <Select value={newSt.count_type} onValueChange={v => setNewSt({ ...newSt, count_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full Count</SelectItem>
                      <SelectItem value="partial">Partial Count</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Notes</Label><Textarea value={newSt.notes} onChange={e => setNewSt({ ...newSt, notes: e.target.value })} placeholder="Optional notes..." /></div>
                <Button onClick={createStocktake} className="w-full">Start Stocktake</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="counts">
        <TabsList>
          <TabsTrigger value="counts">Stocktakes ({stocktakes.length})</TabsTrigger>
          <TabsTrigger value="waste">Waste / Breakage</TabsTrigger>
          <TabsTrigger value="dead-stock">
            Dead Stock {deadStockItems.length > 0 && <Badge variant="destructive" className="ml-1.5 text-[10px] px-1.5 py-0">{deadStockItems.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="calc"><Calculator className="w-4 h-4 mr-1" /> Calculator</TabsTrigger>
        </TabsList>

        <TabsContent value="counts" className="space-y-3">
          {loading ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card>
          ) : stocktakes.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No stocktakes recorded. Start a guided count by location.</CardContent></Card>
          ) : (
            stocktakes.map(st => (
              <Card key={st.id}>
                <CardContent className="pt-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{st.location || "All locations"} — {st.count_type}</p>
                    <p className="text-sm text-muted-foreground">{format(new Date(st.date), "dd MMM yyyy")} {st.notes ? ` · ${st.notes}` : ""}</p>
                  </div>
                  <Badge variant={st.status === "completed" ? "default" : "secondary"}>{st.status}</Badge>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="waste" className="space-y-3">
          {totalWasteCost > 0 && (
            <Card className="border-destructive/50">
              <CardContent className="pt-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <span className="font-medium">Total waste cost: ${totalWasteCost.toFixed(2)}</span>
              </CardContent>
            </Card>
          )}
          {wasteEvents.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No waste events logged.</CardContent></Card>
          ) : (
            wasteEvents.map(w => (
              <Card key={w.id}>
                <CardContent className="pt-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{w.bev_products?.name || "Unknown"}</p>
                    <p className="text-sm text-muted-foreground">
                      {w.quantity_ml}ml · {w.reason.replace("_", " ")} · ${(w.cost || 0).toFixed(2)}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{format(new Date(w.created_at), "dd MMM HH:mm")}</span>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="dead-stock" className="space-y-3">
          {totalDeadStockValue > 0 && (
            <Card className="border-destructive/50">
              <CardContent className="pt-4 flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-destructive" />
                <span className="font-medium">~${totalDeadStockValue.toFixed(0)} tied up in dead stock</span>
                <span className="text-xs text-muted-foreground ml-auto">{deadStockItems.length} product{deadStockItems.length !== 1 ? "s" : ""}</span>
              </CardContent>
            </Card>
          )}
          {deadStockItems.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No dead stock — all products have recent pours 🎉</CardContent></Card>
          ) : (
            deadStockItems.map(item => (
              <Card key={item.id} className={item.severity === "critical" ? "border-destructive/30" : "border-amber-500/30"}>
                <CardContent className="pt-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{item.name}</p>
                      <Badge variant={item.severity === "critical" ? "destructive" : "secondary"} className="text-[10px]">
                        {item.severity === "critical" ? "60+ days" : "30-60 days"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.daysSinceLastPour === Infinity ? "Never poured" : `Last poured ${item.daysSinceLastPour} days ago`}
                      {" · "}${(item.purchase_price || 0).toFixed(2)}
                      {" · "}{item.main_category}
                    </p>
                  </div>
                  <Link to="/bev/cocktails" className="flex items-center gap-1 text-xs text-primary hover:underline whitespace-nowrap">
                    <Martini className="w-3.5 h-3.5" /> Create Spec
                  </Link>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
        <TabsContent value="calc">
          <BevCostCalculator isOpen={true} onClose={() => {}} embedded />
        </TabsContent>
      </Tabs>

      <BevLabelScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        scanType="barcode"
        title="QR / Barcode Scanner"
        onDataExtracted={(data) => { console.log("Barcode scan:", data); toast.success("Barcode scanned!"); load(); }}
      />
    </div>
  );
};

export default Stocktake;
