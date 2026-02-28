import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertTriangle, XCircle, Shield, FileText, Users, Thermometer, Sparkles, Bug, Truck, Wrench, ClipboardCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/useOrgId";
import BCCStarRating from "./BCCStarRating";

interface ReadinessCheck {
  area: string;
  icon: React.ReactNode;
  status: "ready" | "warning" | "not_ready" | "loading";
  detail: string;
}

export default function PreInspectionReadiness() {
  const orgId = useOrgId();
  const [checks, setChecks] = useState<ReadinessCheck[]>([]);
  const [loading, setLoading] = useState(true);

  const runChecks = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);

    const [profileRes, fssRes, trainingRes, logsRes, correctiveRes, cleaningRes, pestRes, equipRes, supplierRes, assessmentRes] = await Promise.all([
      supabase.from("compliance_profiles").select("*").eq("org_id", orgId).maybeSingle(),
      supabase.from("food_safety_supervisors").select("*").eq("org_id", orgId),
      supabase.from("food_handler_training").select("*").eq("org_id", orgId),
      supabase.from("daily_compliance_logs").select("id, log_date, status").eq("org_id", orgId).order("log_date", { ascending: false }).limit(50),
      supabase.from("corrective_actions").select("id, status, severity").eq("org_id", orgId),
      supabase.from("bcc_cleaning_schedules").select("id").eq("org_id", orgId),
      supabase.from("bcc_pest_control_logs").select("id, date_of_service").eq("org_id", orgId).order("date_of_service", { ascending: false }).limit(1),
      supabase.from("bcc_equipment_calibration_logs").select("id, performed_at").eq("org_id", orgId).order("performed_at", { ascending: false }).limit(1),
      supabase.from("bcc_supplier_register").select("id").eq("org_id", orgId),
      supabase.from("audit_self_assessments").select("predicted_star_rating, assessment_date").eq("org_id", orgId).order("assessment_date", { ascending: false }).limit(1),
    ]);

    const results: ReadinessCheck[] = [];

    // Profile
    const p = profileRes.data;
    results.push({
      area: "Compliance Profile",
      icon: <Shield className="w-4 h-4" />,
      status: p ? "ready" : "not_ready",
      detail: p ? `Licence: ${p.bcc_licence_number || "Set"}` : "No compliance profile set up",
    });

    // FSS
    const fss = fssRes.data || [];
    const primaryFss = fss.find((s: any) => s.is_primary) || fss[0];
    results.push({
      area: "Food Safety Supervisor",
      icon: <Users className="w-4 h-4" />,
      status: primaryFss ? (primaryFss.certificate_expiry && new Date(primaryFss.certificate_expiry) < new Date() ? "warning" : "ready") : "not_ready",
      detail: primaryFss ? `${primaryFss.name}${primaryFss.notified_council ? " — Council notified" : ""}` : "No FSS assigned",
    });

    // Training
    const tr = trainingRes.data || [];
    results.push({
      area: "Food Handler Training",
      icon: <Users className="w-4 h-4" />,
      status: tr.length > 0 ? "ready" : "warning",
      detail: `${tr.length} handler${tr.length !== 1 ? "s" : ""} registered`,
    });

    // Daily Logs
    const logs = logsRes.data || [];
    const today = new Date().toISOString().split("T")[0];
    const todayLogs = logs.filter((l: any) => l.log_date === today);
    results.push({
      area: "Daily Compliance Logs",
      icon: <Thermometer className="w-4 h-4" />,
      status: todayLogs.length >= 5 ? "ready" : todayLogs.length > 0 ? "warning" : "not_ready",
      detail: `${todayLogs.length} entries today`,
    });

    // Corrective Actions
    const ca = correctiveRes.data || [];
    const openCritical = ca.filter((c: any) => c.severity === "critical" && (c.status === "open" || c.status === "in_progress")).length;
    results.push({
      area: "Corrective Actions",
      icon: <AlertTriangle className="w-4 h-4" />,
      status: openCritical > 0 ? "not_ready" : ca.filter((c: any) => c.status === "open").length > 0 ? "warning" : "ready",
      detail: openCritical > 0 ? `${openCritical} critical open` : `${ca.filter((c: any) => c.status === "open").length} open`,
    });

    // Cleaning
    results.push({
      area: "Cleaning Schedules",
      icon: <Sparkles className="w-4 h-4" />,
      status: (cleaningRes.data?.length || 0) > 0 ? "ready" : "warning",
      detail: `${cleaningRes.data?.length || 0} schedule${(cleaningRes.data?.length || 0) !== 1 ? "s" : ""} configured`,
    });

    // Pest Control
    const lastPest = pestRes.data?.[0];
    const pestDays = lastPest ? Math.floor((Date.now() - new Date(lastPest.date_of_service).getTime()) / 86400000) : 999;
    results.push({
      area: "Pest Control",
      icon: <Bug className="w-4 h-4" />,
      status: pestDays <= 30 ? "ready" : pestDays <= 90 ? "warning" : "not_ready",
      detail: lastPest ? `Last: ${pestDays}d ago` : "No records",
    });

    // Equipment
    const lastEquip = equipRes.data?.[0];
    const equipDays = lastEquip ? Math.floor((Date.now() - new Date(lastEquip.performed_at).getTime()) / 86400000) : 999;
    results.push({
      area: "Equipment Calibration",
      icon: <Wrench className="w-4 h-4" />,
      status: equipDays <= 30 ? "ready" : equipDays <= 90 ? "warning" : "not_ready",
      detail: lastEquip ? `Last: ${equipDays}d ago` : "No records",
    });

    // Suppliers
    results.push({
      area: "Supplier Register",
      icon: <Truck className="w-4 h-4" />,
      status: (supplierRes.data?.length || 0) > 0 ? "ready" : "warning",
      detail: `${supplierRes.data?.length || 0} supplier${(supplierRes.data?.length || 0) !== 1 ? "s" : ""}`,
    });

    // Self Assessment
    const lastAssessment = assessmentRes.data?.[0];
    results.push({
      area: "Self-Assessment",
      icon: <ClipboardCheck className="w-4 h-4" />,
      status: lastAssessment ? "ready" : "not_ready",
      detail: lastAssessment ? `Predicted: ${lastAssessment.predicted_star_rating}★` : "Not completed",
    });

    setChecks(results);
    setLoading(false);
  }, [orgId]);

  useEffect(() => { runChecks(); }, [runChecks]);

  const readyCount = checks.filter((c) => c.status === "ready").length;
  const warningCount = checks.filter((c) => c.status === "warning").length;
  const notReadyCount = checks.filter((c) => c.status === "not_ready").length;
  const totalCount = checks.length;
  const score = totalCount > 0 ? Math.round((readyCount / totalCount) * 100) : 0;

  const statusIcon = (s: string) => {
    if (s === "ready") return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
    if (s === "warning") return <AlertTriangle className="w-5 h-5 text-warning" />;
    return <XCircle className="w-5 h-5 text-destructive" />;
  };

  return (
    <Card className="border-[#000080]/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#000080]">
          <ClipboardCheck className="w-5 h-5" />
          Pre-Inspection Readiness
        </CardTitle>
        <CardDescription>How ready are you for a BCC Eat Safe inspection?</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#000080]" /></div>
        ) : (
          <>
            {/* Score */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-[#000080]">{score}%</p>
                <p className="text-sm text-muted-foreground">Readiness Score</p>
              </div>
              <div className="flex gap-2">
                <Badge className="bg-emerald-600">{readyCount} Ready</Badge>
                <Badge variant="secondary">{warningCount} Warning</Badge>
                <Badge variant="destructive">{notReadyCount} Not Ready</Badge>
              </div>
            </div>
            <Progress value={score} className="h-3" />

            {/* Checks */}
            <div className="space-y-2">
              {checks.map((c) => (
                <div key={c.area} className={`flex items-center gap-3 p-3 rounded-lg border ${
                  c.status === "ready" ? "border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20" :
                  c.status === "warning" ? "border-warning/30 bg-warning/5" :
                  "border-destructive/30 bg-destructive/5"
                }`}>
                  {statusIcon(c.status)}
                  <div className="flex-1">
                    <p className="text-sm font-medium flex items-center gap-1.5">{c.icon} {c.area}</p>
                    <p className="text-xs text-muted-foreground">{c.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}