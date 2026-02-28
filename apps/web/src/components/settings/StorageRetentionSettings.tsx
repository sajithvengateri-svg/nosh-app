import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { HardDrive, Trash2, Clock, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/useOrgId";
import { toast } from "sonner";

interface StorageSetting {
  id: string;
  bucket_name: string;
  retention_days: number;
  auto_delete_after_parse: boolean;
  enabled: boolean;
}

const BUCKET_LABELS: Record<string, { label: string; description: string; icon: string }> = {
  "invoices": { label: "Invoices", description: "Scanned/uploaded invoices for AI extraction", icon: "📄" },
  "audit-documents": { label: "Audit Documents", description: "Uploaded documents for compliance audits", icon: "📋" },
  "clock-photos": { label: "Clock-In Photos", description: "Employee attendance verification photos", icon: "📸" },
  "cleaning-photos": { label: "Cleaning Photos", description: "Food safety cleaning evidence", icon: "🧹" },
  "recipe-images": { label: "Recipe Images", description: "Recipe and plating reference photos", icon: "🍽️" },
  "employee-documents": { label: "Employee Documents", description: "HR documents, contracts, certifications", icon: "👤" },
  "floor-layouts": { label: "Floor Layouts", description: "Restaurant floor plan images", icon: "🗺️" },
};

const RETENTION_OPTIONS = [
  { value: "0", label: "Delete after parsing" },
  { value: "7", label: "7 days" },
  { value: "14", label: "14 days" },
  { value: "30", label: "30 days" },
  { value: "60", label: "60 days" },
  { value: "90", label: "90 days" },
  { value: "180", label: "6 months" },
  { value: "365", label: "1 year" },
  { value: "-1", label: "Keep forever" },
];

const StorageRetentionSettings = () => {
  const orgId = useOrgId();
  const [settings, setSettings] = useState<StorageSetting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    const fetch = async () => {
      const { data, error } = await supabase
        .from("org_storage_settings")
        .select("*")
        .eq("org_id", orgId)
        .order("bucket_name");
      if (error) {
        toast.error("Failed to load storage settings");
        return;
      }
      setSettings(data || []);
      setLoading(false);
    };
    fetch();
  }, [orgId]);

  const updateSetting = async (id: string, updates: Partial<StorageSetting>) => {
    const { error } = await supabase
      .from("org_storage_settings")
      .update(updates)
      .eq("id", id);
    if (error) {
      toast.error("Failed to update setting");
      return;
    }
    setSettings(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    toast.success("Storage setting updated");
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading storage settings...
        </CardContent>
      </Card>
    );
  }

  const parsableBuckets = settings.filter(s => ["invoices", "audit-documents"].includes(s.bucket_name));
  const retentionBuckets = settings.filter(s => !["invoices", "audit-documents"].includes(s.bucket_name));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Parsed Documents — Auto-delete */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Parsed Document Cleanup
          </CardTitle>
          <CardDescription>
            Documents parsed by AI (invoices, audit docs) — data is extracted to the database, originals can be safely deleted
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {parsableBuckets.map(setting => {
            const info = BUCKET_LABELS[setting.bucket_name];
            return (
              <div key={setting.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{info?.icon}</span>
                    <div>
                      <Label>{info?.label || setting.bucket_name}</Label>
                      <p className="text-sm text-muted-foreground">{info?.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {setting.auto_delete_after_parse && (
                      <Badge variant="secondary" className="text-xs">Auto-delete</Badge>
                    )}
                    <Switch
                      checked={setting.auto_delete_after_parse}
                      onCheckedChange={(v) => updateSetting(setting.id, { 
                        auto_delete_after_parse: v,
                        retention_days: v ? 0 : 30 
                      })}
                    />
                  </div>
                </div>
                {!setting.auto_delete_after_parse && (
                  <div className="ml-10 mt-2 flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">Keep for:</Label>
                    <Select
                      value={String(setting.retention_days)}
                      onValueChange={(v) => updateSetting(setting.id, { retention_days: parseInt(v) })}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RETENTION_OPTIONS.filter(o => o.value !== "0").map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Separator className="mt-4" />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Media & Documents — Retention */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            File Retention Policies
          </CardTitle>
          <CardDescription>
            Set how long photos, documents and media are kept. Use -1 for permanent storage.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {retentionBuckets.map(setting => {
            const info = BUCKET_LABELS[setting.bucket_name];
            return (
              <div key={setting.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{info?.icon}</span>
                    <div>
                      <Label>{info?.label || setting.bucket_name}</Label>
                      <p className="text-sm text-muted-foreground">{info?.description}</p>
                    </div>
                  </div>
                  <Select
                    value={String(setting.retention_days)}
                    onValueChange={(v) => updateSetting(setting.id, { retention_days: parseInt(v) })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RETENTION_OPTIONS.filter(o => o.value !== "0").map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Separator className="mt-4" />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Info card */}
      <Card className="border-dashed">
        <CardContent className="py-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">How it works</p>
            <ul className="space-y-1 list-disc list-inside">
              <li><strong>Auto-delete after parsing:</strong> Files are removed immediately once data is extracted to the database</li>
              <li><strong>Retention period:</strong> Files older than the set period are automatically cleaned up daily</li>
              <li><strong>Keep forever:</strong> Files are never automatically deleted</li>
              <li>Extracted data (prices, readings, etc.) is always retained in the database regardless of file deletion</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StorageRetentionSettings;
