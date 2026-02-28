import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, CloudRain, Thermometer, AlertTriangle, Building2 } from "lucide-react";
import { fetchFunctionById, fetchFunctionPackages, fetchFunctionPayments } from "@/lib/shared/queries/resQueries";
import { format } from "date-fns";
import { useWeather, RAIN_RISK_THRESHOLD, HIGH_TEMP_THRESHOLD } from "../hooks/useWeather";

const ResFunctionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getWeatherForDate, outdoorRiskLevel } = useWeather();

  const { data: fn, isLoading } = useQuery({
    queryKey: ["res_function", id],
    queryFn: async () => { const { data } = await fetchFunctionById(id!); return data; },
    enabled: !!id,
  });

  const { data: packages = [] } = useQuery({
    queryKey: ["res_function_packages", id],
    queryFn: async () => { const { data } = await fetchFunctionPackages(id!); return data ?? []; },
    enabled: !!id,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["res_function_payments", id],
    queryFn: async () => { const { data } = await fetchFunctionPayments(id!); return data ?? []; },
    enabled: !!id,
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!fn) return <div className="p-6 text-center text-muted-foreground">Function not found</div>;

  const f = fn as any;
  const totalPaid = payments.reduce((s: number, p: any) => s + (p.amount || 0), 0);

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{f.client_name}</CardTitle>
            <Badge>{f.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-muted-foreground block">Date</span>{format(new Date(f.event_date), "d MMM yyyy")}</div>
            <div><span className="text-muted-foreground block">Time</span>{f.start_time?.slice(0, 5)}{f.end_time ? ` – ${f.end_time.slice(0, 5)}` : ''}</div>
            <div><span className="text-muted-foreground block">Guests</span>{f.party_size} pax</div>
            <div><span className="text-muted-foreground block">Type</span>{f.event_type}</div>
          </div>
          {f.notes && <div className="text-sm"><span className="text-muted-foreground">Notes:</span> {f.notes}</div>}
        </CardContent>
      </Card>

      {/* Weather warning for outdoor functions */}
      {(() => {
        if (!f.event_date) return null;
        const eventDateStr = format(new Date(f.event_date), "yyyy-MM-dd");
        const weather = getWeatherForDate(eventDateStr);
        if (!weather) return null;

        const risk = outdoorRiskLevel(eventDateStr);
        const isOutdoorType = /cocktail|outdoor|garden|terrace|rooftop/i.test(
          [f.event_type, f.notes, f.setup_style].filter(Boolean).join(" ")
        );

        // Show warning if: outdoor event + any weather risk, OR any event + danger level
        if (risk === "safe" || (!isOutdoorType && risk !== "danger")) return null;

        const rainPct = weather.rain_chance;
        const tempMax = weather.temp_max ?? 0;

        return (
          <Card className={risk === "danger" ? "border-red-200 bg-red-50/50" : "border-amber-200 bg-amber-50/50"}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${risk === "danger" ? "text-red-500" : "text-amber-500"}`} />
                <div className="flex-1 space-y-2">
                  <p className={`text-sm font-semibold ${risk === "danger" ? "text-red-700" : "text-amber-700"}`}>
                    Weather Alert — {isOutdoorType ? "Outdoor" : ""} Event on {format(new Date(f.event_date), "d MMM")}
                  </p>
                  <div className="flex flex-wrap gap-3 text-sm">
                    {rainPct >= RAIN_RISK_THRESHOLD && (
                      <span className="flex items-center gap-1 text-red-600">
                        <CloudRain className="w-4 h-4" /> {rainPct}% rain chance
                      </span>
                    )}
                    {tempMax >= HIGH_TEMP_THRESHOLD && (
                      <span className="flex items-center gap-1 text-orange-600">
                        <Thermometer className="w-4 h-4" /> {tempMax}°C high
                      </span>
                    )}
                  </div>
                  {isOutdoorType && (
                    <p className="text-xs text-muted-foreground">
                      {rainPct >= RAIN_RISK_THRESHOLD
                        ? "Consider activating a backup indoor area for this event."
                        : "High temperatures may affect outdoor comfort — ensure shade and hydration options."}
                    </p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => navigate("/reservation/functions/spaces")}
                  >
                    <Building2 className="w-3 h-3 mr-1.5" /> View Backup Spaces
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Packages */}
      <Card>
        <CardHeader><CardTitle className="text-base">Packages & Quote</CardTitle></CardHeader>
        <CardContent>
          {packages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No packages added yet</p>
          ) : (
            <div className="space-y-2">
              {packages.map((p: any) => (
                <div key={p.id} className="flex justify-between text-sm">
                  <span>{p.description} <Badge variant="outline" className="text-[10px] ml-1">{p.type}</Badge></span>
                  <span className="font-medium">${p.total?.toLocaleString()}</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total</span><span>${f.quoted_total?.toLocaleString() || packages.reduce((s: number, p: any) => s + (p.total || 0), 0).toLocaleString()}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payments */}
      <Card>
        <CardHeader><CardTitle className="text-base">Payments (${totalPaid.toLocaleString()} received)</CardTitle></CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments recorded</p>
          ) : (
            <div className="space-y-2">
              {payments.map((p: any) => (
                <div key={p.id} className="flex justify-between text-sm">
                  <span>{p.payment_type} · {format(new Date(p.paid_at), "d MMM yyyy")}</span>
                  <span className="font-medium">${p.amount?.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResFunctionDetail;
