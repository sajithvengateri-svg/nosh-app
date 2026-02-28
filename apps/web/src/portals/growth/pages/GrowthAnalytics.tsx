import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const campaignData = [
  { name: "Valentine's Day", channel: "Email", sent: 2400, opened: 960, clicked: 288, booked: 48, status: "Completed" },
  { name: "Sunday Brunch Launch", channel: "SMS", sent: 1200, opened: 1080, clicked: 216, booked: 32, status: "Completed" },
  { name: "Wine Night Promo", channel: "Email", sent: 1800, opened: 630, clicked: 126, booked: 18, status: "Active" },
  { name: "Happy Hour Reminder", channel: "SMS", sent: 800, opened: 720, clicked: 144, booked: 22, status: "Active" },
  { name: "Easter Menu Tease", channel: "Social", sent: 0, opened: 0, clicked: 340, booked: 12, status: "Scheduled" },
];

const channelComparison = [
  { channel: "Email", openRate: 40, clickRate: 12, bookRate: 2 },
  { channel: "SMS", openRate: 90, clickRate: 18, bookRate: 2.7 },
  { channel: "Social", openRate: 0, clickRate: 8, bookRate: 1.2 },
];

const engagementTrend = [
  { week: "W1", email: 38, sms: 88, social: 6 },
  { week: "W2", email: 42, sms: 91, social: 7 },
  { week: "W3", email: 40, sms: 89, social: 8 },
  { week: "W4", email: 44, sms: 92, social: 9 },
  { week: "W5", email: 41, sms: 90, social: 7 },
  { week: "W6", email: 45, sms: 93, social: 10 },
];

const roi = { totalSpend: 1250, totalRevenue: 8400, roas: 6.72, cpa: 9.47 };

export default function GrowthAnalytics() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Campaign Analytics</h1>
        <p className="text-muted-foreground text-sm">Performance, ROI, and engagement insights</p>
      </div>

      {/* ROI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Spend", value: `$${roi.totalSpend}` },
          { label: "Revenue Attributed", value: `$${roi.totalRevenue.toLocaleString()}` },
          { label: "ROAS", value: `${roi.roas}x` },
          { label: "Cost / Acquisition", value: `$${roi.cpa}` },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Campaign Performance</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border">
                    <th className="text-left py-2 text-muted-foreground">Campaign</th>
                    <th className="text-center py-2 text-muted-foreground">Channel</th>
                    <th className="text-center py-2 text-muted-foreground">Sent</th>
                    <th className="text-center py-2 text-muted-foreground">Opened</th>
                    <th className="text-center py-2 text-muted-foreground">Clicked</th>
                    <th className="text-center py-2 text-muted-foreground">Booked</th>
                    <th className="text-center py-2 text-muted-foreground">Status</th>
                  </tr></thead>
                  <tbody>
                    {campaignData.map((c) => (
                      <tr key={c.name} className="border-b border-border">
                        <td className="py-2 font-medium text-foreground">{c.name}</td>
                        <td className="py-2 text-center"><Badge variant="outline">{c.channel}</Badge></td>
                        <td className="py-2 text-center text-muted-foreground">{c.sent || "—"}</td>
                        <td className="py-2 text-center text-muted-foreground">{c.opened || "—"}</td>
                        <td className="py-2 text-center text-muted-foreground">{c.clicked}</td>
                        <td className="py-2 text-center font-semibold text-foreground">{c.booked}</td>
                        <td className="py-2 text-center">
                          <Badge variant={c.status === "Active" ? "default" : "secondary"}>{c.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Channel Effectiveness (%)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={channelComparison}>
                  <XAxis dataKey="channel" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="openRate" name="Open Rate" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                  <Bar dataKey="clickRate" name="Click Rate" fill="hsl(142, 76%, 36%)" radius={[4,4,0,0]} />
                  <Bar dataKey="bookRate" name="Book Rate" fill="hsl(280, 67%, 60%)" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Engagement Trend (Open Rate %)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={engagementTrend}>
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="email" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <Line type="monotone" dataKey="sms" stroke="hsl(142, 76%, 36%)" strokeWidth={2} />
                  <Line type="monotone" dataKey="social" stroke="hsl(280, 67%, 60%)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
