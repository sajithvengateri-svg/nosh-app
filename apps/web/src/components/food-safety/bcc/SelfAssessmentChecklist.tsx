import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle, MinusCircle, ClipboardCheck, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/useOrgId";
import { useAuth } from "@/contexts/AuthContext";
import BCCStarRating from "./BCCStarRating";

// A1–A40 BCC Checklist items
const CHECKLIST_ITEMS = [
  { id: "A1", text: "Food business licence displayed", category: "Licensing" },
  { id: "A2", text: "Licence conditions met", category: "Licensing" },
  { id: "A3", text: "Food Safety Supervisor appointed", category: "People" },
  { id: "A4", text: "FSS certificate current (within 5 years)", category: "People" },
  { id: "A5", text: "FSS reasonably available during operations", category: "People" },
  { id: "A6", text: "FSS has relevant competency", category: "People" },
  { id: "A7", text: "Council notified of FSS details", category: "People" },
  { id: "A8", text: "Food handlers trained in food safety", category: "People" },
  { id: "A9", text: "Food safety program in place (if required)", category: "Program" },
  { id: "A10", text: "Program regularly reviewed and updated", category: "Program" },
  { id: "A11", text: "Temperature control — cold food ≤5°C", category: "Temperature" },
  { id: "A12", text: "Temperature control — frozen food ≤-18°C", category: "Temperature" },
  { id: "A13", text: "Temperature control — hot food ≥60°C", category: "Temperature" },
  { id: "A14", text: "Cooking to safe temperatures (≥75°C)", category: "Temperature" },
  { id: "A15", text: "Cooling within safe timeframes", category: "Temperature" },
  { id: "A16", text: "Reheating to ≥75°C", category: "Temperature" },
  { id: "A17", text: "Temperature records maintained", category: "Temperature" },
  { id: "A18", text: "Thermometers accurate and calibrated", category: "Equipment" },
  { id: "A19", text: "Equipment in good working order", category: "Equipment" },
  { id: "A20", text: "Adequate handwashing facilities", category: "Hygiene" },
  { id: "A21", text: "Handwashing practised by all staff", category: "Hygiene" },
  { id: "A22", text: "Personal hygiene standards met", category: "Hygiene" },
  { id: "A23", text: "Staff health — illness/exclusion policy", category: "Hygiene" },
  { id: "A24", text: "Premises clean and maintained", category: "Cleaning" },
  { id: "A25", text: "Cleaning schedule implemented", category: "Cleaning" },
  { id: "A26", text: "Sanitiser used correctly (correct PPM)", category: "Cleaning" },
  { id: "A27", text: "Food contact surfaces sanitised", category: "Cleaning" },
  { id: "A28", text: "Waste management adequate", category: "Cleaning" },
  { id: "A29", text: "Pest control measures in place", category: "Pest" },
  { id: "A30", text: "No evidence of pest activity", category: "Pest" },
  { id: "A31", text: "Pest control records maintained", category: "Pest" },
  { id: "A32", text: "Food received from approved suppliers", category: "Receiving" },
  { id: "A33", text: "Receiving checks conducted", category: "Receiving" },
  { id: "A34", text: "Food stored correctly and labelled", category: "Storage" },
  { id: "A35", text: "Cross-contamination controls in place", category: "Storage" },
  { id: "A36", text: "Allergen management procedures", category: "Storage" },
  { id: "A37", text: "Food transport temperature control", category: "Transport" },
  { id: "A38", text: "Display food protected and temperature controlled", category: "Display" },
  { id: "A39", text: "Corrective actions documented", category: "Records" },
  { id: "A40", text: "All records available for inspection", category: "Records" },
];

type ItemStatus = "compliant" | "non_compliant" | "not_assessed";
type SeverityLevel = "critical" | "major" | "minor";

interface ChecklistState {
  [id: string]: { status: ItemStatus; severity?: SeverityLevel; notes?: string };
}

function predictStarRating(items: ChecklistState): number {
  const assessed = Object.values(items).filter((v) => v.status !== "not_assessed");
  if (assessed.length === 0) return 0;
  const criticals = assessed.filter((v) => v.status === "non_compliant" && v.severity === "critical").length;
  const majors = assessed.filter((v) => v.status === "non_compliant" && v.severity === "major").length;
  const minors = assessed.filter((v) => v.status === "non_compliant" && v.severity === "minor").length;
  if (criticals >= 2) return 0;
  if (criticals === 1) return 1;
  if (majors >= 4) return 1;
  if (majors >= 2) return 2;
  if (majors === 1 && minors >= 3) return 2;
  if (majors === 1) return 3;
  if (minors >= 5) return 3;
  if (minors >= 2) return 4;
  return 5;
}

