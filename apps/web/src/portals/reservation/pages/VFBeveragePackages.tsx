import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Loader2, Plus, Wine, Pencil, Trash2, Copy, Clock, GlassWater } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { VFBeverageTier, VFBeverageCategory } from "@/lib/shared/types/venueflow.types";

const TIER_LABELS: Record<VFBeverageTier, { label: string; color: string; icon: string }> = {
  HOUSE: { label: "House", color: "bg-slate-500/10 text-slate-600", icon: "🍷" },
  PREMIUM: { label: "Premium", color: "bg-purple-500/10 text-purple-600", icon: "🥂" },
  PRESTIGE: { label: "Prestige", color: "bg-vf-gold/20 text-vf-gold", icon: "🍾" },
  NON_ALCOHOLIC: { label: "Non-Alcoholic", color: "bg-emerald-500/10 text-emerald-600", icon: "🧃" },
};

const DEFAULT_CATEGORIES: VFBeverageCategory[] = [
  { category: "Wine", items: [] },
  { category: "Beer", items: [] },
  { category: "Spirits", items: [] },
  { category: "Cocktails", items: [] },
  { category: "Soft Drinks", items: [] },
];

const VFBeveragePackages = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const qc = useQueryClient();
  const [editSheet, setEditSheet] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    tier: "HOUSE" as VFBeverageTier,
    price_per_head: 55,
    duration_hours: 3,
    is_active: true,
  });
  const [categories, setCategories] = useState<VFBeverageCategory[]>(DEFAULT_CATEGORIES);

  const { data: packages = [], isLoading } = useQuery({
    queryKey: ["vf_beverage_packages", orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from("vf_beverage_packages")
        .select("*")
        .eq("org_id", orgId!)
        .order("sort_order");
      return data ?? [];
    },
    enabled: !!orgId,
  });

  const resetForm = () => {
    setForm({ name: "", tier: "HOUSE", price_per_head: 55, duration_hours: 3, is_active: true });
    setCategories(DEFAULT_CATEGORIES);
    setEditId(null);
  };

  const openNew = () => { resetForm(); setEditSheet(true); };

  const openEdit = (pkg: any) => {
    setForm({
      name: pkg.name,
      tier: pkg.tier,
      price_per_head: Number(pkg.price_per_head),
      duration_hours: Number(pkg.duration_hours),
      is_active: pkg.is_active,
    });
    setCategories(pkg.includes?.length ? pkg.includes : DEFAULT_CATEGORIES);
    setEditId(pkg.id);
    setEditSheet(true);
  };

  const handleSave = async () => {
    if (!orgId || !form.name) { toast.error("Name required"); return; }
    setSaving(true);
    const payload = {
      ...form,
      includes: categories.filter(c => c.category.trim()),
      org_id: orgId,
    };
    if (editId) {
      const { error } = await supabase.from("vf_beverage_packages").update(payload as any).eq("id", editId);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Package updated");
    } else {
      const { error } = await supabase.from("vf_beverage_packages").insert({ ...payload, sort_order: packages.length } as any);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Package created");
    }
    setSaving(false);
    setEditSheet(false);
    resetForm();
    qc.invalidateQueries({ queryKey: ["vf_beverage_packages"] });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("vf_beverage_packages").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Package deleted");
    qc.invalidateQueries({ queryKey: ["vf_beverage_packages"] });
  };

  const duplicatePackage = async (pkg: any) => {
    if (!orgId) return;
    const { error } = await supabase.from("vf_beverage_packages").insert({
      org_id: orgId,
      name: `${pkg.name} (Copy)`,
      tier: pkg.tier,
      price_per_head: pkg.price_per_head,
      duration_hours: pkg.duration_hours,
      includes: pkg.includes,
      is_active: false,
      sort_order: packages.length,
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Package duplicated");
    qc.invalidateQueries({ queryKey: ["vf_beverage_packages"] });
  };

  const updateCategory = (idx: number, field: keyof VFBeverageCategory, value: any) => {
    const updated = [...categories];
    if (field === "items" && typeof value === "string") {
      updated[idx].items = value.split(",").map((s: string) => s.trim()).filter(Boolean);
    } else {
      (updated[idx] as any)[field] = value;
    }
    setCategories(updated);
  };

  const addCategory = () => {
    setCategories([...categories, { category: "", items: [] }]);
  };

  const removeCategory = (idx: number) => {
    setCategories(categories.filter((_, i) => i !== idx));
  };

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold flex items-center gap-2 text-vf-charcoal">
          <Wine className="w-6 h-6 text-vf-gold" /> Beverage Packages
        </h1>
        <Button onClick={openNew} className="bg-vf-gold hover:bg-vf-gold-light text-vf-navy font-medium">
          <Plus className="w-4 h-4 mr-2" /> New Package
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-vf-gold" /></div>
      ) : packages.length === 0 ? (
        <Card className="border-vf-gold/10">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Wine className="w-12 h-12 mx-auto mb-3 text-vf-gold/30" />
            <p className="font-medium">No beverage packages yet</p>
            <p className="text-sm mt-1">Create packages for your proposals ($55-$120pp)</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {packages.map((pkg: any) => {
            const tier = TIER_LABELS[pkg.tier as VFBeverageTier] || TIER_LABELS.HOUSE;
            const catCount = (pkg.includes || []).length;
            const itemCount = (pkg.includes || []).reduce((sum: number, c: any) => sum + (c.items?.length || 0), 0);
            return (
              <Card key={pkg.id} className="border-vf-gold/10 hover:border-vf-gold/30 transition-colors group">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base font-medium text-vf-charcoal">{pkg.name}</CardTitle>
                    <Badge className={tier.color} variant="secondary">{tier.icon} {tier.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-vf-navy">${Number(pkg.price_per_head).toFixed(0)}</span>
                      <span className="text-sm text-muted-foreground">/pp</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {Number(pkg.duration_hours)}h</span>
                      <span>{catCount} categories</span>
                      <span>{itemCount} items</span>
                    </div>
                    {!pkg.is_active && <Badge variant="secondary" className="text-[10px]">Inactive</Badge>}
                  </div>
                  <Separator className="my-3" />
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(pkg)}><Pencil className="w-3.5 h-3.5 mr-1" /> Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => duplicatePackage(pkg)}><Copy className="w-3.5 h-3.5 mr-1" /> Copy</Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(pkg.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Sheet */}
      <Sheet open={editSheet} onOpenChange={(v) => { setEditSheet(v); if (!v) resetForm(); }}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-display">{editId ? "Edit" : "New"} Beverage Package</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Premium Selection" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tier</Label>
                <Select value={form.tier} onValueChange={(v: VFBeverageTier) => setForm(p => ({ ...p, tier: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIER_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.icon} {v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Price per head ($)</Label>
                <Input type="number" min={0} step={5} value={form.price_per_head} onChange={e => setForm(p => ({ ...p, price_per_head: +e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Duration (hours)</Label>
              <Input type="number" min={1} max={8} step={0.5} value={form.duration_hours} onChange={e => setForm(p => ({ ...p, duration_hours: +e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={v => setForm(p => ({ ...p, is_active: v }))} />
              <Label>Active</Label>
            </div>

            <Separator />
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">Included Items</h3>
              <Button variant="outline" size="sm" onClick={addCategory}><Plus className="w-3.5 h-3.5 mr-1" /> Category</Button>
            </div>

            {categories.map((cat, idx) => (
              <Card key={idx} className="border-vf-gold/10">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Input value={cat.category} onChange={e => updateCategory(idx, "category", e.target.value)} placeholder="Category (e.g. Wine)" className="font-medium" />
                    <Button variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => removeCategory(idx)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                  <Textarea
                    value={cat.items.join(", ")}
                    onChange={e => updateCategory(idx, "items", e.target.value)}
                    placeholder="Items separated by commas (e.g. Pinot Noir, Sauvignon Blanc, Chardonnay)"
                    className="text-sm min-h-[60px]"
                  />
                </CardContent>
              </Card>
            ))}

            <Button className="w-full bg-vf-gold hover:bg-vf-gold-light text-vf-navy font-medium" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editId ? "Update Package" : "Create Package"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default VFBeveragePackages;
