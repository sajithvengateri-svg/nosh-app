import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ModuleScore {
  name: string;
  score: number;
}

interface Props {
  overall?: number;
  modules?: ModuleScore[];
}

export function AuditWidget({
  overall = 67,
  modules = [
    { name: "Labour", score: 58 },
    { name: "Overhead", score: 74 },
    { name: "Food", score: 62 },
    { name: "Service", score: 78 },
    { name: "Bev", score: 71 },
    { name: "Marketing", score: 55 },
    { name: "Compliance", score: 45 },
  ],
}: Props) {
  const scoreColor = (s: number) =>
    s >= 80 ? "text-emerald-400" : s >= 60 ? "text-amber-400" : "text-destructive";
  const barColor = (s: number) =>
    s >= 80 ? "bg-emerald-400" : s >= 60 ? "bg-amber-400" : "bg-destructive";

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quiet Audit</p>
          <Badge variant={overall >= 80 ? "default" : overall >= 60 ? "secondary" : "destructive"} className="text-[10px]">
            {overall >= 80 ? "GOOD" : overall >= 60 ? "FAIR" : "POOR"}
          </Badge>
        </div>

        <div className="text-center">
          <span className={`text-4xl font-black ${scoreColor(overall)}`}>{overall}</span>
          <span className="text-lg text-muted-foreground">/100</span>
        </div>

        <div className="space-y-1.5">
          {modules.map((m) => (
            <div key={m.name} className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-16 truncate">{m.name}</span>
              <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                <div className={`h-full rounded-full ${barColor(m.score)}`} style={{ width: `${m.score}%` }} />
              </div>
              <span className={`text-[10px] font-semibold w-6 text-right ${scoreColor(m.score)}`}>{m.score}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
