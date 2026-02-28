import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  differenceInDays,
  parseISO,
} from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  CreditCard,
  Target,
  Loader2,
  Users,
  Repeat,
  ArrowRightLeft,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  VF_PIPELINE_STAGES,
  type VFPipelineStage,
  type VFLeadSource,
} from "@/lib/shared/types/venueflow.types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type DateRangePreset = "month" | "quarter" | "year" | "all";

const DATE_RANGE_OPTIONS: { value: DateRangePreset; label: string }[] = [
  { value: "month", label: "This Month" },
  { value: "quarter", label: "This Quarter" },
  { value: "year", label: "This Year" },
  { value: "all", label: "All Time" },
];

const VF_NAVY = "#1B2A4A";
const VF_GOLD = "#C9A96E";
const VF_SAGE = "#7A8B6F";

const LEAD_SOURCE_COLORS: Record<string, string> = {
  DIRECT: VF_NAVY,
  WIDGET: VF_GOLD,
  ENGINE: "#6366f1",
  REFERRAL: "#059669",
  PHONE: "#2563eb",
  WALK_IN: "#d97706",
  EMAIL: "#9333ea",
};

const LEAD_SOURCE_LABELS: Record<string, string> = {
  DIRECT: "Direct",
  WIDGET: "Widget",
  ENGINE: "Engine",
  REFERRAL: "Referral",
  PHONE: "Phone",
  WALK_IN: "Walk-in",
  EMAIL: "Email",
};

const FUNNEL_STAGES: VFPipelineStage[] = [
  "INQUIRY",
  "SITE_VISIT",
  "PROPOSAL",
  "DEPOSIT",
  "CONFIRMED",
  "COMPLETED",
];

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

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
  return `$${value.toLocaleString()}`;
}

function getDateRange(preset: DateRangePreset): { start: string; end: string } | null {
  const now = new Date();
  switch (preset) {
    case "month":
      return {
        start: format(startOfMonth(now), "yyyy-MM-dd"),
        end: format(endOfMonth(now), "yyyy-MM-dd"),
      };
    case "quarter":
      return {
        start: format(startOfQuarter(now), "yyyy-MM-dd"),
        end: format(endOfQuarter(now), "yyyy-MM-dd"),
      };
    case "year":
      return {
        start: format(startOfYear(now), "yyyy-MM-dd"),
        end: format(endOfYear(now), "yyyy-MM-dd"),
      };
    case "all":
      return null;
  }
}

// ---------------------------------------------------------------------------
// Component: VFAnalytics
// ---------------------------------------------------------------------------

