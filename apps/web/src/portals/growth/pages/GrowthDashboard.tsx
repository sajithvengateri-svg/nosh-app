import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp, Megaphone, Mail, Users, Sparkles, ArrowRight,
  Send, BarChart3, UserPlus, Clock, Heart, Star, AlertTriangle, Cake,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOrg } from "@/contexts/OrgContext";
import {
  fetchCampaigns,
  fetchLapsedGuests,
  fetchBirthdayGuests,
  fetchGuestSegmentCounts,
} from "@/lib/shared/queries/marketingQueries";
import { generateAllSuggestions } from "@/lib/shared/engines/marketingTriggerEngine";
import type { CampaignSuggestion, Campaign } from "@/lib/shared/types/marketing.types";

const statusColors: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  SCHEDULED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  SENT: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  COMPLETED: "bg-secondary text-secondary-foreground",
};

const channelIcons: Record<string, typeof Mail> = {
  EMAIL: Mail, SMS: Send, SOCIAL: Megaphone, MULTI: Sparkles,
};

const segmentIcons: Record<string, typeof Users> = {
  NEW: UserPlus, RETURNING: ArrowRight, REGULAR: Heart, VIP: Star,
  CHAMPION: Star, LAPSED: Clock, AT_RISK: AlertTriangle, BIRTHDAY_SOON: Cake,
};

const GrowthDashboard = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const navigate = useNavigate();

  const { data: campaigns = [] } = useQuery({
    queryKey: ["growth-campaigns", orgId],
    queryFn: () => fetchCampaigns(orgId!),
    enabled: !!orgId,
  });

  const { data: lapsedGuests = [] } = useQuery({
    queryKey: ["growth-lapsed-guests", orgId],
    queryFn: () => fetchLapsedGuests(orgId!),
    enabled: !!orgId,
  });

  const { data: birthdayGuests = [] } = useQuery({
    queryKey: ["growth-birthday-guests", orgId],
    queryFn: () => fetchBirthdayGuests(orgId!),
    enabled: !!orgId,
  });

  const { data: segmentCounts = {} } = useQuery({
    queryKey: ["growth-segment-counts", orgId],
    queryFn: () => fetchGuestSegmentCounts(orgId!),
    enabled: !!orgId,
  });

  const suggestions = generateAllSuggestions(lapsedGuests, birthdayGuests);
  const activeCampaigns = campaigns.filter((c) => c.status === 'SCHEDULED' || c.status === 'SENT');
  const thisMonthCampaigns = campaigns.filter((c) => {
    const d = new Date(c.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const totalSent = campaigns.reduce((s, c) => s + c.recipients_count, 0);
  const totalBookings = campaigns.reduce((s, c) => s + c.bookings_attributed, 0);

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            GrowthOS
          </h1>
          <p className="text-muted-foreground text-sm">Intelligent marketing engine</p>
        </div>
        <Button onClick={() => navigate("/growth/campaigns")} className="gap-2">
          <Megaphone className="w-4 h-4" /> New Campaign
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Campaigns This Month", value: thisMonthCampaigns.length, icon: Megaphone },
          { label: "Messages Sent", value: totalSent, icon: Send },
          { label: "Bookings Attributed", value: totalBookings, icon: BarChart3 },
          { label: "Active Campaigns", value: activeCampaigns.length, icon: Sparkles },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Smart Suggestions */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Smart Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestions.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">{s.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.reason}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate("/growth/campaigns")} className="ml-3 shrink-0">
                  Create
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active Campaigns */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Active Campaigns</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/growth/campaigns")}>View All</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeCampaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active campaigns</p>
            ) : (
              activeCampaigns.slice(0, 5).map((c) => {
                const Icon = channelIcons[c.channel] || Mail;
                const openRate = c.recipients_count > 0 ? Math.round((c.opened_count / c.recipients_count) * 100) : 0;
                return (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.recipients_count} recipients · {openRate}% opened</p>
                      </div>
                    </div>
                    <Badge className={statusColors[c.status]}>{c.status}</Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Guest Segments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Guest Segments</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/growth/segments")}>View All</Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(segmentCounts).filter(([, count]) => (count as number) > 0).map(([key, count]) => {
                const Icon = segmentIcons[key] || Users;
                return (
                  <div key={key} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{count as number}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{key.replace('_', ' ')}</p>
                    </div>
                  </div>
                );
              })}
              {Object.values(segmentCounts).every((v) => v === 0) && (
                <p className="text-sm text-muted-foreground col-span-2">No guest data yet. Connect Res OS guests to see segments.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GrowthDashboard;
