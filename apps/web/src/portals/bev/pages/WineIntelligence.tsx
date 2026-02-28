import { useState, useEffect } from "react";
import { Wine, TrendingUp, Calendar, MapPin, Grape, BarChart3, Plus, Scan } from "lucide-react";
import BevLabelScanner from "../components/BevLabelScanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { calculateCellaringScore, calculateBTGMargin, calculatePourCost } from "@/lib/shared/calculations/bevCost";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { toast } from "sonner";

interface WineProduct {
  id: string;
  name: string;
  purchase_price: number;
  sell_price: number;
  bottle_size_ml: number | null;
  pour_size_ml: number | null;
  is_coravin_eligible: boolean;
  pours_per_unit: number | null;
  bev_wine_details?: {
    vintage: number | null;
    region: string | null;
    varietal: string | null;
    producer: string | null;
    drink_from: number | null;
    drink_to: number | null;
    wine_type: string;
    appellation: string | null;
  }[];
}

const READINESS_COLORS: Record<string, string> = {
  too_young: "bg-blue-500",
  ready: "bg-green-500",
  peak: "bg-amber-500",
  declining: "bg-red-500",
};

const READINESS_LABELS: Record<string, string> = {
  too_young: "Too Young",
  ready: "Ready",
  peak: "Peak",
  declining: "Declining",
};

