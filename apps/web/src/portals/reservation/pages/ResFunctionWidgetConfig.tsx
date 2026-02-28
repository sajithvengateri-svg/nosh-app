import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  PartyPopper, Copy, ExternalLink, Loader2, Save, Eye, Code2, Plus, X,
} from "lucide-react";

const ResFunctionWidgetConfig = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const qc = useQueryClient();

  const [config, setConfig] = useState<Record<string, any>>({
    org_slug: "",
    function_widget_enabled: false,
    max_function_party_size: 200,
    menu_sets: ["Set Menu 1", "Set Menu 2", "Shared Platters", "Cocktail Function", "Custom"],
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
      toast.success("Function widget config saved!");
    },
    onError: () => toast.error("Failed to save config"),
  });

  const functionWidgetUrl = `${window.location.origin}/functions/${config.org_slug}`;
  const functionEmbedCode = `<iframe src="${functionWidgetUrl}" width="100%" height="700" frameborder="0" style="border:none;border-radius:12px;"></iframe>`;

  const [newMenuSet, setNewMenuSet] = useState("");

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
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
          <PartyPopper className="w-6 h-6 text-primary" /> Function Widget
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open(functionWidgetUrl, "_blank")}>
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
            <p className="font-medium">Function Widget Active</p>
            <p className="text-xs text-muted-foreground">Public enquiry form for private events, weddings, corporate functions</p>
          </div>
          <Switch checked={config.function_widget_enabled} onCheckedChange={(v) => setConfig({ ...config, function_widget_enabled: v })} />
        </CardContent>
      </Card>

      {/* Party Size */}
      <Card>
        <CardHeader><CardTitle className="text-base">Party Size</CardTitle></CardHeader>
        <CardContent>
          <div>
            <Label className="text-xs">Max Function Party Size</Label>
            <Input type="number" min={10} max={500} className="w-32 mt-1" value={config.max_function_party_size}
              onChange={(e) => setConfig({ ...config, max_function_party_size: +e.target.value })} />
          </div>
        </CardContent>
      </Card>

      {/* Menu Sets */}
      <Card>
        <CardHeader><CardTitle className="text-base">Menu Sets</CardTitle></CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">Options shown in the function enquiry menu dropdown</p>
          <div className="space-y-1">
            {(Array.isArray(config.menu_sets) ? config.menu_sets : []).map((item: string, idx: number) => (
              <div key={idx} className="flex items-center gap-2">
                <Input value={item} readOnly className="text-sm h-8" />
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0"
                  onClick={() => setConfig({ ...config, menu_sets: (config.menu_sets as string[]).filter((_: string, i: number) => i !== idx) })}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <Input placeholder="Add menu option..." value={newMenuSet}
              onChange={(e) => setNewMenuSet(e.target.value)} className="text-sm h-8" />
            <Button variant="outline" size="sm" className="h-8"
              onClick={() => {
                if (newMenuSet.trim()) {
                  setConfig({ ...config, menu_sets: [...(Array.isArray(config.menu_sets) ? config.menu_sets : []), newMenuSet.trim()] });
                  setNewMenuSet("");
                }
              }}>
              <Plus className="w-3 h-3 mr-1" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Links & Embed */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Code2 className="w-4 h-4" /> Share & Embed</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">Direct Link</Label>
            <div className="flex gap-2">
              <Input readOnly value={functionWidgetUrl} className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={() => copyToClipboard(functionWidgetUrl, "Link")}>
                <Copy className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => window.open(functionWidgetUrl, "_blank")}>
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div>
            <Label className="text-xs">Embed Code</Label>
            <div className="flex gap-2">
              <Input readOnly value={functionEmbedCode} className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={() => copyToClipboard(functionEmbedCode, "Embed code")}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResFunctionWidgetConfig;
