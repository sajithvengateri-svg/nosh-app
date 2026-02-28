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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  Loader2, Plus, UtensilsCrossed, Pencil, Trash2, Copy, GripVertical,
  ChevronDown, ChevronUp, Leaf, Wheat, Milk, Fish,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { VFMenuTier, VFMenuSection, VFMenuItem } from "@/lib/shared/types/venueflow.types";

const TIER_LABELS: Record<VFMenuTier, { label: string; color: string }> = {
  STANDARD: { label: "Standard", color: "bg-slate-500/10 text-slate-600" },
  PREMIUM: { label: "Premium", color: "bg-purple-500/10 text-purple-600" },
  DEGUSTATION: { label: "Degustation", color: "bg-vf-gold/20 text-vf-gold" },
  COCKTAIL: { label: "Cocktail", color: "bg-pink-500/10 text-pink-600" },
};

const DIETARY_FLAGS = [
  { flag: "V", label: "Vegetarian", icon: Leaf },
  { flag: "VG", label: "Vegan", icon: Leaf },
  { flag: "GF", label: "Gluten Free", icon: Wheat },
  { flag: "DF", label: "Dairy Free", icon: Milk },
];

const DEFAULT_SECTIONS: VFMenuSection[] = [
  { title: "Canapes", items: [{ name: "", description: "", dietary_flags: [] }] },
  { title: "Entree", items: [{ name: "", description: "", dietary_flags: [] }] },
  { title: "Main", items: [{ name: "", description: "", dietary_flags: [] }] },
  { title: "Dessert", items: [{ name: "", description: "", dietary_flags: [] }] },
];

