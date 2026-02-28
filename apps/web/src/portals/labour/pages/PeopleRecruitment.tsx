import { useState } from "react";
import { Plus, Search, Briefcase } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useOrg } from "@/contexts/OrgContext";
import { useRecruitmentPositions, useCreatePosition, useRecruitmentApplicants, useUpdateApplicant } from "@/lib/shared/queries/peopleQueries";
import { toast } from "sonner";

const PIPELINE_COLUMNS = ["NEW", "SCREENING", "SHORTLISTED", "INTERVIEW", "TRIAL", "OFFER", "HIRED"];
const SECTIONS = ["KITCHEN", "BAR", "FOH", "BACK_HOUSE"];

const PeopleRecruitment = () => {
  const navigate = useNavigate();
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const { data: positions } = useRecruitmentPositions(orgId);
  const { data: applicants } = useRecruitmentApplicants(orgId);
  const createPosition = useCreatePosition();
  const updateApplicant = useUpdateApplicant();
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ title: "", section: "KITCHEN", employment_type: "FULL_TIME", description: "", requirements: "", wage_range_min: "", wage_range_max: "" });

  const handleCreate = async () => {
    if (!form.title || !orgId) return;
    try {
      await createPosition.mutateAsync({
        ...form, org_id: orgId,
        wage_range_min: form.wage_range_min ? Number(form.wage_range_min) : null,
        wage_range_max: form.wage_range_max ? Number(form.wage_range_max) : null,
        status: "OPEN", posted_at: new Date().toISOString(),
      });
      toast.success("Position created");
      setShowCreate(false);
      setForm({ title: "", section: "KITCHEN", employment_type: "FULL_TIME", description: "", requirements: "", wage_range_min: "", wage_range_max: "" });
    } catch { toast.error("Failed to create position"); }
  };

  const moveApplicant = async (id: string, newStatus: string) => {
    try { await updateApplicant.mutateAsync({ id, status: newStatus }); } catch { toast.error("Failed"); }
  };

  const filtered = applicants?.filter(a => !search || a.full_name.toLowerCase().includes(search.toLowerCase())) ?? [];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Recruitment</h1>
          <p className="text-sm text-muted-foreground">{positions?.filter(p => p.status === "OPEN").length ?? 0} open positions</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-2" />Create Position</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>New Position</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Chef de Partie" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Section</Label>
                  <Select value={form.section} onValueChange={v => setForm(f => ({ ...f, section: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{SECTIONS.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Type</Label>
                  <Select value={form.employment_type} onValueChange={v => setForm(f => ({ ...f, employment_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FULL_TIME">Full Time</SelectItem>
                      <SelectItem value="PART_TIME">Part Time</SelectItem>
                      <SelectItem value="CASUAL">Casual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Min Wage ($/hr)</Label><Input type="number" value={form.wage_range_min} onChange={e => setForm(f => ({ ...f, wage_range_min: e.target.value }))} /></div>
                <div><Label>Max Wage ($/hr)</Label><Input type="number" value={form.wage_range_max} onChange={e => setForm(f => ({ ...f, wage_range_max: e.target.value }))} /></div>
              </div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div><Label>Requirements</Label><Textarea value={form.requirements} onChange={e => setForm(f => ({ ...f, requirements: e.target.value }))} /></div>
              <Button onClick={handleCreate} disabled={!form.title || createPosition.isPending} className="w-full">{createPosition.isPending ? "Creating…" : "Create Position"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {positions && positions.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {positions.map((p) => (
            <Card key={p.id} className="min-w-[200px] cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate(`/labour/people/recruitment/${p.id}`)}>
              <CardContent className="pt-4 space-y-1">
                <p className="font-medium text-sm text-foreground">{p.title}</p>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">{p.section}</Badge>
                  <Badge variant={p.status === "OPEN" ? "default" : "secondary"} className="text-xs">{p.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-10" placeholder="Search applicants…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {PIPELINE_COLUMNS.map(col => {
          const colApplicants = filtered.filter(a => a.status === col);
          return (
            <div key={col} className="min-w-[220px] flex-shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{col.replace("_", " ")}</h3>
                <Badge variant="secondary" className="text-xs">{colApplicants.length}</Badge>
              </div>
              <div className="space-y-2">
                {colApplicants.map((a) => (
                  <Card key={a.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate(`/labour/people/applicants/${a.id}`)}>
                    <CardContent className="p-3 space-y-2">
                      <p className="text-sm font-medium text-foreground">{a.full_name}</p>
                      <div className="flex items-center gap-2">
                        {a.ai_score != null && <Badge variant={a.ai_score >= 70 ? "default" : a.ai_score >= 40 ? "secondary" : "destructive"} className="text-xs">{a.ai_score}%</Badge>}
                        <span className="text-xs text-muted-foreground">{a.source}</span>
                      </div>
                      {col !== "HIRED" && PIPELINE_COLUMNS.indexOf(col) < PIPELINE_COLUMNS.length - 1 && (
                        <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={(e) => { e.stopPropagation(); moveApplicant(a.id, PIPELINE_COLUMNS[PIPELINE_COLUMNS.indexOf(col) + 1]); }}>
                          → {PIPELINE_COLUMNS[PIPELINE_COLUMNS.indexOf(col) + 1]?.replace("_", " ")}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {colApplicants.length === 0 && <div className="border border-dashed border-border rounded-lg p-4 text-center text-xs text-muted-foreground">Empty</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PeopleRecruitment;
