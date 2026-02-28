import { useQuery } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, BarChart3, Check, AlertTriangle, Megaphone, CloudRain } from "lucide-react";
import { fetchForecasts, fetchTables } from "@/lib/shared/queries/resQueries";
import { format, addDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import WeatherForecastRow from "@/components/forecast/WeatherForecastRow";
import { supabase } from "@/integrations/supabase/client";

const ResForecast = () => {
  const { currentOrg, venues } = useOrg();
  const orgId = currentOrg?.id;
  const navigate = useNavigate();
  const today = new Date();
  const startDate = format(today, "yyyy-MM-dd");
  const endDate = format(addDays(today, 6), "yyyy-MM-dd");

  const postcode = venues?.[0]?.postcode ?? null;

  const { data: forecasts = [], isLoading } = useQuery({
    queryKey: ["res_forecasts", orgId, startDate, endDate],
    queryFn: async () => { const { data } = await fetchForecasts(orgId!, startDate, endDate); return data ?? []; },
    enabled: !!orgId,
  });

  const { data: tables = [] } = useQuery({
    queryKey: ["res_tables", orgId],
    queryFn: async () => { const { data } = await fetchTables(orgId!); return data ?? []; },
    enabled: !!orgId,
  });

  // Fetch weather for rain annotations on cover cards
  const { data: weatherData } = useQuery({
    queryKey: ["weather-forecast", postcode],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("weather-forecast", {
        body: { postcode },
      });
      if (error) throw error;
      return data as { location: string; days: { date: string; rain_chance: number }[]; radar_station_id: string };
    },
    enabled: !!postcode && postcode !== "0000",
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const rainByDate = new Map(weatherData?.days?.map((d) => [d.date, d.rain_chance]) ?? []);

  const totalSeats = tables.reduce((s: number, t: any) => s + (t.max_capacity || 0), 0) || 62;

  const dates = Array.from({ length: 7 }, (_, i) => format(addDays(today, i), "yyyy-MM-dd"));

  const days = dates.map((date, i) => {
    const forecast = forecasts.find((f: any) => f.date === date);
    return { date, day: format(addDays(today, i), "EEE"), dateLabel: format(addDays(today, i), "d MMM"), forecast };
  });

  const getCapacityColor = (pct: number) => {
    if (pct >= 85) return "text-red-500";
    if (pct >= 60) return "text-amber-500";
    return "text-emerald-500";
  };

  const StatusDot = ({ ok }: { ok: boolean }) => ok
    ? <Check className="w-3 h-3 text-emerald-500" />
    : <AlertTriangle className="w-3 h-3 text-amber-500" />;

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="w-6 h-6 text-primary" /> Cover Forecast</h1>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {days.map(d => {
            const covers = d.forecast?.predicted_covers ?? 0;
            const confirmed = d.forecast?.confirmed_reservations ?? 0;
            const walkIns = d.forecast?.predicted_walk_ins ?? 0;
            const capacityPct = totalSeats > 0 ? Math.round((covers / totalSeats) * 100) : 0;
            const maxHeight = 160;
            const barH = Math.min(covers, totalSeats) / totalSeats * maxHeight;
            const confirmedH = Math.min(confirmed, totalSeats) / totalSeats * maxHeight;

            const chefOk = d.forecast?.chef_os_prep_generated ?? false;
            const bevOk = d.forecast?.bev_os_stock_checked ?? false;
            const labourOk = d.forecast?.labour_os_coverage_checked ?? false;

            const rainChance = rainByDate.get(d.date);

            return (
              <Card key={d.date} className="text-center">
                <CardContent className="pt-3 space-y-1.5 px-2">
                  <p className="text-xs font-medium">{d.day}</p>
                  <p className="text-[10px] text-muted-foreground">{d.dateLabel}</p>

                  {/* Capacity badge */}
                  <p className={`text-sm font-bold ${getCapacityColor(capacityPct)}`}>
                    {capacityPct}%
                  </p>

                  {/* Bars */}
                  <div className="h-[160px] flex items-end justify-center gap-1">
                    <div className="w-4 bg-primary/20 rounded-t" style={{ height: `${barH}px` }} title={`Predicted: ${covers}`} />
                    <div className="w-4 bg-primary rounded-t" style={{ height: `${confirmedH}px` }} title={`Confirmed: ${confirmed}`} />
                  </div>

                  <div className="text-[10px] text-muted-foreground space-y-0.5">
                    <p className="font-bold text-foreground text-sm">{covers}</p>
                    <p>covers ({confirmed} booked + {walkIns} walk-in est.)</p>
                  </div>

                  {/* Rain annotation on cover card */}
                  {rainChance != null && rainChance > 50 && (
                    <div className="flex items-center justify-center gap-1 text-[9px] text-red-500">
                      <CloudRain className="w-3 h-3" />
                      <span>{rainChance}% rain — fewer walk-ins</span>
                    </div>
                  )}

                  {/* Cross-OS readiness */}
                  <div className="flex justify-center gap-2 pt-1">
                    <div className="flex items-center gap-0.5" title="ChefOS prep"><StatusDot ok={chefOk} /><span className="text-[9px]">Chef</span></div>
                    <div className="flex items-center gap-0.5" title="BevOS stock"><StatusDot ok={bevOk} /><span className="text-[9px]">Bev</span></div>
                    <div className="flex items-center gap-0.5" title="LabourOS roster"><StatusDot ok={labourOk} /><span className="text-[9px]">Labour</span></div>
                  </div>

                  {/* Alerts */}
                  {capacityPct >= 95 && <Badge variant="destructive" className="text-[9px] mt-1">Fully Booked</Badge>}
                  {capacityPct < 50 && capacityPct > 0 && (
                    <button
                      className="text-[9px] text-primary underline mt-1 block mx-auto"
                      onClick={() => navigate("/growth/campaigns")}
                    >
                      <Megaphone className="w-3 h-3 inline mr-0.5" />Campaign?
                    </button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-primary/20" /> Predicted</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-primary" /> Confirmed</div>
        <div className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500" /> Ready</div>
        <div className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-amber-500" /> Pending</div>
      </div>

      {/* Weather forecast row + radar */}
      <WeatherForecastRow postcode={postcode} dates={dates} />
    </div>
  );
};

export default ResForecast;
