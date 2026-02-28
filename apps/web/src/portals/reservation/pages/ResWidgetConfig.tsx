import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Globe, Palette, MessageCircle, Phone, Copy, ExternalLink,
  Loader2, Save, Eye, Code2,
} from "lucide-react";

const FAQ_KEYS = [
  { key: "parking", label: "Parking" },
  { key: "dress_code", label: "Dress Code" },
  { key: "dietary", label: "Dietary Options" },
  { key: "children", label: "Children" },
  { key: "groups", label: "Group Bookings" },
  { key: "cancellation", label: "Cancellation Policy" },
];

const ResWidgetConfig = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const qc = useQueryClient();

  const [config, setConfig] = useState<Record<string, any>>({
    org_slug: "",
    primary_color: "#0f766e",
    logo_url: "",
    venue_name: "",
    welcome_message: "",
    slot_interval_minutes: 30,
    max_online_party_size: 8,
    chat_agent_enabled: true,
    voice_agent_enabled: false,
    faq_answers: {},
    is_active: true,
  });

  const { data: existing, isLoading } = useQuery({
    queryKey: ["res_widget_config", orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from("res_widget_config")
        .select("*")
        .eq("org_id", orgId!)
        .maybeSingle();
      return data;
    },
    enabled: !!orgId,
  });

  useEffect(() => {
    if (existing) {
      setConfig(existing as any);
    } else if (currentOrg) {
      setConfig((prev) => ({
        ...prev,
        org_slug: currentOrg.slug || currentOrg.id?.replace(/-/g, "").substring(0, 12) || "",
        venue_name: currentOrg.name || "",
      }));
    }
  }, [existing, currentOrg]);

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!orgId) return;
      const { id, created_at, updated_at, ...rest } = config;
      const payload = { ...rest, org_id: orgId };

      if (existing) {
        await supabase.from("res_widget_config").update(payload as any).eq("org_id", orgId);
      } else {
        await supabase.from("res_widget_config").insert(payload as any);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["res_widget_config"] });
      toast.success("Widget config saved!");
    },
    onError: () => toast.error("Failed to save config"),
  });

  const widgetUrl = `${window.location.origin}/book/${config.org_slug}`;
  const embedCode = `<iframe src="${widgetUrl}" width="100%" height="700" frameborder="0" style="border:none;border-radius:12px;"></iframe>`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const updateFaq = (key: string, value: string) => {
    setConfig((prev) => ({
      ...prev,
      faq_answers: { ...(prev.faq_answers || {}), [key]: value },
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Globe className="w-6 h-6 text-primary" /> Booking Widget
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open(widgetUrl, "_blank")}>
            <Eye className="w-4 h-4 mr-2" /> Preview
          </Button>
          <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
            {saveMut.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save
          </Button>
        </div>
      </div>

      {/* Active Toggle */}
      <Card>
        <CardContent className="pt-4 flex items-center justify-between">
          <div>
            <p className="font-medium">Widget Active</p>
            <p className="text-xs text-muted-foreground">Toggle the public booking widget on or off</p>
          </div>
          <Switch checked={config.is_active} onCheckedChange={(v) => setConfig({ ...config, is_active: v })} />
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Palette className="w-4 h-4" /> Branding</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">URL Slug</Label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">/book/</span>
              <Input value={config.org_slug} onChange={(e) => setConfig({ ...config, org_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} className="max-w-[200px]" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Venue Name</Label>
            <Input value={config.venue_name} onChange={(e) => setConfig({ ...config, venue_name: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Welcome Message</Label>
            <Input value={config.welcome_message} onChange={(e) => setConfig({ ...config, welcome_message: e.target.value })} placeholder="Welcome! Book your table below." />
          </div>
          <div>
            <Label className="text-xs">Logo URL</Label>
            <Input value={config.logo_url} onChange={(e) => setConfig({ ...config, logo_url: e.target.value })} placeholder="https://..." />
          </div>
          <div>
            <Label className="text-xs">Primary Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.primary_color}
                onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                className="w-10 h-10 rounded-lg cursor-pointer border"
              />
              <Input value={config.primary_color} onChange={(e) => setConfig({ ...config, primary_color: e.target.value })} className="max-w-[120px]" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking Settings */}
      <Card>
        <CardHeader><CardTitle className="text-base">Booking Settings</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Slot Interval</Label>
              <Select value={String(config.slot_interval_minutes)} onValueChange={(v) => setConfig({ ...config, slot_interval_minutes: +v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Max Online Party Size</Label>
              <Input type="number" min={1} max={50} value={config.max_online_party_size}
                onChange={(e) => setConfig({ ...config, max_online_party_size: +e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Agents */}
      <Card>
        <CardHeader><CardTitle className="text-base">AI Agents</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Chat Agent</p>
                <p className="text-[10px] text-muted-foreground">AI concierge to help guests book</p>
              </div>
            </div>
            <Switch checked={config.chat_agent_enabled} onCheckedChange={(v) => setConfig({ ...config, chat_agent_enabled: v })} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Voice Agent (Vapi)</p>
                <p className="text-[10px] text-muted-foreground">Allow guests to book by voice call</p>
              </div>
            </div>
            <Switch checked={config.voice_agent_enabled} onCheckedChange={(v) => setConfig({ ...config, voice_agent_enabled: v })} />
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader><CardTitle className="text-base">FAQ Answers</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">The chat agent will use these answers when guests ask about these topics.</p>
          {FAQ_KEYS.map(({ key, label }) => (
            <div key={key}>
              <Label className="text-xs">{label}</Label>
              <Textarea
                className="min-h-[50px]"
                placeholder={`Describe your ${label.toLowerCase()} policy...`}
                value={config.faq_answers?.[key] || ""}
                onChange={(e) => updateFaq(key, e.target.value)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Embed */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Code2 className="w-4 h-4" /> Booking Widget Embed</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">Direct Link</Label>
            <div className="flex gap-2">
              <Input readOnly value={widgetUrl} className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={() => copyToClipboard(widgetUrl, "Link")}>
                <Copy className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => window.open(widgetUrl, "_blank")}>
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div>
            <Label className="text-xs">Embed Code</Label>
            <div className="flex gap-2">
              <Input readOnly value={embedCode} className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={() => copyToClipboard(embedCode, "Embed code")}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResWidgetConfig;
