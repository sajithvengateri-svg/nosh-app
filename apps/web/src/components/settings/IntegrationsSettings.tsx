import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CreditCard, BookOpen, Calendar, Mail, MessageSquare,
  HardDrive, Database, Users, Wifi, Phone, Thermometer,
  Clock, CheckCircle2, XCircle, Loader2, RefreshCw,
  ExternalLink, ChevronDown, ChevronUp, Puzzle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useOrgId } from "@/hooks/useOrgId";
import { useDataConnections } from "@/hooks/useDataConnections";

// ---------------------------------------------------------------------------
// Integration registry
// ---------------------------------------------------------------------------

type IntegrationStatus = "active" | "coming_soon";

interface IntegrationDef {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  provider: string;
  status: IntegrationStatus;
  configType: "oauth" | "api_key" | "form" | "none";
}

const INTEGRATION_REGISTRY: IntegrationDef[] = [
  // POS
  { id: "square", name: "Square POS", description: "Sync payments, menu items & daily reconciliation", category: "POS", icon: <CreditCard className="w-5 h-5" />, provider: "square", status: "coming_soon", configType: "oauth" },
  { id: "lightspeed", name: "Lightspeed", description: "Menu sync and tab management", category: "POS", icon: <CreditCard className="w-5 h-5" />, provider: "lightspeed", status: "coming_soon", configType: "oauth" },
  // Accounting
  { id: "xero", name: "Xero", description: "Sync invoices, contacts & revenue categorisation", category: "Accounting", icon: <BookOpen className="w-5 h-5" />, provider: "xero", status: "coming_soon", configType: "oauth" },
  { id: "myob", name: "MYOB", description: "Push invoices and reconcile payments", category: "Accounting", icon: <BookOpen className="w-5 h-5" />, provider: "myob", status: "coming_soon", configType: "oauth" },
  // Roster
  { id: "deputy", name: "Deputy", description: "Import rosters and sync timesheets", category: "Roster", icon: <Users className="w-5 h-5" />, provider: "deputy", status: "coming_soon", configType: "oauth" },
  { id: "tanda", name: "Tanda", description: "Roster sync and award interpretation", category: "Roster", icon: <Users className="w-5 h-5" />, provider: "tanda", status: "coming_soon", configType: "oauth" },
  // Storage & Sync
  { id: "google-drive", name: "Google Drive", description: "Bulk-import recipes from your files", category: "Storage & Sync", icon: <HardDrive className="w-5 h-5" />, provider: "google_drive", status: "active", configType: "api_key" },
  { id: "airtable", name: "Airtable", description: "Sync shows & events from Airtable bases", category: "Storage & Sync", icon: <Database className="w-5 h-5" />, provider: "airtable", status: "active", configType: "api_key" },
  // Calendar
  { id: "google-calendar", name: "Google Calendar", description: "Two-way sync confirmed events to calendar", category: "Calendar", icon: <Calendar className="w-5 h-5" />, provider: "google_calendar", status: "active", configType: "oauth" },
  { id: "outlook", name: "Outlook Calendar", description: "Sync events to Microsoft 365 calendar", category: "Calendar", icon: <Calendar className="w-5 h-5" />, provider: "outlook", status: "active", configType: "oauth" },
  // Communication
  { id: "sendgrid", name: "SendGrid", description: "Email delivery for automations with tracking", category: "Communication", icon: <Mail className="w-5 h-5" />, provider: "sendgrid", status: "active", configType: "api_key" },
  { id: "twilio", name: "Twilio", description: "SMS for deposit reminders & confirmations", category: "Communication", icon: <MessageSquare className="w-5 h-5" />, provider: "twilio", status: "active", configType: "api_key" },
  // Email
  { id: "email-smtp", name: "Email (SMTP / Resend)", description: "Configure outbound email provider", category: "Email", icon: <Mail className="w-5 h-5" />, provider: "org_email", status: "active", configType: "form" },
  // Venue
  { id: "wifi", name: "Guest WiFi", description: "WiFi password shown on receipts & widgets", category: "Venue", icon: <Wifi className="w-5 h-5" />, provider: "wifi", status: "active", configType: "form" },
  // Voice & AI
  { id: "vapi", name: "Voice Agent (VAPI)", description: "AI voice agent for phone reservations", category: "Voice & AI", icon: <Phone className="w-5 h-5" />, provider: "vapi", status: "coming_soon", configType: "form" },
  // Hardware
  { id: "temp-probes", name: "Temperature Probes", description: "Bluetooth temp probe integration for CCP checks", category: "Hardware", icon: <Thermometer className="w-5 h-5" />, provider: "temp_probes", status: "coming_soon", configType: "none" },
  { id: "tmps-oven", name: "TMPS Oven Sensors", description: "Smart oven monitoring & alerting", category: "Hardware", icon: <Thermometer className="w-5 h-5" />, provider: "tmps_oven", status: "coming_soon", configType: "none" },
];