const VFMenuTemplates = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const qc = useQueryClient();
  const [editSheet, setEditSheet] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    tier: "STANDARD" as VFMenuTier,
    price_per_head: 0,
    is_active: true,
  });
  const [sections, setSections] = useState<VFMenuSection[]>(DEFAULT_SECTIONS);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["vf_menu_templates", orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from("vf_menu_templates")
        .select("*")
        .eq("org_id", orgId!)
        .order("sort_order");
      return data ?? [];
    },
    enabled: !!orgId,
  });

  const resetForm = () => {
    setForm({ name: "", description: "", tier: "STANDARD", price_per_head: 0, is_active: true });
    setSections(DEFAULT_SECTIONS);
    setEditId(null);
  };

  const openNew = () => {
    resetForm();
    setEditSheet(true);
  };

  const openEdit = (t: any) => {
    setForm({
      name: t.name,
      description: t.description || "",
      tier: t.tier,
      price_per_head: Number(t.price_per_head),
      is_active: t.is_active,
    });
    setSections(t.sections || DEFAULT_SECTIONS);
    setEditId(t.id);
    setEditSheet(true);
  };

  const duplicateTemplate = async (t: any) => {
    if (!orgId) return;
    const { error } = await supabase.from("vf_menu_templates").insert({
      org_id: orgId,
      name: `${t.name} (Copy)`,
      description: t.description,
      tier: t.tier,
      price_per_head: t.price_per_head,
      sections: t.sections,
      is_active: false,
      sort_order: templates.length,
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Template duplicated");
    qc.invalidateQueries({ queryKey: ["vf_menu_templates"] });
  };

  const handleSave = async () => {
    if (!orgId || !form.name) { toast.error("Name required"); return; }
    setSaving(true);
    const payload = {
      ...form,
      sections: sections.filter(s => s.title.trim()),
      org_id: orgId,
    };
    if (editId) {
      const { error } = await supabase.from("vf_menu_templates").update(payload as any).eq("id", editId);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Template updated");
    } else {
      const { error } = await supabase.from("vf_menu_templates").insert({ ...payload, sort_order: templates.length } as any);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Template created");
    }
    setSaving(false);
    setEditSheet(false);
    resetForm();
    qc.invalidateQueries({ queryKey: ["vf_menu_templates"] });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("vf_menu_templates").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Template deleted");
    qc.invalidateQueries({ queryKey: ["vf_menu_templates"] });
  };

  const addSection = () => {
    setSections([...sections, { title: "", items: [{ name: "", description: "", dietary_flags: [] }] }]);
  };

  const removeSection = (idx: number) => {
    setSections(sections.filter((_, i) => i !== idx));
  };

  const updateSection = (idx: number, field: string, value: string) => {
    const updated = [...sections];
    (updated[idx] as any)[field] = value;
    setSections(updated);
  };

  const addItem = (sIdx: number) => {
    const updated = [...sections];
    updated[sIdx].items.push({ name: "", description: "", dietary_flags: [] });
    setSections(updated);
  };

  const removeItem = (sIdx: number, iIdx: number) => {
    const updated = [...sections];
    updated[sIdx].items = updated[sIdx].items.filter((_, i) => i !== iIdx);
    setSections(updated);
  };

  const updateItem = (sIdx: number, iIdx: number, field: string, value: any) => {
    const updated = [...sections];
    (updated[sIdx].items[iIdx] as any)[field] = value;
    setSections(updated);
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= sections.length) return;
    const updated = [...sections];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    setSections(updated);
  };

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold flex items-center gap-2 text-vf-charcoal">
          <UtensilsCrossed className="w-6 h-6 text-vf-gold" /> Menu Templates
        </h1>
        <Button onClick={openNew} className="bg-vf-gold hover:bg-vf-gold-light text-vf-navy font-medium">
          <Plus className="w-4 h-4 mr-2" /> New Menu
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-vf-gold" /></div>
      ) : templates.length === 0 ? (
        <Card className="border-vf-gold/10">
          <CardContent className="py-12 text-center text-muted-foreground">
            <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 text-vf-gold/30" />
            <p className="font-medium">No menu templates yet</p>
            <p className="text-sm mt-1">Create your first menu template for proposals</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((t: any) => {
            const tier = TIER_LABELS[t.tier as VFMenuTier] || TIER_LABELS.STANDARD;
            const sectionCount = (t.sections || []).length;
            const itemCount = (t.sections || []).reduce((sum: number, s: any) => sum + (s.items?.length || 0), 0);
            return (
              <Card key={t.id} className="border-vf-gold/10 hover:border-vf-gold/30 transition-colors group">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base font-medium text-vf-charcoal">{t.name}</CardTitle>
                      {t.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>}
                    </div>
                    <Badge className={tier.color} variant="secondary">{tier.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-bold text-vf-navy">${Number(t.price_per_head).toFixed(0)}<span className="text-sm font-normal text-muted-foreground">/pp</span></span>
                    {!t.is_active && <Badge variant="secondary" className="text-[10px]">Inactive</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{sectionCount} courses · {itemCount} items</p>
                  <Separator className="my-3" />
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(t)}><Pencil className="w-3.5 h-3.5 mr-1" /> Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => duplicateTemplate(t)}><Copy className="w-3.5 h-3.5 mr-1" /> Copy</Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(t.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Sheet */}
      <Sheet open={editSheet} onOpenChange={(v) => { setEditSheet(v); if (!v) resetForm(); }}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-display">{editId ? "Edit" : "New"} Menu Template</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Classic 3-Course" /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Short description of this menu" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tier</Label>
                <Select value={form.tier} onValueChange={(v: VFMenuTier) => setForm(p => ({ ...p, tier: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIER_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Price per head ($)</Label>
                <Input type="number" min={0} step={5} value={form.price_per_head} onChange={e => setForm(p => ({ ...p, price_per_head: +e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={v => setForm(p => ({ ...p, is_active: v }))} />
              <Label>Active</Label>
            </div>

            <Separator />
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">Courses / Sections</h3>
              <Button variant="outline" size="sm" onClick={addSection}><Plus className="w-3.5 h-3.5 mr-1" /> Section</Button>
            </div>

            {sections.map((section, sIdx) => (
              <Card key={sIdx} className="border-vf-gold/10">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => moveSection(sIdx, -1)} className="text-muted-foreground hover:text-foreground" disabled={sIdx === 0}><ChevronUp className="w-3.5 h-3.5" /></button>
                      <button onClick={() => moveSection(sIdx, 1)} className="text-muted-foreground hover:text-foreground" disabled={sIdx === sections.length - 1}><ChevronDown className="w-3.5 h-3.5" /></button>
                    </div>
                    <Input value={section.title} onChange={e => updateSection(sIdx, "title", e.target.value)} placeholder="Section title (e.g. Entree)" className="font-medium" />
                    <Button variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => removeSection(sIdx)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                  {section.items.map((item, iIdx) => (
                    <div key={iIdx} className="pl-6 flex items-start gap-2">
                      <div className="flex-1 space-y-1">
                        <Input value={item.name} onChange={e => updateItem(sIdx, iIdx, "name", e.target.value)} placeholder="Dish name" className="text-sm h-8" />
                        <Input value={item.description} onChange={e => updateItem(sIdx, iIdx, "description", e.target.value)} placeholder="Description (optional)" className="text-xs h-7" />
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive shrink-0 h-8 w-8" onClick={() => removeItem(sIdx, iIdx)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" className="ml-6 text-xs" onClick={() => addItem(sIdx)}><Plus className="w-3 h-3 mr-1" /> Add item</Button>
                </CardContent>
              </Card>
            ))}

            <Button className="w-full bg-vf-gold hover:bg-vf-gold-light text-vf-navy font-medium" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editId ? "Update Template" : "Create Template"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default VFMenuTemplates;