const VFAnalytics: React.FC = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const [dateRange, setDateRange] = useState<DateRangePreset>("quarter");

  const range = getDateRange(dateRange);

  // -----------------------------------------------------------------------
  // Query: Pipeline clients
  // -----------------------------------------------------------------------
  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ["vf_analytics_clients", orgId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("res_function_clients")
        .select("*")
        .eq("org_id", orgId!);
      if (error) {
        console.error("Error fetching clients:", error);
        toast.error("Failed to load client data");
        return [];
      }
      return data ?? [];
    },
    enabled: !!orgId,
  });

  // -----------------------------------------------------------------------
  // Query: Functions (events)
  // -----------------------------------------------------------------------
  const { data: functions = [], isLoading: loadingFunctions } = useQuery({
    queryKey: ["vf_analytics_functions", orgId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("res_functions")
        .select("*")
        .eq("org_id", orgId!);
      if (error) {
        console.error("Error fetching functions:", error);
        return [];
      }
      return data ?? [];
    },
    enabled: !!orgId,
  });

  // -----------------------------------------------------------------------
  // Query: Venue spaces
  // -----------------------------------------------------------------------
  const { data: venueSpaces = [], isLoading: loadingSpaces } = useQuery({
    queryKey: ["vf_analytics_spaces", orgId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("res_venue_spaces")
        .select("*")
        .eq("org_id", orgId!)
        .eq("is_active", true)
        .order("sort_order");
      if (error) {
        console.error("Error fetching venue spaces:", error);
        return [];
      }
      return data ?? [];
    },
    enabled: !!orgId,
  });

  // -----------------------------------------------------------------------
  // Query: Referrals
  // -----------------------------------------------------------------------
  const { data: referrals = [], isLoading: loadingReferrals } = useQuery({
    queryKey: ["vf_analytics_referrals", orgId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("vf_referrals")
        .select("*")
        .eq("org_id", orgId!);
      if (error) {
        console.warn("Referrals query error (table may not exist):", error.message);
        return [];
      }
      return data ?? [];
    },
    enabled: !!orgId,
  });

  // -----------------------------------------------------------------------
  // Filter by date range
  // -----------------------------------------------------------------------
  const filteredClients = useMemo(() => {
    if (!range) return clients;
    return clients.filter((c: any) => {
      const created = c.created_at?.slice(0, 10);
      if (!created) return false;
      return created >= range.start && created <= range.end;
    });
  }, [clients, range]);

  const filteredFunctions = useMemo(() => {
    if (!range) return functions;
    return functions.filter((f: any) => {
      const eventDate = f.event_date;
      if (!eventDate) return false;
      return eventDate >= range.start && eventDate <= range.end;
    });
  }, [functions, range]);

  const filteredReferrals = useMemo(() => {
    if (!range) return referrals;
    return referrals.filter((r: any) => {
      const created = r.created_at?.slice(0, 10);
      if (!created) return false;
      return created >= range.start && created <= range.end;
    });
  }, [referrals, range]);

  // -----------------------------------------------------------------------
  // Revenue Metrics
  // -----------------------------------------------------------------------
  const metrics = useMemo(() => {
    const activePipeline = ["INQUIRY", "SITE_VISIT", "PROPOSAL", "DEPOSIT", "CONFIRMED", "PRE_EVENT", "EVENT_DAY"];
    const activeClients = filteredClients.filter((c: any) => activePipeline.includes(c.pipeline_stage));

    const pipelineValue = filteredFunctions.reduce(
      (sum: number, f: any) => sum + (Number(f.quoted_total) || 0),
      0,
    );

    const confirmedFunctions = filteredFunctions.filter((f: any) => {
      // Match functions to confirmed clients
      const client = clients.find((c: any) => c.id === f.client_id);
      return client?.pipeline_stage === "CONFIRMED" || f.status === "CONFIRMED";
    });
    const confirmedRevenue = confirmedFunctions.reduce(
      (sum: number, f: any) => sum + (Number(f.quoted_total) || 0),
      0,
    );

    const depositClients = filteredClients.filter(
      (c: any) => c.pipeline_stage === "DEPOSIT" || c.pipeline_stage === "CONFIRMED" || c.pipeline_stage === "COMPLETED",
    );
    const collectedDeposits = depositClients.reduce(
      (sum: number, c: any) => sum + (Number(c.deposit_paid) || 0),
      0,
    );

    const allQuotedTotals = filteredFunctions
      .map((f: any) => Number(f.quoted_total) || 0)
      .filter((v: number) => v > 0);
    const avgDealSize =
      allQuotedTotals.length > 0
        ? allQuotedTotals.reduce((a: number, b: number) => a + b, 0) / allQuotedTotals.length
        : 0;

    return { pipelineValue, confirmedRevenue, collectedDeposits, avgDealSize };
  }, [filteredClients, filteredFunctions, clients]);

  // -----------------------------------------------------------------------
  // Conversion Funnel
  // -----------------------------------------------------------------------
  const funnelData = useMemo(() => {
    // Use all clients (not just filtered) for funnel - shows cumulative progression
    const stageCounts: Record<string, number> = {};
    FUNNEL_STAGES.forEach((s) => (stageCounts[s] = 0));

    // Count clients at or past each stage
    const stageOrder = FUNNEL_STAGES;
    clients.forEach((c: any) => {
      const clientStageIdx = stageOrder.indexOf(c.pipeline_stage as VFPipelineStage);
      // A client at CONFIRMED has passed through INQUIRY, SITE_VISIT, PROPOSAL, DEPOSIT
      stageOrder.forEach((stage, idx) => {
        if (clientStageIdx >= idx) {
          stageCounts[stage] = (stageCounts[stage] || 0) + 1;
        }
      });
      // Also count stages beyond the funnel
      if (c.pipeline_stage === "PRE_EVENT" || c.pipeline_stage === "EVENT_DAY" || c.pipeline_stage === "POST_EVENT") {
        stageOrder.forEach((stage) => {
          stageCounts[stage] = (stageCounts[stage] || 0) + 1;
        });
      }
    });

    return stageOrder.map((stage, idx) => {
      const config = VF_PIPELINE_STAGES.find((s) => s.value === stage);
      const count = stageCounts[stage] || 0;
      const prevCount = idx > 0 ? stageCounts[stageOrder[idx - 1]] || 1 : count;
      const dropOff = idx > 0 && prevCount > 0 ? Math.round(((prevCount - count) / prevCount) * 100) : 0;
      return {
        name: config?.label || stage,
        count,
        dropOff,
        fill: VF_GOLD,
      };
    });
  }, [clients]);

  // -----------------------------------------------------------------------
  // Revenue Over Time (last 12 months)
  // -----------------------------------------------------------------------
  const revenueOverTime = useMemo(() => {
    const months: { month: string; label: string; revenue: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = subMonths(now, i);
      const monthKey = format(d, "yyyy-MM");
      const label = format(d, "MMM yy");
      months.push({ month: monthKey, label, revenue: 0 });
    }

    functions.forEach((f: any) => {
      if (!f.event_date) return;
      const isCompleted =
        f.status === "COMPLETED" ||
        f.status === "CONFIRMED" ||
        f.status === "DEPOSIT_PAID";
      if (!isCompleted) return;
      const monthKey = f.event_date.slice(0, 7);
      const entry = months.find((m) => m.month === monthKey);
      if (entry) {
        entry.revenue += Number(f.quoted_total) || 0;
      }
    });

    return months;
  }, [functions]);

  // -----------------------------------------------------------------------
  // Room Utilisation
  // -----------------------------------------------------------------------
  const roomUtilisation = useMemo(() => {
    const spaceMap = new Map<string, any>();
    venueSpaces.forEach((s: any) => spaceMap.set(s.id, s));

    const roomData: Record<string, { bookings: number; revenue: number; name: string; color: string; maxCapacity: number }> = {};

    venueSpaces.forEach((s: any) => {
      roomData[s.id] = {
        bookings: 0,
        revenue: 0,
        name: s.name,
        color: s.color_code || "#94a3b8",
        maxCapacity: s.capacity_max || 100,
      };
    });

    filteredFunctions.forEach((f: any) => {
      if (f.venue_space_id && roomData[f.venue_space_id]) {
        roomData[f.venue_space_id].bookings += 1;
        roomData[f.venue_space_id].revenue += Number(f.quoted_total) || 0;
      }
    });

    // Calculate utilisation based on days in the period
    const periodDays = range
      ? differenceInDays(parseISO(range.end), parseISO(range.start)) + 1
      : 365;

    return Object.entries(roomData).map(([id, data]) => ({
      id,
      name: data.name,
      bookings: data.bookings,
      revenue: data.revenue,
      utilisation: Math.min(Math.round((data.bookings / periodDays) * 100), 100),
      color: data.color,
    }));
  }, [venueSpaces, filteredFunctions, range]);

  // -----------------------------------------------------------------------
  // Lead Source Breakdown
  // -----------------------------------------------------------------------
  const leadSourceData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredClients.forEach((c: any) => {
      const source = c.lead_source || "DIRECT";
      counts[source] = (counts[source] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([source, count]) => ({
        name: LEAD_SOURCE_LABELS[source] || source,
        value: count,
        color: LEAD_SOURCE_COLORS[source] || "#94a3b8",
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredClients]);

  // -----------------------------------------------------------------------
  // Pipeline Stage Distribution
  // -----------------------------------------------------------------------
  const pipelineDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredClients.forEach((c: any) => {
      const stage = c.pipeline_stage || "INQUIRY";
      counts[stage] = (counts[stage] || 0) + 1;
    });

    return VF_PIPELINE_STAGES.map((stage) => ({
      name: stage.label,
      count: counts[stage.value] || 0,
      fill: stage.value === "CONFIRMED"
        ? "#059669"
        : stage.value === "LOST"
          ? "#dc2626"
          : stage.value === "COMPLETED"
            ? "#64748b"
            : VF_GOLD,
    }));
  }, [filteredClients]);

  // -----------------------------------------------------------------------
  // Key Metrics Table
  // -----------------------------------------------------------------------
  const keyMetrics = useMemo(() => {
    // Avg days inquiry-to-proposal
    const inquiryToProposal: number[] = [];
    const proposalToDeposit: number[] = [];

    // Use activity log or approximate from client timestamps
    // Since we don't have detailed stage transition timestamps, approximate from created_at to updated_at
    const proposalClients = clients.filter(
      (c: any) =>
        ["PROPOSAL", "DEPOSIT", "CONFIRMED", "PRE_EVENT", "EVENT_DAY", "COMPLETED", "POST_EVENT"].includes(c.pipeline_stage),
    );
    proposalClients.forEach((c: any) => {
      if (c.created_at && c.updated_at) {
        const days = differenceInDays(parseISO(c.updated_at), parseISO(c.created_at));
        if (days > 0 && days < 365) inquiryToProposal.push(days);
      }
    });

    const depositClients = clients.filter(
      (c: any) =>
        ["DEPOSIT", "CONFIRMED", "PRE_EVENT", "EVENT_DAY", "COMPLETED", "POST_EVENT"].includes(c.pipeline_stage),
    );
    depositClients.forEach((c: any) => {
      if (c.created_at && c.updated_at) {
        const days = differenceInDays(parseISO(c.updated_at), parseISO(c.created_at));
        if (days > 0 && days < 365) proposalToDeposit.push(days);
      }
    });

    const avgInquiryToProposal =
      inquiryToProposal.length > 0
        ? Math.round(inquiryToProposal.reduce((a, b) => a + b, 0) / inquiryToProposal.length)
        : 0;

    const avgProposalToDeposit =
      proposalToDeposit.length > 0
        ? Math.round(proposalToDeposit.reduce((a, b) => a + b, 0) / proposalToDeposit.length)
        : 0;

    const totalCycleTime = avgInquiryToProposal + avgProposalToDeposit;

    // Repeat rate
    const repeatClients = clients.filter((c: any) => c.reactivated_from).length;
    const repeatRate = clients.length > 0 ? Math.round((repeatClients / clients.length) * 100) : 0;

    // Referral metrics
    const totalReferrals = referrals.length;
    const convertedReferrals = referrals.filter(
      (r: any) => r.status === "BOOKED" || r.status === "REWARDED",
    ).length;
    const referralConversionRate =
      totalReferrals > 0 ? Math.round((convertedReferrals / totalReferrals) * 100) : 0;

    return {
      avgInquiryToProposal,
      avgProposalToDeposit,
      totalCycleTime,
      repeatRate,
      repeatClients,
      totalReferrals,
      referralConversionRate,
    };
  }, [clients, referrals]);

  // -----------------------------------------------------------------------
  // Loading
  // -----------------------------------------------------------------------
  const isLoading = loadingClients || loadingFunctions || loadingSpaces;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-vf-gold mx-auto" />
          <p className="text-sm text-vf-navy/60">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-vf-cream">
      <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-vf-navy flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-vf-gold" />
            </div>
            <h1 className="text-xl lg:text-2xl font-display font-bold text-vf-navy">Analytics</h1>
          </div>

          {/* Date range selector */}
          <div className="flex rounded-lg border border-vf-navy/10 overflow-hidden">
            {DATE_RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDateRange(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  dateRange === opt.value
                    ? "bg-vf-navy text-white"
                    : "bg-white text-vf-navy/60 hover:bg-vf-cream"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Revenue Metrics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-vf-navy/50 uppercase tracking-wide">
                    Pipeline Value
                  </p>
                  <p className="text-2xl lg:text-3xl font-bold text-vf-navy mt-1">
                    {formatCompact(metrics.pipelineValue)}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-vf-gold/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-vf-gold" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-vf-navy/50 uppercase tracking-wide">
                    Confirmed Revenue
                  </p>
                  <p className="text-2xl lg:text-3xl font-bold text-vf-navy mt-1">
                    {formatCompact(metrics.confirmedRevenue)}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-vf-navy/50 uppercase tracking-wide">
                    Collected Deposits
                  </p>
                  <p className="text-2xl lg:text-3xl font-bold text-vf-navy mt-1">
                    {formatCompact(metrics.collectedDeposits)}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-vf-navy/50 uppercase tracking-wide">
                    Avg Deal Size
                  </p>
                  <p className="text-2xl lg:text-3xl font-bold text-vf-navy mt-1">
                    {formatCompact(metrics.avgDealSize)}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Two-column layout for charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Conversion Funnel */}
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-vf-navy">
                Conversion Funnel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={funnelData}
                    layout="vertical"
                    margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: VF_NAVY }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={80}
                      tick={{ fontSize: 11, fill: VF_NAVY }}
                    />
                    <Tooltip
                      wrapperClassName="rounded-md shadow-md"
                      contentStyle={{
                        border: "none",
                        fontSize: 12,
                      }}
                      formatter={(value: number, name: string) => [value, "Count"]}
                    />
                    <Bar dataKey="count" fill={VF_GOLD} radius={[0, 4, 4, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Drop-off labels */}
              <div className="flex flex-wrap gap-2 mt-2">
                {funnelData
                  .filter((d) => d.dropOff > 0)
                  .map((d) => (
                    <Badge
                      key={d.name}
                      variant="outline"
                      className="text-[10px] text-vf-navy/50"
                    >
                      {d.name}: -{d.dropOff}% drop-off
                    </Badge>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Revenue Over Time */}
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-vf-navy">
                Revenue Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={revenueOverTime}
                    margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: VF_NAVY }}
                      interval={1}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: VF_NAVY }}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      wrapperClassName="rounded-md shadow-md"
                      contentStyle={{
                        border: "none",
                        fontSize: 12,
                      }}
                      formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                    />
                    <defs>
                      <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={VF_GOLD} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={VF_GOLD} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke={VF_GOLD}
                      strokeWidth={2}
                      fill="url(#goldGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Room Utilisation */}
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-vf-navy">
                Room Utilisation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {roomUtilisation.length === 0 ? (
                <div className="py-8 text-center text-sm text-vf-navy/40">
                  No venue spaces configured.
                </div>
              ) : (
                <div className="space-y-3">
                  {roomUtilisation.map((room) => (
                    <div key={room.id}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: room.color }}
                          />
                          <span className="text-xs font-medium text-vf-navy">{room.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-vf-navy/50">
                          <span>{room.bookings} bookings</span>
                          <span>{formatCompact(room.revenue)}</span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-vf-navy/5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${room.utilisation}%`,
                            backgroundColor: room.color,
                          }}
                        />
                      </div>
                      <p className="text-[10px] text-vf-navy/40 text-right mt-0.5">
                        {room.utilisation}% utilised
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lead Source Breakdown */}
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-vf-navy">
                Lead Source Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leadSourceData.length === 0 ? (
                <div className="py-8 text-center text-sm text-vf-navy/40">No lead data yet.</div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="h-[200px] w-[200px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={leadSourceData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {leadSourceData.map((entry, idx) => (
                            <Cell key={idx} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          wrapperClassName="rounded-md shadow-md"
                          contentStyle={{
                            border: "none",
                            fontSize: 12,
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {leadSourceData.map((source) => (
                      <div key={source.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: source.color }}
                          />
                          <span className="text-xs text-vf-navy">{source.name}</span>
                        </div>
                        <span className="text-xs font-semibold text-vf-navy">{source.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pipeline Stage Distribution (full width) */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-vf-navy">
              Pipeline Stage Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={pipelineDistribution}
                  margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: VF_NAVY }}
                    angle={-30}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 10, fill: VF_NAVY }} />
                  <Tooltip
                    wrapperClassName="rounded-md shadow-md"
                    contentStyle={{
                      border: "none",
                      fontSize: 12,
                    }}
                    formatter={(value: number) => [value, "Clients"]}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={32}>
                    {pipelineDistribution.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics Table */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-vf-navy">Key Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-vf-cream/50">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-vf-gold" />
                  <p className="text-[10px] font-medium text-vf-navy/50 uppercase tracking-wide">
                    Avg Inquiry to Proposal
                  </p>
                </div>
                <p className="text-xl font-bold text-vf-navy">
                  {keyMetrics.avgInquiryToProposal}{" "}
                  <span className="text-xs font-normal text-vf-navy/50">days</span>
                </p>
              </div>

              <div className="p-3 rounded-lg bg-vf-cream/50">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-vf-gold" />
                  <p className="text-[10px] font-medium text-vf-navy/50 uppercase tracking-wide">
                    Avg Proposal to Deposit
                  </p>
                </div>
                <p className="text-xl font-bold text-vf-navy">
                  {keyMetrics.avgProposalToDeposit}{" "}
                  <span className="text-xs font-normal text-vf-navy/50">days</span>
                </p>
              </div>

              <div className="p-3 rounded-lg bg-vf-cream/50">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-vf-sage" />
                  <p className="text-[10px] font-medium text-vf-navy/50 uppercase tracking-wide">
                    Total Cycle Time
                  </p>
                </div>
                <p className="text-xl font-bold text-vf-navy">
                  {keyMetrics.totalCycleTime}{" "}
                  <span className="text-xs font-normal text-vf-navy/50">days</span>
                </p>
              </div>

              <div className="p-3 rounded-lg bg-vf-cream/50">
                <div className="flex items-center gap-2 mb-1">
                  <Repeat className="w-3.5 h-3.5 text-vf-gold" />
                  <p className="text-[10px] font-medium text-vf-navy/50 uppercase tracking-wide">
                    Repeat Rate
                  </p>
                </div>
                <p className="text-xl font-bold text-vf-navy">
                  {keyMetrics.repeatRate}%{" "}
                  <span className="text-xs font-normal text-vf-navy/50">
                    ({keyMetrics.repeatClients} clients)
                  </span>
                </p>
              </div>

              <div className="p-3 rounded-lg bg-vf-cream/50">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-3.5 h-3.5 text-vf-sage" />
                  <p className="text-[10px] font-medium text-vf-navy/50 uppercase tracking-wide">
                    Total Referrals
                  </p>
                </div>
                <p className="text-xl font-bold text-vf-navy">{keyMetrics.totalReferrals}</p>
              </div>

              <div className="p-3 rounded-lg bg-vf-cream/50">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  <p className="text-[10px] font-medium text-vf-navy/50 uppercase tracking-wide">
                    Referral Conversion
                  </p>
                </div>
                <p className="text-xl font-bold text-vf-navy">
                  {keyMetrics.referralConversionRate}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VFAnalytics;
