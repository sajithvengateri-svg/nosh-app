import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Plus, Trash2, ExternalLink, Copy, Check, Mail } from "lucide-react";
import { toast } from "sonner";

export interface LandingSectionRow {
  id: string;
  section_key: string;
  title: string;
  subtitle: string;
  is_visible: boolean;
  content: any;
  sort_order: number;
  updated_at: string;
}

interface LandingPageEditorProps {
  pageTitle: string;
  pageSubtitle: string;
  previewUrl: string;
  tableName: string;
  useSectionsHook: () => {
    sections: LandingSectionRow[];
    isLoading: boolean;
    refetch: () => void;
  };
}

const ICON_OPTIONS = [
  "DollarSign", "ClipboardList", "Package", "Shield", "Menu", "Users",
  "ChefHat", "TrendingDown", "AlertTriangle", "Clock", "BarChart3", "Target",
  "Heart", "Home", "Utensils", "Leaf", "Star", "Sparkles",
  "Truck", "Tag", "MessageSquare", "TrendingUp", "ShoppingCart",
  "Thermometer", "FileCheck", "Scale", "Building2",
];

const LandingPageEditor = ({ pageTitle, pageSubtitle, previewUrl, tableName, useSectionsHook }: LandingPageEditorProps) => {
  const { sections, isLoading, refetch } = useSectionsHook();
  const [saving, setSaving] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const updateSection = async (id: string, updates: Partial<LandingSectionRow>) => {
    setSaving(id);
    const { error } = await (supabase as any)
      .from(tableName)
      .update(updates)
      .eq("id", id);
    if (error) {
      toast.error("Failed to update: " + error.message);
    } else {
      toast.success("Section updated");
      refetch();
    }
    setSaving(null);
  };

  const getFullUrl = () => `${window.location.origin}${previewUrl}`;

  const copyLink = () => {
    navigator.clipboard.writeText(getFullUrl());
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const sendEmail = () => {
    const url = getFullUrl();
    const subject = encodeURIComponent(pageTitle.replace(" Page", ""));
    const body = encodeURIComponent(`Check out our page:\n\n${url}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_self");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{pageTitle}</h1>
          <p className="text-sm text-muted-foreground">{pageSubtitle}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyLink} className="gap-2">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            Copy URL
          </Button>
          <Button variant="outline" size="sm" onClick={sendEmail} className="gap-2">
            <Mail className="w-4 h-4" /> Send
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.open(previewUrl, "_blank")} className="gap-2">
            <ExternalLink className="w-4 h-4" /> Preview
          </Button>
        </div>
      </div>

      {sections.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No sections found. Seed the <code className="text-xs bg-muted px-1 rounded">{tableName}</code> table to get started.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {sections.map((section) => (
          <SectionCard
            key={section.id}
            section={section}
            saving={saving === section.id}
            onToggle={() => updateSection(section.id, { is_visible: !section.is_visible })}
            onSave={(updates) => updateSection(section.id, updates)}
          />
        ))}
      </div>
    </div>
  );
};

/* ─── Section Card ─── */
interface SectionCardProps {
  section: LandingSectionRow;
  saving: boolean;
  onToggle: () => void;
  onSave: (updates: Partial<LandingSectionRow>) => void;
}

const SectionCard = ({ section, saving, onToggle, onSave }: SectionCardProps) => {
  const parseContent = (c: any) => (typeof c === "string" ? JSON.parse(c) : c);
  const [title, setTitle] = useState(section.title);
  const [subtitle, setSubtitle] = useState(section.subtitle);
  const [content, setContent] = useState<any>(parseContent(section.content));

  const contentKey = JSON.stringify(section.content);
  useEffect(() => {
    setTitle(section.title);
    setSubtitle(section.subtitle);
    setContent(parseContent(section.content));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section.id, section.title, section.subtitle, contentKey]);

  const handleSave = () => onSave({ title, subtitle, content });

  const isDirty =
    title !== section.title ||
    subtitle !== section.subtitle ||
    JSON.stringify(content) !== JSON.stringify(parseContent(section.content));

  return (
    <Card className={!section.is_visible ? "opacity-60" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">{section.section_key}</CardTitle>
            <Badge variant={section.is_visible ? "default" : "secondary"}>
              {section.is_visible ? "Visible" : "Hidden"}
            </Badge>
          </div>
          <Switch checked={section.is_visible} onCheckedChange={onToggle} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Subtitle</label>
            <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
          </div>
        </div>

        <ContentEditor sectionKey={section.section_key} content={content} onChange={setContent} />

        {isDirty && (
          <Button onClick={handleSave} disabled={saving} size="sm" className="gap-2">
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Save Changes
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

/* ─── Content Editor Router ─── */
const ContentEditor = ({ sectionKey, content, onChange }: { sectionKey: string; content: any; onChange: (v: any) => void }) => {
  if (!content || typeof content !== "object") {
    return <p className="text-xs text-muted-foreground">No editable content for this section.</p>;
  }

  if (sectionKey === "hero") return <HeroEditor content={content} onChange={onChange} />;
  if (sectionKey === "final_cta" || sectionKey.endsWith("_cta")) return <CtaEditor content={content} onChange={onChange} />;
  if (sectionKey === "pricing") return <PricingTierEditor items={Array.isArray(content) ? content : []} onChange={onChange} />;

  if (Array.isArray(content)) {
    return <ArrayCardEditor items={content} onChange={onChange} />;
  }

  // Object with known keys
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {Object.entries(content).map(([key, val]) => (
        <div key={key}>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">{key.replace(/_/g, " ")}</label>
          {typeof val === "string" ? (
            <Input
              value={val}
              onChange={(e) => onChange({ ...content, [key]: e.target.value })}
              className="h-8 text-sm"
            />
          ) : (
            <Input
              value={JSON.stringify(val)}
              onChange={(e) => {
                try { onChange({ ...content, [key]: JSON.parse(e.target.value) }); } catch { /* ignore */ }
              }}
              className="h-8 text-sm font-mono"
            />
          )}
        </div>
      ))}
    </div>
  );
};

/* ─── Hero Carousel Editor ─── */
const HeroEditor = ({ content, onChange }: { content: any; onChange: (v: any) => void }) => {
  const data = content && typeof content === "object" && !Array.isArray(content)
    ? content
    : { carousel_enabled: false, images: [] };
  const images: { url: string; alt: string; caption: string }[] = Array.isArray(data.images) ? data.images : [];

  const toggleCarousel = () => onChange({ ...data, carousel_enabled: !data.carousel_enabled });

  const updateImage = (idx: number, field: string, value: string) => {
    const next = [...images];
    next[idx] = { ...next[idx], [field]: value };
    onChange({ ...data, images: next });
  };

  const addImage = () => onChange({ ...data, images: [...images, { url: "", alt: "", caption: "" }] });
  const removeImage = (idx: number) => onChange({ ...data, images: images.filter((_, i) => i !== idx) });

  // Editable text fields (badge, cta_text, cta_subtext)
  const textFields = Object.entries(data).filter(
    ([k, v]) => typeof v === "string" && k !== "carousel_enabled" && !["images"].includes(k)
  );

  return (
    <div className="space-y-4">
      {textFields.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {textFields.map(([key, val]) => (
            <div key={key}>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">{key.replace(/_/g, " ")}</label>
              <Input
                value={val as string}
                onChange={(e) => onChange({ ...data, [key]: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
        <div>
          <p className="font-medium text-sm">Background Image Carousel</p>
          <p className="text-xs text-muted-foreground">
            {data.carousel_enabled ? "Carousel active — full-screen hero with image slideshow" : "Default gradient hero (no images)"}
          </p>
        </div>
        <Switch checked={!!data.carousel_enabled} onCheckedChange={toggleCarousel} />
      </div>

      {data.carousel_enabled && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Carousel Images</h4>
          {images.map((img, idx) => (
            <div key={idx} className="flex gap-2 items-start border rounded-md p-3 bg-muted/30">
              <div className="flex-1 grid gap-2 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Image URL</label>
                  <Input value={img.url} onChange={(e) => updateImage(idx, "url", e.target.value)} className="h-8 text-sm" placeholder="https://images.unsplash.com/..." />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Caption</label>
                  <Input value={img.caption || ""} onChange={(e) => updateImage(idx, "caption", e.target.value)} className="h-8 text-sm" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Alt Text</label>
                  <Input value={img.alt} onChange={(e) => updateImage(idx, "alt", e.target.value)} className="h-8 text-sm" />
                </div>
                {img.url && (
                  <div className="flex items-end">
                    <img src={img.url} alt={img.alt} className="h-8 w-14 object-cover rounded" />
                  </div>
                )}
              </div>
              <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 text-destructive" onClick={() => removeImage(idx)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addImage} className="gap-1">
            <Plus className="w-3 h-3" /> Add Image
          </Button>
        </div>
      )}
    </div>
  );
};

/* ─── Array Card Editor ─── */
const ArrayCardEditor = ({ items, onChange }: { items: any[]; onChange: (v: any[]) => void }) => {
  const fields = items.length > 0 ? Object.keys(items[0]).filter((k) => k !== "icon" && k !== "features" && k !== "popular") : [];
  const hasIcon = items.length > 0 && "icon" in items[0];

  const update = (idx: number, field: string, value: string) => {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: value };
    onChange(next);
  };

  const add = () => {
    const empty: any = {};
    fields.forEach((f) => (empty[f] = ""));
    if (hasIcon) empty.icon = "ChefHat";
    onChange([...items, empty]);
  };

  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));

  return (
    <div className="space-y-3">
      {items.map((item: any, idx: number) => (
        <div key={idx} className="flex gap-2 items-start border rounded-md p-3 bg-muted/30">
          <div className="flex-1 grid gap-2 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f}>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground">{f}</label>
                <Input
                  value={typeof item[f] === "object" ? JSON.stringify(item[f]) : (item[f] ?? "")}
                  onChange={(e) => update(idx, f, e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            ))}
            {hasIcon && (
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Icon</label>
                <Select value={item.icon || "ChefHat"} onValueChange={(v) => update(idx, "icon", v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((ic) => (
                      <SelectItem key={ic} value={ic}>{ic}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 text-destructive" onClick={() => remove(idx)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add} className="gap-1">
        <Plus className="w-3 h-3" /> Add Item
      </Button>
    </div>
  );
};

/* ─── Pricing Tier Editor ─── */
const PricingTierEditor = ({ items, onChange }: { items: any[]; onChange: (v: any[]) => void }) => {
  const updateTier = (idx: number, field: string, value: any) => {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: value };
    onChange(next);
  };

  const addFeature = (tierIdx: number) => {
    const next = [...items];
    const features = [...(next[tierIdx].features || []), ""];
    next[tierIdx] = { ...next[tierIdx], features };
    onChange(next);
  };

  const updateFeature = (tierIdx: number, featIdx: number, value: string) => {
    const next = [...items];
    const features = [...(next[tierIdx].features || [])];
    features[featIdx] = value;
    next[tierIdx] = { ...next[tierIdx], features };
    onChange(next);
  };

  const removeFeature = (tierIdx: number, featIdx: number) => {
    const next = [...items];
    const features = (next[tierIdx].features || []).filter((_: any, i: number) => i !== featIdx);
    next[tierIdx] = { ...next[tierIdx], features };
    onChange(next);
  };

  const addTier = () => {
    onChange([...items, { name: "", price: "", period: "", features: [], popular: false, cta: "Get Started" }]);
  };

  const removeTier = (idx: number) => onChange(items.filter((_, i) => i !== idx));

  return (
    <div className="space-y-4">
      {items.map((tier: any, idx: number) => (
        <div key={idx} className="border rounded-lg p-4 bg-muted/20 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">{tier.name || `Tier ${idx + 1}`}</h4>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                Popular
                <Switch
                  checked={!!tier.popular}
                  onCheckedChange={(v) => updateTier(idx, "popular", v)}
                />
              </label>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeTier(idx)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Name</label>
              <Input value={tier.name ?? ""} onChange={(e) => updateTier(idx, "name", e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Price</label>
              <Input value={tier.price ?? ""} onChange={(e) => updateTier(idx, "price", e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Period</label>
              <Input value={tier.period ?? ""} onChange={(e) => updateTier(idx, "period", e.target.value)} className="h-8 text-sm" placeholder="/mo" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">CTA Text</label>
              <Input value={tier.cta ?? ""} onChange={(e) => updateTier(idx, "cta", e.target.value)} className="h-8 text-sm" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Features</label>
            {(tier.features || []).map((feat: string, fi: number) => (
              <div key={fi} className="flex gap-2">
                <Input value={feat} onChange={(e) => updateFeature(idx, fi, e.target.value)} className="h-8 text-sm" />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => removeFeature(idx, fi)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addFeature(idx)} className="gap-1">
              <Plus className="w-3 h-3" /> Add Feature
            </Button>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addTier} className="gap-1">
        <Plus className="w-3 h-3" /> Add Tier
      </Button>
    </div>
  );
};

/* ─── CTA Editor ─── */
const CtaEditor = ({ content, onChange }: { content: any; onChange: (v: any) => void }) => {
  const data = content && typeof content === "object" ? content : { button_text: "", button_link: "" };
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <label className="text-xs font-medium text-muted-foreground">Button Text</label>
        <Input value={data.button_text ?? ""} onChange={(e) => onChange({ ...data, button_text: e.target.value })} />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Button Link</label>
        <Input value={data.button_link ?? ""} onChange={(e) => onChange({ ...data, button_link: e.target.value })} />
      </div>
    </div>
  );
};

export default LandingPageEditor;