export default function SelfAssessmentChecklist() {
  const orgId = useOrgId();
  const { user } = useAuth();
  const [items, setItems] = useState<ChecklistState>(() => {
    const init: ChecklistState = {};
    CHECKLIST_ITEMS.forEach((c) => { init[c.id] = { status: "not_assessed" }; });
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [savedAssessments, setSavedAssessments] = useState<any[]>([]);

  const fetchAssessments = useCallback(async () => {
    if (!orgId) return;
    const { data } = await supabase
      .from("audit_self_assessments")
      .select("*")
      .eq("org_id", orgId)
      .order("assessment_date", { ascending: false })
      .limit(5);
    if (data) setSavedAssessments(data);
  }, [orgId]);

  useEffect(() => { fetchAssessments(); }, [fetchAssessments]);

  const setItemStatus = (id: string, status: ItemStatus) => {
    setItems((prev) => ({ ...prev, [id]: { ...prev[id], status, severity: status === "non_compliant" ? (prev[id]?.severity || "minor") : undefined } }));
  };

  const setItemSeverity = (id: string, severity: SeverityLevel) => {
    setItems((prev) => ({ ...prev, [id]: { ...prev[id], severity } }));
  };

  const assessed = Object.values(items).filter((v) => v.status !== "not_assessed").length;
  const compliant = Object.values(items).filter((v) => v.status === "compliant").length;
  const nonCompliant = Object.values(items).filter((v) => v.status === "non_compliant").length;
  const progress = Math.round((assessed / CHECKLIST_ITEMS.length) * 100);
  const predictedRating = predictStarRating(items);

  const handleSave = async () => {
    if (!orgId) return;
    setSaving(true);
    const criticals = Object.values(items).filter((v) => v.status === "non_compliant" && v.severity === "critical").length;
    const majors = Object.values(items).filter((v) => v.status === "non_compliant" && v.severity === "major").length;
    const minors = Object.values(items).filter((v) => v.status === "non_compliant" && v.severity === "minor").length;

    const { error } = await supabase.from("audit_self_assessments").insert({
      org_id: orgId,
      assessed_by: user?.id ?? null,
      assessed_by_name: user?.email?.split("@")[0] || "Unknown",
      checklist_items: items as any,
      predicted_star_rating: predictedRating,
      total_critical: criticals,
      total_major: majors,
      total_minor: minors,
    } as any);

    if (error) toast.error("Failed to save assessment");
    else { toast.success("Self-assessment saved"); fetchAssessments(); }
    setSaving(false);
  };

  const categories = [...new Set(CHECKLIST_ITEMS.map((c) => c.category))];

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card className="border-[#000080]/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-[#000080]">
            <ClipboardCheck className="w-5 h-5" />
            A1–A40 Self-Assessment
          </CardTitle>
          <CardDescription>Pre-inspection readiness checklist based on BCC Eat Safe criteria</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{assessed}/40 assessed</p>
              <Progress value={progress} className="mt-1 w-48" />
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-1">Predicted Rating</p>
              <BCCStarRating rating={predictedRating} size="md" />
            </div>
          </div>
          <div className="flex gap-3 text-sm">
            <Badge className="bg-emerald-600">{compliant} Compliant</Badge>
            <Badge variant="destructive">{nonCompliant} Non-Compliant</Badge>
            <Badge variant="secondary">{40 - assessed} Not Assessed</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Checklist by Category */}
      {categories.map((cat) => (
        <Card key={cat} className="border-[#000080]/10">
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-semibold">{cat}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {CHECKLIST_ITEMS.filter((c) => c.category === cat).map((item) => {
              const state = items[item.id];
              return (
                <div key={item.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                  <span className="text-xs font-mono text-muted-foreground w-8 shrink-0">{item.id}</span>
                  <span className="text-sm flex-1">{item.text}</span>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => setItemStatus(item.id, "compliant")}
                      className={`p-1.5 rounded ${state.status === "compliant" ? "bg-emerald-100 text-emerald-700" : "text-muted-foreground/40 hover:text-emerald-600"}`}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setItemStatus(item.id, "non_compliant")}
                      className={`p-1.5 rounded ${state.status === "non_compliant" ? "bg-destructive/10 text-destructive" : "text-muted-foreground/40 hover:text-destructive"}`}
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setItemStatus(item.id, "not_assessed")}
                      className={`p-1.5 rounded ${state.status === "not_assessed" ? "bg-muted text-muted-foreground" : "text-muted-foreground/40 hover:text-muted-foreground"}`}
                    >
                      <MinusCircle className="w-5 h-5" />
                    </button>
                  </div>
                  {state.status === "non_compliant" && (
                    <Select value={state.severity || "minor"} onValueChange={(v) => setItemSeverity(item.id, v as SeverityLevel)}>
                      <SelectTrigger className="w-[90px] h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="major">Major</SelectItem>
                        <SelectItem value="minor">Minor</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-[#000080] hover:bg-[#000080]/90 text-white">
          {saving ? "Saving…" : "Save Assessment"}
        </Button>
      </div>
    </div>
  );
}