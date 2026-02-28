import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Landmark, Plus, Pencil, Trash2, TrendingDown, DollarSign, Loader2, Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format, parseISO, differenceInMonths } from "date-fns";
import { cn } from "@/lib/utils";

const METHODS = [
  { value: "STRAIGHT_LINE", label: "Straight Line" },
  { value: "DIMINISHING_VALUE", label: "Diminishing Value" },
];

const OverheadAssets = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    name: "", purchase_price: "", purchase_date: format(new Date(), "yyyy-MM-dd"),
    useful_life_years: "5", depreciation_method: "STRAIGHT_LINE", salvage_value: "0",
  });

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["depreciation_assets", orgId],
    queryFn: async () => {
      const { data } = await supabase.from("depreciation_assets").select("*").eq("org_id", orgId!).order("created_at", { ascending: false });
      return (data ?? []).map((a: any) => {
        // Calculate current values
        const months = differenceInMonths(new Date(), parseISO(a.purchase_date));
        const totalMonths = a.useful_life_years * 12;
        const monthlyDep = (a.purchase_price - a.salvage_value) / totalMonths;
        const totalDep = Math.min(months * monthlyDep, a.purchase_price - a.salvage_value);
        const bookValue = Math.max(a.purchase_price - totalDep, a.salvage_value);
        const depPct = ((a.purchase_price - bookValue) / (a.purchase_price - a.salvage_value || 1)) * 100;
        return { ...a, calc_monthly: monthlyDep, calc_book_value: bookValue, calc_total_dep: totalDep, calc_pct: Math.min(depPct, 100), months_elapsed: months, total_months: totalMonths };
      });
    },
    enabled: !!orgId,
  });

  const saveMut = useMutation({
    mutationFn: async (values: any) => {
      const price = parseFloat(values.purchase_price);
      const salvage = parseFloat(values.salvage_value) || 0;
      const years = parseInt(values.useful_life_years);
      const monthly = (price - salvage) / (years * 12);
      const payload = {
        org_id: orgId!, name: values.name, purchase_price: price,
        purchase_date: values.purchase_date, useful_life_years: years,
        depreciation_method: values.depreciation_method, salvage_value: salvage,
        monthly_depreciation: monthly, current_book_value: price,
      };
      if (editing) {
        const { error } = await supabase.from("depreciation_assets").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("depreciation_assets").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["depreciation_assets"] });
      toast.success(editing ? "Asset updated" : "Asset added");
      closeDialog();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("depreciation_assets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["depreciation_assets"] }); toast.success("Asset removed"); },
  });

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", purchase_price: "", purchase_date: format(new Date(), "yyyy-MM-dd"), useful_life_years: "5", depreciation_method: "STRAIGHT_LINE", salvage_value: "0" });
    setDialogOpen(true);
  };
  const openEdit = (a: any) => {
    setEditing(a);
    setForm({ name: a.name, purchase_price: String(a.purchase_price), purchase_date: a.purchase_date, useful_life_years: String(a.useful_life_years), depreciation_method: a.depreciation_method, salvage_value: String(a.salvage_value) });
    setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditing(null); };

  const totalBookValue = assets.reduce((s: number, a: any) => s + a.calc_book_value, 0);
  const totalMonthlyDep = assets.reduce((s: number, a: any) => s + (a.calc_pct < 100 ? a.calc_monthly : 0), 0);
  const totalPurchase = assets.reduce((s: number, a: any) => s + Number(a.purchase_price), 0);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Landmark className="w-6 h-6 text-primary" /> Assets & Depreciation
          </h1>
          <p className="text-muted-foreground text-sm">Track equipment value and monthly depreciation for your P&L</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> Add Asset</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Purchase Value</p>
            <p className="text-2xl font-bold font-mono text-foreground">${totalPurchase.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Current Book Value</p>
            <p className="text-2xl font-bold font-mono text-emerald-500">${totalBookValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Monthly Depreciation</p>
            <p className="text-2xl font-bold font-mono text-amber-500">${totalMonthlyDep.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            <p className="text-[10px] text-muted-foreground">→ injected into P&L</p>
          </CardContent>
        </Card>
      </div>

      {/* Assets List */}
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : assets.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No assets tracked yet. Add your first piece of equipment.
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {assets.map((a: any) => {
            const fullyDep = a.calc_pct >= 100;
            return (
              <Card key={a.id} className={cn(fullyDep && "border-dashed opacity-70")}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-foreground">{a.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        Purchased {format(parseISO(a.purchase_date), "d MMM yyyy")}
                        <Badge variant="outline" className="text-[9px]">{a.useful_life_years}yr life</Badge>
                        {fullyDep && <Badge variant="secondary" className="text-[9px]">Fully Depreciated</Badge>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(a)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMut.mutate(a.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Depreciation Progress</span>
                      <span className="font-mono text-foreground">{a.calc_pct.toFixed(0)}%</span>
                    </div>
                    <Progress value={a.calc_pct} className={cn("h-2", a.calc_pct >= 100 && "[&>div]:bg-muted-foreground")} />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Purchase</p>
                      <p className="text-sm font-mono font-bold text-foreground">${Number(a.purchase_price).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Book Value</p>
                      <p className="text-sm font-mono font-bold text-emerald-500">${a.calc_book_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Monthly Dep.</p>
                      <p className="text-sm font-mono font-bold text-amber-500 flex items-center justify-center gap-0.5">
                        <TrendingDown className="w-3 h-3" />${a.calc_monthly.toFixed(0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Asset" : "Add Asset"}</DialogTitle>
            <DialogDescription>Track equipment depreciation for accurate P&L reporting.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Asset Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. La Marzocca Espresso Machine" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Purchase Price ($) *</Label>
                <Input type="number" value={form.purchase_price} onChange={e => setForm(f => ({ ...f, purchase_price: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Purchase Date</Label>
                <Input type="date" value={form.purchase_date} onChange={e => setForm(f => ({ ...f, purchase_date: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Useful Life (years)</Label>
                <Input type="number" value={form.useful_life_years} onChange={e => setForm(f => ({ ...f, useful_life_years: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Salvage Value ($)</Label>
                <Input type="number" value={form.salvage_value} onChange={e => setForm(f => ({ ...f, salvage_value: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Method</Label>
                <Select value={form.depreciation_method} onValueChange={v => setForm(f => ({ ...f, depreciation_method: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.purchase_price && (
              <Card className="bg-muted/50">
                <CardContent className="p-3 text-xs text-muted-foreground">
                  <DollarSign className="w-3 h-3 inline" /> Monthly depreciation: <span className="font-mono font-bold text-foreground">
                    ${((parseFloat(form.purchase_price) - (parseFloat(form.salvage_value) || 0)) / (parseInt(form.useful_life_years) * 12 || 1)).toFixed(2)}
                  </span>/month
                </CardContent>
              </Card>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={() => saveMut.mutate(form)} disabled={!form.name || !form.purchase_price || saveMut.isPending}>
              {saveMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : editing ? "Update" : "Add Asset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OverheadAssets;
