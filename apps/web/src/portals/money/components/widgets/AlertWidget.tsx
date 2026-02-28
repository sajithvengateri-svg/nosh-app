import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Alert {
  msg: string;
  severity: "high" | "medium" | "low";
  time: string;
}

interface Props {
  alerts?: Alert[];
}

export function AlertWidget({
  alerts = [
    { msg: "Food cost trending to 33.2% — above 30% target", severity: "high", time: "2h ago" },
    { msg: "Saturday cash variance 2.8%", severity: "medium", time: "5h ago" },
    { msg: "3 break violations this week", severity: "high", time: "1d ago" },
  ],
}: Props) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Alerts</p>

        {alerts.map((a, i) => (
          <div key={i} className="flex items-start gap-2 py-1.5 border-b border-border last:border-0">
            <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${a.severity === "high" ? "text-destructive" : "text-amber-400"}`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-foreground leading-tight">{a.msg}</p>
              <p className="text-[10px] text-muted-foreground">{a.time}</p>
            </div>
          </div>
        ))}

        <Button variant="ghost" size="sm" className="w-full text-xs h-7" onClick={() => navigate("/money/reactor")}>
          View All <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}
