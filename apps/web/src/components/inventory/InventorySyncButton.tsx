import { useState } from "react";
import { RefreshCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InventorySyncButtonProps {
  onSync?: () => void;
}

const InventorySyncButton = ({ onSync }: InventorySyncButtonProps) => {
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    
    try {
      const { data, error } = await supabase.rpc("sync_inventory_from_ingredients");
      
      if (error) throw error;
      
      const count = data as number;
      
      if (count > 0) {
        toast.success(`Synced ${count} new ingredients to inventory`);
      } else {
        toast.info("Inventory is already up to date");
      }
      
      setSynced(true);
      setTimeout(() => setSynced(false), 2000);
      onSync?.();
    } catch (error) {
      console.error("Sync error:", error);
      toast.error("Failed to sync inventory");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleSync}
      disabled={syncing}
    >
      {synced ? (
        <Check className="w-4 h-4 mr-2 text-success" />
      ) : (
        <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
      )}
      {syncing ? "Syncing..." : synced ? "Synced!" : "Sync from Ingredients"}
    </Button>
  );
};

export default InventorySyncButton;
