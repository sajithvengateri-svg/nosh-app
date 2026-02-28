import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { GraduationCap, Plus, Video, FileText, HelpCircle, ClipboardCheck } from "lucide-react";

const moduleTypeIcons: Record<string, any> = {
  VIDEO: Video,
  READ_ACKNOWLEDGE: FileText,
  READ_QUIZ: HelpCircle,
  PRACTICAL_ASSESSMENT: ClipboardCheck,
  DOCUMENT_SIGN: FileText,
};

const ClockInduction = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const { user } = useAuth();
  const { toast } = useToast();
  const [modules, setModules] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", module_type: "READ_ACKNOWLEDGE", estimated_minutes: 10, required_for_roles: "ALL" });

  const load = async () => {
    if (!orgId) return;
    const { data } = await supabase
      .from("clock_induction_modules")
      .select("*")
      .eq("org_id", orgId)
      .order("sort_order");
    setModules(data || []);
  };

  useEffect(() => { load(); }, [orgId]);

  const createModule = async () => {
    if (!orgId || !form.title) return;
    await supabase.from("clock_induction_modules").insert({
      org_id: orgId,
      title: form.title,
      description: form.description,
      module_type: form.module_type,
      estimated_minutes: form.estimated_minutes,
      required_for_roles: [form.required_for_roles],
      created_by: user?.id,
      sort_order: modules.length,
    });
    toast({ title: "Module created" });
    setShowCreate(false);
    setForm({ title: "", description: "", module_type: "READ_ACKNOWLEDGE", estimated_minutes: 10, required_for_roles: "ALL" });
    load();
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <GraduationCap className="w-6 h-6" /> Induction Modules
          </h1>
          <p className="text-muted-foreground">Configure onboarding training modules</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4 mr-1" /> Add Module</Button>
      </div>

      {modules.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No induction modules configured. Add your first module to get started.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {modules.map((m, i) => {
            const Icon = moduleTypeIcons[m.module_type] || FileText;
            return (
              <Card key={m.id}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{i + 1}. {m.title}</p>
                    <p className="text-xs text-muted-foreground">{m.description}</p>
                  </div>
                  <Badge variant="outline">{m.module_type.replace(/_/g, " ")}</Badge>
                  <span className="text-xs text-muted-foreground">{m.estimated_minutes} min</span>
                  <Badge variant={m.is_active ? "default" : "secondary"}>{m.is_active ? "Active" : "Inactive"}</Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Induction Module</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Module title" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
            <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
            <Select value={form.module_type} onValueChange={(v) => setForm(f => ({ ...f, module_type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="VIDEO">Video</SelectItem>
                <SelectItem value="READ_ACKNOWLEDGE">Read + Acknowledge</SelectItem>
                <SelectItem value="READ_QUIZ">Read + Quiz</SelectItem>
                <SelectItem value="PRACTICAL_ASSESSMENT">Practical Assessment</SelectItem>
                <SelectItem value="DOCUMENT_SIGN">Document Sign</SelectItem>
              </SelectContent>
            </Select>
            <Input type="number" placeholder="Estimated minutes" value={form.estimated_minutes} onChange={(e) => setForm(f => ({ ...f, estimated_minutes: parseInt(e.target.value) || 10 }))} />
            <Select value={form.required_for_roles} onValueChange={(v) => setForm(f => ({ ...f, required_for_roles: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="KITCHEN">Kitchen Only</SelectItem>
                <SelectItem value="BAR">Bar Only</SelectItem>
                <SelectItem value="FOH">FOH Only</SelectItem>
              </SelectContent>
            </Select>
            <Button className="w-full" onClick={createModule} disabled={!form.title}>Create Module</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClockInduction;
