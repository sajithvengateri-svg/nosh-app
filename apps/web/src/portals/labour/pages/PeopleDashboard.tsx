import { Users, Briefcase, UserPlus, Award, AlertTriangle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useOrg } from "@/contexts/OrgContext";
import { useRecruitmentPositions, useRecruitmentApplicants, useOnboardingChecklists, useEmployeeMilestones } from "@/lib/shared/queries/peopleQueries";

const PeopleDashboard = () => {
  const navigate = useNavigate();
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const { data: positions } = useRecruitmentPositions(orgId);
  const { data: applicants } = useRecruitmentApplicants(orgId);
  const { data: checklists } = useOnboardingChecklists(orgId);
  const { data: milestones } = useEmployeeMilestones(orgId);

  const openPositions = positions?.filter(p => p.status === "OPEN")?.length ?? 0;
  const pipelineCount = applicants?.filter(a => !["HIRED", "REJECTED", "WITHDRAWN"].includes(a.status))?.length ?? 0;
  const onboardingActive = checklists?.filter(c => c.status !== "COMPLETED")?.length ?? 0;
  const upcomingMilestones = milestones?.filter(m => !m.is_acknowledged)?.length ?? 0;

  const stats = [
    { label: "Open Positions", value: openPositions, icon: Briefcase, color: "text-blue-500" },
    { label: "In Pipeline", value: pipelineCount, icon: UserPlus, color: "text-emerald-500" },
    { label: "Onboarding", value: onboardingActive, icon: Clock, color: "text-amber-500" },
    { label: "Milestones", value: upcomingMilestones, icon: Award, color: "text-purple-500" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">People</h1>
          <p className="text-sm text-muted-foreground">Employee lifecycle & recruitment</p>
        </div>
        <Button onClick={() => navigate("/labour/people/recruitment")} size="sm">
          <Briefcase className="w-4 h-4 mr-2" />Recruitment
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-4 space-y-2">
            <p className="text-sm font-semibold text-foreground mb-2">Recruitment Pipeline</p>
            {applicants && applicants.length > 0 ? (
              applicants.slice(0, 5).map((a: any) => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{a.full_name}</p>
                    <p className="text-xs text-muted-foreground">{a.recruitment_positions?.title ?? "—"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {a.ai_score != null && <Badge variant={a.ai_score >= 70 ? "default" : "secondary"} className="text-xs">{a.ai_score}%</Badge>}
                    <Badge variant="outline" className="text-xs">{a.status}</Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No applicants yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 space-y-3">
            <p className="text-sm font-semibold text-foreground mb-2">Onboarding Progress</p>
            {checklists && checklists.length > 0 ? (
              (() => {
                const byUser = checklists.reduce((acc: Record<string, any[]>, c: any) => {
                  (acc[c.user_id] = acc[c.user_id] || []).push(c);
                  return acc;
                }, {});
                return Object.entries(byUser).slice(0, 4).map(([uid, items]) => {
                  const done = items.filter((i: any) => i.status === "COMPLETED").length;
                  const pct = Math.round((done / 6) * 100);
                  return (
                    <div key={uid} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-foreground font-medium">{uid.slice(0, 8)}…</span>
                        <span className="text-muted-foreground">{done}/6</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </div>
                  );
                });
              })()
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No active onboarding</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate("/labour/people/directory")}>
          <CardContent className="pt-4 flex items-center gap-3">
            <Users className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium text-foreground">Directory</p>
              <p className="text-xs text-muted-foreground">View all employees</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate("/labour/people/reviews")}>
          <CardContent className="pt-4 flex items-center gap-3">
            <Award className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium text-foreground">Reviews</p>
              <p className="text-xs text-muted-foreground">Performance tracking</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate("/labour/people/warnings")}>
          <CardContent className="pt-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium text-foreground">Warnings</p>
              <p className="text-xs text-muted-foreground">Disciplinary records</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PeopleDashboard;
