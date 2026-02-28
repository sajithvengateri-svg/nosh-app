import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, formatDistanceToNow, startOfWeek } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarCheck,
  DollarSign,
  Inbox,
  CreditCard,
  Clock,
  Users,
  Mail,
  Utensils,
  MessageSquare,
  ArrowUpRight,
  AlertTriangle,
  Plus,
  PhoneCall,
  FileText,
  Loader2,
  Activity,
  ChevronRight,
  X,
} from "lucide-react";
import { VF_PIPELINE_STAGES } from "@/lib/shared/types/venueflow.types";
import type { VFPipelineStage } from "@/lib/shared/types/venueflow.types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getFirstName(fullName: string | null | undefined): string {
  if (!fullName) return "there";
  return fullName.split(" ")[0];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function daysOverdue(dateStr: string): number {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getStatusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    CONFIRMED: { label: "Confirmed", className: "bg-emerald-500/10 text-emerald-700 border-emerald-200" },
    TENTATIVE: { label: "Tentative", className: "bg-amber-500/10 text-amber-700 border-amber-200" },
    DEPOSIT_PAID: { label: "Deposit Paid", className: "bg-blue-500/10 text-blue-700 border-blue-200" },
    IN_PROGRESS: { label: "In Progress", className: "bg-orange-500/10 text-orange-700 border-orange-200" },
    COMPLETED: { label: "Completed", className: "bg-slate-500/10 text-slate-700 border-slate-200" },
    CANCELLED: { label: "Cancelled", className: "bg-red-500/10 text-red-700 border-red-200" },
  };
  const entry = map[status] ?? { label: status, className: "bg-slate-500/10 text-slate-600 border-slate-200" };
  return <Badge variant="outline" className={entry.className}>{entry.label}</Badge>;
}

function getActivityIcon(noteType: string | null) {
  switch (noteType) {
    case "CALL": return <PhoneCall className="w-4 h-4 text-vf-gold" />;
    case "EMAIL": return <Mail className="w-4 h-4 text-blue-500" />;
    case "MEETING": return <Users className="w-4 h-4 text-purple-500" />;
    case "FOLLOW_UP": return <Clock className="w-4 h-4 text-amber-500" />;
    case "NOTE": return <MessageSquare className="w-4 h-4 text-slate-500" />;
    default: return <Activity className="w-4 h-4 text-vf-sage" />;
  }
}

function getStageBadge(stage: string) {
  const config = VF_PIPELINE_STAGES.find((s) => s.value === stage);
  if (!config) return <Badge variant="secondary">{stage}</Badge>;
  return <Badge variant="secondary" className={`${config.bgColor} ${config.color}`}>{config.label}</Badge>;
}

// ---------------------------------------------------------------------------
// Active pipeline stages (for computing pipeline value and deposits due)
// ---------------------------------------------------------------------------

const ACTIVE_PIPELINE_STAGES: VFPipelineStage[] = [
  "INQUIRY",
  "SITE_VISIT",
  "PROPOSAL",
  "DEPOSIT",
  "CONFIRMED",
  "PRE_EVENT",
  "EVENT_DAY",
];

const DEPOSIT_DUE_STAGES: VFPipelineStage[] = ["PROPOSAL", "DEPOSIT"];

// ---------------------------------------------------------------------------
// VFDashboard
// ---------------------------------------------------------------------------

