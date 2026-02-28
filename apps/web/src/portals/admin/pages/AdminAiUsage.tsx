import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth } from "date-fns";
import {
  Brain,
  Loader2,
  Activity,
  Coins,
  DollarSign,
  Building2,
  Users,
  Calendar,
  RefreshCw,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AdminAiUsage = () => {
  const today = new Date();
  const [dateFrom, setDateFrom] = useState(
    format(startOfMonth(today), "yyyy-MM-dd")
  );
  const [dateTo, setDateTo] = useState(
    format(endOfMonth(today), "yyyy-MM-dd")
  );

  // ---- AI usage logs for the selected date range ----
  const {
    data: usageLogs,
    isLoading: logsLoading,
    refetch: refetchLogs,
  } = useQuery({
    queryKey: ["admin-ai-usage-logs", dateFrom, dateTo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_usage_log")
        .select("function_name, total_tokens, cost_usd, created_at")
        .gte("created_at", `${dateFrom}T00:00:00`)
        .lte("created_at", `${dateTo}T23:59:59`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // ---- Top orgs by usage (current month view) ----
  const { data: orgUsage, isLoading: orgUsageLoading } = useQuery({
    queryKey: ["admin-org-token-usage"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_org_token_usage_current_month")
        .select("*")
        .order("total_tokens", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
  });

  // ---- Fetch org names for joining ----
  const { data: orgs } = useQuery({
    queryKey: ["admin-orgs-names"],
    queryFn: async () => {
      const { data } = await supabase
        .from("organizations")
        .select("id, name, slug");
      return data || [];
    },
  });

  // ---- Top users by usage (current month view) ----
  const { data: userUsage, isLoading: userUsageLoading } = useQuery({
    queryKey: ["admin-user-token-usage"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_user_token_usage_current_month")
        .select("*")
        .order("total_tokens", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
  });

  // ---- Fetch profiles for user name resolution ----
  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles-names"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, email");
      return data || [];
    },
  });

  // ---- Client-side grouping by function_name ----
  const grouped = useMemo(() => {
    if (!usageLogs) return [];
    const map = new Map<
      string,
      { function_name: string; call_count: number; total_tokens: number; total_cost: number }
    >();
    for (const row of usageLogs) {
      const fn = row.function_name || "unknown";
      const existing = map.get(fn) || {
        function_name: fn,
        call_count: 0,
        total_tokens: 0,
        total_cost: 0,
      };
      existing.call_count += 1;
      existing.total_tokens += row.total_tokens || 0;
      existing.total_cost += row.cost_usd || 0;
      map.set(fn, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.total_cost - a.total_cost);
  }, [usageLogs]);

  // ---- Summary totals ----
  const totals = useMemo(() => {
    if (!usageLogs) return { calls: 0, tokens: 0, cost: 0 };
    return usageLogs.reduce(
      (acc, row) => ({
        calls: acc.calls + 1,
        tokens: acc.tokens + (row.total_tokens || 0),
        cost: acc.cost + (row.cost_usd || 0),
      }),
      { calls: 0, tokens: 0, cost: 0 }
    );
  }, [usageLogs]);

  const getOrgName = (orgId: string) => {
    const org = orgs?.find((o) => o.id === orgId);
    return org?.name || org?.slug || orgId?.slice(0, 8) || "Unknown";
  };

  const getUserName = (userId: string) => {
    const profile = profiles?.find((p) => p.user_id === userId);
    return profile?.full_name || profile?.email || userId?.slice(0, 8) || "Unknown";
  };

  const handleRefresh = () => {
    refetchLogs();
    toast.success("Usage data refreshed");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="w-8 h-8 text-primary" />
            AI Usage Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor AI usage, token consumption, and costs across the platform
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Date range filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">From</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-auto"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">To</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-auto"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDateFrom(format(startOfMonth(today), "yyyy-MM-dd"));
                setDateTo(format(endOfMonth(today), "yyyy-MM-dd"));
              }}
            >
              This Month
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Calls</p>
                <p className="text-3xl font-bold">
                  {logsLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    formatNumber(totals.calls)
                  )}
                </p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tokens</p>
                <p className="text-3xl font-bold">
                  {logsLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    formatNumber(totals.tokens)
                  )}
                </p>
              </div>
              <Coins className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Cost (USD)</p>
                <p className="text-3xl font-bold">
                  {logsLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    `$${totals.cost.toFixed(2)}`
                  )}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage by function table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Usage by Function
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : grouped.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No AI usage data for the selected period
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Function</TableHead>
                    <TableHead className="text-right">Calls</TableHead>
                    <TableHead className="text-right">Total Tokens</TableHead>
                    <TableHead className="text-right">Total Cost (USD)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grouped.map((row) => (
                    <TableRow key={row.function_name}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {row.function_name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {row.call_count.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(row.total_tokens)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${row.total_cost.toFixed(4)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top orgs by usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Top Organisations by Usage (Current Month)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orgUsageLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : !orgUsage || orgUsage.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No organisation usage data this month
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organisation</TableHead>
                    <TableHead className="text-right">Total Tokens</TableHead>
                    <TableHead className="text-right">Total Cost (USD)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orgUsage.map((row: any, idx: number) => (
                    <TableRow key={row.org_id || idx}>
                      <TableCell className="font-medium">
                        {getOrgName(row.org_id)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(row.total_tokens || 0)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${(row.total_cost || 0).toFixed(4)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top users by usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Top Users by Usage (Current Month)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userUsageLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : !userUsage || userUsage.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No user usage data this month
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead className="text-right">Total Tokens</TableHead>
                    <TableHead className="text-right">Total Cost (USD)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userUsage.map((row: any, idx: number) => (
                    <TableRow key={row.user_id || idx}>
                      <TableCell className="font-medium">
                        {getUserName(row.user_id)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(row.total_tokens || 0)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${(row.total_cost || 0).toFixed(4)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAiUsage;
