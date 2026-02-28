import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Archive, Clock, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAwardRates, useArchivedAwardRates } from "@/lib/shared/queries/labourQueries";
import { useQueryClient } from "@tanstack/react-query";

export default function AwardRatesSettings() {
  const { data: currentRates, isLoading } = useAwardRates();
  const { data: archivedRates } = useArchivedAwardRates();
  const queryClient = useQueryClient();

  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [newRates, setNewRates] = useState<Record<string, string>>({});
  const [bulkEffectiveDate, setBulkEffectiveDate] = useState(new Date().toISOString().split("T")[0]);
  const [savingRates, setSavingRates] = useState(false);

  // Add single rate
  const [showAddRate, setShowAddRate] = useState(false);
  const [newRate, setNewRate] = useState({ classification: "", employment_type: "FULL_TIME", base_hourly_rate: "", award_code: "MA000009" });
  const [addingRate, setAddingRate] = useState(false);

  const showRateReminder = useMemo(() => {
    const m = new Date().getMonth();
    return m === 5 || m === 6;
  }, []);

  // Group archived by effective_to date for timeline
  const archivedGroups = useMemo(() => {
    if (!archivedRates?.length) return [];
    const groups: Record<string, typeof archivedRates> = {};
    archivedRates.forEach(r => {
      const key = r.effective_to || "unknown";
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [archivedRates]);

  const handleBulkRateUpdate = async () => {
    const entries = Object.entries(newRates).filter(([, v]) => v && parseFloat(v) > 0);
    if (!entries.length) return;
    setSavingRates(true);
    try {
      for (const [rateId, rate] of entries) {
        const old = currentRates?.find(r => r.id === rateId);
        if (!old) continue;
        await supabase.from("award_rates").update({ effective_to: bulkEffectiveDate, is_current: false }).eq("id", rateId);
        await supabase.from("award_rates").insert({
          award_code: old.award_code,
          classification: old.classification,
          employment_type: old.employment_type,
          base_hourly_rate: parseFloat(rate),
          casual_hourly_rate: old.casual_hourly_rate ? parseFloat(rate) * (1 + (old.casual_loading_pct || 25) / 100) : null,
          casual_loading_pct: old.casual_loading_pct,
          weekly_rate: old.weekly_rate ? parseFloat(rate) * 38 : null,
          annual_rate: old.annual_rate ? parseFloat(rate) * 38 * 52 : null,
          effective_from: bulkEffectiveDate,
          is_current: true,
        });
      }
      toast.success(`Updated ${entries.length} rates — old rates archived`);
      setNewRates({});
      setShowBulkUpdate(false);
      queryClient.invalidateQueries({ queryKey: ["award-rates"] });
      queryClient.invalidateQueries({ queryKey: ["award-rates-archived"] });
    } catch {
      toast.error("Failed to update rates");
    } finally {
      setSavingRates(false);
    }
  };

  const handleAddRate = async () => {
    if (!newRate.classification || !newRate.base_hourly_rate) return;
    setAddingRate(true);
    try {
      const base = parseFloat(newRate.base_hourly_rate);
      const { error } = await supabase.from("award_rates").insert({
        award_code: newRate.award_code,
        classification: newRate.classification,
        employment_type: newRate.employment_type,
        base_hourly_rate: base,
        casual_hourly_rate: newRate.employment_type === "CASUAL" ? base * 1.25 : null,
        casual_loading_pct: 25,
        weekly_rate: base * 38,
        annual_rate: base * 38 * 52,
        effective_from: new Date().toISOString().split("T")[0],
        is_current: true,
      });
      if (error) throw error;
      toast.success("Rate added");
      setShowAddRate(false);
      setNewRate({ classification: "", employment_type: "FULL_TIME", base_hourly_rate: "", award_code: "MA000009" });
      queryClient.invalidateQueries({ queryKey: ["award-rates"] });
    } catch {
      toast.error("Failed to add rate");
    } finally {
      setAddingRate(false);
    }
  };

  const handleDeleteRate = async (id: string) => {
    try {
      await supabase.from("award_rates").delete().eq("id", id);
      toast.success("Rate removed");
      queryClient.invalidateQueries({ queryKey: ["award-rates"] });
      queryClient.invalidateQueries({ queryKey: ["award-rates-archived"] });
    } catch {
      toast.error("Failed to delete rate");
    }
  };

  if (isLoading) return null;

  return (
    <div className="space-y-4">
      {showRateReminder && (
        <div className="p-4 rounded-lg border border-warning/50 bg-warning/10 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">New Fair Work rates may be effective from 1 July</p>
            <p className="text-xs text-muted-foreground mt-1">
              Update rates below. Old rates will be automatically archived with their effective date range preserved.
            </p>
            <Button size="sm" variant="outline" className="mt-2" onClick={() => setShowBulkUpdate(true)}>
              Update Rates Now
            </Button>
          </div>
        </div>
      )}

      <Tabs defaultValue="current">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <TabsList>
            <TabsTrigger value="current">Current ({currentRates?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="archived">
              <Archive className="w-3.5 h-3.5 mr-1" /> Archived ({archivedRates?.length ?? 0})
            </TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowAddRate(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add Rate
            </Button>
            {!showBulkUpdate && (
              <Button variant="outline" size="sm" onClick={() => setShowBulkUpdate(true)}>
                Bulk Update
              </Button>
            )}
          </div>
        </div>

        {/* Add Single Rate */}
        {showAddRate && (
          <Card className="mt-4">
            <CardHeader><CardTitle className="text-base">Add New Rate</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Classification</Label>
                  <Input placeholder="e.g. FB_3" value={newRate.classification} onChange={e => setNewRate(p => ({ ...p, classification: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Employment Type</Label>
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={newRate.employment_type} onChange={e => setNewRate(p => ({ ...p, employment_type: e.target.value }))}>
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CASUAL">Casual</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Base $/hr</Label>
                  <Input type="number" step="0.01" placeholder="25.50" value={newRate.base_hourly_rate} onChange={e => setNewRate(p => ({ ...p, base_hourly_rate: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Award</Label>
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={newRate.award_code} onChange={e => setNewRate(p => ({ ...p, award_code: e.target.value }))}>
                    <option value="MA000009">MA000009</option>
                    <option value="MA000119">MA000119</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowAddRate(false)}>Cancel</Button>
                <Button size="sm" onClick={handleAddRate} disabled={addingRate || !newRate.classification}>
                  {addingRate ? "Adding..." : "Add Rate"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bulk Update */}
        {showBulkUpdate && currentRates?.length ? (
          <Card className="mt-4">
            <CardHeader><CardTitle className="text-base">Bulk Rate Update — Old rates will be filed</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Effective From</Label>
                <Input type="date" value={bulkEffectiveDate} onChange={e => setBulkEffectiveDate(e.target.value)} className="max-w-xs" />
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Classification</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Current $/hr</TableHead>
                    <TableHead>New $/hr</TableHead>
                    <TableHead>Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentRates.map(r => {
                    const val = newRates[r.id] || "";
                    const pct = val ? ((parseFloat(val) - r.base_hourly_rate) / r.base_hourly_rate * 100).toFixed(1) : "";
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium text-foreground">{r.classification}</TableCell>
                        <TableCell><Badge variant="secondary" className="text-xs">{r.employment_type}</Badge></TableCell>
                        <TableCell>${r.base_hourly_rate.toFixed(2)}</TableCell>
                        <TableCell>
                          <Input type="number" step="0.01" className="w-24" placeholder={r.base_hourly_rate.toFixed(2)} value={val} onChange={e => setNewRates(p => ({ ...p, [r.id]: e.target.value }))} />
                        </TableCell>
                        <TableCell className={parseFloat(pct) > 0 ? "text-green-600" : ""}>{pct ? `${pct}%` : "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setShowBulkUpdate(false); setNewRates({}); }}>Cancel</Button>
                <Button onClick={handleBulkRateUpdate} disabled={savingRates || !Object.values(newRates).some(v => v)}>
                  {savingRates ? "Updating..." : "Confirm & Archive Old Rates"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Current Rates Table */}
        <TabsContent value="current" className="mt-4">
          {!currentRates?.length ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No current award rates configured.</CardContent></Card>
          ) : (
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Award</TableHead>
                      <TableHead>Classification</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Base $/hr</TableHead>
                      <TableHead>Casual $/hr</TableHead>
                      <TableHead>Weekly</TableHead>
                      <TableHead>Annual</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentRates.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs text-muted-foreground">{r.award_code}</TableCell>
                        <TableCell className="font-medium text-foreground">{r.classification}</TableCell>
                        <TableCell><Badge variant="secondary" className="text-xs">{r.employment_type}</Badge></TableCell>
                        <TableCell className="font-medium">${r.base_hourly_rate.toFixed(2)}</TableCell>
                        <TableCell>{r.casual_hourly_rate ? `$${r.casual_hourly_rate.toFixed(2)}` : "—"}</TableCell>
                        <TableCell>{r.weekly_rate ? `$${Number(r.weekly_rate).toFixed(0)}` : "—"}</TableCell>
                        <TableCell>{r.annual_rate ? `$${Number(r.annual_rate).toLocaleString()}` : "—"}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{r.effective_from}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteRate(r.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Archived Rates */}
        <TabsContent value="archived" className="mt-4 space-y-4">
          {!archivedGroups.length ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No archived rates. When you update rates, old versions will appear here.</CardContent></Card>
          ) : (
            archivedGroups.map(([endDate, rates]) => (
              <Card key={endDate}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    Superseded {endDate} · {rates.length} classification{rates.length > 1 ? "s" : ""}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Classification</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Base $/hr</TableHead>
                        <TableHead>Effective</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rates.map(r => (
                        <TableRow key={r.id} className="opacity-70">
                          <TableCell className="font-medium">{r.classification}</TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{r.employment_type}</Badge></TableCell>
                          <TableCell>${r.base_hourly_rate.toFixed(2)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{r.effective_from} → {r.effective_to}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
