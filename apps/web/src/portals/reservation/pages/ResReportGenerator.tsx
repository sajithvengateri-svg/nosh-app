import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import {
  fetchReservationMetrics,
  fetchChannelBreakdown,
  fetchTablePerformance,
} from "@/lib/shared/queries/resQueries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Download,
  FileBarChart,
  Printer,
  Copy,
  Filter,
} from "lucide-react";
import {
  format,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
} from "date-fns";
import ReportMetricCard from "../components/report/ReportMetricCard";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DatePreset = "today" | "this_week" | "this_month" | "last_month" | "custom";
type ServicePeriod = "all" | "breakfast" | "lunch" | "dinner";

interface Reservation {
  id: string;
  status: string;
  party_size: number;
  channel: string;
  turn_time_minutes: number | null;
  date: string;
  time: string;
  table_id: string | null;
}

interface ChannelRow {
  channel: string;
  status: string;
}

interface TableRow {
  table_id: string;
  turn_time_minutes: number | null;
  party_size: number;
  status: string;
  res_tables: { name: string } | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHANNELS = [
  "WEBSITE",
  "PHONE",
  "WALK_IN",
  "GOOGLE_RESERVE",
  "VOICE_AI",
  "IN_PERSON",
] as const;

const CHANNEL_LABELS: Record<string, string> = {
  WEBSITE: "Website",
  PHONE: "Phone",
  WALK_IN: "Walk-in",
  GOOGLE_RESERVE: "Google Reserve",
  VOICE_AI: "Voice AI",
  IN_PERSON: "In Person",
};

const CHANNEL_COLORS: Record<string, string> = {
  WEBSITE: "bg-blue-500",
  PHONE: "bg-indigo-500",
  WALK_IN: "bg-amber-500",
  GOOGLE_RESERVE: "bg-green-500",
  VOICE_AI: "bg-purple-500",
  IN_PERSON: "bg-rose-500",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeDateRange(preset: DatePreset): { start: Date; end: Date } {
  const today = new Date();
  switch (preset) {
    case "today":
      return { start: today, end: today };
    case "this_week":
      return { start: startOfWeek(today, { weekStartsOn: 1 }), end: endOfWeek(today, { weekStartsOn: 1 }) };
    case "this_month":
      return { start: startOfMonth(today), end: endOfMonth(today) };
    case "last_month": {
      const lm = subMonths(today, 1);
      return { start: startOfMonth(lm), end: endOfMonth(lm) };
    }
    case "custom":
    default:
      return { start: subDays(today, 7), end: today };
  }
}

function computePreviousRange(start: Date, end: Date): { start: Date; end: Date } {
  const diff = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - diff);
  return { start: prevStart, end: prevEnd };
}

function buildCsvString(headers: string[], rows: string[][]): string {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [headers.map(escape).join(",")];
  for (const row of rows) {
    lines.push(row.map(escape).join(","));
  }
  return lines.join("\n");
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ResReportGenerator: React.FC = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;

  const [preset, setPreset] = useState<DatePreset>("this_week");
  const [servicePeriod, setServicePeriod] = useState<ServicePeriod>("all");

  // Date ranges
  const { start: rangeStart, end: rangeEnd } = useMemo(() => computeDateRange(preset), [preset]);
  const startStr = format(rangeStart, "yyyy-MM-dd");
  const endStr = format(rangeEnd, "yyyy-MM-dd");

  const { start: prevStart, end: prevEnd } = useMemo(
    () => computePreviousRange(rangeStart, rangeEnd),
    [rangeStart, rangeEnd],
  );
  const prevStartStr = format(prevStart, "yyyy-MM-dd");
  const prevEndStr = format(prevEnd, "yyyy-MM-dd");

  // ── Queries ──────────────────────────────────────
  const { data: metricsData, isLoading: metricsLoading } = useQuery({
    queryKey: ["res_report_metrics", orgId, startStr, endStr, servicePeriod],
    queryFn: async () => {
      const { data } = await fetchReservationMetrics(orgId!, startStr, endStr, servicePeriod);
      return (data ?? []) as Reservation[];
    },
    enabled: !!orgId,
  });

  const { data: prevMetricsData } = useQuery({
    queryKey: ["res_report_metrics_prev", orgId, prevStartStr, prevEndStr, servicePeriod],
    queryFn: async () => {
      const { data } = await fetchReservationMetrics(orgId!, prevStartStr, prevEndStr, servicePeriod);
      return (data ?? []) as Reservation[];
    },
    enabled: !!orgId,
  });

  const { data: channelData } = useQuery({
    queryKey: ["res_channel_breakdown", orgId, startStr, endStr],
    queryFn: async () => {
      const { data } = await fetchChannelBreakdown(orgId!, startStr, endStr);
      return (data ?? []) as ChannelRow[];
    },
    enabled: !!orgId,
  });

  const { data: tableData } = useQuery({
    queryKey: ["res_table_performance", orgId, startStr, endStr],
    queryFn: async () => {
      const { data } = await fetchTablePerformance(orgId!, startStr, endStr);
      return (data ?? []) as TableRow[];
    },
    enabled: !!orgId,
  });

  // ── Computed Metrics ──────────────────────────────
  const metrics = useMemo(() => {
    const reservations = metricsData ?? [];
    const total = reservations.length;
    const totalCovers = reservations.reduce((s, r) => s + (r.party_size ?? 0), 0);
    const walkIns = reservations.filter((r) => r.channel === "WALK_IN").length;
    const noShows = reservations.filter((r) => r.status === "NO_SHOW").length;
    const noShowRate = total > 0 ? (noShows / total) * 100 : 0;
    const completed = reservations.filter((r) => r.status === "COMPLETED");
    const cancelled = reservations.filter((r) => r.status === "CANCELLED").length;
    const completedCount = completed.length;
    const turnTimes = completed
      .filter((r) => r.turn_time_minutes != null)
      .map((r) => r.turn_time_minutes!);
    const avgTurnTime = turnTimes.length > 0
      ? Math.round(turnTimes.reduce((a, b) => a + b, 0) / turnTimes.length)
      : 0;

    return { total, totalCovers, walkIns, noShows, noShowRate, completedCount, cancelled, avgTurnTime };
  }, [metricsData]);

  const prevMetrics = useMemo(() => {
    const reservations = prevMetricsData ?? [];
    const total = reservations.length;
    const totalCovers = reservations.reduce((s, r) => s + (r.party_size ?? 0), 0);
    const walkIns = reservations.filter((r) => r.channel === "WALK_IN").length;
    const noShows = reservations.filter((r) => r.status === "NO_SHOW").length;
    const noShowRate = total > 0 ? (noShows / total) * 100 : 0;
    const completed = reservations.filter((r) => r.status === "COMPLETED");
    const turnTimes = completed
      .filter((r) => r.turn_time_minutes != null)
      .map((r) => r.turn_time_minutes!);
    const avgTurnTime = turnTimes.length > 0
      ? Math.round(turnTimes.reduce((a, b) => a + b, 0) / turnTimes.length)
      : 0;

    return { total, totalCovers, walkIns, noShows, noShowRate, avgTurnTime };
  }, [prevMetricsData]);

  // ── Channel Breakdown ─────────────────────────────
  const channelBreakdown = useMemo(() => {
    const rows = channelData ?? [];
    const counts: Record<string, number> = {};
    for (const ch of CHANNELS) counts[ch] = 0;
    for (const r of rows) {
      const ch = r.channel ?? "WEBSITE";
      counts[ch] = (counts[ch] ?? 0) + 1;
    }
    const total = rows.length || 1;
    return CHANNELS.map((ch) => ({
      channel: ch,
      label: CHANNEL_LABELS[ch] ?? ch,
      count: counts[ch] ?? 0,
      pct: (((counts[ch] ?? 0) / total) * 100).toFixed(1),
      color: CHANNEL_COLORS[ch] ?? "bg-gray-400",
    }));
  }, [channelData]);

  // ── Table Performance ─────────────────────────────
  const { topTables, bottomTables } = useMemo(() => {
    const rows = tableData ?? [];
    const map: Record<string, { name: string; covers: number; turnTimes: number[] }> = {};
    for (const r of rows) {
      if (!r.table_id) continue;
      if (!map[r.table_id]) {
        map[r.table_id] = {
          name: r.res_tables?.name ?? r.table_id,
          covers: 0,
          turnTimes: [],
        };
      }
      map[r.table_id].covers += r.party_size ?? 0;
      if (r.turn_time_minutes != null) {
        map[r.table_id].turnTimes.push(r.turn_time_minutes);
      }
    }

    const sorted = Object.values(map)
      .map((t) => ({
        ...t,
        avgTurnTime: t.turnTimes.length > 0
          ? Math.round(t.turnTimes.reduce((a, b) => a + b, 0) / t.turnTimes.length)
          : 0,
      }))
      .sort((a, b) => b.covers - a.covers);

    return {
      topTables: sorted.slice(0, 5),
      bottomTables: sorted.length > 5 ? sorted.slice(-5).reverse() : [],
    };
  }, [tableData]);

  // ── Export Handlers ───────────────────────────────
  const handlePrint = () => window.print();

  const handleCsvDownload = () => {
    const headers = [
      "Metric",
      "Value",
    ];
    const rows: string[][] = [
      ["Total Reservations", String(metrics.total)],
      ["Total Covers", String(metrics.totalCovers)],
      ["Walk-ins", String(metrics.walkIns)],
      ["No-Shows", String(metrics.noShows)],
      ["No-Show Rate", `${metrics.noShowRate.toFixed(1)}%`],
      ["Avg Turn Time (min)", String(metrics.avgTurnTime)],
      ["Completed", String(metrics.completedCount)],
      ["Cancelled", String(metrics.cancelled)],
      ...channelBreakdown.map((ch) => [`Channel: ${ch.label}`, String(ch.count)]),
      ...topTables.map((t) => [`Table: ${t.name} (covers)`, String(t.covers)]),
    ];
    const csv = buildCsvString(headers, rows);
    downloadCsv(csv, `report-${startStr}-${endStr}.csv`);
  };

  const handleCopyClipboard = async () => {
    const lines = [
      `Report: ${format(rangeStart, "MMM d, yyyy")} - ${format(rangeEnd, "MMM d, yyyy")}`,
      `Service Period: ${servicePeriod === "all" ? "All" : servicePeriod}`,
      "",
      `Total Reservations: ${metrics.total}`,
      `Total Covers: ${metrics.totalCovers}`,
      `Walk-ins: ${metrics.walkIns}`,
      `No-Shows: ${metrics.noShows} (${metrics.noShowRate.toFixed(1)}%)`,
      `Avg Turn Time: ${metrics.avgTurnTime} min`,
      `Completed: ${metrics.completedCount}`,
      `Cancelled: ${metrics.cancelled}`,
      "",
      "Channel Breakdown:",
      ...channelBreakdown.map((ch) => `  ${ch.label}: ${ch.count} (${ch.pct}%)`),
    ];
    await navigator.clipboard.writeText(lines.join("\n"));
  };

  // ── Render ────────────────────────────────────────
  if (!orgId) return null;

  return (
    <div className="flex flex-col gap-6 pb-20">
      {/* Page Header */}
      <div className="flex items-center gap-2">
        <FileBarChart className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-semibold">Report Generator</h1>
      </div>

      {/* Controls Bar */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Select value={preset} onValueChange={(v) => setPreset(v as DatePreset)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this_week">This Week</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={servicePeriod} onValueChange={(v) => setServicePeriod(v as ServicePeriod)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Service period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Badge variant="outline" className="ml-auto text-xs">
            {format(rangeStart, "MMM d")} &ndash; {format(rangeEnd, "MMM d, yyyy")}
          </Badge>
        </CardContent>
      </Card>

      {metricsLoading ? (
        <p className="text-sm text-muted-foreground">Loading report data...</p>
      ) : (
        <>
          {/* Volume Summary */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Volume Summary
            </h2>
            <div className="flex flex-wrap gap-3">
              <ReportMetricCard
                label="Reservations"
                value={metrics.total}
                previousValue={prevMetrics.total}
                icon={<Calendar className="w-3.5 h-3.5" />}
                format="number"
              />
              <ReportMetricCard
                label="Covers"
                value={metrics.totalCovers}
                previousValue={prevMetrics.totalCovers}
                icon={<Calendar className="w-3.5 h-3.5" />}
                format="number"
              />
              <ReportMetricCard
                label="Walk-ins"
                value={metrics.walkIns}
                previousValue={prevMetrics.walkIns}
                icon={<Calendar className="w-3.5 h-3.5" />}
                format="number"
              />
              <ReportMetricCard
                label="No-Shows"
                value={metrics.noShows}
                previousValue={prevMetrics.noShows}
                icon={<Calendar className="w-3.5 h-3.5" />}
                format="number"
              />
              <ReportMetricCard
                label="No-Show Rate"
                value={metrics.noShowRate}
                previousValue={prevMetrics.noShowRate}
                icon={<Calendar className="w-3.5 h-3.5" />}
                format="percentage"
              />
            </div>
          </section>

          {/* Efficiency Metrics */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Efficiency Metrics
            </h2>
            <div className="flex flex-wrap gap-3">
              <ReportMetricCard
                label="Avg Turn Time"
                value={metrics.avgTurnTime}
                previousValue={prevMetrics.avgTurnTime}
                icon={<Calendar className="w-3.5 h-3.5" />}
                format="minutes"
              />
              <ReportMetricCard
                label="Completed"
                value={metrics.completedCount}
                icon={<Calendar className="w-3.5 h-3.5" />}
                format="number"
              />
              <ReportMetricCard
                label="Cancelled"
                value={metrics.cancelled}
                icon={<Calendar className="w-3.5 h-3.5" />}
                format="number"
              />
            </div>
          </section>

          {/* Channel Breakdown */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Channel Breakdown
            </h2>
            <Card>
              <CardContent className="p-4 flex flex-col gap-3">
                {channelBreakdown.map((ch) => {
                  const maxCount = Math.max(...channelBreakdown.map((c) => c.count), 1);
                  const widthPct = (ch.count / maxCount) * 100;
                  return (
                    <div key={ch.channel} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-28 shrink-0 truncate">
                        {ch.label}
                      </span>
                      <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                        <div
                          className={`${ch.color} h-full rounded transition-all`}
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium w-16 text-right">
                        {ch.count} ({ch.pct}%)
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </section>

          {/* Table Performance */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Table Performance
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Top 5 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Top 5 Tables by Covers</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {topTables.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No table data available</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {topTables.map((t, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-sm border-b last:border-0 pb-1"
                        >
                          <span className="font-medium">{t.name}</span>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{t.covers} covers</span>
                            <span>{t.avgTurnTime} min avg</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Bottom 5 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Bottom 5 Tables by Covers</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {bottomTables.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Not enough data for bottom 5</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {bottomTables.map((t, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-sm border-b last:border-0 pb-1"
                        >
                          <span className="font-medium">{t.name}</span>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{t.covers} covers</span>
                            <span>{t.avgTurnTime} min avg</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>
        </>
      )}

      {/* Export Bar (sticky bottom) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t px-4 py-3 flex items-center justify-end gap-2 print:hidden">
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-1.5" />
          Print
        </Button>
        <Button variant="outline" size="sm" onClick={handleCsvDownload}>
          <Download className="w-4 h-4 mr-1.5" />
          CSV
        </Button>
        <Button variant="outline" size="sm" onClick={handleCopyClipboard}>
          <Copy className="w-4 h-4 mr-1.5" />
          Copy
        </Button>
      </div>
    </div>
  );
};

export default ResReportGenerator;
