import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { Settings, Bell } from "lucide-react";

const defaultSettings = {
  grace_period_minutes: 5,
  require_photo: true,
  photo_retention_days: 90,
  allow_remote_clock: false,
  max_remote_hours_week: 8,
  auto_break_end_minutes: 45,
  meal_break_minutes: 30,
  rest_break_minutes: 20,
  meal_break_threshold_hours: 5,
  rest_break_threshold_hours: 8,
  min_shift_gap_hours: 10,
  pin_lockout_attempts: 5,
  pin_lockout_minutes: 5,
  probation_months: 6,
  casual_conversion_months: 6,
};

interface StaffPrefs {
  quiet_start: string;
  quiet_end: string;
  opt_in_extra_shifts: boolean;
  notify_sms: boolean;
  notify_email: boolean;
}

const defaultStaffPrefs: StaffPrefs = {
  quiet_start: "21:00",
  quiet_end: "08:00",
  opt_in_extra_shifts: false,
  notify_sms: true,
  notify_email: true,
};

const ClockSettingsPage = () => {
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const orgId = currentOrg?.id;
  const { toast } = useToast();
  const [settings, setSettings] = useState(defaultSettings);
  const [dirty, setDirty] = useState(false);

  // Staff communication preferences
  const [staffPrefs, setStaffPrefs] = useState<StaffPrefs>(defaultStaffPrefs);
  const [prefsDirty, setPrefsDirty] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    const load = async () => {
      const { data } = await supabase.from("clock_settings").select("*").eq("org_id", orgId).maybeSingle();
      if (data) setSettings(data as any);
    };
    load();
  }, [orgId]);

  // Load staff preferences
  useEffect(() => {
    if (!orgId || !user?.id) return;
    const loadPrefs = async () => {
      const { data } = await supabase
        .from("staff_preferences")
        .select("*")
        .eq("org_id", orgId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setStaffPrefs({
          quiet_start: data.quiet_start || "21:00",
          quiet_end: data.quiet_end || "08:00",
          opt_in_extra_shifts: data.opt_in_extra_shifts ?? false,
          notify_sms: data.notify_sms ?? true,
          notify_email: data.notify_email ?? true,
        });
      }
    };
    loadPrefs();
  }, [orgId, user?.id]);

  const save = async () => {
    if (!orgId) return;
    const { error } = await supabase.from("clock_settings").upsert({
      org_id: orgId,
      ...settings,
    }, { onConflict: "org_id" });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Settings saved" });
      setDirty(false);
    }
  };

  const saveStaffPrefs = async () => {
    if (!orgId || !user?.id) return;
    const { error } = await supabase.from("staff_preferences").upsert({
      org_id: orgId,
      user_id: user.id,
      ...staffPrefs,
    }, { onConflict: "org_id,user_id" });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Preferences saved" });
      setPrefsDirty(false);
    }
  };

  const update = (key: string, value: any) => {
    setSettings(s => ({ ...s, [key]: value }));
    setDirty(true);
  };

  const updatePref = (key: keyof StaffPrefs, value: any) => {
    setStaffPrefs(s => ({ ...s, [key]: value }));
    setPrefsDirty(true);
  };

  const Field = ({ label, field, type = "number" }: { label: string; field: string; type?: string }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-foreground">{label}</span>
      {type === "boolean" ? (
        <Switch checked={(settings as any)[field]} onCheckedChange={(v) => update(field, v)} />
      ) : (
        <Input type="number" className="w-24 text-right" value={(settings as any)[field]} onChange={(e) => update(field, parseFloat(e.target.value) || 0)} />
      )}
    </div>
  );

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Settings className="w-6 h-6" /> Clock Settings</h1>
          <p className="text-muted-foreground">Configure ClockOS behavior for your venue</p>
        </div>
        {dirty && <Button onClick={save}>Save Changes</Button>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Clock-In Rules</CardTitle></CardHeader>
          <CardContent className="divide-y divide-border">
            <Field label="Grace period (minutes)" field="grace_period_minutes" />
            <Field label="Require photo" field="require_photo" type="boolean" />
            <Field label="Photo retention (days)" field="photo_retention_days" />
            <Field label="Min shift gap (hours)" field="min_shift_gap_hours" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Break Rules</CardTitle></CardHeader>
          <CardContent className="divide-y divide-border">
            <Field label="Meal break (minutes)" field="meal_break_minutes" />
            <Field label="Rest break (minutes)" field="rest_break_minutes" />
            <Field label="Meal break after (hours)" field="meal_break_threshold_hours" />
            <Field label="Rest break after (hours)" field="rest_break_threshold_hours" />
            <Field label="Auto-end break after (minutes)" field="auto_break_end_minutes" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Remote Work</CardTitle></CardHeader>
          <CardContent className="divide-y divide-border">
            <Field label="Allow remote clock-in" field="allow_remote_clock" type="boolean" />
            <Field label="Max remote hours/week" field="max_remote_hours_week" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">PIN Security</CardTitle></CardHeader>
          <CardContent className="divide-y divide-border">
            <Field label="Lockout after (attempts)" field="pin_lockout_attempts" />
            <Field label="Lockout duration (minutes)" field="pin_lockout_minutes" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Employment</CardTitle></CardHeader>
          <CardContent className="divide-y divide-border">
            <Field label="Probation period (months)" field="probation_months" />
            <Field label="Casual conversion (months)" field="casual_conversion_months" />
          </CardContent>
        </Card>

        {/* Staff Communication Preferences (RTD) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Bell className="w-4 h-4" /> Communication Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Right to Disconnect — set your quiet hours and notification preferences. Non-emergency messages will be queued outside your hours.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Quiet Start</Label>
                <Input type="time" value={staffPrefs.quiet_start} onChange={e => updatePref("quiet_start", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Quiet End</Label>
                <Input type="time" value={staffPrefs.quiet_end} onChange={e => updatePref("quiet_end", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Receive SMS notifications</Label>
                <Switch checked={staffPrefs.notify_sms} onCheckedChange={v => updatePref("notify_sms", v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Receive email notifications</Label>
                <Switch checked={staffPrefs.notify_email} onCheckedChange={v => updatePref("notify_email", v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Opt-in for extra shift offers</Label>
                <Switch checked={staffPrefs.opt_in_extra_shifts} onCheckedChange={v => updatePref("opt_in_extra_shifts", v)} />
              </div>
            </div>
            {prefsDirty && (
              <Button size="sm" onClick={saveStaffPrefs}>Save Preferences</Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClockSettingsPage;
