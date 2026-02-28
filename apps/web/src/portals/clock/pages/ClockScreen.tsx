import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { Delete, Camera, CheckCircle2, Clock, Coffee, LogOut, AlertTriangle, MapPin, UserCog, ShieldAlert } from "lucide-react";

type ClockState = "IDLE" | "IDENTIFYING" | "CLOCK_IN" | "CLOCK_OUT" | "ON_BREAK" | "CONFIRMED";

interface StaffInfo {
  user_id: string;
  full_name: string;
  classification: string;
  activeShift: any | null;
  onBreak: boolean;
}

interface ComplianceGate {
  type: "ok" | "warning" | "blocked";
  gapHours: number;
  lastClockOut: string;
  overtimeUntil?: string;
}

interface GeofenceResult {
  status: "ON_SITE" | "REMOTE" | "LOW_ACCURACY" | "UNAVAILABLE";
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  matchedLocation?: string;
}

const CLASSIFICATIONS = [
  "FB_INTRO", "FB_1", "FB_2", "FB_3", "FB_4", "FB_5",
  "K_INTRO", "K_1", "K_2", "K_3",
  "COOK_1", "COOK_2", "COOK_3", "COOK_4", "COOK_5",
];

const ClockScreen = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const { toast } = useToast();
  const [pin, setPin] = useState("");
  const [now, setNow] = useState(new Date());
  const [state, setState] = useState<ClockState>("IDLE");
  const [staffInfo, setStaffInfo] = useState<StaffInfo | null>(null);
  const [clockedInStaff, setClockedInStaff] = useState<string[]>([]);
  const [confirmData, setConfirmData] = useState<{ action: string; time: string } | null>(null);
  const [showForgotPin, setShowForgotPin] = useState(false);

  // Compliance gate state
  const [complianceGate, setComplianceGate] = useState<ComplianceGate | null>(null);
  const [gateAcknowledged, setGateAcknowledged] = useState(false);
  const [managerPin, setManagerPin] = useState("");
  const [managerOverrideReason, setManagerOverrideReason] = useState("");

  // Geofence state
  const [geoResult, setGeoResult] = useState<GeofenceResult | null>(null);
  const [remoteReason, setRemoteReason] = useState("");

  // Role change state
  const [showRoleChange, setShowRoleChange] = useState(false);
  const [newRole, setNewRole] = useState("");

  // Live clock
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Load currently clocked-in staff
  useEffect(() => {
    if (!orgId) return;
    const loadActive = async () => {
      const { data } = await supabase
        .from("clock_shifts")
        .select("user_id")
        .eq("org_id", orgId)
        .eq("status", "ACTIVE");
      if (data) {
        const userIds = data.map((s: any) => s.user_id);
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, full_name")
            .in("user_id", userIds);
          setClockedInStaff(profiles?.map((p: any) => p.full_name) || []);
        } else {
          setClockedInStaff([]);
        }
      }
    };
    loadActive();
  }, [orgId, state]);

  // Check 10-hour compliance gap
  const checkComplianceGap = async (userId: string): Promise<ComplianceGate> => {
    if (!orgId) return { type: "ok", gapHours: 99, lastClockOut: "" };

    const { data: lastShift } = await supabase
      .from("clock_shifts")
      .select("clock_out")
      .eq("org_id", orgId)
      .eq("user_id", userId)
      .eq("status", "COMPLETED")
      .not("clock_out", "is", null)
      .order("clock_out", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!lastShift?.clock_out) return { type: "ok", gapHours: 99, lastClockOut: "" };

    const lastOut = new Date(lastShift.clock_out);
    const gapMs = Date.now() - lastOut.getTime();
    const gapHours = gapMs / 3600000;

    if (gapHours >= 10) {
      return { type: "ok", gapHours, lastClockOut: lastShift.clock_out };
    } else if (gapHours >= 8) {
      const overtimeHours = 10 - gapHours;
      const overtimeUntilMs = lastOut.getTime() + 10 * 3600000;
      return {
        type: "warning",
        gapHours,
        lastClockOut: lastShift.clock_out,
        overtimeUntil: format(new Date(overtimeUntilMs), "h:mm a"),
      };
    } else {
      return { type: "blocked", gapHours, lastClockOut: lastShift.clock_out };
    }
  };

  // Geofence check
  const checkGeofence = async (): Promise<GeofenceResult> => {
    if (!orgId) return { status: "UNAVAILABLE" };

    // Check if this is a registered iPad (skip GPS)
    const isRegisteredDevice = false; // TODO: check device_id against clock_devices
    if (isRegisteredDevice) return { status: "ON_SITE" };

    // Request GPS
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ status: "UNAVAILABLE" });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;

          if (accuracy > 200) {
            resolve({ status: "LOW_ACCURACY", latitude, longitude, accuracy });
            return;
          }

          // Check against geofence_locations
          const { data: geofences } = await supabase
            .from("geofence_locations")
            .select("*")
            .eq("org_id", orgId)
            .eq("is_active", true);

          if (!geofences?.length) {
            resolve({ status: "ON_SITE", latitude, longitude, accuracy }); // No geofences = allow
            return;
          }

          // Check distance to each geofence
          for (const gf of geofences) {
            const dist = haversineDistance(latitude, longitude, gf.latitude, gf.longitude);
            if (dist <= gf.radius_meters) {
              resolve({ status: "ON_SITE", latitude, longitude, accuracy, matchedLocation: gf.name });
              return;
            }
          }

          resolve({ status: "REMOTE", latitude, longitude, accuracy });
        },
        () => resolve({ status: "UNAVAILABLE" }),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  const handleDigit = (d: string) => {
    if (pin.length < 4) setPin(prev => prev + d);
  };
  const handleDelete = () => setPin(prev => prev.slice(0, -1));

  const handleSubmit = useCallback(async () => {
    if (pin.length !== 4 || !orgId) return;
    setState("IDENTIFYING");

    const { data: employees } = await supabase
      .from("employee_profiles")
      .select("user_id, classification")
      .eq("org_id", orgId)
      .eq("is_active", true);

    if (!employees || employees.length === 0) {
      toast({ title: "No employees found", description: "Set up employees in LabourOS first.", variant: "destructive" });
      setPin("");
      setState("IDLE");
      return;
    }

    const pinIndex = parseInt(pin) - 1001;
    const employee = employees[pinIndex];
    if (!employee) {
      toast({ title: "Invalid PIN", description: "Please try again.", variant: "destructive" });
      setPin("");
      setState("IDLE");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", employee.user_id)
      .single();

    const { data: activeShift } = await supabase
      .from("clock_shifts")
      .select("*")
      .eq("org_id", orgId)
      .eq("user_id", employee.user_id)
      .eq("status", "ACTIVE")
      .maybeSingle();

    let onBreak = false;
    if (activeShift) {
      const { data: lastEvent } = await supabase
        .from("clock_events")
        .select("event_type")
        .eq("org_id", orgId)
        .eq("user_id", employee.user_id)
        .eq("shift_date", format(new Date(), "yyyy-MM-dd"))
        .order("event_time", { ascending: false })
        .limit(1)
        .maybeSingle();
      onBreak = lastEvent?.event_type === "BREAK_START";
    }

    setStaffInfo({
      user_id: employee.user_id,
      full_name: profile?.full_name || "Staff Member",
      classification: employee.classification,
      activeShift,
      onBreak,
    });

    if (!activeShift) {
      // Check compliance gate before clock-in
      const gate = await checkComplianceGap(employee.user_id);
      setComplianceGate(gate);
      setGateAcknowledged(false);

      // Check geofence
      const geo = await checkGeofence();
      setGeoResult(geo);

      setState("CLOCK_IN");
    } else if (onBreak) {
      setState("ON_BREAK");
    } else {
      setState("CLOCK_OUT");
    }
    setPin("");
  }, [pin, orgId, toast]);

  useEffect(() => {
    if (pin.length === 4) handleSubmit();
  }, [pin, handleSubmit]);

  const canProceedClockIn = () => {
    if (!complianceGate) return true;
    if (complianceGate.type === "ok") return true;
    if (complianceGate.type === "warning" && gateAcknowledged) return true;
    if (complianceGate.type === "blocked" && managerPin.length === 4 && managerOverrideReason) return true;
    return false;
  };

  const canProceedGeo = () => {
    if (!geoResult) return true;
    if (geoResult.status === "ON_SITE" || geoResult.status === "UNAVAILABLE") return true;
    if (geoResult.status === "REMOTE" && remoteReason.trim()) return true;
    if (geoResult.status === "LOW_ACCURACY") return true; // warn only
    return false;
  };

  const performClockIn = async () => {
    if (!staffInfo || !orgId) return;
    const eventTime = new Date().toISOString();
    const shiftDate = format(new Date(), "yyyy-MM-dd");

    const locationType = geoResult?.status === "REMOTE" ? "REMOTE" : "ON_SITE";
    const complianceStatus = complianceGate?.type === "warning" ? "OVERTIME_GAP" :
      complianceGate?.type === "blocked" ? "MANAGER_OVERRIDE" : "VALID";

    await supabase.from("clock_events").insert({
      org_id: orgId,
      user_id: staffInfo.user_id,
      event_type: "CLOCK_IN",
      event_time: eventTime,
      shift_date: shiftDate,
      device_type: "BROWSER",
      location_type: locationType,
      compliance_status: complianceStatus,
      latitude: geoResult?.latitude || null,
      longitude: geoResult?.longitude || null,
      gps_accuracy: geoResult?.accuracy || null,
      geofence_result: geoResult?.status || null,
      remote_reason: geoResult?.status === "REMOTE" ? remoteReason : null,
    });

    await supabase.from("clock_shifts").insert({
      org_id: orgId,
      user_id: staffInfo.user_id,
      shift_date: shiftDate,
      clock_in: eventTime,
      status: "ACTIVE",
    });

    setConfirmData({ action: "CLOCKED IN", time: format(new Date(), "h:mm a") });
    setState("CONFIRMED");
    resetGateState();
    setTimeout(() => { setState("IDLE"); setStaffInfo(null); setConfirmData(null); }, 5000);
  };

  const performClockOut = async () => {
    if (!staffInfo?.activeShift || !orgId) return;
    const eventTime = new Date().toISOString();
    const clockIn = new Date(staffInfo.activeShift.clock_in);
    const totalHours = (Date.now() - clockIn.getTime()) / 3600000;
    const breakMin = staffInfo.activeShift.break_minutes || 0;
    const paidHours = Math.max(0, totalHours - breakMin / 60);

    await supabase.from("clock_events").insert({
      org_id: orgId,
      user_id: staffInfo.user_id,
      event_type: "CLOCK_OUT",
      event_time: eventTime,
      shift_date: format(new Date(), "yyyy-MM-dd"),
      device_type: "BROWSER",
      location_type: "ON_SITE",
    });

    await supabase.from("clock_shifts")
      .update({
        clock_out: eventTime,
        status: "COMPLETED",
        total_hours: Math.round(totalHours * 100) / 100,
        paid_hours: Math.round(paidHours * 100) / 100,
      })
      .eq("id", staffInfo.activeShift.id);

    setConfirmData({ action: "CLOCKED OUT", time: format(new Date(), "h:mm a") });
    setState("CONFIRMED");
    setTimeout(() => { setState("IDLE"); setStaffInfo(null); setConfirmData(null); }, 5000);
  };

  const performBreakStart = async () => {
    if (!staffInfo || !orgId) return;
    await supabase.from("clock_events").insert({
      org_id: orgId,
      user_id: staffInfo.user_id,
      event_type: "BREAK_START",
      event_time: new Date().toISOString(),
      shift_date: format(new Date(), "yyyy-MM-dd"),
      device_type: "BROWSER",
      break_type: "MEAL_UNPAID",
    });
    setConfirmData({ action: "BREAK STARTED", time: format(new Date(), "h:mm a") });
    setState("CONFIRMED");
    setTimeout(() => { setState("IDLE"); setStaffInfo(null); setConfirmData(null); }, 5000);
  };

  const performBreakEnd = async () => {
    if (!staffInfo?.activeShift || !orgId) return;
    await supabase.from("clock_events").insert({
      org_id: orgId,
      user_id: staffInfo.user_id,
      event_type: "BREAK_END",
      event_time: new Date().toISOString(),
      shift_date: format(new Date(), "yyyy-MM-dd"),
      device_type: "BROWSER",
      break_type: "MEAL_UNPAID",
    });

    const currentBreak = staffInfo.activeShift.break_minutes || 0;
    await supabase.from("clock_shifts")
      .update({ break_minutes: currentBreak + 30 })
      .eq("id", staffInfo.activeShift.id);

    setConfirmData({ action: "BACK FROM BREAK", time: format(new Date(), "h:mm a") });
    setState("CONFIRMED");
    setTimeout(() => { setState("IDLE"); setStaffInfo(null); setConfirmData(null); }, 5000);
  };

  // Mid-shift role change
  const performRoleChange = async () => {
    if (!staffInfo || !orgId || !newRole) return;

    await supabase.from("clock_events").insert({
      org_id: orgId,
      user_id: staffInfo.user_id,
      event_type: "ROLE_CHANGE",
      event_time: new Date().toISOString(),
      shift_date: format(new Date(), "yyyy-MM-dd"),
      device_type: "BROWSER",
      role_change_from: staffInfo.classification,
      role_change_to: newRole,
    });

    setShowRoleChange(false);
    setNewRole("");
    toast({ title: "Role Changed", description: `Now working as ${newRole.replace(/_/g, " ")}` });
  };

  const resetGateState = () => {
    setComplianceGate(null);
    setGateAcknowledged(false);
    setManagerPin("");
    setManagerOverrideReason("");
    setGeoResult(null);
    setRemoteReason("");
  };

  // ========== CONFIRMED STATE ==========
  if (state === "CONFIRMED" && confirmData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md p-8 text-center space-y-4">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
          <h2 className="text-2xl font-bold text-foreground">{confirmData.action === "CLOCKED IN" ? "✅" : confirmData.action === "CLOCKED OUT" ? "👋" : "☕"} {confirmData.action}</h2>
          <p className="text-xl font-semibold text-foreground">{staffInfo?.full_name}</p>
          <p className="text-muted-foreground">{staffInfo?.classification}</p>
          <p className="text-lg text-foreground">{confirmData.time}</p>
          {complianceGate?.type === "warning" && (
            <p className="text-sm text-warning">⚠ Overtime rates apply until {complianceGate.overtimeUntil}</p>
          )}
          <p className="text-sm text-muted-foreground">Screen returns automatically...</p>
        </Card>
      </div>
    );
  }

  // ========== CLOCK-IN STATE WITH COMPLIANCE GATE ==========
  if (state === "CLOCK_IN" && staffInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground">{staffInfo.full_name}</h2>
            <p className="text-sm text-muted-foreground">{staffInfo.classification}</p>
          </div>

          {/* Compliance Gate */}
          {complianceGate?.type === "warning" && !gateAcknowledged && (
            <div className="p-4 rounded-lg border border-warning/50 bg-warning/10 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                <span className="font-medium text-foreground">Short Rest Warning</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Only {complianceGate.gapHours.toFixed(1)} hours since last shift ended.
                Overtime rates will apply until {complianceGate.overtimeUntil}.
              </p>
              <Button onClick={() => setGateAcknowledged(true)} variant="outline" className="w-full">
                I Understand — Proceed
              </Button>
            </div>
          )}

          {complianceGate?.type === "blocked" && (
            <div className="p-4 rounded-lg border border-destructive/50 bg-destructive/10 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-destructive" />
                <span className="font-medium text-foreground">Clock-In Blocked</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Only {complianceGate.gapHours.toFixed(1)} hours since last shift. Minimum 8 hours required.
                Manager Override needed.
              </p>
              <div className="space-y-2">
                <Label className="text-xs">Manager PIN</Label>
                <Input type="password" maxLength={4} value={managerPin} onChange={e => setManagerPin(e.target.value)} placeholder="Enter manager PIN" />
                <Label className="text-xs">Override Reason</Label>
                <Textarea value={managerOverrideReason} onChange={e => setManagerOverrideReason(e.target.value)} placeholder="Reason for override..." rows={2} />
              </div>
            </div>
          )}

          {/* Geofence Status */}
          {geoResult && geoResult.status !== "ON_SITE" && geoResult.status !== "UNAVAILABLE" && (
            <div className={`p-4 rounded-lg border space-y-3 ${geoResult.status === "REMOTE" ? "border-warning/50 bg-warning/10" : "border-muted bg-muted/30"}`}>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-warning" />
                <span className="font-medium text-foreground">
                  {geoResult.status === "REMOTE" ? "Off-Site Clock-In" : "Low GPS Accuracy"}
                </span>
              </div>
              {geoResult.status === "REMOTE" && (
                <>
                  <p className="text-sm text-muted-foreground">You are outside all registered locations. Please provide a reason.</p>
                  <Textarea value={remoteReason} onChange={e => setRemoteReason(e.target.value)} placeholder="Reason for remote clock-in..." rows={2} />
                </>
              )}
              {geoResult.status === "LOW_ACCURACY" && (
                <p className="text-sm text-muted-foreground">GPS accuracy is low ({Math.round(geoResult.accuracy || 0)}m). Move to area with better signal.</p>
              )}
            </div>
          )}

          {geoResult?.status === "ON_SITE" && geoResult.matchedLocation && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <MapPin className="w-4 h-4" />
              <span>On-Site: {geoResult.matchedLocation}</span>
            </div>
          )}

          <Button
            onClick={performClockIn}
            className="w-full h-16 text-lg"
            size="lg"
            disabled={!canProceedClockIn() || !canProceedGeo()}
          >
            <Clock className="w-6 h-6 mr-2" /> Clock In
          </Button>

          <Button variant="ghost" onClick={() => { setState("IDLE"); setStaffInfo(null); resetGateState(); }} className="w-full">
            Cancel
          </Button>
        </Card>
      </div>
    );
  }

  // ========== CLOCK-OUT / BREAK STATE ==========
  if ((state === "CLOCK_OUT" || state === "ON_BREAK") && staffInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground">{staffInfo.full_name}</h2>
            <p className="text-sm text-muted-foreground">{staffInfo.classification}</p>
            {staffInfo.activeShift && (
              <p className="text-sm text-muted-foreground mt-1">
                Clocked in since {format(new Date(staffInfo.activeShift.clock_in), "h:mm a")}
              </p>
            )}
          </div>

          {state === "CLOCK_OUT" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={performBreakStart} variant="outline" className="h-16 text-base flex flex-col gap-1">
                  <Coffee className="w-6 h-6" />
                  Start Break
                </Button>
                <Button onClick={performClockOut} variant="destructive" className="h-16 text-base flex flex-col gap-1">
                  <LogOut className="w-6 h-6" />
                  Clock Out
                </Button>
              </div>
              {/* Mid-shift role change */}
              <Button
                variant="outline"
                className="w-full h-12"
                onClick={() => setShowRoleChange(true)}
              >
                <UserCog className="w-5 h-5 mr-2" /> Change Role (Higher Duties)
              </Button>
            </div>
          )}

          {state === "ON_BREAK" && (
            <div className="space-y-3">
              <div className="text-center p-3 bg-accent/10 rounded-lg">
                <Coffee className="w-6 h-6 text-accent mx-auto mb-1" />
                <p className="text-sm font-medium text-accent">Currently on break</p>
              </div>
              <Button onClick={performBreakEnd} className="w-full h-16 text-lg" size="lg">
                Return from Break
              </Button>
            </div>
          )}

          <Button variant="ghost" onClick={() => { setState("IDLE"); setStaffInfo(null); }} className="w-full">
            Cancel
          </Button>
        </Card>

        {/* Role Change Dialog */}
        <Dialog open={showRoleChange} onOpenChange={setShowRoleChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Role — Higher Duties</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Current: <span className="font-medium text-foreground">{staffInfo.classification.replace(/_/g, " ")}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                If you work 2+ hours at a higher classification, the higher rate applies for the entire shift.
              </p>
              <div className="space-y-2">
                <Label>Select Higher Classification</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger><SelectValue placeholder="Choose role..." /></SelectTrigger>
                  <SelectContent>
                    {CLASSIFICATIONS
                      .filter(c => c !== staffInfo.classification)
                      .map(c => (
                        <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowRoleChange(false)} className="flex-1">Cancel</Button>
                <Button onClick={performRoleChange} disabled={!newRole} className="flex-1">Confirm Change</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ========== IDLE / PIN ENTRY (DEFAULT) ==========
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">CHICC.iT</h1>
        <p className="text-5xl font-bold text-foreground mt-4 tabular-nums">
          {format(now, "h:mm:ss a")}
        </p>
        <p className="text-lg text-muted-foreground mt-1">
          {format(now, "EEEE, d MMMM")}
        </p>
      </div>

      <Card className="w-full max-w-xs p-6 space-y-4">
        <p className="text-center text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Enter Your PIN
        </p>
        <div className="flex justify-center gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`w-4 h-4 rounded-full transition-colors ${i < pin.length ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {["1","2","3","4","5","6","7","8","9"].map((d) => (
            <Button key={d} variant="outline" className="h-14 text-xl font-medium" onClick={() => handleDigit(d)}>
              {d}
            </Button>
          ))}
          <Button variant="outline" className="h-14" onClick={handleDelete}>
            <Delete className="w-5 h-5" />
          </Button>
          <Button variant="outline" className="h-14 text-xl font-medium" onClick={() => handleDigit("0")}>
            0
          </Button>
          <Button className="h-14 text-sm font-bold" onClick={handleSubmit} disabled={pin.length !== 4}>
            GO
          </Button>
        </div>
      </Card>

      {clockedInStaff.length > 0 && (
        <p className="mt-6 text-sm text-muted-foreground text-center">
          Currently clocked in: {clockedInStaff.join(", ")} ({clockedInStaff.length} staff)
        </p>
      )}

      <div className="mt-4 flex items-center gap-6">
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setShowForgotPin(true)}>
          Forgot PIN?
        </Button>
      </div>

      <Dialog open={showForgotPin} onOpenChange={setShowForgotPin}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Forgot Your PIN?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Contact your manager to reset your PIN using Manager Override, or visit the staff portal.</p>
            <Button variant="outline" className="w-full" onClick={() => setShowForgotPin(false)}>OK</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Haversine distance in meters
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default ClockScreen;
