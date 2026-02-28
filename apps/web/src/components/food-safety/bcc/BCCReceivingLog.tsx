import { useState, useEffect, useRef } from "react";
import {
  Package, Plus, CheckCircle2, AlertTriangle, Clock, Camera, Loader2,
  Save, X, Truck, FileText, Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { format } from "date-fns";

interface ReceivingItem {
  name: string;
  qty: string;
  temp: string;
  condition: "pass" | "fail";
}

interface ReceivingLog {
  id: string;
  date: string;
  time: string;
  location: string | null;
  status: string | null;
  receiving_data: any;
  recorded_by_name: string | null;
  notes: string | null;
}

const statusColors: Record<string, string> = {
  pass: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  fail: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function BCCReceivingLog() {
  const { user, canEdit } = useAuth();
  const { currentOrg } = useOrg();
  const hasEdit = canEdit("food-safety");

  const [logs, setLogs] = useState<ReceivingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [mode, setMode] = useState<"manual" | "scan" | "email">("manual");
  const [supplier, setSupplier] = useState("");
  const [items, setItems] = useState<ReceivingItem[]>([{ name: "", qty: "", temp: "", condition: "pass" }]);
  const [checklist, setChecklist] = useState({ packaging_ok: true, temp_ok: true, dates_ok: true, vehicle_clean: true });
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const invoiceRef = useRef<HTMLInputElement>(null);
  const tempPhotoRef = useRef<HTMLInputElement>(null);
  const [tempPhotoIdx, setTempPhotoIdx] = useState<number | null>(null);

  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    fetchLogs();
  }, [currentOrg?.id]);

  const fetchLogs = async () => {
    if (!currentOrg?.id) { setLoading(false); return; }
    setLoading(true);

    const { data } = await supabase
      .from("food_safety_logs")
      .select("*")
      .eq("org_id", currentOrg.id)
      .eq("log_type", "receiving")
      .order("date", { ascending: false })
      .order("time", { ascending: false })
      .limit(100);

    setLogs((data || []) as ReceivingLog[]);
    setLoading(false);
  };

  const todayLogs = logs.filter(l => l.date === today);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleInvoiceScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsExtracting(true);
    try {
      const base64 = await fileToBase64(file);
      const { data, error } = await supabase.functions.invoke("extract-invoice", {
        body: { image_base64: base64, file_type: file.type, existing_ingredients: [] },
      });
      if (error) throw error;
      if (data?.items?.length > 0) {
        setItems(data.items.map((item: any) => ({
          name: item.name || "", qty: String(item.quantity || ""), temp: "", condition: "pass" as const,
        })));
        if (data.supplier) setSupplier(data.supplier);
        toast.success(`AI extracted ${data.items.length} items`);
      } else {
        toast.error("Could not extract items from photo");
      }
    } catch {
      toast.error("Failed to extract invoice data");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleTempPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || tempPhotoIdx === null) return;
    try {
      const base64 = await fileToBase64(file);
      const { data, error } = await supabase.functions.invoke("read-temp-display", {
        body: { image_base64: base64, file_type: file.type },
      });
      if (error) throw error;
      if (data?.temperature !== undefined) {
        const updated = [...items];
        updated[tempPhotoIdx] = { ...updated[tempPhotoIdx], temp: `${data.temperature}°${data.unit || "C"}` };
        setItems(updated);
        toast.success(`AI read: ${data.temperature}°${data.unit || "C"}`);
      }
    } catch {
      toast.error("Failed to read temperature");
    } finally {
      setTempPhotoIdx(null);
    }
  };

  const handleSave = async () => {
    if (!supplier.trim()) { toast.error("Supplier name is required"); return; }
    setSaving(true);

    const allPass = checklist.packaging_ok && checklist.temp_ok && checklist.dates_ok && checklist.vehicle_clean
      && items.every(i => i.condition === "pass");

    const { error } = await supabase.from("food_safety_logs").insert({
      log_type: "receiving",
      location: supplier,
      status: allPass ? "pass" : "fail",
      notes: notes || null,
      recorded_by: user?.id,
      recorded_by_name: user?.email?.split("@")[0] || "Unknown",
      date: today,
      time: new Date().toTimeString().split(" ")[0],
      receiving_data: { supplier, items: items.filter(i => i.name.trim()), ...checklist },
      org_id: currentOrg?.id || null,
    } as any);

    if (error) {
      toast.error("Failed to save receiving log");
    } else {
      toast.success("Receiving log saved");
      resetDialog();
      fetchLogs();
    }
    setSaving(false);
  };

  const resetDialog = () => {
    setDialogOpen(false);
    setMode("manual");
    setSupplier("");
    setItems([{ name: "", qty: "", temp: "", condition: "pass" }]);
    setChecklist({ packaging_ok: true, temp_ok: true, dates_ok: true, vehicle_clean: true });
    setNotes("");
  };

  const CHECKLIST_ITEMS = [
    { key: "packaging_ok" as const, label: "Packaging intact" },
    { key: "temp_ok" as const, label: "Temperature OK" },
    { key: "dates_ok" as const, label: "Use-by dates valid" },
    { key: "vehicle_clean" as const, label: "Vehicle clean" },
  ];

  const INPUT_MODES = [
    { key: "manual" as const, label: "Manual", icon: FileText },
    { key: "scan" as const, label: "Scan Invoice", icon: Camera },
    { key: "email" as const, label: "From Email", icon: Mail },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Package className="w-5 h-5 text-[#000080]" />
            Receiving Log
          </h3>
          <p className="text-sm text-muted-foreground">
            {format(new Date(), "EEEE, d MMMM yyyy")}
          </p>
        </div>
        {hasEdit && (
          <Button size="sm" onClick={() => setDialogOpen(true)} className="gap-1.5 bg-[#000080] hover:bg-[#000080]/90">
            <Plus className="w-4 h-4" /> Log Delivery
          </Button>
        )}
      </div>

      {/* Today's summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card-elevated p-3 text-center">
          <p className="text-xl font-bold">{todayLogs.length}</p>
          <p className="text-xs text-muted-foreground">Deliveries Today</p>
        </div>
        <div className="card-elevated p-3 text-center">
          <p className="text-xl font-bold text-success">{todayLogs.filter(l => l.status === "pass").length}</p>
          <p className="text-xs text-muted-foreground">Passed</p>
        </div>
        <div className="card-elevated p-3 text-center">
          <p className="text-xl font-bold text-destructive">{todayLogs.filter(l => l.status === "fail").length}</p>
          <p className="text-xs text-muted-foreground">Failed</p>
        </div>
      </div>

      {/* Log list */}
      {logs.length === 0 ? (
        <div className="card-elevated p-8 text-center">
          <Truck className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="font-medium">No receiving logs yet</p>
          <p className="text-sm text-muted-foreground">Tap "Log Delivery" to record a delivery</p>
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-2 font-medium">Date</th>
                <th className="text-left p-2 font-medium">Time</th>
                <th className="text-left p-2 font-medium">Supplier</th>
                <th className="text-center p-2 font-medium">Items</th>
                <th className="text-center p-2 font-medium">Status</th>
                <th className="text-left p-2 font-medium">Recorded By</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const rd = log.receiving_data as any;
                const itemCount = rd?.items?.length || 0;
                const displayStatus = log.status || "pass";
                return (
                  <tr key={log.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="p-2">{log.date ? format(new Date(log.date + "T00:00:00"), "dd MMM") : "—"}</td>
                    <td className="p-2 text-muted-foreground">{log.time?.slice(0, 5) || "—"}</td>
                    <td className="p-2 font-medium">{log.location || "—"}</td>
                    <td className="p-2 text-center">
                      <Badge variant="secondary" className="text-xs">{itemCount}</Badge>
                    </td>
                    <td className="p-2 text-center">
                      <Badge variant="outline" className={cn("text-xs capitalize", statusColors[displayStatus] || "")}>
                        {displayStatus}
                      </Badge>
                    </td>
                    <td className="p-2 text-muted-foreground">{log.recorded_by_name || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Hidden file inputs */}
      <input ref={invoiceRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleInvoiceScan} />
      <input ref={tempPhotoRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleTempPhoto} />

      {/* New Delivery Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetDialog(); }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" /> Log Delivery
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Input mode */}
            <div className="flex gap-2">
              {INPUT_MODES.map((m) => (
                <button key={m.key} onClick={() => setMode(m.key)}
                  className={cn("flex-1 flex items-center justify-center gap-1.5 rounded-lg border-2 p-2 text-xs font-medium transition-all",
                    mode === m.key ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-transparent hover:bg-secondary"
                  )}>
                  <m.icon className="w-3.5 h-3.5" />
                  {m.label}
                </button>
              ))}
            </div>

            {/* Scan mode */}
            {mode === "scan" && (
              <Button variant="outline" className="w-full gap-2" onClick={() => invoiceRef.current?.click()} disabled={isExtracting}>
                {isExtracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                {isExtracting ? "Extracting…" : "Take Photo of Invoice / Docket"}
              </Button>
            )}

            {/* Supplier */}
            <div>
              <Label>Supplier</Label>
              <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Supplier name" className="mt-1" />
            </div>

            {/* Items */}
            <div className="space-y-2">
              <Label>Items Received</Label>
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input placeholder="Item" value={item.name} className="flex-1"
                    onChange={(e) => { const u = [...items]; u[i] = { ...u[i], name: e.target.value }; setItems(u); }} />
                  <Input placeholder="Qty" value={item.qty} className="w-16"
                    onChange={(e) => { const u = [...items]; u[i] = { ...u[i], qty: e.target.value }; setItems(u); }} />
                  <Input placeholder="Temp" value={item.temp} className="w-20"
                    onChange={(e) => { const u = [...items]; u[i] = { ...u[i], temp: e.target.value }; setItems(u); }} />
                  <Button size="icon" variant="ghost" className="h-8 w-8"
                    onClick={() => { setTempPhotoIdx(i); tempPhotoRef.current?.click(); }}>
                    <Camera className="w-4 h-4" />
                  </Button>
                  <button
                    onClick={() => { const u = [...items]; u[i] = { ...u[i], condition: u[i].condition === "pass" ? "fail" : "pass" }; setItems(u); }}
                    className={cn("px-2 py-1 rounded text-xs font-medium", item.condition === "pass" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
                    {item.condition === "pass" ? "OK" : "Fail"}
                  </button>
                  {items.length > 1 && (
                    <button onClick={() => setItems(items.filter((_, j) => j !== i))} className="p-1">
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setItems([...items, { name: "", qty: "", temp: "", condition: "pass" }])}>
                <Plus className="w-3 h-3 mr-1" /> Add Item
              </Button>
            </div>

            {/* Checklist */}
            <div className="space-y-2">
              <Label>Receiving Checklist</Label>
              <div className="grid grid-cols-2 gap-2">
                {CHECKLIST_ITEMS.map((check) => (
                  <label key={check.key} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={checklist[check.key]}
                      onCheckedChange={(v) => setChecklist({ ...checklist, [check.key]: !!v })} />
                    {check.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any issues or notes..." className="mt-1" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetDialog}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#000080] hover:bg-[#000080]/90">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Delivery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
