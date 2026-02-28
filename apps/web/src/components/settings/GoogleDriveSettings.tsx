import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { HardDrive, ExternalLink, Loader2, Check, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useOrgId } from "@/hooks/useOrgId";
import { useDataConnections } from "@/hooks/useDataConnections";

const GoogleDriveSettings = () => {
  const orgId = useOrgId();
  const { data: connections, addConnection, updateConnection, deleteConnection } = useDataConnections(orgId ?? undefined);
  const [apiKey, setApiKey] = useState("");
  const [clientId, setClientId] = useState("");
  const [saving, setSaving] = useState(false);

  const existingConnection = connections?.find((c) => c.provider === "google_drive");

  useEffect(() => {
    if (existingConnection) {
      setApiKey(existingConnection.config?.api_key || "");
      setClientId(existingConnection.config?.client_id || "");
    }
  }, [existingConnection]);

  const handleSave = async () => {
    if (!orgId) return;
    if (!apiKey.trim() || !clientId.trim()) {
      toast.error("Both API Key and Client ID are required");
      return;
    }

    setSaving(true);
    try {
      const config = { api_key: apiKey.trim(), client_id: clientId.trim() };

      if (existingConnection) {
        await updateConnection.mutateAsync({
          id: existingConnection.id,
          config,
          status: "active",
        });
      } else {
        await addConnection.mutateAsync({
          org_id: orgId,
          provider: "google_drive",
          category: "storage",
          status: "active",
          config,
          last_sync_at: null,
          sync_frequency: "manual",
          error_message: null,
        });
      }
      toast.success("Google Drive credentials saved");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save credentials");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!existingConnection) return;
    try {
      await deleteConnection.mutateAsync(existingConnection.id);
      setApiKey("");
      setClientId("");
      toast.success("Google Drive disconnected");
    } catch {
      toast.error("Failed to remove connection");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            Google Drive Integration
          </CardTitle>
          <CardDescription>
            Connect Google Drive to bulk-import recipes directly from your files.
            {existingConnection && (
              <span className="ml-2 inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <Check className="w-3.5 h-3.5" /> Connected
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Setup instructions */}
          <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm space-y-2">
            <p className="font-medium text-foreground">One-time setup (5 min):</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>
                Go to{" "}
                <a
                  href="https://console.cloud.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline inline-flex items-center gap-1"
                >
                  Google Cloud Console <ExternalLink className="w-3 h-3" />
                </a>{" "}
                and create a project (or use an existing one)
              </li>
              <li>
                Enable{" "}
                <a
                  href="https://console.cloud.google.com/apis/library/drive.googleapis.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Google Drive API
                </a>{" "}
                and{" "}
                <a
                  href="https://console.cloud.google.com/apis/library/picker.googleapis.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Google Picker API
                </a>
              </li>
              <li>Create an <strong>OAuth Client ID</strong> (Web application) — add your site URL as an authorized origin</li>
              <li>Create an <strong>API Key</strong> — restrict it to Picker + Drive APIs</li>
              <li>Paste both below</li>
            </ol>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="gdrive-api-key">Google API Key</Label>
              <Input
                id="gdrive-api-key"
                type="password"
                placeholder="AIza..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gdrive-client-id">Google OAuth Client ID</Label>
              <Input
                id="gdrive-client-id"
                placeholder="123456789-abc.apps.googleusercontent.com"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving || !apiKey.trim() || !clientId.trim()}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {existingConnection ? "Update Credentials" : "Save & Connect"}
            </Button>
            {existingConnection && (
              <Button variant="outline" onClick={handleRemove} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default GoogleDriveSettings;
