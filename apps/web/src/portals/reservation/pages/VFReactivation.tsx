import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  format,
  addMonths,
  differenceInDays,
  parseISO,
  formatDistanceToNow,
} from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  RefreshCw,
  CalendarDays,
  Users,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Send,
  Star,
  Repeat,
  Clock,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function getStageBadge(stage: string) {
  const stageMap: Record<string, { label: string; className: string }> = {
    INQUIRY: {
      label: "Inquiry",
      className: "bg-blue-500/10 text-blue-700 border-blue-200",
    },
    SITE_VISIT: {
      label: "Site Visit",
      className: "bg-purple-500/10 text-purple-700 border-purple-200",
    },
    PROPOSAL: {
      label: "Proposal",
      className: "bg-amber-500/10 text-amber-700 border-amber-200",
    },
    DEPOSIT: {
      label: "Deposit",
      className: "bg-orange-500/10 text-orange-700 border-orange-200",
    },
    CONFIRMED: {
      label: "Confirmed",
      className: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
    },
    PRE_EVENT: {
      label: "Pre-Event",
      className: "bg-cyan-500/10 text-cyan-700 border-cyan-200",
    },
    EVENT_DAY: {
      label: "Event Day",
      className: "bg-pink-500/10 text-pink-700 border-pink-200",
    },
    POST_EVENT: {
      label: "Post Event",
      className: "bg-slate-500/10 text-slate-700 border-slate-200",
    },
    COMPLETED: {
      label: "Completed",
      className: "bg-green-500/10 text-green-700 border-green-200",
    },
    LOST: {
      label: "Lost",
      className: "bg-red-500/10 text-red-700 border-red-200",
    },
  };
  const entry = stageMap[stage] ?? {
    label: stage,
    className: "bg-slate-500/10 text-slate-600 border-slate-200",
  };
  return (
    <Badge variant="outline" className={entry.className}>
      {entry.label}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Component: VFReactivation
// ---------------------------------------------------------------------------

const VFReactivation: React.FC = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const qc = useQueryClient();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [reactivating, setReactivating] = useState<string | null>(null);
  const [sendingCampaign, setSendingCampaign] = useState(false);

  // -----------------------------------------------------------------------
  // Query: Completed clients with their function event data
  // -----------------------------------------------------------------------

  const {
    data: completedClients = [],
    isLoading: loadingClients,
  } = useQuery({
    queryKey: ["vf_reactivation_clients", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("res_function_clients")
        .select("*")
        .eq("org_id", orgId!)
        .in("pipeline_stage", ["COMPLETED", "POST_EVENT"])
        .is("archived_at", null)
        .order("updated_at", { ascending: false });
      if (error) {
        console.error("Error fetching completed clients:", error);
        return [];
      }
      return data ?? [];
    },
    enabled: !!orgId,
  });

  // -----------------------------------------------------------------------
  // Query: Functions (events) for event_date, event_type, quoted_total
  // -----------------------------------------------------------------------

  const {
    data: functions = [],
    isLoading: loadingFunctions,
  } = useQuery({
    queryKey: ["vf_reactivation_functions", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("res_functions")
        .select("id, client_id, event_date, event_type, party_size, quoted_total, status, feedback_score")
        .eq("org_id", orgId!)
        .order("event_date", { ascending: false });
      if (error) {
        console.error("Error fetching functions:", error);
        return [];
      }
      return data ?? [];
    },
    enabled: !!orgId,
  });

  // -----------------------------------------------------------------------
  // Query: Recently reactivated clients
  // -----------------------------------------------------------------------

  const {
    data: reactivatedClients = [],
    isLoading: loadingReactivated,
  } = useQuery({
    queryKey: ["vf_reactivated_clients", orgId],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("res_function_clients")
        .select("*")
        .eq("org_id", orgId!)
        .not("reactivated_from", "is", null)
        .order("created_at", { ascending: false })
        .limit(20) as any);
      if (error) {
        console.error("Error fetching reactivated clients:", error);
        return [];
      }
      return data ?? [];
    },
    enabled: !!orgId,
  });

  // -----------------------------------------------------------------------
  // Derived: function lookup by client_id (most recent function per client)
  // -----------------------------------------------------------------------

  const functionByClient = useMemo(() => {
    const map: Record<string, any> = {};
    for (const fn of functions) {
      const cid = fn.client_id;
      if (!cid) continue;
      // Keep the most recent completed event
      if (
        !map[cid] ||
        new Date(fn.event_date) > new Date(map[cid].event_date)
      ) {
        map[cid] = fn;
      }
    }
    return map;
  }, [functions]);

  // -----------------------------------------------------------------------
  // Derived: Anniversary approaching (within next 60 days)
  // event_date + 11 months = reactivation window start
  // -----------------------------------------------------------------------

  const anniversaryClients = useMemo(() => {
    const now = new Date();
    const windowEnd = addMonths(now, 2); // ~60 days

    return completedClients
      .map((client: any) => {
        const fn = functionByClient[client.id];
        if (!fn || !fn.event_date) return null;

        const eventDate = parseISO(fn.event_date);
        const reactivationDate = addMonths(eventDate, 11);
        const daysUntil = differenceInDays(reactivationDate, now);

        // Within the 60-day window (reactivation date is between now and 60 days from now)
        if (reactivationDate >= now && reactivationDate <= windowEnd) {
          return {
            ...client,
            fn,
            reactivationDate,
            daysUntil,
            anniversaryDate: addMonths(eventDate, 12),
          };
        }

        // Also include clients whose anniversary has already passed but within the last 30 days
        if (daysUntil >= -30 && daysUntil < 0) {
          return {
            ...client,
            fn,
            reactivationDate,
            daysUntil,
            anniversaryDate: addMonths(eventDate, 12),
          };
        }

        return null;
      })
      .filter(Boolean)
      .sort((a: any, b: any) => a.daysUntil - b.daysUntil);
  }, [completedClients, functionByClient]);

  // -----------------------------------------------------------------------
  // Derived: Reactivated clients with original client info
  // -----------------------------------------------------------------------

  const clientMap = useMemo(() => {
    const map = new Map<string, any>();
    completedClients.forEach((c: any) => map.set(c.id, c));
    return map;
  }, [completedClients]);

  // -----------------------------------------------------------------------
  // Stats
  // -----------------------------------------------------------------------

  const stats = useMemo(() => {
    const totalReactivated = reactivatedClients.length;
    const totalCompleted = completedClients.length;
    const reactivationRate =
      totalCompleted > 0
        ? Math.round((totalReactivated / totalCompleted) * 100)
        : 0;

    // Repeat revenue: sum of total_spend from reactivated clients
    const repeatRevenue = reactivatedClients.reduce(
      (sum: number, c: any) => sum + (Number(c.total_spend) || 0),
      0,
    );

    // Avg time between events (for reactivated clients)
    let avgDaysBetween = 0;
    let validCount = 0;
    reactivatedClients.forEach((rc: any) => {
      if (rc.reactivated_from && rc.created_at) {
        const original = clientMap.get(rc.reactivated_from);
        const originalFn = original ? functionByClient[original.id] : null;
        if (originalFn?.event_date) {
          const days = differenceInDays(
            new Date(rc.created_at),
            parseISO(originalFn.event_date),
          );
          if (days > 0) {
            avgDaysBetween += days;
            validCount++;
          }
        }
      }
    });
    if (validCount > 0) avgDaysBetween = Math.round(avgDaysBetween / validCount);

    return { reactivationRate, repeatRevenue, avgDaysBetween, totalReactivated };
  }, [reactivatedClients, completedClients, clientMap, functionByClient]);

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------

  const toggleSelected = (clientId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(clientId)) {
        next.delete(clientId);
      } else {
        next.add(clientId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === anniversaryClients.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(anniversaryClients.map((c: any) => c.id)));
    }
  };

  const handleReactivate = async (client: any) => {
    if (!orgId) return;
    setReactivating(client.id);

    const { error } = await supabase.from("res_function_clients").insert({
      org_id: orgId,
      contact_name: client.contact_name,
      company_name: client.company_name || null,
      email: client.email || null,
      phone: client.phone || null,
      pipeline_stage: "INQUIRY",
      reactivated_from: client.id,
      notes: `Re-activated from ${client.fn?.event_type || "previous"} event on ${
        client.fn?.event_date
          ? format(parseISO(client.fn.event_date), "d MMM yyyy")
          : "unknown date"
      }`,
    } as any);

    if (error) {
      toast.error("Failed to re-activate: " + error.message);
      setReactivating(null);
      return;
    }

    toast.success(`${client.contact_name} re-activated as new inquiry`);
    setReactivating(null);
    qc.invalidateQueries({ queryKey: ["vf_reactivated_clients"] });
    qc.invalidateQueries({ queryKey: ["vf_reactivation_clients"] });
    qc.invalidateQueries({ queryKey: ["vf_pipeline_clients"] });
  };

  const handleSendCampaign = async () => {
    if (selectedIds.size === 0) {
      toast.error("Please select at least one client");
      return;
    }
    setSendingCampaign(true);

    // Reactivate all selected clients
    let successCount = 0;
    for (const clientId of selectedIds) {
      const client = anniversaryClients.find((c: any) => c.id === clientId);
      if (!client) continue;

      const { error } = await supabase.from("res_function_clients").insert({
        org_id: orgId,
        contact_name: (client as any).contact_name,
        company_name: (client as any).company_name || null,
        email: (client as any).email || null,
        phone: (client as any).phone || null,
        pipeline_stage: "INQUIRY",
        reactivated_from: clientId,
        notes: `Bulk re-activation campaign - original event: ${
          (client as any).fn?.event_type || "event"
        } on ${
          (client as any).fn?.event_date
            ? format(parseISO((client as any).fn.event_date), "d MMM yyyy")
            : "unknown date"
        }`,
      } as any);

      if (!error) successCount++;
    }

    setSendingCampaign(false);
    setSelectedIds(new Set());

    if (successCount > 0) {
      toast.success(
        `Campaign sent: ${successCount} client${successCount !== 1 ? "s" : ""} re-activated`,
      );
      qc.invalidateQueries({ queryKey: ["vf_reactivated_clients"] });
      qc.invalidateQueries({ queryKey: ["vf_reactivation_clients"] });
      qc.invalidateQueries({ queryKey: ["vf_pipeline_clients"] });
    } else {
      toast.error("Failed to re-activate any clients");
    }
  };

  // -----------------------------------------------------------------------
  // Loading state
  // -----------------------------------------------------------------------

  const isLoading = loadingClients || loadingFunctions || loadingReactivated;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-vf-gold mx-auto" />
          <p className="text-sm text-vf-navy/60">
            Loading re-activation data...
          </p>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold flex items-center gap-2 text-vf-navy">
          <RefreshCw className="w-6 h-6 text-vf-gold" /> Client Re-activation
        </h1>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {/* Reactivation Rate */}
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-vf-navy/50 uppercase tracking-wide">
                  Reactivation Rate
                </p>
                <p className="text-3xl font-bold text-vf-navy mt-1">
                  {stats.reactivationRate}%
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-vf-gold/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-vf-gold" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Repeat Revenue */}
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-vf-navy/50 uppercase tracking-wide">
                  Repeat Revenue
                </p>
                <p className="text-3xl font-bold text-vf-navy mt-1">
                  {formatCurrency(stats.repeatRevenue)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Avg Time Between Events */}
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-vf-navy/50 uppercase tracking-wide">
                  Avg Time Between
                </p>
                <p className="text-3xl font-bold text-vf-navy mt-1">
                  {stats.avgDaysBetween > 0
                    ? `${stats.avgDaysBetween}d`
                    : "-"}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Reactivated */}
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-vf-navy/50 uppercase tracking-wide">
                  Total Reactivated
                </p>
                <p className="text-3xl font-bold text-vf-navy mt-1">
                  {stats.totalReactivated}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Repeat className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ================================================================
          Anniversary Approaching Section
          ================================================================ */}
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-vf-navy flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-vf-gold" />
              Anniversary Approaching
              {anniversaryClients.length > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-vf-gold/10 text-vf-gold text-xs"
                >
                  {anniversaryClients.length}
                </Badge>
              )}
            </CardTitle>
            {anniversaryClients.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAll}
                  className="text-xs"
                >
                  {selectedIds.size === anniversaryClients.length
                    ? "Deselect All"
                    : "Select All"}
                </Button>
                <Button
                  size="sm"
                  className="bg-vf-gold hover:bg-vf-gold-light text-vf-navy font-medium text-xs"
                  onClick={handleSendCampaign}
                  disabled={selectedIds.size === 0 || sendingCampaign}
                >
                  {sendingCampaign ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : (
                    <Send className="w-3 h-3 mr-1" />
                  )}
                  Send Campaign ({selectedIds.size})
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {anniversaryClients.length === 0 ? (
            <div className="py-12 text-center">
              <CalendarDays className="w-12 h-12 mx-auto mb-3 text-vf-navy/20" />
              <p className="text-sm font-medium text-vf-navy/50">
                No anniversaries approaching
              </p>
              <p className="text-xs text-vf-navy/40 mt-1">
                Clients with events approaching their 1-year anniversary will
                appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {anniversaryClients.map((client: any) => (
                <div
                  key={client.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-vf-navy/5 hover:border-vf-gold/30 hover:bg-vf-cream/30 transition-colors"
                >
                  {/* Checkbox */}
                  <Checkbox
                    checked={selectedIds.has(client.id)}
                    onCheckedChange={() => toggleSelected(client.id)}
                    className="border-vf-navy/30 data-[state=checked]:bg-vf-gold data-[state=checked]:border-vf-gold"
                  />

                  {/* Client info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-vf-navy truncate">
                        {client.contact_name}
                      </p>
                      {client.company_name && (
                        <span className="text-xs text-vf-navy/50 truncate">
                          {client.company_name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-vf-navy/50 flex-wrap">
                      {client.fn?.event_type && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 h-4"
                        >
                          {client.fn.event_type}
                        </Badge>
                      )}
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {format(parseISO(client.fn.event_date), "d MMM yyyy")}
                      </span>
                      {client.fn?.quoted_total > 0 && (
                        <span className="flex items-center gap-1 font-medium text-emerald-600">
                          <DollarSign className="w-3 h-3" />
                          {formatCurrency(Number(client.fn.quoted_total))}
                        </span>
                      )}
                      {client.fn?.feedback_score != null && (
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-vf-gold" />
                          {client.fn.feedback_score}/5
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Days until */}
                  <div className="shrink-0 text-right mr-2">
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        client.daysUntil <= 0
                          ? "bg-red-500/10 text-red-600 border-red-200"
                          : client.daysUntil <= 14
                            ? "bg-amber-500/10 text-amber-600 border-amber-200"
                            : "bg-blue-500/10 text-blue-600 border-blue-200"
                      }`}
                    >
                      {client.daysUntil <= 0
                        ? `${Math.abs(client.daysUntil)}d overdue`
                        : `${client.daysUntil}d away`}
                    </Badge>
                  </div>

                  {/* Re-activate button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 text-xs border-vf-gold/30 text-vf-gold hover:bg-vf-gold/10"
                    disabled={reactivating === client.id}
                    onClick={() => handleReactivate(client)}
                  >
                    {reactivating === client.id ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    ) : (
                      <RefreshCw className="w-3 h-3 mr-1" />
                    )}
                    Re-activate
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ================================================================
          Recently Reactivated Section
          ================================================================ */}
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-vf-navy flex items-center gap-2">
            <Repeat className="w-4 h-4 text-vf-sage" />
            Recently Reactivated
            {reactivatedClients.length > 0 && (
              <Badge
                variant="secondary"
                className="bg-vf-sage/10 text-vf-sage text-xs ml-auto"
              >
                {reactivatedClients.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reactivatedClients.length === 0 ? (
            <div className="py-12 text-center">
              <Repeat className="w-12 h-12 mx-auto mb-3 text-vf-navy/20" />
              <p className="text-sm font-medium text-vf-navy/50">
                No reactivated clients yet
              </p>
              <p className="text-xs text-vf-navy/40 mt-1">
                Re-activated clients and their pipeline progression will appear
                here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {reactivatedClients.map((rc: any) => {
                const originalClient = clientMap.get(rc.reactivated_from);
                const originalFn = originalClient
                  ? functionByClient[originalClient.id]
                  : null;

                return (
                  <div
                    key={rc.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-vf-cream/40 transition-colors border-l-2 border-vf-sage"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-vf-navy truncate">
                        {rc.contact_name}
                      </p>
                      {rc.company_name && (
                        <p className="text-xs text-vf-navy/50 truncate">
                          {rc.company_name}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-xs text-vf-navy/40">
                        <span>
                          Re-activated{" "}
                          {formatDistanceToNow(new Date(rc.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Pipeline progression: original stage -> current stage */}
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      {originalClient && (
                        <>
                          {getStageBadge(originalClient.pipeline_stage)}
                          <ArrowRight className="w-3 h-3 text-vf-navy/30" />
                        </>
                      )}
                      {getStageBadge(rc.pipeline_stage)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VFReactivation;
