import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, AlertTriangle, CheckCircle2, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import type { FoodHandlerTraining } from "@/hooks/useBCCCompliance";
import { format, parseISO, isPast } from "date-fns";

interface Props {
  training: FoodHandlerTraining[];
  onAdd: (data: Omit<FoodHandlerTraining, "id" | "org_id">) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const TRAINING_TYPES = [
  { value: "food_safety_course", label: "Food Safety Course" },
  { value: "im_alert", label: "I'm Alert Online" },
  { value: "induction", label: "Workplace Induction" },
  { value: "refresher", label: "Refresher Training" },
];

const emptyForm = (): Omit<FoodHandlerTraining, "id" | "org_id"> => ({
  handler_name: "",
  role: "",
  training_type: "food_safety_course",
  training_provider: "",
  training_date: "",
  certificate_url: "",
  expiry_date: "",
  covers_safe_handling: false,
  covers_contamination: false,
  covers_cleaning: false,
  covers_personal_hygiene: false,
});

export default function TrainingRegister({ training, onAdd, onDelete }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const allCovered = form.covers_safe_handling && form.covers_contamination && form.covers_cleaning && form.covers_personal_hygiene;

  const handleSave = async () => {
    if (!form.handler_name.trim()) { toast.error("Handler name is required"); return; }
    if (!allCovered) { toast.error("All 4 training areas must be covered"); return; }
    setSaving(true);
    try {
      await onAdd(form);
      toast.success("Training record added");
      setForm(emptyForm());
      setDialogOpen(false);
    } catch { toast.error("Failed to save"); }
    setSaving(false);
  };

  const untrained = training.filter((t) => !t.covers_safe_handling || !t.covers_contamination || !t.covers_cleaning || !t.covers_personal_hygiene);
  const expired = training.filter((t) => t.expiry_date && isPast(parseISO(t.expiry_date)));

  return (
    <>
      <Card className="border-[#000080]/20">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-[#000080]" />
              Food Handler Training Register
            </CardTitle>
            <CardDescription>Standard 3.2.2A — all handlers must demonstrate competency in 4 areas</CardDescription>
          </div>
          <Button size="sm" className="bg-[#000080] hover:bg-[#000080]/90 text-white" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Add Handler
          </Button>
        </CardHeader>

        {/* Warnings */}
        {(untrained.length > 0 || expired.length > 0) && (
          <div className="px-6 space-y-2 pb-2">
            {untrained.length > 0 && (
              <div className="flex items-center gap-2 text-warning text-sm bg-warning/10 rounded-lg px-3 py-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {untrained.length} handler{untrained.length > 1 ? "s" : ""} missing training coverage
              </div>
            )}
            {expired.length > 0 && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-lg px-3 py-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {expired.length} expired certificate{expired.length > 1 ? "s" : ""}
              </div>
            )}
          </div>
        )}

        <CardContent>
          {training.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No training records yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Coverage</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {training.map((t) => {
                    const covered = [t.covers_safe_handling, t.covers_contamination, t.covers_cleaning, t.covers_personal_hygiene].filter(Boolean).length;
                    const isExpired = t.expiry_date && isPast(parseISO(t.expiry_date));
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.handler_name}</TableCell>
                        <TableCell>{t.role || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {TRAINING_TYPES.find((tt) => tt.value === t.training_type)?.label || t.training_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {t.training_date ? format(parseISO(t.training_date), "dd/MM/yy") : "—"}
                          {isExpired && <Badge variant="destructive" className="ml-1 text-xs">Expired</Badge>}
                        </TableCell>
                        <TableCell>
                          {covered === 4 ? (
                            <CheckCircle2 className="w-4 h-4 text-success" />
                          ) : (
                            <span className="text-xs text-warning">{covered}/4</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(t.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Food Handler</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Handler Name *</Label>
                <Input value={form.handler_name} onChange={(e) => setForm({ ...form, handler_name: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Role</Label>
                <Input value={form.role || ""} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="e.g. Chef, Kitchen Hand" className="mt-1" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Training Type</Label>
                <Select value={form.training_type} onValueChange={(v) => setForm({ ...form, training_type: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TRAINING_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Training Provider</Label>
                <Input value={form.training_provider || ""} onChange={(e) => setForm({ ...form, training_provider: e.target.value })} placeholder="RTO name" className="mt-1" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Training Date</Label>
                <Input type="date" value={form.training_date || ""} onChange={(e) => setForm({ ...form, training_date: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Expiry Date</Label>
                <Input type="date" value={form.expiry_date || ""} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} className="mt-1" />
              </div>
            </div>

            {/* 4-area checklist */}
            <div>
              <Label className="mb-2 block">Training Coverage (all 4 required) *</Label>
              <div className="space-y-2">
                {[
                  { key: "covers_safe_handling" as const, label: "Safe food handling" },
                  { key: "covers_contamination" as const, label: "Food contamination prevention" },
                  { key: "covers_cleaning" as const, label: "Cleaning & sanitising" },
                  { key: "covers_personal_hygiene" as const, label: "Personal hygiene" },
                ].map((area) => (
                  <div key={area.key} className="flex items-center gap-2">
                    <Checkbox
                      checked={form[area.key]}
                      onCheckedChange={(v) => setForm({ ...form, [area.key]: !!v })}
                    />
                    <span className="text-sm">{area.label}</span>
                  </div>
                ))}
              </div>
              {!allCovered && <p className="text-xs text-warning mt-1">All 4 areas must be covered per Standard 3.2.2A</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#000080] hover:bg-[#000080]/90 text-white">
              {saving ? "Saving…" : "Add Handler"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