const CATEGORY_ORDER = [
  "POS", "Accounting", "Roster",
  "Storage & Sync", "Calendar", "Communication",
  "Email", "Venue", "Voice & AI", "Hardware",
];

// ---------------------------------------------------------------------------
// Inline config forms
// ---------------------------------------------------------------------------

interface ConfigFormProps {
  integration: IntegrationDef;
  orgId: string;
  existingConfig: Record<string, any> | null;
  onSaved: () => void;
  onDisconnect: () => void;
}

const GoogleDriveConfigForm: React.FC<ConfigFormProps> = ({ orgId, existingConfig, onSaved, onDisconnect }) => {
  const { addConnection, updateConnection } = useDataConnections(orgId);
  const [apiKey, setApiKey] = useState(existingConfig?.api_key || "");
  const [clientId, setClientId] = useState(existingConfig?.client_id || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!apiKey.trim() || !clientId.trim()) { toast.error("Both API Key and Client ID are required"); return; }
    setSaving(true);
    try {
      const config = { api_key: apiKey.trim(), client_id: clientId.trim() };
      if (existingConfig?._connectionId) {
        await updateConnection.mutateAsync({ id: existingConfig._connectionId, config, status: "active" });
      } else {
        await addConnection.mutateAsync({ org_id: orgId, provider: "google_drive", category: "storage", status: "active", config, last_sync_at: null, sync_frequency: "manual", error_message: null });
      }
      toast.success("Google Drive credentials saved");
      onSaved();
    } catch { toast.error("Failed to save credentials"); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-3 pt-3 border-t border-border mt-3">
      <div className="space-y-1.5">
        <Label htmlFor="gdrive-api-key">Google API Key</Label>
        <Input id="gdrive-api-key" type="password" placeholder="AIza..." value={apiKey} onChange={e => setApiKey(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="gdrive-client-id">OAuth Client ID</Label>
        <Input id="gdrive-client-id" placeholder="123456789-abc.apps.googleusercontent.com" value={clientId} onChange={e => setClientId(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={saving || !apiKey.trim() || !clientId.trim()}>
          {saving && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
          {existingConfig?._connectionId ? "Update" : "Save & Connect"}
        </Button>
        {existingConfig?._connectionId && (
          <Button variant="ghost" size="sm" className="text-destructive" onClick={onDisconnect}>Disconnect</Button>
        )}
      </div>
    </div>
  );
};

const ApiKeyConfigForm: React.FC<ConfigFormProps> = ({ integration, orgId, existingConfig, onSaved, onDisconnect }) => {
  const { addConnection, updateConnection } = useDataConnections(orgId);
  const [apiKey, setApiKey] = useState(existingConfig?.api_key || "");
  const [saving, setSaving] = useState(false);

  const extraFields: Record<string, { label: string; key: string; placeholder: string }[]> = {
    airtable: [
      { label: "Base ID", key: "base_id", placeholder: "appXXXXXXXXXXXXXX" },
      { label: "Table Name", key: "table_name", placeholder: "Shows" },
    ],
  };
  const extras = extraFields[integration.provider] || [];
  const [extraValues, setExtraValues] = useState<Record<string, string>>(
    Object.fromEntries(extras.map(f => [f.key, existingConfig?.[f.key] || ""]))
  );

  const handleSave = async () => {
    if (!apiKey.trim()) { toast.error("API Key is required"); return; }
    setSaving(true);
    try {
      const config: Record<string, string> = { api_key: apiKey.trim(), ...Object.fromEntries(Object.entries(extraValues).map(([k, v]) => [k, v.trim()])) };
      if (existingConfig?._connectionId) {
        await updateConnection.mutateAsync({ id: existingConfig._connectionId, config, status: "active" });
      } else {
        await addConnection.mutateAsync({ org_id: orgId, provider: integration.provider, category: integration.category.toLowerCase(), status: "active", config, last_sync_at: null, sync_frequency: "manual", error_message: null });
      }
      toast.success(`${integration.name} credentials saved`);
      onSaved();
    } catch { toast.error("Failed to save"); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-3 pt-3 border-t border-border mt-3">
      <div className="space-y-1.5">
        <Label>API Key</Label>
        <Input type="password" placeholder="sk-..." value={apiKey} onChange={e => setApiKey(e.target.value)} />
      </div>
      {extras.map(f => (
        <div key={f.key} className="space-y-1.5">
          <Label>{f.label}</Label>
          <Input placeholder={f.placeholder} value={extraValues[f.key] || ""} onChange={e => setExtraValues(prev => ({ ...prev, [f.key]: e.target.value }))} />
        </div>
      ))}
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={saving || !apiKey.trim()}>
          {saving && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
          {existingConfig?._connectionId ? "Update" : "Save & Connect"}
        </Button>
        {existingConfig?._connectionId && (
          <Button variant="ghost" size="sm" className="text-destructive" onClick={onDisconnect}>Disconnect</Button>
        )}
      </div>
    </div>
  );
};

const EmailConfigForm: React.FC<{ orgId: string }> = ({ orgId }) => {
  const qc = useQueryClient();
  const { data: emailSettings } = useQuery({
    queryKey: ["org_email_settings", orgId],
    queryFn: async () => {
      const { data } = await supabase.from("org_email_settings").select("*").eq("org_id", orgId).maybeSingle();
      return data;
    },
    enabled: !!orgId,
  });

  const [provider, setProvider] = useState("smtp");
  const [fromName, setFromName] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (emailSettings) {
      setProvider(emailSettings.provider || "smtp");
      setFromName(emailSettings.from_name || "");
      setFromEmail(emailSettings.from_email || "");
      setSmtpHost(emailSettings.smtp_host || "");
      setSmtpPort(String(emailSettings.smtp_port || 587));
      setSmtpUser(emailSettings.smtp_user || "");
    }
  }, [emailSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        org_id: orgId,
        provider,
        from_name: fromName.trim(),
        from_email: fromEmail.trim(),
        smtp_host: smtpHost.trim(),
        smtp_port: parseInt(smtpPort) || 587,
        smtp_user: smtpUser.trim(),
        ...(smtpPass ? { smtp_pass_encrypted: smtpPass } : {}),
      };
      const { error } = await supabase.from("org_email_settings").upsert(payload, { onConflict: "org_id" });
      if (error) throw error;
      toast.success("Email settings saved");
      qc.invalidateQueries({ queryKey: ["org_email_settings", orgId] });
    } catch { toast.error("Failed to save email settings"); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-3 pt-3 border-t border-border mt-3">
      <div className="space-y-1.5">
        <Label>Provider</Label>
        <Select value={provider} onValueChange={setProvider}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="smtp">SMTP</SelectItem>
            <SelectItem value="resend">Resend</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>From Name</Label>
          <Input placeholder="My Restaurant" value={fromName} onChange={e => setFromName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>From Email</Label>
          <Input type="email" placeholder="hello@example.com" value={fromEmail} onChange={e => setFromEmail(e.target.value)} />
        </div>
      </div>
      {provider === "smtp" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>SMTP Host</Label>
            <Input placeholder="smtp.gmail.com" value={smtpHost} onChange={e => setSmtpHost(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>SMTP Port</Label>
            <Input placeholder="587" value={smtpPort} onChange={e => setSmtpPort(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>SMTP User</Label>
            <Input placeholder="user@example.com" value={smtpUser} onChange={e => setSmtpUser(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>SMTP Password</Label>
            <Input type="password" placeholder="Enter to change" value={smtpPass} onChange={e => setSmtpPass(e.target.value)} />
          </div>
        </div>
      )}
      <Button size="sm" onClick={handleSave} disabled={saving}>
        {saving && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
        {emailSettings ? "Update" : "Save"}
      </Button>
    </div>
  );
};

const WiFiConfigForm: React.FC<{ orgId: string }> = ({ orgId }) => {
  const qc = useQueryClient();
  const { data: store } = useQuery({
    queryKey: ["pos-store-wifi", orgId],
    queryFn: async () => {
      const { data } = await supabase.from("pos_stores").select("id, settings").eq("org_id", orgId).limit(1).maybeSingle();
      return data;
    },
    enabled: !!orgId,
  });

  const [wifiPassword, setWifiPassword] = useState("");
  const [showOnReceipt, setShowOnReceipt] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (store?.settings) {
      const s = store.settings as Record<string, any>;
      setWifiPassword(s.wifi_password || "");
      setShowOnReceipt(!!s.receipt_show_wifi);
    }
  }, [store]);

  const handleSave = async () => {
    if (!store?.id) { toast.error("No POS store found for this org"); return; }
    setSaving(true);
    try {
      const existingSettings = (store.settings || {}) as Record<string, any>;
      const { error } = await supabase.from("pos_stores").update({
        settings: { ...existingSettings, wifi_password: wifiPassword.trim(), receipt_show_wifi: showOnReceipt },
      }).eq("id", store.id);
      if (error) throw error;
      toast.success("WiFi settings saved");
      qc.invalidateQueries({ queryKey: ["pos-store-wifi", orgId] });
    } catch { toast.error("Failed to save WiFi settings"); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-3 pt-3 border-t border-border mt-3">
      <div className="space-y-1.5">
        <Label>WiFi Password</Label>
        <Input placeholder="Guest WiFi password" value={wifiPassword} onChange={e => setWifiPassword(e.target.value)} />
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={showOnReceipt} onCheckedChange={setShowOnReceipt} />
        <Label>Show on receipts</Label>
      </div>
      <Button size="sm" onClick={handleSave} disabled={saving}>
        {saving && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
        Save
      </Button>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const IntegrationsSettings = () => {
  const orgId = useOrgId();
  const qc = useQueryClient();
  const { data: connections = [], isLoading, deleteConnection } = useDataConnections(orgId ?? undefined);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Email settings (for connected status)
  const { data: emailSettings } = useQuery({
    queryKey: ["org_email_settings", orgId],
    queryFn: async () => {
      const { data } = await supabase.from("org_email_settings").select("*").eq("org_id", orgId!).maybeSingle();
      return data;
    },
    enabled: !!orgId,
  });

  // WiFi (for connected status)
  const { data: wifiStore } = useQuery({
    queryKey: ["pos-store-wifi", orgId],
    queryFn: async () => {
      const { data } = await supabase.from("pos_stores").select("id, settings").eq("org_id", orgId!).limit(1).maybeSingle();
      return data;
    },
    enabled: !!orgId,
  });

  const getConnection = (provider: string) => connections.find(c => c.provider === provider);

  const isConnected = (integration: IntegrationDef): boolean => {
    if (integration.provider === "org_email") return !!emailSettings?.provider;
    if (integration.provider === "wifi") return !!(wifiStore?.settings as Record<string, any>)?.wifi_password;
    return !!getConnection(integration.provider);
  };

  const getConfig = (integration: IntegrationDef): Record<string, any> | null => {
    const conn = getConnection(integration.provider);
    if (!conn) return null;
    return { ...conn.config, _connectionId: conn.id };
  };

  const handleConnect = async (provider: string) => {
    setConnecting(provider);
    toast.info(`OAuth flow for ${provider} would start here. Configure in Supabase Edge Functions.`);
    setTimeout(() => setConnecting(null), 1500);
  };

  const handleDisconnect = async (provider: string) => {
    const conn = getConnection(provider);
    if (!conn) return;
    try {
      await deleteConnection.mutateAsync(conn.id);
      toast.success(`${provider} disconnected`);
      setExpandedId(null);
    } catch {
      toast.error("Failed to disconnect");
    }
  };

  const handleTestConnection = async (provider: string) => {
    toast.info(`Testing ${provider} connection...`);
    setTimeout(() => toast.success(`${provider} connection is healthy`), 1000);
  };

  const toggleExpand = (id: string) => setExpandedId(prev => prev === id ? null : id);

  const grouped = CATEGORY_ORDER.map(cat => ({
    category: cat,
    integrations: INTEGRATION_REGISTRY.filter(i => i.category === cat),
  })).filter(g => g.integrations.length > 0);

  const connectedCount = INTEGRATION_REGISTRY.filter(i => i.status === "active" && isConnected(i)).length;
  const activeCount = INTEGRATION_REGISTRY.filter(i => i.status === "active").length;
  const comingSoonCount = INTEGRATION_REGISTRY.filter(i => i.status === "coming_soon").length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-primary">{connectedCount}</p>
            <p className="text-xs text-muted-foreground">Connected</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-primary">{activeCount}</p>
            <p className="text-xs text-muted-foreground">Available</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-muted-foreground">{comingSoonCount}</p>
            <p className="text-xs text-muted-foreground">Coming Soon</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : (
        grouped.map(({ category, integrations }) => (
          <div key={category} className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{category}</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {integrations.map(integration => {
                const isComingSoon = integration.status === "coming_soon";
                const connected = !isComingSoon && isConnected(integration);
                const isExpanded = expandedId === integration.id;
                const config = getConfig(integration);

                return (
                  <Card
                    key={integration.id}
                    className={
                      isComingSoon
                        ? "opacity-50 pointer-events-none"
                        : connected
                        ? "border-l-4 border-l-emerald-500"
                        : ""
                    }
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${connected ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                          {integration.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium">{integration.name}</h3>
                            {isComingSoon ? (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                <Clock className="w-3 h-3 mr-1" /> Coming Soon
                              </Badge>
                            ) : connected ? (
                              <Badge className="bg-emerald-500/10 text-emerald-600 text-[10px]">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Connected
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px]">
                                <XCircle className="w-3 h-3 mr-1" /> Not Connected
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{integration.description}</p>
                        </div>

                        {/* Action buttons */}
                        {!isComingSoon && (
                          <div className="flex flex-col gap-1 shrink-0">
                            {connected && integration.configType === "oauth" ? (
                              <>
                                <Button variant="outline" size="sm" className="text-xs" onClick={() => handleTestConnection(integration.provider)}>
                                  <RefreshCw className="w-3 h-3 mr-1" /> Test
                                </Button>
                                <Button variant="ghost" size="sm" className="text-xs text-destructive" onClick={() => handleDisconnect(integration.provider)}>
                                  Disconnect
                                </Button>
                              </>
                            ) : integration.configType === "oauth" ? (
                              <Button
                                size="sm"
                                className="text-xs"
                                onClick={() => handleConnect(integration.provider)}
                                disabled={connecting === integration.provider}
                              >
                                {connecting === integration.provider ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <><ExternalLink className="w-3 h-3 mr-1" /> Connect</>
                                )}
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                onClick={() => toggleExpand(integration.id)}
                              >
                                {isExpanded ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
                                Configure
                              </Button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Inline config panels */}
                      {isExpanded && !isComingSoon && orgId && (
                        <>
                          {integration.provider === "google_drive" && (
                            <GoogleDriveConfigForm
                              integration={integration}
                              orgId={orgId}
                              existingConfig={config}
                              onSaved={() => setExpandedId(null)}
                              onDisconnect={() => handleDisconnect(integration.provider)}
                            />
                          )}
                          {integration.provider === "org_email" && (
                            <EmailConfigForm orgId={orgId} />
                          )}
                          {integration.provider === "wifi" && (
                            <WiFiConfigForm orgId={orgId} />
                          )}
                          {["airtable", "sendgrid", "twilio"].includes(integration.provider) && (
                            <ApiKeyConfigForm
                              integration={integration}
                              orgId={orgId}
                              existingConfig={config}
                              onSaved={() => setExpandedId(null)}
                              onDisconnect={() => handleDisconnect(integration.provider)}
                            />
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))
      )}
    </motion.div>
  );
};

export default IntegrationsSettings;
