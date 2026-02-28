import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Settings, Save, ExternalLink, DollarSign, Archive, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DAY_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const AWARD_OPTIONS = [
  { code: "MA000009", name: "Hospitality Industry (General) Award", desc: "Hotels, pubs, clubs, catering, accommodation" },
  { code: "MA000119", name: "Restaurant Industry Award", desc: "Restaurants, cafes, bistros (food service primary)" },
];

const ROUNDING_OPTIONS = [
  { value: "EXACT", label: "Exact — No rounding" },
  { value: "NEAREST_6", label: "Nearest 6 min (0.1 hr)" },
  { value: "NEAREST_15", label: "Nearest 15 min (0.25 hr)" },
];

const RETENTION_DOCS = [
  "Payslip PDFs", "Pay run summaries", "Approved timesheets", "Employment contracts",
  "Leave records", "Overtime records", "Super contributions", "STP submissions",
];

interface Props {
  settings: any;
  refetchSettings: () => void;
}

export default function LabourOrgSettings({ settings, refetchSettings }: Props) {
  const [saving, setSaving] = useState(false);
  const [edits, setEdits] = useState<Record<string, unknown>>({});

  const hasEdits = Object.keys(edits).length > 0;

  const current = (field: string) => edits[field] !== undefined ? edits[field] : (settings as any)?.[field];

  const setField = (field: string, value: unknown) => {
    setEdits(prev => {
      const next = { ...prev, [field]: value };
      // Remove if same as original
      if ((settings as any)?.[field] === value) delete next[field];
      return next;
    });
  };

  const handleSave = async () => {
    if (!settings?.id || !hasEdits) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("labour_settings").update(edits as any).eq("id", settings.id);
      if (error) throw error;
      toast.success("Settings saved");
      setEdits({});
      refetchSettings();
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return null;

  return (
    <div className="space-y-4">
      {/* Sticky save bar */}
      {hasEdits && (
        <div className="sticky top-0 z-10 p-3 rounded-lg border border-primary/30 bg-primary/5 backdrop-blur flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            {Object.keys(edits).length} unsaved change{Object.keys(edits).length > 1 ? "s" : ""}
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEdits({})}>Discard</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-1" /> {saving ? "Saving..." : "Save All"}
            </Button>
          </div>
        </div>
      )}

      {/* Primary Award */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="w-4 h-4" /> Primary Award
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Award Code</Label>
            <Select value={current("default_award_code") ?? "MA000009"} onValueChange={v => setField("default_award_code", v)}>
              <SelectTrigger className="max-w-md mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {AWARD_OPTIONS.map(a => (
                  <SelectItem key={a.code} value={a.code}>{a.code} — {a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {AWARD_OPTIONS.find(a => a.code === current("default_award_code"))?.desc}
              {" · "}
              <a href="https://www.fairwork.gov.au/awards" target="_blank" rel="noopener noreferrer" className="text-primary inline-flex items-center gap-0.5">
                fairwork.gov.au <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pay Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="w-4 h-4" /> Pay Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Pay Cycle</Label>
              <Select value={current("pay_cycle") ?? "WEEKLY"} onValueChange={v => setField("pay_cycle", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="FORTNIGHTLY">Fortnightly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Pay Day</Label>
              <Select value={String(current("payday") ?? 1)} onValueChange={v => setField("payday", Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7].map(d => (
                    <SelectItem key={d} value={String(d)}>{DAY_NAMES[d]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Rounding Rule</Label>
              <Select value={current("rounding_rule") ?? "EXACT"} onValueChange={v => setField("rounding_rule", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROUNDING_OPTIONS.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Super & Compliance Toggles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="w-4 h-4" /> Superannuation & Compliance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Default Super Rate (%)</Label>
              <Input
                type="number"
                step="0.5"
                min="0"
                max="30"
                className="max-w-[120px]"
                value={current("default_super_rate") ?? 11.5}
                onChange={e => setField("default_super_rate", parseFloat(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">Current SG rate: 12% (from 1 Jul 2025)</p>
            </div>
            <div className="space-y-2">
              <Label>Record Retention (years)</Label>
              <Input
                type="number"
                min="7"
                max="30"
                className="max-w-[120px]"
                value={current("record_retention_years") ?? 7}
                onChange={e => setField("record_retention_years", parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">Minimum 7 years (Fair Work Act)</p>
            </div>
          </div>

          <div className="space-y-4 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Payday Super</Label>
                <p className="text-xs text-muted-foreground">Super paid within 7 days of wages (mandatory from Jul 2026)</p>
              </div>
              <Switch
                checked={current("payday_super_enabled") ?? false}
                onCheckedChange={v => setField("payday_super_enabled", v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Overtime Requires Approval</Label>
                <p className="text-xs text-muted-foreground">Manager must approve overtime before payroll processes it</p>
              </div>
              <Switch
                checked={current("overtime_approval_required") ?? false}
                onCheckedChange={v => setField("overtime_approval_required", v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Auto Break Deduction</Label>
                <p className="text-xs text-muted-foreground">Automatically deduct unpaid break if no break event logged</p>
              </div>
              <Switch
                checked={current("auto_break_deduction") ?? false}
                onCheckedChange={v => setField("auto_break_deduction", v)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Record Retention */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Archive className="w-4 h-4" /> Record Retention — {current("record_retention_years") ?? 7} Years
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            Fair Work Act requires employers to keep employee records for 7 years. All payroll data is retained with no auto-deletion.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {RETENTION_DOCS.map((doc, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-3.5 h-3.5 text-green-600 shrink-0" />
                <span className="text-foreground">{doc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
