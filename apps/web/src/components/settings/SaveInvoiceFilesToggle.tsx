import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const SaveInvoiceFilesToggle = () => {
  const { profile, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const saveFiles = (profile as any)?.save_invoice_files !== false;

  const handleToggle = async (value: boolean) => {
    if (!profile?.user_id) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ save_invoice_files: value } as any)
        .eq("user_id", profile.user_id);
      if (error) throw error;
      await refreshProfile();
      toast.success(value ? "Invoice files will be saved" : "Invoice files won't be saved");
    } catch {
      toast.error("Failed to update preference");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <Label>Save Invoice Dockets</Label>
        <p className="text-sm text-muted-foreground">
          Keep original invoice files in storage. When off, only extracted data is saved.
        </p>
      </div>
      <Switch
        checked={saveFiles}
        onCheckedChange={handleToggle}
        disabled={saving}
      />
    </div>
  );
};

export default SaveInvoiceFilesToggle;
