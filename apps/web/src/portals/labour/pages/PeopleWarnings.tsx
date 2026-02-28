import { useState } from "react";
import { Plus, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useOrg } from "@/contexts/OrgContext";
import { useEmployeeWarnings, useCreateWarning } from "@/lib/shared/queries/peopleQueries";
import { toast } from "sonner";
import { format } from "date-fns";

const WARNING_TYPES = ["VERBAL", "FIRST_WRITTEN", "FINAL_WRITTEN", "SHOW_CAUSE", "TERMINATION"];

const PeopleWarnings = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const { data: warnings } = useEmployeeWarnings(orgId);
  const createWarning = useCreateWarning();
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ user_id: "", warning_type: "VERBAL", reason: "", details: "" });

  const handleCreate = async () => {
    if (!form.user_id || !form.reason || !orgId) { toast.error("Fill required fields"); return; }
    try {
      await createWarning.mutateAsync({ ...form, org_id: orgId });
      toast.success("Warning issued");
      setShowNew(false);
      setForm({ user_id: "", warning_type: "VERBAL", reason: "", details: "" });
    } catch { toast.error("Failed"); }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Warnings</h1>
          <p className="text-sm text-muted-foreground">{warnings?.length ?? 0} active warnings</p>
        </div>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger asChild><Button size="sm" variant="destructive"><Plus className="w-4 h-4 mr-2" />Issue Warning</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Issue Warning</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Employee User ID</Label><Input value={form.user_id} onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))} placeholder="Paste employee user ID" /></div>
              <div><Label>Warning Type</Label>
                <Select value={form.warning_type} onValueChange={v => setForm(f => ({ ...f, warning_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{WARNING_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex gap-1">
                {WARNING_TYPES.map((w, i) => <div key={w} className={`flex-1 h-2 rounded ${WARNING_TYPES.indexOf(form.warning_type) >= i ? "bg-destructive" : "bg-muted"}`} />)}
              </div>
              <div><Label>Reason</Label><Input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} /></div>
              <div><Label>Details</Label><Textarea value={form.details} onChange={e => setForm(f => ({ ...f, details: e.target.value }))} /></div>
              <Button onClick={handleCreate} disabled={createWarning.isPending} variant="destructive" className="w-full">Issue Warning</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {warnings && warnings.length > 0 ? warnings.map(w => (
        <Card key={w.id}>
          <CardContent className="pt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <div><p className="text-sm font-medium text-foreground">{w.reason}</p><p className="text-xs text-muted-foreground">{w.user_id?.slice(0, 8)}… · {format(new Date(w.issued_at), "dd MMM yyyy")}</p></div>
            </div>
            <Badge variant="outline">{w.warning_type.replace(/_/g, " ")}</Badge>
          </CardContent>
        </Card>
      )) : (
        <Card><CardContent className="pt-8 pb-8 text-center">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">No warnings issued</p>
        </CardContent></Card>
      )}
    </div>
  );
};

export default PeopleWarnings;
