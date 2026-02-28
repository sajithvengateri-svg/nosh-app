import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { UserPlus, CheckCircle2, Circle } from "lucide-react";

const statusColors: Record<string, string> = {
  NEW: "secondary",
  INVITED: "outline",
  DETAILS_SUBMITTED: "outline",
  INDUCTION_STARTED: "outline",
  INDUCTION_COMPLETE: "outline",
  CERTS_VERIFIED: "outline",
  READY_TO_WORK: "default",
};

const ClockOnboarding = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const [records, setRecords] = useState<any[]>([]);

  useEffect(() => {
    if (!orgId) return;
    const load = async () => {
      const { data } = await supabase
        .from("onboarding_status")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        const userIds = data.map((r: any) => r.user_id);
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
        setRecords(data.map((r: any) => ({
          ...r,
          full_name: profiles?.find((p: any) => p.user_id === r.user_id)?.full_name || "Unknown",
        })));
      }
    };
    load();
  }, [orgId]);

  const getProgress = (r: any) => {
    const checks = [
      r.personal_details_complete,
      r.employment_docs_signed,
      r.bank_details_complete,
      r.super_details_complete,
      r.tfn_submitted,
      r.induction_complete,
      r.certs_verified,
      r.profile_photo_uploaded,
      r.pin_changed_from_temp,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <UserPlus className="w-6 h-6" /> Onboarding Queue
        </h1>
        <p className="text-muted-foreground">Track new employees from hire to ready-to-work</p>
      </div>

      {records.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">
          No onboarding records. New employees will appear here when created via LabourOS or ClockOS.
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {records.map((r) => {
            const pct = getProgress(r);
            return (
              <Card key={r.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{r.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.invited_at ? `Invited ${format(new Date(r.invited_at), "d MMM")}` : "Not yet invited"}
                      </p>
                    </div>
                    <Badge variant={statusColors[r.status] as any || "outline"}>{r.status.replace(/_/g, " ")}</Badge>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <div className="grid grid-cols-3 gap-1 text-xs">
                    {[
                      { label: "Personal", done: r.personal_details_complete },
                      { label: "Docs Signed", done: r.employment_docs_signed },
                      { label: "Bank", done: r.bank_details_complete },
                      { label: "Super", done: r.super_details_complete },
                      { label: "TFN", done: r.tfn_submitted },
                      { label: "Induction", done: r.induction_complete },
                      { label: "Certs", done: r.certs_verified },
                      { label: "Photo", done: r.profile_photo_uploaded },
                      { label: "PIN Changed", done: r.pin_changed_from_temp },
                    ].map((item) => (
                      <span key={item.label} className="flex items-center gap-1 text-muted-foreground">
                        {item.done ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <Circle className="w-3 h-3" />}
                        {item.label}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClockOnboarding;
