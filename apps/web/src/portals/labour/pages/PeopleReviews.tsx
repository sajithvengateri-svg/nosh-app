import { useState } from "react";
import { Plus, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { useOrg } from "@/contexts/OrgContext";
import { usePerformanceReviews, useCreateReview } from "@/lib/shared/queries/peopleQueries";
import { toast } from "sonner";
import { format } from "date-fns";

const SCORING_CATEGORIES = ["punctuality", "teamwork", "technical_skill", "hygiene_safety", "initiative", "communication"];

const PeopleReviews = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const { data: reviews } = usePerformanceReviews(orgId);
  const createReview = useCreateReview();
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    user_id: "",
    review_type: "ANNUAL",
    comments: "",
    scores: Object.fromEntries(SCORING_CATEGORIES.map(c => [c, 3])),
  });

  const overallScore = Object.values(form.scores).reduce((a, b) => a + b, 0) / SCORING_CATEGORIES.length;

  const handleCreate = async () => {
    if (!form.user_id || !orgId) { toast.error("Select an employee"); return; }
    try {
      await createReview.mutateAsync({
        org_id: orgId, user_id: form.user_id, review_type: form.review_type,
        scores: form.scores, overall_score: Math.round(overallScore * 10) / 10,
        comments: form.comments, status: "DRAFT", review_date: new Date().toISOString().slice(0, 10),
      });
      toast.success("Review created");
      setShowNew(false);
    } catch { toast.error("Failed"); }
  };

  const grouped = {
    upcoming: reviews?.filter(r => r.status === "DRAFT") ?? [],
    completed: reviews?.filter(r => r.status !== "DRAFT") ?? [],
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Performance Reviews</h1>
          <p className="text-sm text-muted-foreground">{reviews?.length ?? 0} total reviews</p>
        </div>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-2" />New Review</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>New Performance Review</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Employee User ID</Label><Input value={form.user_id} onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))} placeholder="Paste employee user ID" /></div>
              <div><Label>Review Type</Label>
                <Select value={form.review_type} onValueChange={v => setForm(f => ({ ...f, review_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PROBATION">Probation</SelectItem>
                    <SelectItem value="ANNUAL">Annual</SelectItem>
                    <SelectItem value="MID_YEAR">Mid-Year</SelectItem>
                    <SelectItem value="AD_HOC">Ad Hoc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label>Scoring (1-5)</Label>
                {SCORING_CATEGORIES.map(cat => (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-sm text-foreground w-32 capitalize">{cat.replace("_", " ")}</span>
                    <Slider min={1} max={5} step={1} value={[form.scores[cat]]} onValueChange={([v]) => setForm(f => ({ ...f, scores: { ...f.scores, [cat]: v } }))} className="flex-1" />
                    <span className="text-sm font-medium text-foreground w-6 text-right">{form.scores[cat]}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 mt-2">
                  <Star className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold text-foreground">Overall: {overallScore.toFixed(1)}/5</span>
                </div>
              </div>
              <div><Label>Comments</Label><Textarea value={form.comments} onChange={e => setForm(f => ({ ...f, comments: e.target.value }))} /></div>
              <Button onClick={handleCreate} disabled={createReview.isPending} className="w-full">Create Review</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {(["upcoming", "completed"] as const).map(group => (
        <div key={group}>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 capitalize">{group}</h2>
          {grouped[group].length > 0 ? grouped[group].map(r => (
            <Card key={r.id} className="mb-2">
              <CardContent className="pt-4 flex items-center justify-between">
                <div><p className="text-sm font-medium text-foreground">{r.review_type} Review</p><p className="text-xs text-muted-foreground">{r.review_date ? format(new Date(r.review_date), "dd MMM yyyy") : "—"}</p></div>
                <div className="flex items-center gap-2">
                  {r.overall_score && <Badge variant="outline">{r.overall_score}/5</Badge>}
                  <Badge variant={r.status === "DRAFT" ? "secondary" : "default"}>{r.status}</Badge>
                </div>
              </CardContent>
            </Card>
          )) : <p className="text-sm text-muted-foreground mb-4">None</p>}
        </div>
      ))}
    </div>
  );
};

export default PeopleReviews;
