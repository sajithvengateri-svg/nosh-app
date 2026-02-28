import { Card, CardContent } from "@/components/ui/card";

interface CostLine {
  label: string;
  value: number;
  target: number;
}

interface Props {
  costs?: CostLine[];
  primeCost?: number;
  primeCostTarget?: number;
}

export function CostWidget({
  costs = [
    { label: "Food", value: 32.0, target: 30 },
    { label: "Bev", value: 18.5, target: 20 },
    { label: "Labour", value: 29.0, target: 28 },
    { label: "Supplies", value: 2.9, target: 3 },
  ],
  primeCost = 82.4,
  primeCostTarget = 81,
}: Props) {
  const statusColor = (val: number, target: number) =>
    val <= target ? "text-emerald-400" : val <= target * 1.05 ? "text-amber-400" : "text-destructive";

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cost Breakdown</p>

        <div className="space-y-2">
          {costs.map((c) => (
            <div key={c.label} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{c.label} %</span>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${statusColor(c.value, c.target)}`}>{c.value}%</span>
                <span className="text-[10px] text-muted-foreground">/ {c.target}%</span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-2 flex justify-between items-center">
          <span className="text-sm font-semibold text-foreground">Prime Cost</span>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold ${statusColor(primeCost, primeCostTarget)}`}>{primeCost}%</span>
            <span className="text-[10px] text-muted-foreground">/ {primeCostTarget}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
