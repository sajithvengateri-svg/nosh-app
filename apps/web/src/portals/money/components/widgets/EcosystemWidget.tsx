import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface ModuleStatus {
  name: string;
  path: string;
  fresh: boolean;
  last: string;
}

interface Props {
  modules?: ModuleStatus[];
}

export function EcosystemWidget({
  modules = [
    { name: "RestOS", path: "/pos", fresh: true, last: "2m" },
    { name: "LabourOS", path: "/labour/dashboard", fresh: true, last: "15m" },
    { name: "OverheadOS", path: "/overhead/dashboard", fresh: true, last: "1h" },
    { name: "BevOS", path: "/bev/dashboard", fresh: true, last: "3h" },
    { name: "ResOS", path: "/reservation/dashboard", fresh: true, last: "30m" },
    { name: "GrowthOS", path: "/growth/dashboard", fresh: false, last: "2d" },
    { name: "ChefOS", path: "/dashboard", fresh: true, last: "10m" },
    { name: "ClockOS", path: "/clock", fresh: true, last: "5m" },
    { name: "SupplyOS", path: "/supply/dashboard", fresh: true, last: "4h" },
  ],
}: Props) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ecosystem Status</p>

        <div className="grid grid-cols-3 gap-2">
          {modules.map((m) => (
            <button
              key={m.name}
              onClick={() => navigate(m.path)}
              className="text-center p-2 rounded-lg border border-border hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center justify-center gap-1">
                <div className={`w-2 h-2 rounded-full ${m.fresh ? "bg-emerald-400" : "bg-amber-400"}`} />
                <span className="text-[10px] font-semibold text-foreground">{m.name}</span>
              </div>
              <p className="text-[9px] text-muted-foreground mt-0.5">{m.last}</p>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
