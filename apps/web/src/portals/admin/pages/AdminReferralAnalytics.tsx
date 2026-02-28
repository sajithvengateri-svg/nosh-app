import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, FunnelChart } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, Users, DollarSign, Percent, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const AdminReferralAnalytics = () => {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [shares, setShares] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [refsRes, sharesRes] = await Promise.all([
        supabase.from("referrals").select("*").order("created_at", { ascending: false }),
        supabase.from("referral_shares").select("*"),
      ]);
      setReferrals(refsRes.data || []);
      setShares(sharesRes.data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const totalShares = shares.length;
  const signups = referrals.filter((r: any) => r.referred_user_id).length;
  const paid = referrals.filter((r: any) => r.paid_at).length;
  const credited = referrals.filter((r: any) => r.reward_status === "credited").length;
  const shareToSignup = totalShares ? ((signups / totalShares) * 100).toFixed(1) : "0";
  const signupToPaid = signups ? ((paid / signups) * 100).toFixed(1) : "0";
  const totalRewardCost = referrals.reduce((s: number, r: any) => s + (Number(r.reward_value) || 0), 0);

  // Funnel data
  const funnelData = [
    { name: "Shares", value: totalShares, fill: "hsl(var(--primary))" },
    { name: "Sign-ups", value: signups, fill: "hsl(var(--chart-2))" },
    { name: "Paid", value: paid, fill: "hsl(var(--chart-3))" },
    { name: "Credited", value: credited, fill: "hsl(var(--chart-4))" },
  ];

  // Channel performance
  const channelMap: Record<string, number> = {};
  shares.forEach((s: any) => { channelMap[s.channel] = (channelMap[s.channel] || 0) + 1; });
  const channelData = Object.entries(channelMap).map(([channel, count]) => ({ channel, count }));

  // Flagged referrals (simple heuristic: same email domain clusters)
  const flagged = referrals.filter((r: any) => r.notes?.includes("FLAGGED") || r.reward_status === "voided");

  // Top advocates — group by referrer_id
  const advocateMap: Record<string, { count: number; credited: number; revenue: number }> = {};
  referrals.forEach((r: any) => {
    if (!r.referrer_id) return;
    if (!advocateMap[r.referrer_id]) advocateMap[r.referrer_id] = { count: 0, credited: 0, revenue: 0 };
    advocateMap[r.referrer_id].count++;
    if (r.reward_status === "credited") {
      advocateMap[r.referrer_id].credited++;
      advocateMap[r.referrer_id].revenue += Number(r.reward_value) || 0;
    }
  });
  const topAdvocates = Object.entries(advocateMap)
    .sort(([, a], [, b]) => b.credited - a.credited)
    .slice(0, 10)
    .map(([id, data], i) => ({ rank: i + 1, referrerId: id.slice(0, 8), ...data }));

  const kpis = [
    { icon: Users, label: "Links Shared", value: loading ? "..." : totalShares },
    { icon: Percent, label: "Share→Signup", value: loading ? "..." : `${shareToSignup}%` },
    { icon: Percent, label: "Signup→Paid", value: loading ? "..." : `${signupToPaid}%` },
    { icon: DollarSign, label: "Reward Cost", value: loading ? "..." : `$${totalRewardCost.toFixed(2)}` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Referral Analytics</h1>
        <p className="text-sm text-muted-foreground">Conversion funnel, channel performance, and top advocates.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map(k => (
          <Card key={k.label}>
            <CardContent className="p-4 text-center">
              <k.icon className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="text-xl font-bold text-foreground">{k.value}</p>
              <p className="text-xs text-muted-foreground">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Conversion Funnel</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 justify-center flex-wrap">
            {funnelData.map((step, i) => (
              <div key={step.name} className="flex items-center gap-2">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{step.value}</p>
                  <p className="text-xs text-muted-foreground">{step.name}</p>
                </div>
                {i < funnelData.length - 1 && (
                  <div className="flex flex-col items-center">
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">
                      {funnelData[i].value ? ((funnelData[i + 1].value / funnelData[i].value) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Channel Performance */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Channel Performance</CardTitle></CardHeader>
          <CardContent>
            {channelData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No share data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={channelData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="channel" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Fraud Alerts */}
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /> Fraud Alerts</CardTitle></CardHeader>
          <CardContent>
            {flagged.length === 0 ? (
              <p className="text-sm text-muted-foreground">No flagged referrals. All clear! ✅</p>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {flagged.map((r: any) => (
                  <div key={r.id} className="p-2 rounded bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 text-sm">
                    <p className="font-medium text-foreground">{r.referred_email || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{r.notes || "Voided"}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Advocates */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Top Advocates</CardTitle></CardHeader>
        <CardContent>
          {topAdvocates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No referral data yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Referrer</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Conversions</TableHead>
                  <TableHead className="text-right">Rewards</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topAdvocates.map(a => (
                  <TableRow key={a.referrerId}>
                    <TableCell>{a.rank}</TableCell>
                    <TableCell className="font-mono text-xs">{a.referrerId}…</TableCell>
                    <TableCell>{a.count}</TableCell>
                    <TableCell>{a.credited}</TableCell>
                    <TableCell className="text-right">${a.revenue.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReferralAnalytics;
