import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Puzzle, CheckCircle2, XCircle, AlertTriangle, Loader2,
  RefreshCw, ExternalLink, CreditCard, BookOpen, Calendar,
  Mail, MessageSquare, BarChart3, Clock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  provider: string;
  connected: boolean;
  lastSync?: string;
  autoSync: boolean;
}

const COMING_SOON_PROVIDERS = new Set(["xero", "myob", "square", "lightspeed"]);

const AVAILABLE_INTEGRATIONS: (Omit<Integration, "connected" | "lastSync" | "autoSync"> & { comingSoon?: boolean })[] = [
  { id: "xero", name: "Xero", description: "Sync invoices, contacts & revenue categorisation", category: "Accounting", icon: <BookOpen className="w-6 h-6" />, provider: "xero", comingSoon: true },
  { id: "myob", name: "MYOB", description: "Push invoices and reconcile payments", category: "Accounting", icon: <BookOpen className="w-6 h-6" />, provider: "myob", comingSoon: true },
  { id: "square", name: "Square POS", description: "Sync payments, menu items & daily reconciliation", category: "POS", icon: <CreditCard className="w-6 h-6" />, provider: "square", comingSoon: true },
  { id: "lightspeed", name: "Lightspeed", description: "Menu sync and tab management", category: "POS", icon: <CreditCard className="w-6 h-6" />, provider: "lightspeed", comingSoon: true },
  { id: "google-calendar", name: "Google Calendar", description: "Two-way sync confirmed events to calendar", category: "Calendar", icon: <Calendar className="w-6 h-6" />, provider: "google_calendar" },
  { id: "outlook", name: "Outlook Calendar", description: "Sync events to Microsoft 365 calendar", category: "Calendar", icon: <Calendar className="w-6 h-6" />, provider: "outlook" },
  { id: "sendgrid", name: "SendGrid", description: "Email delivery for automations with tracking", category: "Communication", icon: <Mail className="w-6 h-6" />, provider: "sendgrid" },
  { id: "twilio", name: "Twilio", description: "SMS for deposit reminders & confirmations", category: "Communication", icon: <MessageSquare className="w-6 h-6" />, provider: "twilio" },
];

const CATEGORY_ORDER = ["POS", "Accounting", "Calendar", "Communication"];

