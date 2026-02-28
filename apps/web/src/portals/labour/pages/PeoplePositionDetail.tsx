import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOrg } from "@/contexts/OrgContext";
import { useRecruitmentPositions, useRecruitmentApplicants, useCreateApplicant, useUpdateApplicant } from "@/lib/shared/queries/peopleQueries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SOURCES = ["DIRECT", "SEEK", "INDEED", "REFERRAL", "WALK_IN"];

const PeoplePositionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const { data: positions } = useRecruitmentPositions(orgId);
  const { data: applicants } = useRecruitmentApplicants(orgId, id);
  const createApplicant = useCreateApplicant();
  const updateApplicant = useUpdateApplicant();
  const [showAdd, setShowAdd] = useState(false);
  const [screening, setScreening] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", cover_letter: "", source: "DIRECT" });

  const position = positions?.find(p => p.id === id);

  const handleAddApplicant = async () => {
    if (!form.full_name || !orgId || !id) return;
    try {
      await createApplicant.mutateAsync({ ...form, org_id: orgId, position_id: id });
      toast.success("Applicant added");
      setShowAdd(false);
      setForm({ full_name: "", email: "", phone: "", cover_letter: "", source: "DIRECT" });
    } catch { toast.error("Failed to add applicant"); }
  };

  const handleAIScreen = async () => {
    if (!position || !applicants) return;
    const toScreen = applicants.filter(a => a.status === "NEW" && !a.ai_score);
    if (toScreen.length === 0) { toast.info("No new applicants to screen"); return; }
    setScreening(true);
    try {
      const { data, error } = await supabase.functions.invoke("screen-applicants", {
        body: { position, applicants: toScreen },
      });
      if (error) throw error;
      if (data?.results) {
        for (const r of data.results) {
          if (r.overall_score != null) {
            await updateApplicant.mutateAsync({ id: r.applicant_id, ai_score: r.overall_score, ai_summary: r.summary, status: "SCREENING" });
          }
        }
        toast.success(`Screened ${data.results.filter((r: any) => r.overall_score != null).length} applicants`);
      }
    } catch (e: any) { toast.error(e.message || "AI screening failed"); }
    setScreening(false);
  };

  if (!position) return <div className="p-6 text-center text-muted-foreground">Position not found</div>;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => navigate("/labour/people/recruitment")}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{position.title}</h1>
          <div className="flex gap-2 mt-1">
            <Badge variant="outline">{position.section}</Badge>
            <Badge variant="outline">{position.employment_type?.replace("_", " ")}</Badge>
            <Badge variant={position.status === "OPEN" ? "default" : "secondary"}>{position.status}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleAIScreen} disabled={screening}>
            <Sparkles className="w-4 h-4 mr-2" />{screening ? "Screening…" : "AI Screen"}
          </Button>
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-2" />Add Applicant</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Applicant</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Full Name</Label><Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
                  <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
                </div>
                <div><Label>Source</Label>
                  <Select value={form.source} onValueChange={v => setForm(f => ({ ...f, source: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{SOURCES.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Resume / Cover Letter</Label><Textarea rows={5} value={form.cover_letter} onChange={e => setForm(f => ({ ...f, cover_letter: e.target.value }))} placeholder="Paste resume text…" /></div>
                <Button onClick={handleAddApplicant} disabled={!form.full_name || createApplicant.isPending} className="w-full">Add</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {position.description && <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">{position.description}</p></CardContent></Card>}

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Applicants ({applicants?.length ?? 0})</CardTitle></CardHeader>
        <CardContent>
          {applicants && applicants.length > 0 ? (
            <div className="space-y-2">
              {applicants.map(a => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 rounded px-2 -mx-2 transition-colors" onClick={() => navigate(`/labour/people/applicants/${a.id}`)}>
                  <div>
                    <p className="text-sm font-medium text-foreground">{a.full_name}</p>
                    <p className="text-xs text-muted-foreground">{a.email} · {a.source}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {a.ai_score != null && <Badge variant={a.ai_score >= 70 ? "default" : "secondary"}>{a.ai_score}%</Badge>}
                    <Badge variant="outline">{a.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No applicants yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PeoplePositionDetail;
