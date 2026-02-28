import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Rocket, Users, CheckCircle2, Clock, TrendingUp, DollarSign, BarChart3, Building2,
} from "lucide-react";

interface BetaVenue {
  id: string;
  name: string;
  type: string;
  products: string[];
  onboardDate: string;
  status: "setup" | "active" | "churned";
  healthScore: number;
  checklist: Record<string, boolean>;
}

const INITIAL_VENUES: BetaVenue[] = [
  {
    id: "1", name: "CHICC.iT Brisbane", type: "Casual Dining", products: ["RestOS", "LabourOS", "ClockOS", "OverheadOS", "MoneyOS", "Quiet Audit", "BevOS", "ReservationOS"],
    onboardDate: "2026-01-15", status: "active", healthScore: 76,
    checklist: { seeded: true, trained: true, firstWeek: true, firstAudit: true },
  },
  {
    id: "2", name: "The Corner House", type: "Café", products: ["RestOS", "LabourOS", "Quiet Audit"],
    onboardDate: "2026-02-01", status: "active", healthScore: 68,
    checklist: { seeded: true, trained: true, firstWeek: true, firstAudit: false },
  },
  {
    id: "3", name: "Sakura Izakaya", type: "Bar / Restaurant", products: ["RestOS", "BevOS", "LabourOS", "Quiet Audit"],
    onboardDate: "2026-02-10", status: "setup", healthScore: 0,
    checklist: { seeded: true, trained: false, firstWeek: false, firstAudit: false },
  },
  {
    id: "4", name: "Green & Co", type: "Fast Casual", products: ["RestOS", "Quiet Audit"],
    onboardDate: "2026-03-01", status: "setup", healthScore: 0,
    checklist: { seeded: false, trained: false, firstWeek: false, firstAudit: false },
  },
];

const METRICS = [
  { label: "Issues Detected", value: "47", icon: TrendingUp, trend: "+12 this week" },
  { label: "$ Savings Identified", value: "$18.4k", icon: DollarSign, trend: "+$3.2k this week" },
  { label: "Product Adoption", value: "72%", icon: BarChart3, trend: "Across 3 venues" },
  { label: "Active Users", value: "14", icon: Users, trend: "Last 7 days" },
];

const AdminBetaTracker = () => {
  const [venues, setVenues] = useState<BetaVenue[]>(INITIAL_VENUES);

  const toggleChecklist = (venueId: string, key: string) => {
    setVenues(prev => prev.map(v =>
      v.id === venueId ? { ...v, checklist: { ...v.checklist, [key]: !v.checklist[key] } } : v
    ));
  };

  const statusColors: Record<string, string> = {
    setup: "bg-yellow-500/20 text-yellow-700",
    active: "bg-green-500/20 text-green-700",
    churned: "bg-destructive/20 text-destructive",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Rocket className="w-8 h-8 text-primary" />
          Beta Tracker
        </h1>
        <p className="text-muted-foreground mt-1">Track beta venue onboarding and success metrics</p>
      </div>

      {/* Success Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {METRICS.map(m => (
          <Card key={m.label}>
            <CardContent className="pt-6 text-center">
              <m.icon className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{m.value}</p>
              <p className="text-sm font-medium">{m.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{m.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Beta Venues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {venues.map(venue => {
          const checklistItems = Object.entries(venue.checklist);
          const completedCount = checklistItems.filter(([, v]) => v).length;
          const progress = (completedCount / checklistItems.length) * 100;

          return (
            <Card key={venue.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      {venue.name}
                    </CardTitle>
                    <CardDescription>{venue.type} • Since {venue.onboardDate}</CardDescription>
                  </div>
                  <Badge className={statusColors[venue.status]}>{venue.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Products */}
                <div className="flex flex-wrap gap-1">
                  {venue.products.map(p => (
                    <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                  ))}
                </div>

                {/* Health Score */}
                {venue.healthScore > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">Health Score:</span>
                    <span className="text-lg font-bold">{venue.healthScore}/100</span>
                    <Progress value={venue.healthScore} className="flex-1 h-2" />
                  </div>
                )}

                {/* Onboarding Checklist */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Onboarding ({completedCount}/{checklistItems.length})</p>
                  {[
                    { key: "seeded", label: "Ecosystem data seeded" },
                    { key: "trained", label: "Staff trained" },
                    { key: "firstWeek", label: "First week complete" },
                    { key: "firstAudit", label: "First audit score generated" },
                  ].map(item => (
                    <div key={item.key} className="flex items-center gap-2">
                      <Checkbox checked={!!venue.checklist[item.key]} onCheckedChange={() => toggleChecklist(venue.id, item.key)} />
                      <span className="text-sm">{item.label}</span>
                    </div>
                  ))}
                  <Progress value={progress} className="h-1.5 mt-2" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AdminBetaTracker;
