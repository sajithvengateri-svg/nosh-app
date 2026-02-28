import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, Mail, Sparkles, UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrg } from "@/contexts/OrgContext";
import { useRecruitmentApplicants, useRecruitmentInterviews, useUpdateApplicant } from "@/lib/shared/queries/peopleQueries";
import { toast } from "sonner";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

const CHECKLIST_TYPES = [
  "PERSONAL_DETAILS", "BANK_SUPER", "DOCUMENTS", "UNIFORM_TOOLS", "IDENTITY_CHECK", "INDUCTION",
];

const PeopleApplicantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const { data: applicants } = useRecruitmentApplicants(orgId);
  const { data: interviews } = useRecruitmentInterviews(id);
  const updateApplicant = useUpdateApplicant();
  const [converting, setConverting] = useState(false);

  const applicant = applicants?.find(a => a.id === id);

  const moveStatus = async (status: string) => {
    if (!id) return;
    try { await updateApplicant.mutateAsync({ id, status }); toast.success(`Moved to ${status}`); } catch { toast.error("Failed"); }
  };

  const handleConvertToEmployee = async () => {
    if (!applicant || !orgId) return;
    setConverting(true);
    try {
      // 1. Create a profile row
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .upsert({
          user_id: crypto.randomUUID(),
          full_name: applicant.full_name,
          email: applicant.email || "",
        }, { onConflict: "email" })
        .select()
        .single();
      if (profileErr) throw profileErr;

      const userId = profile.user_id;
      const position = (applicant as any).recruitment_positions;
      const sectionTag = position?.section || "KITCHEN";

      // 2. Create employee_profiles row
      const { error: empErr } = await supabase.from("employee_profiles").insert({
        org_id: orgId,
        user_id: userId,
        employment_type: "FULL_TIME",
        pay_type: "AWARD_HOURLY",
        classification: "LEVEL_1",
        section_tags: [sectionTag],
        start_date: new Date().toISOString().split("T")[0],
        is_active: true,
      });
      if (empErr) throw empErr;

      // 3. Create 6 onboarding checklists
      const checklists = CHECKLIST_TYPES.map(type => ({
        org_id: orgId,
        user_id: userId,
        checklist_type: type,
        status: "PENDING",
      }));
      const { error: clErr } = await supabase.from("onboarding_checklists").insert(checklists);
      if (clErr) throw clErr;

      // 4. Update applicant status to HIRED
      await updateApplicant.mutateAsync({ id: applicant.id, status: "HIRED" });

      // 5. Send welcome email
      try {
        await supabase.functions.invoke("send-onboarding-email", {
          body: {
            type: "welcome",
            employee_name: applicant.full_name,
            employee_email: applicant.email,
            org_name: currentOrg?.name,
            section: sectionTag,
          },
        });
      } catch { /* email failure is non-blocking */ }

      toast.success("Converted to employee — onboarding started");
      navigate("/labour/people/onboarding");
    } catch (err: any) {
      console.error("Convert error:", err);
      toast.error(err.message || "Failed to convert");
    } finally {
      setConverting(false);
    }
  };

  if (!applicant) return <div className="p-6 text-center text-muted-foreground">Applicant not found</div>;

  const position = (applicant as any).recruitment_positions;
  const awardRate = 25.68;
  const superPct = 0.115;
  const annualHours = 38 * 52;
  const annualBase = awardRate * annualHours;
  const annualSuper = annualBase * superPct;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{applicant.full_name}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            {applicant.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{applicant.email}</span>}
            {applicant.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{applicant.phone}</span>}
          </div>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline">{applicant.status}</Badge>
            <Badge variant="outline">{applicant.source}</Badge>
            {position && <Badge variant="secondary">{position.title}</Badge>}
          </div>
        </div>
        {applicant.status !== "HIRED" && (
          <Button size="sm" onClick={handleConvertToEmployee} disabled={converting}>
            <UserCheck className="w-4 h-4 mr-2" />{converting ? "Converting…" : "Convert to Employee"}
          </Button>
        )}
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="ai">AI Summary</TabsTrigger>
          <TabsTrigger value="interviews">Interviews</TabsTrigger>
          <TabsTrigger value="offer">Offer & Wage</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card><CardContent className="pt-4"><p className="text-sm text-foreground whitespace-pre-wrap">{applicant.cover_letter || "No text provided"}</p></CardContent></Card>
        </TabsContent>

        <TabsContent value="ai">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Sparkles className="w-4 h-4" />AI Assessment</CardTitle></CardHeader>
            <CardContent>
              {applicant.ai_score != null ? (
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold text-primary">{applicant.ai_score}%</div>
                  <p className="text-sm text-muted-foreground flex-1">{applicant.ai_summary}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not yet screened</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interviews">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Interview Timeline</CardTitle></CardHeader>
            <CardContent>
              {interviews && interviews.length > 0 ? interviews.map((i) => (
                <div key={i.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                  <div className={`w-2 h-2 rounded-full mt-2 ${i.outcome === "PASS" ? "bg-emerald-500" : i.outcome === "FAIL" ? "bg-red-500" : "bg-amber-500"}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{i.interview_type.replace("_", " ")}</p>
                    {i.scheduled_at && <p className="text-xs text-muted-foreground">{format(new Date(i.scheduled_at), "PPp")}</p>}
                    {i.score != null && <Badge variant="outline" className="mt-1">{i.score}/10</Badge>}
                  </div>
                  <Badge variant={i.outcome === "PASS" ? "default" : i.outcome === "FAIL" ? "destructive" : "secondary"}>{i.outcome}</Badge>
                </div>
              )) : <p className="text-sm text-muted-foreground text-center py-4">No interviews</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="offer">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Wage Simulation</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div><p className="text-xs text-muted-foreground">Award Base Rate</p><p className="text-lg font-bold text-foreground">${awardRate.toFixed(2)}/hr</p></div>
                <div><p className="text-xs text-muted-foreground">Annual Base</p><p className="text-lg font-bold text-foreground">${annualBase.toLocaleString()}</p></div>
                <div><p className="text-xs text-muted-foreground">Super (11.5%)</p><p className="text-lg font-bold text-foreground">${annualSuper.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p></div>
                <div><p className="text-xs text-muted-foreground">Total Package</p><p className="text-lg font-bold text-primary">${(annualBase + annualSuper).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardContent className="pt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Move to</p>
          <div className="flex flex-wrap gap-2">
            {["SCREENING", "SHORTLISTED", "INTERVIEW", "TRIAL", "OFFER", "HIRED", "REJECTED"].map(s => (
              <Button key={s} variant={applicant.status === s ? "default" : "outline"} size="sm" onClick={() => moveStatus(s)} disabled={applicant.status === s}>{s.replace("_", " ")}</Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PeopleApplicantDetail;