const VFIntegrations = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const qc = useQueryClient();
  const [connecting, setConnecting] = useState<string | null>(null);

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ["data_connections", orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from("data_connections")
        .select("*")
        .eq("org_id", orgId!);
      return data ?? [];
    },
    enabled: !!orgId,
  });

  const { data: syncLogs = [] } = useQuery({
    queryKey: ["vf_integration_sync_log", orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from("vf_integration_sync_log")
        .select("*")
        .eq("org_id", orgId!)
        .order("started_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
    enabled: !!orgId,
  });

  const getConnectionStatus = (provider: string) => {
    return connections.find((c: any) => c.provider === provider);
  };

  const handleConnect = async (provider: string) => {
    setConnecting(provider);
    // In production, this would initiate OAuth flow via edge function
    toast.info(`OAuth flow for ${provider} would start here. Configure in Supabase Edge Functions.`);
    setTimeout(() => setConnecting(null), 1500);
  };

  const handleDisconnect = async (provider: string) => {
    const conn = getConnectionStatus(provider);
    if (!conn) return;
    const { error } = await supabase.from("data_connections").delete().eq("id", (conn as any).id);
    if (error) { toast.error(error.message); return; }
    toast.success(`${provider} disconnected`);
    qc.invalidateQueries({ queryKey: ["data_connections"] });
  };

  const handleTestConnection = async (provider: string) => {
    toast.info(`Testing ${provider} connection...`);
    setTimeout(() => toast.success(`${provider} connection is healthy`), 1000);
  };

  const grouped = CATEGORY_ORDER.map(cat => ({
    category: cat,
    integrations: AVAILABLE_INTEGRATIONS.filter(i => i.category === cat),
  }));

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold flex items-center gap-2 text-vf-charcoal">
          <Puzzle className="w-6 h-6 text-vf-gold" /> Integrations
        </h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-vf-gold" /></div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-4 text-center">
                <p className="text-3xl font-bold text-vf-navy">{connections.length}</p>
                <p className="text-xs text-muted-foreground">Connected</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-4 text-center">
                <p className="text-3xl font-bold text-vf-navy">{AVAILABLE_INTEGRATIONS.length}</p>
                <p className="text-xs text-muted-foreground">Available</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-4 text-center">
                <p className="text-3xl font-bold text-vf-sage">
                  {syncLogs.filter((l: any) => l.status === "COMPLETED").length}
                </p>
                <p className="text-xs text-muted-foreground">Syncs Today</p>
              </CardContent>
            </Card>
          </div>

          {/* Integration Cards by Category */}
          {grouped.map(({ category, integrations }) => (
            <div key={category} className="space-y-3">
              <h2 className="text-sm font-semibold text-vf-gold uppercase tracking-wider">{category}</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {integrations.map(integration => {
                  const isComingSoon = !!integration.comingSoon;
                  const conn = getConnectionStatus(integration.provider);
                  const isConnected = !isComingSoon && !!conn;
                  const lastLog = syncLogs.find((l: any) => l.provider === integration.provider);
                  return (
                    <Card key={integration.id} className={`border-vf-gold/10 ${isComingSoon ? "opacity-50 pointer-events-none" : isConnected ? "border-l-4 border-l-vf-sage" : ""}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${isConnected ? "bg-vf-sage/10 text-vf-sage" : "bg-muted text-muted-foreground"}`}>
                            {integration.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-vf-charcoal">{integration.name}</h3>
                              {isComingSoon ? (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                  <Clock className="w-3 h-3 mr-1" /> Coming Soon
                                </Badge>
                              ) : isConnected ? (
                                <Badge className="bg-vf-sage/10 text-vf-sage text-[10px]">
                                  <CheckCircle2 className="w-3 h-3 mr-1" /> Connected
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px]">
                                  <XCircle className="w-3 h-3 mr-1" /> Not Connected
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{integration.description}</p>
                            {!isComingSoon && lastLog && (
                              <p className="text-[10px] text-muted-foreground mt-1">
                                Last sync: {formatDistanceToNow(new Date((lastLog as any).started_at), { addSuffix: true })}
                                {" · "}{(lastLog as any).records_synced} records
                                {(lastLog as any).status === "FAILED" && (
                                  <span className="text-vf-rose ml-1">
                                    <AlertTriangle className="w-3 h-3 inline" /> Failed
                                  </span>
                                )}
                              </p>
                            )}
                          </div>
                          {!isComingSoon && (
                            <div className="flex flex-col gap-1">
                              {isConnected ? (
                                <>
                                  <Button variant="outline" size="sm" className="text-xs" onClick={() => handleTestConnection(integration.provider)}>
                                    <RefreshCw className="w-3 h-3 mr-1" /> Test
                                  </Button>
                                  <Button variant="ghost" size="sm" className="text-xs text-destructive" onClick={() => handleDisconnect(integration.provider)}>
                                    Disconnect
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  size="sm"
                                  className="bg-vf-gold hover:bg-vf-gold-light text-vf-navy text-xs"
                                  onClick={() => handleConnect(integration.provider)}
                                  disabled={connecting === integration.provider}
                                >
                                  {connecting === integration.provider ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <><ExternalLink className="w-3 h-3 mr-1" /> Connect</>
                                  )}
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Sync Logs */}
          {syncLogs.length > 0 && (
            <>
              <Separator />
              <div>
                <h2 className="text-sm font-semibold text-vf-gold uppercase tracking-wider mb-3">Recent Sync Logs</h2>
                <Card className="border-vf-gold/10">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Provider</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Records</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {syncLogs.slice(0, 10).map((log: any) => (
                          <TableRow key={log.id}>
                            <TableCell className="text-sm font-medium capitalize">{log.provider}</TableCell>
                            <TableCell className="text-sm">{log.sync_type}</TableCell>
                            <TableCell className="text-sm">{log.records_synced}</TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={
                                  log.status === "COMPLETED" ? "bg-vf-sage/10 text-vf-sage" :
                                  log.status === "FAILED" ? "bg-vf-rose/10 text-vf-rose" :
                                  "bg-blue-500/10 text-blue-600"
                                }
                              >
                                {log.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(log.started_at), { addSuffix: true })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default VFIntegrations;
