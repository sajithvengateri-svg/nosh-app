import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, DollarSign, TrendingUp, Clock, Gift, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--muted))"];

const AdminSalesDashboard = () => {
  const [leads, setLeads] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [leadsRes, refsRes, actsRes] = await Promise.all([
        supabase.from("leads").select("*").order("created_at", { ascending: false }),
        supabase.from("referrals").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("lead_activities").select("*").order("created_at", { ascending: false }).limit(20),
      ]);
      setLeads(leadsRes.data || []);
      setReferrals(refsRes.data || []);
      setActivities(actsRes.data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const activeLeads = leads.filter(l => !["closed_won", "closed_lost"].includes(l.stage));
  const pipelineValue = activeLeads.reduce((s, l) => s + (Number(l.deal_value) || 0), 0);
  const closedWon = leads.filter(l => l.stage === "closed_won").length;
  const conversionRate = leads.length ? ((closedWon / leads.length) * 100).toFixed(1) : "0";
  const creditedRefs = referrals.filter((r: any) => r.reward_status === "credited" || r.status === "completed");
  const rewardCost = creditedRefs.reduce((s: number, r: any) => s + (Number(r.reward_value) || 0), 0);

  const stageData = ["lead", "demo_booked", "trial_active", "negotiation", "closed_won", "closed_lost"]
    .map(stage => ({ stage: stage.replace(/_/g, " "), count: leads.filter(l => l.stage === stage).length }));

  const sourceData = ["organic", "referral", "partner", "inbound", "outbound"]
    .map(s => ({ name: s, value: leads.filter(l => l.source === s).length }))
    .filter(s => s.value > 0);

  const kpis = [
    { icon: Users, label: "Active Leads", value: loading ? "..." : activeLeads.length, color: "text-blue-500" },
    { icon: DollarSign, label: "Pipeline Value", value: loading ? "..." : `$${pipelineValue.toLocaleString()}`, color: "text-emerald-500" },
    { icon: TrendingUp, label: "Conversion Rate", value: loading ? "..." : `${conversionRate}%`, color: "text-amber-500" },
    { icon: Gift, label: "Referral Conversions", value: loading ? "..." : creditedRefs.length, color: "text-violet-500" },
    { icon: DollarSign, label: "Reward Cost", value: loading ? "..." : `$${rewardCost.toFixed(2)}`, color: "text-red-500" },
    { icon: BarChart3, label: "ROI", value: loading ? "..." : rewardCost > 0 ? `${((pipelineValue / rewardCost) * 100).toFixed(0)}%` : "∞", color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Sales Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of leads, referrals, and revenue pipeline.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map(k => (
          <Card key={k.label}>
            <CardContent className="p-4 text-center">
              <k.icon className={`w-5 h-5 mx-auto mb-1 ${k.color}`} />
              <p className="text-xl font-bold text-foreground">{k.value}</p>
              <p className="text-xs text-muted-foreground">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Pipeline by Stage</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stageData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="stage" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis allowDecimals={false} className="fill-muted-foreground" />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Lead Sources</CardTitle></CardHeader>
          <CardContent>
            {sourceData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No leads yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={sourceData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" nameKey="name" label>
                    {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Recent Activity</CardTitle></CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity.</p>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {activities.map((a: any) => (
                <div key={a.id} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-foreground">{a.content || a.activity_type}</p>
                    <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSalesDashboard;
