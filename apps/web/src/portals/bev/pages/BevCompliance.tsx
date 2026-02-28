import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Thermometer, Droplets, SprayCan, ClipboardList, Plus } from "lucide-react";
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

const TEMP_LOCATIONS = [
  { name: "Cellar", min: 12, max: 16 },
  { name: "Fridge", min: 2, max: 4 },
  { name: "Glycol System", min: 0, max: 2 },
  { name: "Glass Washer Rinse", min: 65, max: 90 },
];

const BevCompliance = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const [logs, setLogs] = useState<any[]>([]);
  const [cleaningLogs, setCleaningLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTempDialog, setShowTempDialog] = useState(false);
  const [tempForm, setTempForm] = useState({ location: "Cellar", temperature: 0 });

  const load = async () => {
    if (!orgId) return;
    setLoading(true);
    const [logsRes, cleanRes] = await Promise.all([
      supabase.from("food_safety_logs").select("*").eq("org_id", orgId).order("created_at", { ascending: false }).limit(30),
      (supabase as any).from("bev_line_cleaning_log").select("*").eq("org_id", orgId).order("cleaned_at", { ascending: false }).limit(10),
    ]);
    setLogs(logsRes.data || []);
    setCleaningLogs(cleanRes.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [orgId]);

  const logTemp = async () => {
    if (!orgId) return;
    const loc = TEMP_LOCATIONS.find(l => l.name === tempForm.location);
    const pass = loc ? tempForm.temperature >= loc.min && tempForm.temperature <= loc.max : true;
    const { error } = await supabase.from("food_safety_logs").insert({
      org_id: orgId, log_type: "temperature", location: tempForm.location,
      readings: { value: tempForm.temperature, unit: "C" } as any,
      status: pass ? "pass" : "fail", recorded_by_name: "Bar Manager",
    });
    if (error) { toast.error(error.message); return; }
    toast.success(pass ? "Temperature logged ✓" : "⚠️ Temperature out of range!");
    setShowTempDialog(false);
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Beverage Compliance</h1>
          <p className="text-sm text-muted-foreground">Temperature logs, line cleaning, and duty rosters</p>
        </div>
        <Dialog open={showTempDialog} onOpenChange={setShowTempDialog}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Log Temp</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log Temperature</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Location</Label>
                <Select value={tempForm.location} onValueChange={v => setTempForm({ ...tempForm, location: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TEMP_LOCATIONS.map(l => <SelectItem key={l.name} value={l.name}>{l.name} ({l.min}-{l.max}°C)</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Temperature (°C)</Label><Input type="number" step="0.1" value={tempForm.temperature} onChange={e => setTempForm({ ...tempForm, temperature: +e.target.value })} /></div>
              <Button onClick={logTemp} className="w-full">Log Temperature</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <Tabs defaultValue="temps">
        <TabsList>
          <TabsTrigger value="temps"><Thermometer className="w-4 h-4 mr-1" /> Temps ({logs.length})</TabsTrigger>
          <TabsTrigger value="lines"><Droplets className="w-4 h-4 mr-1" /> Line Cleaning ({cleaningLogs.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="temps" className="space-y-2">
          {/* Temp standards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {TEMP_LOCATIONS.map(l => (
              <Card key={l.name}><CardContent className="pt-3 pb-3 text-center">
                <p className="text-xs font-medium">{l.name}</p>
                <p className="text-lg font-bold">{l.min}-{l.max}°C</p>
              </CardContent></Card>
            ))}
          </div>
          {logs.length === 0 ? (
            <Card><CardContent className="py-6 text-center text-muted-foreground text-sm">No temperature logs. Start logging cellar and fridge temps.</CardContent></Card>
          ) : (
            logs.filter(l => l.log_type === "temperature").map(l => (
              <Card key={l.id}>
                <CardContent className="pt-3 pb-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{l.location}</p>
                    <p className="text-xs text-muted-foreground">{l.readings ? `${(l.readings as any).value}°C` : "—"} · {format(new Date(l.created_at), "dd MMM HH:mm")}</p>
                  </div>
                  <Badge variant={l.status === "pass" ? "default" : "destructive"}>{l.status}</Badge>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
        <TabsContent value="lines" className="space-y-2">
          {cleaningLogs.length === 0 ? (
            <Card><CardContent className="py-6 text-center text-muted-foreground text-sm">No line cleaning logs. Log cleans via the Draught Manager.</CardContent></Card>
          ) : (
            cleaningLogs.map(c => (
              <Card key={c.id}>
                <CardContent className="pt-3 pb-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Line {c.line_number}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(c.cleaned_at), "dd MMM yyyy HH:mm")} · {c.chemical_used || "—"}</p>
                  </div>
                  {c.next_due && <Badge variant={new Date(c.next_due) < new Date() ? "destructive" : "secondary"}>Due {format(new Date(c.next_due), "dd MMM")}</Badge>}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BevCompliance;
