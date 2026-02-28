import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { Tablet, Plus } from "lucide-react";

const ClockDevices = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const { toast } = useToast();
  const [devices, setDevices] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ device_name: "", location_description: "", device_identifier: "", require_photo: true });

  const load = async () => {
    if (!orgId) return;
    const { data } = await supabase.from("clock_devices").select("*").eq("org_id", orgId).order("created_at");
    setDevices(data || []);
  };

  useEffect(() => { load(); }, [orgId]);

  const addDevice = async () => {
    if (!orgId || !form.device_name) return;
    await supabase.from("clock_devices").insert({
      org_id: orgId,
      device_name: form.device_name,
      device_identifier: form.device_identifier || `device-${Date.now()}`,
      location_description: form.location_description,
      require_photo: form.require_photo,
    });
    toast({ title: "Device registered" });
    setShowAdd(false);
    setForm({ device_name: "", location_description: "", device_identifier: "", require_photo: true });
    load();
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Tablet className="w-6 h-6" /> Clock Devices</h1>
          <p className="text-muted-foreground">Registered ClockOS iPads and stations</p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-1" /> Register Device</Button>
      </div>

      {devices.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No devices registered. Add your first ClockOS iPad.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {devices.map((d) => (
            <Card key={d.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-foreground">{d.device_name}</p>
                  <Badge variant={d.is_active ? "default" : "secondary"}>{d.is_active ? "Active" : "Inactive"}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{d.location_description || "No location set"}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Photo: {d.require_photo ? "Required" : "Optional"}</span>
                  <span>ID: {d.device_identifier.slice(0, 12)}...</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Register Clock Device</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Device name (e.g. Kitchen iPad)" value={form.device_name} onChange={(e) => setForm(f => ({ ...f, device_name: e.target.value }))} />
            <Input placeholder="Location (e.g. Kitchen entrance)" value={form.location_description} onChange={(e) => setForm(f => ({ ...f, location_description: e.target.value }))} />
            <Input placeholder="Device identifier (auto-generated if empty)" value={form.device_identifier} onChange={(e) => setForm(f => ({ ...f, device_identifier: e.target.value }))} />
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Require photo on clock-in</span>
              <Switch checked={form.require_photo} onCheckedChange={(c) => setForm(f => ({ ...f, require_photo: c }))} />
            </div>
            <Button className="w-full" onClick={addDevice} disabled={!form.device_name}>Register</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClockDevices;