const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const WineIntelligence = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const [wines, setWines] = useState<WineProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (!orgId) return;
    const load = async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from("bev_products")
        .select("*, bev_wine_details(*)")
        .eq("org_id", orgId)
        .eq("main_category", "wine")
        .order("name");
      setWines(data || []);
      setLoading(false);
    };
    load();
  }, [orgId]);

  const winesWithDetails = wines.filter(w => w.bev_wine_details?.length);

  // Vintage tracker data
  const vintageData = winesWithDetails
    .filter(w => w.bev_wine_details?.[0]?.vintage && w.bev_wine_details?.[0]?.drink_from && w.bev_wine_details?.[0]?.drink_to)
    .map(w => {
      const d = w.bev_wine_details![0];
      const readiness = calculateCellaringScore(d.vintage!, d.drink_from!, d.drink_to!, currentYear);
      return { ...w, readiness, detail: d };
    });

  // BTG data
  const btgData = wines
    .filter(w => w.sell_price > 0 && w.bottle_size_ml && w.pour_size_ml)
    .map(w => {
      const pourCost = calculatePourCost(w.purchase_price, w.bottle_size_ml!, w.pour_size_ml!);
      const margin = calculateBTGMargin(pourCost, w.sell_price);
      return { ...w, pourCost, margin };
    })
    .sort((a, b) => b.margin - a.margin);

  // Coravin candidates: high value + eligible
  const coravinCandidates = wines
    .filter(w => w.is_coravin_eligible || w.purchase_price > 30)
    .sort((a, b) => b.purchase_price - a.purchase_price);

  // Region breakdown
  const regionMap: Record<string, number> = {};
  winesWithDetails.forEach(w => {
    const region = w.bev_wine_details?.[0]?.region || "Unknown";
    regionMap[region] = (regionMap[region] || 0) + 1;
  });
  const regionData = Object.entries(regionMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Varietal breakdown
  const varietalMap: Record<string, number> = {};
  winesWithDetails.forEach(w => {
    const varietal = w.bev_wine_details?.[0]?.varietal || "Unknown";
    varietalMap[varietal] = (varietalMap[varietal] || 0) + 1;
  });
  const varietalData = Object.entries(varietalMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);

  // Readiness summary
  const readinessSummary = { too_young: 0, ready: 0, peak: 0, declining: 0 };
  vintageData.forEach(w => { readinessSummary[w.readiness]++; });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Wine className="w-8 h-8" /> Wine Intelligence
          </h1>
          <p className="text-muted-foreground">Vintage tracking, BTG optimisation & cellaring windows</p>
        </div>
        <Button variant="outline" onClick={() => setScannerOpen(true)}>
          <Scan className="w-4 h-4 mr-2" /> Scan Wine Label
        </Button>
      </div>

      <BevLabelScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        scanType="wine_label"
        title="Wine Label Scanner"
        onDataExtracted={(data) => { console.log("Wine scan:", data); toast.success("Wine label scanned!"); }}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(readinessSummary).map(([key, count]) => (
          <Card key={key}>
            <CardContent className="pt-4 text-center">
              <div className={`w-3 h-3 rounded-full ${READINESS_COLORS[key]} mx-auto mb-2`} />
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs text-muted-foreground">{READINESS_LABELS[key]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="vintage">
        <TabsList>
          <TabsTrigger value="vintage">Vintage Tracker</TabsTrigger>
          <TabsTrigger value="btg">BTG Optimiser</TabsTrigger>
          <TabsTrigger value="coravin">Coravin Candidates</TabsTrigger>
          <TabsTrigger value="regions">Region Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="vintage" className="space-y-4">
          {loading ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Loading wines...</CardContent></Card>
          ) : vintageData.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">
              Add wines with vintage and drinking window data to see cellaring intelligence.
            </CardContent></Card>
          ) : (
            vintageData.map(w => {
              const d = w.detail;
              const total = (d.drink_to! - d.drink_from!) || 1;
              const elapsed = Math.max(0, Math.min(currentYear - d.drink_from!, total));
              const pct = (elapsed / total) * 100;
              return (
                <Card key={w.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">{w.name}</p>
                        <p className="text-sm text-muted-foreground">{d.producer} · {d.region} · {d.vintage}</p>
                      </div>
                      <Badge className={`${READINESS_COLORS[w.readiness]} text-white`}>
                        {READINESS_LABELS[w.readiness]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <span>{d.drink_from}</span>
                      <Progress value={pct} className="flex-1 h-2" />
                      <span>{d.drink_to}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="btg" className="space-y-4">
          {btgData.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">
              Add wines with pour sizes and sell prices to see BTG margin analysis.
            </CardContent></Card>
          ) : (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5" /> By-the-Glass Margin</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {btgData.map(w => (
                    <div key={w.id} className="flex items-center justify-between border-b border-border pb-2">
                      <div>
                        <p className="font-medium text-sm">{w.name}</p>
                        <p className="text-xs text-muted-foreground">Pour cost: ${w.pourCost.toFixed(2)} · Sell: ${w.sell_price.toFixed(2)}</p>
                      </div>
                      <Badge variant={w.margin >= 70 ? "default" : w.margin >= 60 ? "secondary" : "destructive"}>
                        {w.margin.toFixed(1)}% GP
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="coravin" className="space-y-4">
          {coravinCandidates.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">
              Mark wines as Coravin-eligible in your cellar to see candidates here.
            </CardContent></Card>
          ) : (
            <Card>
              <CardHeader><CardTitle>Coravin Candidates</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {coravinCandidates.map(w => (
                    <div key={w.id} className="flex items-center justify-between border-b border-border pb-2">
                      <div>
                        <p className="font-medium text-sm">{w.name}</p>
                        <p className="text-xs text-muted-foreground">
                          ${w.purchase_price.toFixed(2)} · {w.pours_per_unit || "?"} pours/bottle
                        </p>
                      </div>
                      <Badge variant={w.is_coravin_eligible ? "default" : "outline"}>
                        {w.is_coravin_eligible ? "Eligible" : "Candidate"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="regions" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5" /> Regions</CardTitle></CardHeader>
              <CardContent>
                {regionData.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No region data available.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={regionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name} (${value})`}>
                        {regionData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Grape className="w-5 h-5" /> Varietals</CardTitle></CardHeader>
              <CardContent>
                {varietalData.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No varietal data available.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={varietalData} layout="vertical">
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WineIntelligence;