const VFDashboard: React.FC = () => {
  const { currentOrg } = useOrg();
  const { profile } = useAuth();
  const orgId = currentOrg?.id;
  const navigate = useNavigate();
  const today = format(new Date(), "yyyy-MM-dd");
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const [fabOpen, setFabOpen] = useState(false);

  // -----------------------------------------------------------------------
  // Query: Today's events from res_functions
  // -----------------------------------------------------------------------
  const {
    data: todaysEvents = [],
    isLoading: loadingEvents,
  } = useQuery({
    queryKey: ["vf_dashboard_events_today", orgId, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("res_functions")
        .select("id, client_name, event_type, party_size, room, start_time, end_time, status, quoted_total, venue_space_id")
        .eq("org_id", orgId!)
        .eq("event_date", today)
        .order("start_time", { ascending: true });
      if (error) {
        console.error("Error fetching today's events:", error);
        toast.error("Failed to load today's events");
        return [];
      }
      return data ?? [];
    },
    enabled: !!orgId,
    refetchInterval: 60_000,
  });

  // -----------------------------------------------------------------------
  // Query: Pipeline clients (for stats + overdue follow-ups)
  // -----------------------------------------------------------------------
  const {
    data: pipelineClients = [],
    isLoading: loadingClients,
  } = useQuery({
    queryKey: ["vf_dashboard_pipeline_clients", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("res_function_clients")
        .select("*")
        .eq("org_id", orgId!)
        .order("updated_at", { ascending: false });
      if (error) {
        console.error("Error fetching pipeline clients:", error);
        return [];
      }
      return data ?? [];
    },
    enabled: !!orgId,
    refetchInterval: 60_000,
  });

  // -----------------------------------------------------------------------
  // Query: Pipeline value from res_functions (active pipeline)
  // -----------------------------------------------------------------------
  const {
    data: pipelineFunctions = [],
    isLoading: loadingPipelineFns,
  } = useQuery({
    queryKey: ["vf_dashboard_pipeline_fns", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("res_functions")
        .select("id, quoted_total, status, client_id")
        .eq("org_id", orgId!)
        .in("status", ["CONFIRMED", "TENTATIVE", "DEPOSIT_PAID", "IN_PROGRESS"]);
      if (error) {
        console.error("Error fetching pipeline functions:", error);
        return [];
      }
      return data ?? [];
    },
    enabled: !!orgId,
  });

  // -----------------------------------------------------------------------
  // Query: Recent activity feed from res_function_notes
  // -----------------------------------------------------------------------
  const {
    data: recentActivities = [],
    isLoading: loadingActivities,
  } = useQuery({
    queryKey: ["vf_dashboard_activities", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("res_function_notes")
        .select("id, note, note_type, created_at, client_id, function_id, created_by")
        .eq("org_id", orgId!)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        // The table may not have org_id — fall back to un-scoped query
        // (notes are linked via client_id which is org-scoped)
        console.warn("Falling back to client-scoped activity query:", error.message);
        const clientIds = pipelineClients.map((c: any) => c.id);
        if (clientIds.length === 0) return [];
        const { data: fallback } = await supabase
          .from("res_function_notes")
          .select("id, note, note_type, created_at, client_id, function_id, created_by")
          .in("client_id", clientIds.slice(0, 50))
          .order("created_at", { ascending: false })
          .limit(10);
        return fallback ?? [];
      }
      return data ?? [];
    },
    enabled: !!orgId && !loadingClients,
  });

  // -----------------------------------------------------------------------
  // Computed stats
  // -----------------------------------------------------------------------

  // 1. Today's Events count
  const todaysEventCount = todaysEvents.length;

  // 2. Pipeline Value
  const pipelineValue = pipelineFunctions.reduce(
    (sum: number, f: any) => sum + (Number(f.quoted_total) || 0),
    0
  );

  // 3. New Inquiries This Week
  const newInquiriesThisWeek = pipelineClients.filter((c: any) => {
    const isInquiry =
      c.pipeline_stage === "INQUIRY" ||
      c.pipeline_stage === "LEAD" ||
      c.pipeline_stage === "ENQUIRY";
    const createdAt = c.created_at;
    return isInquiry && createdAt >= weekStart;
  }).length;

  // 4. Deposits Due
  const depositsDueCount = pipelineClients.filter((c: any) => {
    return (
      DEPOSIT_DUE_STAGES.includes(c.pipeline_stage as VFPipelineStage) ||
      c.pipeline_stage === "PROPOSAL_SENT" ||
      c.pipeline_stage === "NEGOTIATION"
    );
  }).length;

  // 5. Overdue follow-ups
  const now = new Date().toISOString();
  const overdueFollowUps = pipelineClients
    .filter((c: any) => {
      if (!c.next_follow_up) return false;
      return c.next_follow_up < now;
    })
    .sort((a: any, b: any) => {
      return new Date(a.next_follow_up!).getTime() - new Date(b.next_follow_up!).getTime();
    });

  // Client lookup for activity feed
  const clientMap = React.useMemo(() => {
    const map = new Map<string, any>();
    pipelineClients.forEach((c: any) => map.set(c.id, c));
    return map;
  }, [pipelineClients]);

  // -----------------------------------------------------------------------
  // Loading state
  // -----------------------------------------------------------------------
  const isLoading = loadingEvents || loadingClients;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-vf-gold mx-auto" />
          <p className="text-sm text-vf-navy/60">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vf-cream">
      <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6 pb-28">

        {/* ================================================================
            SECTION 1: Welcome Header
            ================================================================ */}
        <div className="pt-2">
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-vf-navy">
            {getGreeting()}, {getFirstName(profile?.full_name)}
          </h1>
          <p className="text-sm text-vf-navy/60 mt-1">
            {format(new Date(), "EEEE, d MMMM yyyy")}
          </p>
        </div>

        {/* ================================================================
            SECTION 2: Stats Row
            ================================================================ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {/* Today's Events */}
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-vf-navy/50 uppercase tracking-wide">
                    Today's Events
                  </p>
                  <p className="text-3xl font-bold text-vf-navy mt-1">
                    {todaysEventCount}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-vf-gold/10 flex items-center justify-center">
                  <CalendarCheck className="w-5 h-5 text-vf-gold" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pipeline Value */}
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-vf-navy/50 uppercase tracking-wide">
                    Pipeline Value
                  </p>
                  <p className="text-3xl font-bold text-vf-navy mt-1">
                    {formatCurrency(pipelineValue)}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* New Inquiries */}
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-vf-navy/50 uppercase tracking-wide">
                    New Inquiries
                  </p>
                  <p className="text-3xl font-bold text-vf-navy mt-1">
                    {newInquiriesThisWeek}
                  </p>
                  <p className="text-[10px] text-vf-navy/40 mt-0.5">This week</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Inbox className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Deposits Due */}
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-vf-navy/50 uppercase tracking-wide">
                    Deposits Due
                  </p>
                  <p className="text-3xl font-bold text-vf-navy mt-1">
                    {depositsDueCount}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ================================================================
            Two-column layout (desktop) / single column (mobile)
            ================================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ================================================================
              SECTION 3: Today's Events
              ================================================================ */}
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-vf-navy flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-vf-gold" />
                Today's Events
                {todaysEventCount > 0 && (
                  <Badge variant="secondary" className="bg-vf-gold/10 text-vf-gold text-xs ml-auto">
                    {todaysEventCount}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todaysEvents.length === 0 ? (
                <div className="py-8 text-center">
                  <CalendarCheck className="w-8 h-8 text-vf-navy/20 mx-auto mb-2" />
                  <p className="text-sm text-vf-navy/40">No events scheduled today</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {todaysEvents.map((event: any) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-vf-cream/60
                        cursor-pointer transition-colors border-l-2 border-vf-gold"
                      onClick={() => navigate(`/reservation/functions/${event.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-vf-navy truncate">
                            {event.client_name}
                          </p>
                          {getStatusBadge(event.status)}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-vf-navy/50">
                          {event.room && (
                            <span className="flex items-center gap-1">
                              <Utensils className="w-3 h-3" />
                              {event.room}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {event.party_size} pax
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {event.start_time?.slice(0, 5)}
                            {event.end_time ? ` - ${event.end_time.slice(0, 5)}` : ""}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-vf-navy/30 flex-shrink-0 ml-2" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ================================================================
              SECTION 4: Overdue Follow-ups
              ================================================================ */}
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-vf-navy flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-vf-rose" />
                Overdue Follow-ups
                {overdueFollowUps.length > 0 && (
                  <Badge variant="secondary" className="bg-vf-rose/10 text-vf-rose text-xs ml-auto">
                    {overdueFollowUps.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {overdueFollowUps.length === 0 ? (
                <div className="py-8 text-center">
                  <AlertTriangle className="w-8 h-8 text-vf-navy/20 mx-auto mb-2" />
                  <p className="text-sm text-vf-navy/40">No overdue follow-ups</p>
                  <p className="text-xs text-vf-navy/30 mt-1">You're all caught up</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {overdueFollowUps.slice(0, 8).map((client: any) => {
                    const overdueDays = daysOverdue(client.next_follow_up);
                    return (
                      <div
                        key={client.id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-vf-cream/60
                          cursor-pointer transition-colors border-l-2 border-vf-rose"
                        onClick={() => navigate(`/reservation/functions/crm/${client.id}`)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-vf-navy truncate">
                            {client.contact_name}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-vf-navy/50">
                            {client.company_name && (
                              <span className="truncate">{client.company_name}</span>
                            )}
                            {client.last_contacted_at && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Last: {formatDistanceToNow(new Date(client.last_contacted_at), { addSuffix: true })}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end flex-shrink-0 ml-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              overdueDays >= 7
                                ? "bg-red-500/10 text-red-600 border-red-200"
                                : overdueDays >= 3
                                  ? "bg-amber-500/10 text-amber-600 border-amber-200"
                                  : "bg-orange-500/10 text-orange-600 border-orange-200"
                            }`}
                          >
                            {overdueDays}d overdue
                          </Badge>
                          {client.pipeline_stage && (
                            <span className="mt-1">
                              {getStageBadge(client.pipeline_stage)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {overdueFollowUps.length > 8 && (
                    <Button
                      variant="ghost"
                      className="w-full text-xs text-vf-navy/50 hover:text-vf-navy"
                      onClick={() => navigate("/reservation/venueflow/pipeline")}
                    >
                      View all {overdueFollowUps.length} overdue
                      <ArrowUpRight className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ================================================================
            SECTION 5: Recent Activity Feed
            ================================================================ */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-vf-navy flex items-center gap-2">
              <Activity className="w-4 h-4 text-vf-sage" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingActivities ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-vf-navy/30" />
              </div>
            ) : recentActivities.length === 0 ? (
              <div className="py-8 text-center">
                <Activity className="w-8 h-8 text-vf-navy/20 mx-auto mb-2" />
                <p className="text-sm text-vf-navy/40">No recent activity</p>
                <p className="text-xs text-vf-navy/30 mt-1">
                  Activity will appear here as you log calls, emails, and notes
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {recentActivities.map((activity: any) => {
                  const client = activity.client_id
                    ? clientMap.get(activity.client_id)
                    : null;
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-vf-cream/40
                        cursor-pointer transition-colors"
                      onClick={() => {
                        if (activity.client_id) {
                          navigate(`/reservation/functions/crm/${activity.client_id}`);
                        }
                      }}
                    >
                      <div className="w-8 h-8 rounded-full bg-vf-cream flex items-center justify-center flex-shrink-0 mt-0.5">
                        {getActivityIcon(activity.note_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-vf-navy leading-snug">
                          {client && (
                            <span className="font-semibold">{client.contact_name}: </span>
                          )}
                          <span className="text-vf-navy/70">{activity.note}</span>
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {activity.note_type && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] bg-vf-navy/5 text-vf-navy/50"
                            >
                              {activity.note_type}
                            </Badge>
                          )}
                          <span className="text-[10px] text-vf-navy/40">
                            {formatDistanceToNow(new Date(activity.created_at), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ==================================================================
          SECTION 6: Quick Actions FAB
          ================================================================== */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Expanded quick actions */}
        {fabOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => setFabOpen(false)}
            />

            {/* Action buttons */}
            <div className="absolute bottom-16 right-0 z-50 space-y-2 animate-fade-in">
              {/* Quick Proposal */}
              <button
                onClick={() => {
                  setFabOpen(false);
                  navigate("/reservation/functions/proposals/new");
                }}
                className="flex items-center gap-3 bg-white shadow-lg rounded-full pl-4 pr-5 py-2.5
                  hover:bg-vf-cream transition-colors whitespace-nowrap"
              >
                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-vf-navy">Quick Proposal</span>
              </button>

              {/* Log Call */}
              <button
                onClick={() => {
                  setFabOpen(false);
                  toast.info("Call logging coming soon");
                }}
                className="flex items-center gap-3 bg-white shadow-lg rounded-full pl-4 pr-5 py-2.5
                  hover:bg-vf-cream transition-colors whitespace-nowrap"
              >
                <div className="w-8 h-8 rounded-full bg-vf-sage/10 flex items-center justify-center">
                  <PhoneCall className="w-4 h-4 text-vf-sage" />
                </div>
                <span className="text-sm font-medium text-vf-navy">Log Call</span>
              </button>

              {/* New Inquiry */}
              <button
                onClick={() => {
                  setFabOpen(false);
                  navigate("/reservation/venueflow/pipeline?action=add");
                }}
                className="flex items-center gap-3 bg-white shadow-lg rounded-full pl-4 pr-5 py-2.5
                  hover:bg-vf-cream transition-colors whitespace-nowrap"
              >
                <div className="w-8 h-8 rounded-full bg-vf-gold/10 flex items-center justify-center">
                  <Inbox className="w-4 h-4 text-vf-gold" />
                </div>
                <span className="text-sm font-medium text-vf-navy">New Inquiry</span>
              </button>
            </div>
          </>
        )}

        {/* FAB Button */}
        <button
          onClick={() => setFabOpen(!fabOpen)}
          className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center
            transition-all duration-200 ${
              fabOpen
                ? "bg-vf-navy text-white rotate-45 z-50"
                : "bg-vf-gold text-white hover:bg-vf-gold-light hover:shadow-xl"
            }`}
        >
          {fabOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Plus className="w-6 h-6" />
          )}
        </button>
      </div>
    </div>
  );
};

export default VFDashboard;
