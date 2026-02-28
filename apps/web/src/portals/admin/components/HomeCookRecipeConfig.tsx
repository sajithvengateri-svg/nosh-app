import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CookingPot } from "lucide-react";

interface FeatureRow {
  id: string;
  feature_key: string;
  enabled: boolean;
  label: string;
  description: string | null;
}

const HomeCookRecipeConfig = () => {
  const [features, setFeatures] = useState<FeatureRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("home_cook_feature_config")
        .select("*")
        .order("label");
      setFeatures(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const toggle = async (id: string, enabled: boolean) => {
    const { error } = await supabase
      .from("home_cook_feature_config")
      .update({ enabled, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update");
      return;
    }

    setFeatures(prev => prev.map(f => f.id === id ? { ...f, enabled } : f));
    toast.success("Feature updated");
  };

  if (loading) return <p className="text-sm text-muted-foreground p-4">Loading...</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CookingPot className="w-5 h-5" />
          Home Cook Recipe Features
        </CardTitle>
        <CardDescription>Toggle which recipe features are available to home cook users</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {features.map(f => (
          <div key={f.id} className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-foreground">{f.label}</p>
              {f.description && (
                <p className="text-xs text-muted-foreground">{f.description}</p>
              )}
            </div>
            <Switch checked={f.enabled} onCheckedChange={v => toggle(f.id, v)} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default HomeCookRecipeConfig;
