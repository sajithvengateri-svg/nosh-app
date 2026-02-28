import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { MapPin, Bell, Plus, Trash2, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCommunicationRules, useGeofenceLocations, usePublicHolidays } from "@/lib/shared/queries/labourQueries";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  orgId?: string;
}

export default function GeofenceCommSettings({ orgId }: Props) {
  const { data: commRules } = useCommunicationRules(orgId);
  const { data: geofences } = useGeofenceLocations(orgId);
  const { data: publicHolidays } = usePublicHolidays("QLD");
  const queryClient = useQueryClient();

  // Add geofence
  const [showAddGeo, setShowAddGeo] = useState(false);
  const [newGeo, setNewGeo] = useState({ name: "", address: "", radius_meters: "100", is_primary: false });
  const [addingGeo, setAddingGeo] = useState(false);

  // Add comm rule
  const [showAddComm, setShowAddComm] = useState(false);
  const [newComm, setNewComm] = useState({ channel: "SMS", message_type: "ROSTER", allowed_window_start: "07:00", allowed_window_end: "21:00", respect_rtd: true, emergency_override: true });
  const [addingComm, setAddingComm] = useState(false);

  // Add holiday
  const [showAddHoliday, setShowAddHoliday] = useState(false);
  const [newHoliday, setNewHoliday] = useState({ date: "", name: "", state: "QLD", is_national: false });
  const [addingHoliday, setAddingHoliday] = useState(false);

  const handleAddGeofence = async () => {
    if (!orgId || !newGeo.name) return;
    setAddingGeo(true);
    try {
      const { error } = await supabase.from("geofence_locations").insert({
        org_id: orgId,
        name: newGeo.name,
        address: newGeo.address || null,
        radius_meters: parseInt(newGeo.radius_meters) || 100,
        is_primary: newGeo.is_primary,
        is_active: true,
      });
      if (error) throw error;
      toast.success("Geofence added");
      setShowAddGeo(false);
      setNewGeo({ name: "", address: "", radius_meters: "100", is_primary: false });
      queryClient.invalidateQueries({ queryKey: ["geofence-locations"] });
    } catch {
      toast.error("Failed to add geofence");
    } finally {
      setAddingGeo(false);
    }
  };

  const handleDeleteGeofence = async (id: string) => {
    try {
      await supabase.from("geofence_locations").update({ is_active: false }).eq("id", id);
      toast.success("Geofence deactivated");
      queryClient.invalidateQueries({ queryKey: ["geofence-locations"] });
    } catch {
      toast.error("Failed to remove geofence");
    }
  };

  const handleAddCommRule = async () => {
    if (!orgId) return;
    setAddingComm(true);
    try {
      const { error } = await supabase.from("communication_rules").insert({
        org_id: orgId,
        channel: newComm.channel,
        message_type: newComm.message_type,
        allowed_window_start: newComm.allowed_window_start,
        allowed_window_end: newComm.allowed_window_end,
        respect_rtd: newComm.respect_rtd,
        emergency_override: newComm.emergency_override,
      });
      if (error) throw error;
      toast.success("Communication rule added");
      setShowAddComm(false);
      queryClient.invalidateQueries({ queryKey: ["communication-rules"] });
    } catch {
      toast.error("Failed to add rule");
    } finally {
      setAddingComm(false);
    }
  };

  const handleDeleteCommRule = async (id: string) => {
    try {
      await supabase.from("communication_rules").delete().eq("id", id);
      toast.success("Rule removed");
      queryClient.invalidateQueries({ queryKey: ["communication-rules"] });
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleAddHoliday = async () => {
    if (!newHoliday.date || !newHoliday.name) return;
    setAddingHoliday(true);
    try {
      const { error } = await supabase.from("public_holidays").insert({
        date: newHoliday.date,
        name: newHoliday.name,
        state: newHoliday.state,
        is_national: newHoliday.is_national,
      });
      if (error) throw error;
      toast.success("Holiday added");
      setShowAddHoliday(false);
      setNewHoliday({ date: "", name: "", state: "QLD", is_national: false });
      queryClient.invalidateQueries({ queryKey: ["public-holidays"] });
    } catch {
      toast.error("Failed to add holiday");
    } finally {
      setAddingHoliday(false);
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    try {
      await supabase.from("public_holidays").delete().eq("id", id);
      toast.success("Holiday removed");
      queryClient.invalidateQueries({ queryKey: ["public-holidays"] });
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="space-y-6">
      {/* Public Holidays */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Public Holidays ({publicHolidays?.length ?? 0})
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setShowAddHoliday(true)}>
            <Plus className="w-4 h-4 mr-1" /> Add Holiday
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {showAddHoliday && (
            <div className="p-3 rounded-lg border border-border space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Date</Label>
                  <Input type="date" value={newHoliday.date} onChange={e => setNewHoliday(p => ({ ...p, date: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Name</Label>
                  <Input placeholder="e.g. ANZAC Day" value={newHoliday.name} onChange={e => setNewHoliday(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">State</Label>
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={newHoliday.state} onChange={e => setNewHoliday(p => ({ ...p, state: e.target.value }))}>
                    {["QLD", "NSW", "VIC", "SA", "WA", "TAS", "NT", "ACT"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex items-end gap-2 pb-1">
                  <Switch checked={newHoliday.is_national} onCheckedChange={v => setNewHoliday(p => ({ ...p, is_national: v }))} />
                  <Label className="text-xs">National</Label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowAddHoliday(false)}>Cancel</Button>
                <Button size="sm" onClick={handleAddHoliday} disabled={addingHoliday}>Add</Button>
              </div>
            </div>
          )}
          {!publicHolidays?.length ? (
            <p className="text-sm text-muted-foreground text-center py-4">No public holidays loaded.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>National</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {publicHolidays.map(h => (
                    <TableRow key={h.id}>
                      <TableCell className="font-medium text-foreground">{h.date}</TableCell>
                      <TableCell>{h.name}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{h.state}</Badge></TableCell>
                      <TableCell>{h.is_national ? "✅" : "—"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteHoliday(h.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Geofences */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Clock-In Geofences ({geofences?.length ?? 0})
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setShowAddGeo(true)}>
            <Plus className="w-4 h-4 mr-1" /> Add Location
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {showAddGeo && (
            <div className="p-3 rounded-lg border border-border space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Name</Label>
                  <Input placeholder="e.g. Main Venue" value={newGeo.name} onChange={e => setNewGeo(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Address</Label>
                  <Input placeholder="123 Street" value={newGeo.address} onChange={e => setNewGeo(p => ({ ...p, address: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Radius (m)</Label>
                  <Input type="number" value={newGeo.radius_meters} onChange={e => setNewGeo(p => ({ ...p, radius_meters: e.target.value }))} />
                </div>
                <div className="flex items-end gap-2 pb-1">
                  <Switch checked={newGeo.is_primary} onCheckedChange={v => setNewGeo(p => ({ ...p, is_primary: v }))} />
                  <Label className="text-xs">Primary</Label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowAddGeo(false)}>Cancel</Button>
                <Button size="sm" onClick={handleAddGeofence} disabled={addingGeo}>Add</Button>
              </div>
            </div>
          )}
          {!geofences?.length ? (
            <p className="text-sm text-muted-foreground text-center py-4">No geofence locations configured.</p>
          ) : (
            <div className="space-y-2">
              {geofences.map(g => (
                <div key={g.id} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                  <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-foreground">{g.name}</div>
                    {g.address && <p className="text-sm text-muted-foreground">{g.address}</p>}
                    <div className="text-xs text-muted-foreground mt-1">
                      Radius: {g.radius_meters}m
                      {g.is_primary && <Badge variant="default" className="ml-2 text-xs">Primary</Badge>}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteGeofence(g.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Communication Rules */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-4 h-4" /> Right to Disconnect — Communication Rules ({commRules?.length ?? 0})
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setShowAddComm(true)}>
            <Plus className="w-4 h-4 mr-1" /> Add Rule
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {showAddComm && (
            <div className="p-3 rounded-lg border border-border space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Channel</Label>
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={newComm.channel} onChange={e => setNewComm(p => ({ ...p, channel: e.target.value }))}>
                    <option value="SMS">SMS</option>
                    <option value="EMAIL">Email</option>
                    <option value="PUSH">Push Notification</option>
                    <option value="IN_APP">In-App</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Message Type</Label>
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={newComm.message_type} onChange={e => setNewComm(p => ({ ...p, message_type: e.target.value }))}>
                    <option value="ROSTER">Roster</option>
                    <option value="SHIFT_REMINDER">Shift Reminder</option>
                    <option value="PAYSLIP">Payslip</option>
                    <option value="GENERAL">General</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Window</Label>
                  <div className="flex gap-1 items-center">
                    <Input type="time" className="text-xs" value={newComm.allowed_window_start} onChange={e => setNewComm(p => ({ ...p, allowed_window_start: e.target.value }))} />
                    <span className="text-xs text-muted-foreground">to</span>
                    <Input type="time" className="text-xs" value={newComm.allowed_window_end} onChange={e => setNewComm(p => ({ ...p, allowed_window_end: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Switch checked={newComm.respect_rtd} onCheckedChange={v => setNewComm(p => ({ ...p, respect_rtd: v }))} />
                  <Label className="text-xs">Respect RTD</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={newComm.emergency_override} onCheckedChange={v => setNewComm(p => ({ ...p, emergency_override: v }))} />
                  <Label className="text-xs">Emergency Override</Label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowAddComm(false)}>Cancel</Button>
                <Button size="sm" onClick={handleAddCommRule} disabled={addingComm}>Add</Button>
              </div>
            </div>
          )}
          {!commRules?.length ? (
            <p className="text-sm text-muted-foreground text-center py-4">No communication rules configured. Right to Disconnect rules will appear here.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Channel</TableHead>
                    <TableHead>Message Type</TableHead>
                    <TableHead>Window</TableHead>
                    <TableHead>RTD</TableHead>
                    <TableHead>Emergency</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commRules.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium text-foreground">{r.channel}</TableCell>
                      <TableCell>{r.message_type}</TableCell>
                      <TableCell className="text-muted-foreground">{r.allowed_window_start} — {r.allowed_window_end}</TableCell>
                      <TableCell>{r.respect_rtd ? "✅" : "—"}</TableCell>
                      <TableCell>{r.emergency_override ? "⚠ Override" : "—"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteCommRule(r.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
