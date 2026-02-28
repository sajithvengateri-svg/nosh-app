import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, Heart, CookingPot, Layout, Plus, Trash2, ExternalLink } from "lucide-react";
import { useHomeCookLandingSections, HomeCookLandingSection } from "@/hooks/useHomeCookLandingSections";
import HomeCookRecipeConfig from "./HomeCookRecipeConfig";

const ICON_OPTIONS = [
  "ChefHat", "Utensils", "Package", "Trash2", "Shield", "BookOpen",
  "Store", "Share2", "Users2", "Heart", "Sparkles", "DollarSign",
  "Clock", "BarChart3", "Target", "AlertTriangle",
];

const HomeCookSettingsTab = () => {
  const { sections, isLoading, refetch } = useHomeCookLandingSections();
  const [saving, setSaving] = useState<string | null>(null);

  const updateSection = async (id: string, updates: Partial<HomeCookLandingSection>) => {
    setSaving(id);
    const { error } = await supabase
      .from("home_cook_landing_sections")
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

  return (
    <div className="space-y-8">
      {/* Landing Page CMS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layout className="w-5 h-5 text-orange-500" />
            <div>
              <h2 className="text-lg font-semibold">Home Cook Landing Page</h2>
              <p className="text-sm text-muted-foreground">Toggle and edit each section of the home cook landing page</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open("/home-cook", "_blank")}>
            <ExternalLink className="w-3.5 h-3.5" /> Preview
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
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
        )}
      </div>

      <Separator />

      {/* Recipe Feature Toggles */}
      <HomeCookRecipeConfig />
    </div>
  );
};

/* ─── Section Card ─── */
interface SectionCardProps {
  section: HomeCookLandingSection;
  saving: boolean;
  onToggle: () => void;
  onSave: (updates: Partial<HomeCookLandingSection>) => void;
}

const SectionCard = ({ section, saving, onToggle, onSave }: SectionCardProps) => {
  const parseContent = (c: any) => (typeof c === "string" ? JSON.parse(c) : c);
  const [title, setTitle] = useState(section.title);
  const [subtitle, setSubtitle] = useState(section.subtitle);
  const [content, setContent] = useState<any>(parseContent(section.content));

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
            <CardTitle className="text-base capitalize">{section.section_key.replace(/_/g, " ")}</CardTitle>
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
  switch (sectionKey) {
    case "hero":
      return <HeroEditor content={content} onChange={onChange} />;
    case "features":
    case "coming_soon":
      return <ArrayCardEditor items={content} onChange={onChange} fields={["title", "desc"]} iconField />;
    case "themes":
      return <ThemeEditor items={content} onChange={onChange} />;
    case "final_cta":
      return <CtaEditor content={content} onChange={onChange} />;
    case "money_tracker":
      return <MetricsEditor content={content} onChange={onChange} />;
    default:
      return <p className="text-xs text-muted-foreground italic">No additional content fields for this section.</p>;
  }
};

/* ─── Hero Editor ─── */
const HeroEditor = ({ content, onChange }: { content: any; onChange: (v: any) => void }) => {
  const data = content && typeof content === "object" ? content : {};
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <label className="text-xs font-medium text-muted-foreground">Badge Text</label>
        <Input value={data.badge ?? ""} onChange={(e) => onChange({ ...data, badge: e.target.value })} />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">CTA Button Text</label>
        <Input value={data.cta_text ?? ""} onChange={(e) => onChange({ ...data, cta_text: e.target.value })} />
      </div>
      <div className="sm:col-span-2">
        <label className="text-xs font-medium text-muted-foreground">CTA Subtext</label>
        <Input value={data.cta_subtext ?? ""} onChange={(e) => onChange({ ...data, cta_subtext: e.target.value })} />
      </div>
    </div>
  );
};

/* ─── Generic Array Card Editor ─── */
const ArrayCardEditor = ({
  items, onChange, fields, iconField,
}: {
  items: any; onChange: (v: any[]) => void; fields: string[]; iconField?: boolean;
}) => {
  const list = Array.isArray(items) ? items : [];

  const update = (idx: number, field: string, value: string) => {
    const next = [...list];
    next[idx] = { ...next[idx], [field]: value };
    onChange(next);
  };

  const add = () => {
    const empty: any = {};
    fields.forEach((f) => (empty[f] = ""));
    if (iconField) empty.icon = "ChefHat";
    onChange([...list, empty]);
  };

  const remove = (idx: number) => onChange(list.filter((_, i) => i !== idx));

  return (
    <div className="space-y-3">
      {list.map((item: any, idx: number) => (
        <div key={idx} className="flex gap-2 items-start border rounded-md p-3 bg-muted/30">
          <div className="flex-1 grid gap-2 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f}>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground">{f}</label>
                <Input value={item[f] ?? ""} onChange={(e) => update(idx, f, e.target.value)} className="h-8 text-sm" />
              </div>
            ))}
            {iconField && (
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

/* ─── Theme Editor ─── */
const ThemeEditor = ({ items, onChange }: { items: any; onChange: (v: any[]) => void }) => {
  const list = Array.isArray(items) ? items : [];

  const updateTheme = (idx: number, field: string, value: any) => {
    const next = [...list];
    next[idx] = { ...next[idx], [field]: value };
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {list.map((theme: any, idx: number) => (
        <div key={idx} className="flex gap-3 items-center border rounded-md p-3 bg-muted/30">
          <Input
            value={theme.name ?? ""}
            onChange={(e) => updateTheme(idx, "name", e.target.value)}
            className="h-8 text-sm w-32"
            placeholder="Theme name"
          />
          <div className="flex gap-1">
            {(theme.colors || []).map((c: string, ci: number) => (
              <input
                key={ci}
                type="color"
                value={c}
                onChange={(e) => {
                  const newColors = [...(theme.colors || [])];
                  newColors[ci] = e.target.value;
                  updateTheme(idx, "colors", newColors);
                }}
                className="w-8 h-8 rounded cursor-pointer border-0"
              />
            ))}
          </div>
          <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 text-destructive" onClick={() => onChange(list.filter((_, i) => i !== idx))}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange([...list, { name: "New Theme", colors: ["#000000", "#555555", "#ffffff"] }])} className="gap-1">
        <Plus className="w-3 h-3" /> Add Theme
      </Button>
    </div>
  );
};

/* ─── CTA Editor ─── */
const CtaEditor = ({ content, onChange }: { content: any; onChange: (v: any) => void }) => {
  const data = content && typeof content === "object" ? content : {};
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">Button Text</label>
      <Input value={data.button_text ?? ""} onChange={(e) => onChange({ ...data, button_text: e.target.value })} />
    </div>
  );
};

/* ─── Metrics Editor ─── */
const MetricsEditor = ({ content, onChange }: { content: any; onChange: (v: any) => void }) => {
  const data = content && typeof content === "object" ? content : { metrics: [] };
  const metrics: string[] = Array.isArray(data.metrics) ? data.metrics : [];

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground">Metric Labels</label>
      <div className="flex flex-wrap gap-2">
        {metrics.map((m, i) => (
          <div key={i} className="flex items-center gap-1">
            <Input
              value={m}
              onChange={(e) => {
                const next = [...metrics];
                next[i] = e.target.value;
                onChange({ ...data, metrics: next });
              }}
              className="h-8 text-sm w-28"
            />
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onChange({ ...data, metrics: metrics.filter((_, j) => j !== i) })}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={() => onChange({ ...data, metrics: [...metrics, ""] })} className="gap-1">
        <Plus className="w-3 h-3" /> Add Metric
      </Button>
    </div>
  );
};

export default HomeCookSettingsTab;
