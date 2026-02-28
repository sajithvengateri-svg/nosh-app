import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import {
  fetchEfficiencySnapshots,
  fetchLatestEfficiencySnapshot,
} from "@/lib/shared/queries/resQueries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  Users,
  Clock,
  BarChart3,
} from "lucide-react";
import { format, subWeeks, addWeeks, startOfWeek, endOfWeek } from "date-fns";
import ReportMetricCard from "../components/report/ReportMetricCard";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AiRecommendation {
  type: "suggestion" | "warning";
  title: string;
  description: string;
}

interface PeriodBreakdown {
  period: string;
  covers: number;
  avg_turn_time: number;
}

interface ChannelBreakdownItem {
  channel: string;
  count: number;
}

interface EfficiencySnapshot {
  id: string;
  org_id: string;
  week_start: string;
  efficiency_score: number;
  total_covers: number;
  avg_turn_time: number;
  no_show_rate: number;
  occupancy_rate: number;
  ai_recommendations: AiRecommendation[] | null;
  period_breakdown: PeriodBreakdown[] | null;
  channel_breakdown: ChannelBreakdownItem[] | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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

function scoreColor(score: number): string {
  if (score > 70) return "text-green-600";
  if (score >= 50) return "text-amber-500";
  return "text-red-600";
}

function scoreBorderColor(score: number): string {
  if (score > 70) return "border-green-500";
  if (score >= 50) return "border-amber-500";
  return "border-red-500";
}

function scoreTrackColor(score: number): string {
  if (score > 70) return "stroke-green-500";
  if (score >= 50) return "stroke-amber-500";
  return "stroke-red-500";
}

// ---------------------------------------------------------------------------
// Circular Score Component
// ---------------------------------------------------------------------------

const CircularScore: React.FC<{ score: number }> = ({ score }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-muted/20"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className={scoreTrackColor(score)}
        />
      </svg>
      <span className={`absolute text-2xl font-bold ${scoreColor(score)}`}>{score}</span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ResEfficiencyAudit: React.FC = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;

  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );

  const weekStartStr = format(selectedWeekStart, "yyyy-MM-dd");
  const weekEndStr = format(endOfWeek(selectedWeekStart, { weekStartsOn: 1 }), "yyyy-MM-dd");

  // Navigation
  const goToPreviousWeek = () => setSelectedWeekStart((d) => subWeeks(d, 1));
  const goToNextWeek = () => setSelectedWeekStart((d) => addWeeks(d, 1));

  // ── Queries ──────────────────────────────────────
  const { data: snapshot, isLoading } = useQuery({
    queryKey: ["res_efficiency_snapshot", orgId, weekStartStr],
    queryFn: async () => {
      const { data } = await fetchEfficiencySnapshots(orgId!, weekStartStr, weekStartStr);
      // Return the first match or null
      const rows = (data ?? []) as EfficiencySnapshot[];
      return rows.length > 0 ? rows[0] : null;
    },
    enabled: !!orgId,
  });

  const { data: latestSnapshot } = useQuery({
    queryKey: ["res_efficiency_latest", orgId],
    queryFn: async () => {
      const { data } = await fetchLatestEfficiencySnapshot(orgId!);
      return (data as EfficiencySnapshot) ?? null;
    },
    enabled: !!orgId,
  });

  // Use the week-specific snapshot, or fall back to latest if viewing current week
  const displaySnapshot = snapshot ?? null;

  const recommendations: AiRecommendation[] =
    (displaySnapshot?.ai_recommendations as AiRecommendation[] | null) ?? [];
  const periodBreakdown: PeriodBreakdown[] =
    (displaySnapshot?.period_breakdown as PeriodBreakdown[] | null) ?? [];
  const channelBreakdown: ChannelBreakdownItem[] =
    (displaySnapshot?.channel_breakdown as ChannelBreakdownItem[] | null) ?? [];

  // ── Render ────────────────────────────────────────
  if (!orgId) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-semibold">Efficiency Audit</h1>
      </div>

