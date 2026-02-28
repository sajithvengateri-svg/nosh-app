import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudDrizzle,
  CloudLightning,
  Wind,
  Droplets,
  Loader2,
  MapPin,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface WeatherDay {
  date: string;
  rain_chance: number;
  rain_amount: string;
  temp_min: number | null;
  temp_max: number | null;
  icon: string;
  short_text: string;
}

interface WeatherData {
  location: string;
  days: WeatherDay[];
  radar_station_id: string;
}

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  sunny: Sun,
  partly_cloudy: CloudSun,
  cloudy: Cloud,
  rain: CloudRain,
  showers: CloudDrizzle,
  storm: CloudLightning,
  windy: Wind,
};

const getRainColor = (pct: number) => {
  if (pct <= 20) return "text-emerald-500";
  if (pct <= 50) return "text-amber-500";
  return "text-red-500";
};

interface Props {
  postcode: string | null | undefined;
  dates: string[]; // array of 7 "yyyy-MM-dd" strings to align with cover forecast
}

const WeatherForecastRow = ({ postcode, dates }: Props) => {
  const { data, isLoading, error } = useQuery<WeatherData>({
    queryKey: ["weather-forecast", postcode],
    queryFn: async () => {
      const { data: result, error } = await supabase.functions.invoke("weather-forecast", {
        body: { postcode },
      });
      if (error) throw error;
      return result as WeatherData;
    },
    enabled: !!postcode && postcode !== "0000",
    staleTime: 30 * 60 * 1000, // 30 min
    refetchOnWindowFocus: false,
  });

  if (!postcode || postcode === "0000") {
    return (
      <Card className="border-dashed">
        <CardContent className="py-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
          <MapPin className="w-4 h-4" />
          Set your venue postcode in settings to enable weather forecasts
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-3 text-center text-xs text-muted-foreground">
          Weather data unavailable
        </CardContent>
      </Card>
    );
  }

  // Match weather days to forecast dates
  const weatherByDate = new Map(data.days.map((d) => [d.date, d]));

  return (
    <div className="space-y-3">
      {/* Weather cards row */}
      <div className="grid grid-cols-7 gap-2">
        {dates.map((date) => {
          const w = weatherByDate.get(date);
          if (!w) {
            return (
              <Card key={date} className="text-center opacity-50">
                <CardContent className="pt-3 px-2 pb-3">
                  <p className="text-[10px] text-muted-foreground">No data</p>
                </CardContent>
              </Card>
            );
          }

          const IconComponent = ICON_MAP[w.icon] || Cloud;

          return (
            <Card key={date} className="text-center">
              <CardContent className="pt-3 px-2 pb-3 space-y-1">
                {/* Weather icon */}
                <div className="flex justify-center">
                  <IconComponent className="w-5 h-5 text-muted-foreground" />
                </div>

                {/* Rain chance */}
                <div className="flex items-center justify-center gap-0.5">
                  <Droplets className={`w-3 h-3 ${getRainColor(w.rain_chance)}`} />
                  <span className={`text-sm font-bold ${getRainColor(w.rain_chance)}`}>
                    {w.rain_chance}%
                  </span>
                </div>

                {/* Temp */}
                <p className="text-[10px] text-muted-foreground">
                  {w.temp_min != null && w.temp_max != null
                    ? `${w.temp_min}°–${w.temp_max}°`
                    : w.temp_max != null
                    ? `${w.temp_max}°`
                    : "—"}
                </p>

                {/* Short text */}
                <p className="text-[9px] text-muted-foreground leading-tight truncate" title={w.short_text}>
                  {w.short_text}
                </p>

                {/* Outdoor risk badge */}
                {w.rain_chance > 50 && (
                  <Badge variant="destructive" className="text-[8px] px-1.5 py-0">
                    <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />
                    Outdoor risk
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Rain radar image */}
      <Card>
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Droplets className="w-4 h-4 text-primary" />
            Rain Radar — {data.location}
          </div>
          <div className="rounded-md overflow-hidden border bg-muted flex justify-center items-center" style={{ minHeight: 320 }}>
            <img
              src={`https://radar.weather.gov.au/public/radar/transparent/IDR${data.radar_station_id}-RF-202602180000.png`}
              alt={`Rain radar for ${data.location}`}
              className="max-w-full max-h-[320px] object-contain"
              onError={(e) => {
                // Fallback: link to BOM radar page
                const target = e.currentTarget;
                target.style.display = 'none';
                const fallback = target.parentElement;
                if (fallback) {
                  fallback.innerHTML = `<a href="http://www.bom.gov.au/products/IDR${data.radar_station_id}.loop.shtml" target="_blank" rel="noopener noreferrer" class="text-sm text-primary underline p-4">View live radar on BOM website →</a>`;
                }
              }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground text-right">
            <a
              href={`http://www.bom.gov.au/products/IDR${data.radar_station_id}.loop.shtml`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              View live radar on BOM →
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default WeatherForecastRow;
