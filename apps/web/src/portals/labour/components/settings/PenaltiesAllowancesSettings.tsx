import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePenaltyRules, useAllowanceRates } from "@/lib/shared/queries/labourQueries";
import { useQueryClient } from "@tanstack/react-query";

export default function PenaltiesAllowancesSettings() {
  const { data: penaltyRules } = usePenaltyRules();
  const { data: allowanceRates } = useAllowanceRates();
  const queryClient = useQueryClient();

  // Add penalty
  const [showAddPenalty, setShowAddPenalty] = useState(false);
  const [newPenalty, setNewPenalty] = useState({ condition: "", employment_type: "ALL", multiplier: "", notes: "" });
  const [addingPenalty, setAddingPenalty] = useState(false);

  // Add allowance
  const [showAddAllowance, setShowAddAllowance] = useState(false);
  const [newAllowance, setNewAllowance] = useState({ allowance_type: "", amount: "", unit: "per_shift", description: "" });
  const [addingAllowance, setAddingAllowance] = useState(false);

  const handleAddPenalty = async () => {
    if (!newPenalty.condition || !newPenalty.multiplier) return;
    setAddingPenalty(true);
    try {
      const { error } = await supabase.from("penalty_rules").insert({
        award_code: "MA000009",
        condition: newPenalty.condition,
        employment_type: newPenalty.employment_type,
        multiplier: parseFloat(newPenalty.multiplier),
        notes: newPenalty.notes || null,
      });
      if (error) throw error;
      toast.success("Penalty rule added");
      setShowAddPenalty(false);
      setNewPenalty({ condition: "", employment_type: "ALL", multiplier: "", notes: "" });
      queryClient.invalidateQueries({ queryKey: ["penalty-rules"] });
    } catch {
      toast.error("Failed to add penalty rule");
    } finally {
      setAddingPenalty(false);
    }
  };

  const handleDeletePenalty = async (id: string) => {
    try {
      await supabase.from("penalty_rules").delete().eq("id", id);
      toast.success("Penalty rule removed");
      queryClient.invalidateQueries({ queryKey: ["penalty-rules"] });
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleAddAllowance = async () => {
    if (!newAllowance.allowance_type || !newAllowance.amount) return;
    setAddingAllowance(true);
    try {
      const { error } = await supabase.from("allowance_rates").insert({
        award_code: "MA000009",
        allowance_type: newAllowance.allowance_type,
        amount: parseFloat(newAllowance.amount),
        unit: newAllowance.unit,
        description: newAllowance.description || null,
        effective_from: new Date().toISOString().split("T")[0],
        is_current: true,
      });
      if (error) throw error;
      toast.success("Allowance added");
      setShowAddAllowance(false);
      setNewAllowance({ allowance_type: "", amount: "", unit: "per_shift", description: "" });
      queryClient.invalidateQueries({ queryKey: ["allowance-rates"] });
    } catch {
      toast.error("Failed to add allowance");
    } finally {
      setAddingAllowance(false);
    }
  };

  const handleDeleteAllowance = async (id: string) => {
    try {
      await supabase.from("allowance_rates").delete().eq("id", id);
      toast.success("Allowance removed");
      queryClient.invalidateQueries({ queryKey: ["allowance-rates"] });
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="space-y-6">
      {/* Penalty Rules */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Penalty Rules ({penaltyRules?.length ?? 0})</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setShowAddPenalty(true)}>
            <Plus className="w-4 h-4 mr-1" /> Add Rule
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {showAddPenalty && (
            <div className="p-3 rounded-lg border border-border space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Condition</Label>
                  <Input placeholder="e.g. Saturday work" value={newPenalty.condition} onChange={e => setNewPenalty(p => ({ ...p, condition: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Type</Label>
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={newPenalty.employment_type} onChange={e => setNewPenalty(p => ({ ...p, employment_type: e.target.value }))}>
                    <option value="ALL">All</option>
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CASUAL">Casual</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Multiplier</Label>
                  <Input type="number" step="0.05" placeholder="1.5" value={newPenalty.multiplier} onChange={e => setNewPenalty(p => ({ ...p, multiplier: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Notes</Label>
                  <Input placeholder="Optional" value={newPenalty.notes} onChange={e => setNewPenalty(p => ({ ...p, notes: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowAddPenalty(false)}>Cancel</Button>
                <Button size="sm" onClick={handleAddPenalty} disabled={addingPenalty}>Add</Button>
              </div>
            </div>
          )}
          {!penaltyRules?.length ? (
            <p className="text-sm text-muted-foreground text-center py-4">No penalty rules configured.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Award</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Multiplier</TableHead>
                    <TableHead>Flat $/hr</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {penaltyRules.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs text-muted-foreground">{r.award_code}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{r.employment_type}</Badge></TableCell>
                      <TableCell className="font-medium text-foreground">{r.condition}</TableCell>
                      <TableCell>{r.multiplier ? `${r.multiplier}×` : "—"}</TableCell>
                      <TableCell>{r.flat_addition ? `$${r.flat_addition.toFixed(2)}` : "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-xs max-w-[200px] truncate">{r.notes || "—"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeletePenalty(r.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Allowance Rates */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Allowance Rates ({allowanceRates?.length ?? 0})</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setShowAddAllowance(true)}>
            <Plus className="w-4 h-4 mr-1" /> Add Allowance
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {showAddAllowance && (
            <div className="p-3 rounded-lg border border-border space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Type</Label>
                  <Input placeholder="e.g. MEAL" value={newAllowance.allowance_type} onChange={e => setNewAllowance(p => ({ ...p, allowance_type: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Amount ($)</Label>
                  <Input type="number" step="0.01" placeholder="18.47" value={newAllowance.amount} onChange={e => setNewAllowance(p => ({ ...p, amount: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Unit</Label>
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={newAllowance.unit} onChange={e => setNewAllowance(p => ({ ...p, unit: e.target.value }))}>
                    <option value="per_shift">Per Shift</option>
                    <option value="per_week">Per Week</option>
                    <option value="per_hour">Per Hour</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Description</Label>
                  <Input placeholder="Optional" value={newAllowance.description} onChange={e => setNewAllowance(p => ({ ...p, description: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowAddAllowance(false)}>Cancel</Button>
                <Button size="sm" onClick={handleAddAllowance} disabled={addingAllowance}>Add</Button>
              </div>
            </div>
          )}
          {!allowanceRates?.length ? (
            <p className="text-sm text-muted-foreground text-center py-4">No allowance rates configured.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Award</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allowanceRates.map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="text-xs text-muted-foreground">{a.award_code}</TableCell>
                      <TableCell className="font-medium text-foreground">{a.allowance_type}</TableCell>
                      <TableCell className="font-medium">${a.amount.toFixed(2)}</TableCell>
                      <TableCell>{a.unit}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{a.description || "—"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteAllowance(a.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