      {/* Week Selector */}
      <div className="flex items-center justify-center gap-3">
        <Button variant="ghost" size="icon" onClick={goToPreviousWeek}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <span className="text-sm font-medium">
          Week of {format(selectedWeekStart, "MMM d")}
        </span>
        <Button variant="ghost" size="icon" onClick={goToNextWeek}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center">Loading audit data...</p>
      ) : !displaySnapshot ? (
        /* Empty state */
        <Card>
          <CardContent className="p-8 text-center">
            <BarChart3 className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No audit data for this week</p>
            <p className="text-xs text-muted-foreground mt-1">
              Efficiency snapshots are generated weekly. Try navigating to a previous week.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Score Card Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Efficiency Score - special circular display */}
            <Card className="col-span-2 md:col-span-1">
              <CardContent className="p-4 flex flex-col items-center gap-2">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  Efficiency Score
                </span>
                <CircularScore score={displaySnapshot.efficiency_score} />
              </CardContent>
            </Card>

            <ReportMetricCard
              label="Total Covers"
              value={displaySnapshot.total_covers}
              icon={<Users className="w-3.5 h-3.5" />}
              format="number"
              className="w-auto"
            />
            <ReportMetricCard
              label="Avg Turn Time"
              value={displaySnapshot.avg_turn_time}
              icon={<Clock className="w-3.5 h-3.5" />}
              format="minutes"
              className="w-auto"
            />
            <ReportMetricCard
              label="No-Show Rate"
              value={displaySnapshot.no_show_rate}
              icon={<TrendingDown className="w-3.5 h-3.5" />}
              format="percentage"
              className="w-auto"
            />
            <ReportMetricCard
              label="Occupancy Rate"
              value={displaySnapshot.occupancy_rate}
              icon={<TrendingUp className="w-3.5 h-3.5" />}
              format="percentage"
              className="w-auto"
            />
          </div>

          {/* AI Recommendations */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              AI Recommendations
            </h2>
            {recommendations.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Lightbulb className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground">No recommendations for this week</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recommendations.map((rec, i) => (
                  <Card key={i}>
                    <CardContent className="p-4 flex gap-3">
                      <div className="shrink-0 mt-0.5">
                        {rec.type === "warning" ? (
                          <AlertTriangle className="w-5 h-5 text-amber-500" />
                        ) : (
                          <Lightbulb className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{rec.title}</span>
                          <Badge
                            variant={rec.type === "warning" ? "destructive" : "secondary"}
                            className="text-[10px] px-1.5 py-0"
                          >
                            {rec.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{rec.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Service Period Breakdown */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Service Period Breakdown
            </h2>
            {periodBreakdown.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-xs text-muted-foreground">No period breakdown available</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {periodBreakdown.map((pb, i) => (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm capitalize">{pb.period}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 flex flex-col gap-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Covers</span>
                        <span className="font-medium">{pb.covers}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Avg Turn Time</span>
                        <span className="font-medium">{pb.avg_turn_time} min</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Channel Breakdown */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Channel Breakdown
            </h2>
            {channelBreakdown.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-xs text-muted-foreground">No channel data available</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-4 flex flex-col gap-3">
                  {(() => {
                    const maxCount = Math.max(...channelBreakdown.map((c) => c.count), 1);
                    const total = channelBreakdown.reduce((s, c) => s + c.count, 0) || 1;
                    return channelBreakdown.map((ch, i) => {
                      const widthPct = (ch.count / maxCount) * 100;
                      const pct = ((ch.count / total) * 100).toFixed(1);
                      const color = CHANNEL_COLORS[ch.channel] ?? "bg-gray-400";
                      const label = CHANNEL_LABELS[ch.channel] ?? ch.channel;

                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-28 shrink-0 truncate">
                            {label}
                          </span>
                          <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                            <div
                              className={`${color} h-full rounded transition-all`}
                              style={{ width: `${widthPct}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium w-16 text-right">
                            {ch.count} ({pct}%)
                          </span>
                        </div>
                      );
                    });
                  })()}
                </CardContent>
              </Card>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default ResEfficiencyAudit;
