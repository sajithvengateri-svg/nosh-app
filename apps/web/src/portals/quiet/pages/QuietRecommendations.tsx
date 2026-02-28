import { useMemo } from "react";
import { Info, DollarSign, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { runQuietAudit, getDemoAuditData } from "@/lib/shared/engines/quietAuditEngine";
import { buildRecoverySummary } from "@/lib/shared/engines/auditRecommendationEngine";

const QuietRecommendations = () => {
  const result = useMemo(() => runQuietAudit(getDemoAuditData()), []);
  const recovery = useMemo(() => buildRecoverySummary(result), [result]);

  return (
    <div className="p-3 lg:p-5 space-y-4 max-w-[1000px] mx-auto">
      <div>
        <h1 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-500" /> All Recommendations
        </h1>
        <p className="text-xs text-muted-foreground">{result.recommendations.length} actions identified · Sorted by priority</p>
      </div>

      {/* Found Money Summary */}
      <Card className="border-emerald-500/20">
        <CardContent className="p-4 flex items-center justify-around text-center">
          <div>
            <p className="text-[10px] text-muted-foreground">Annual Savings</p>
            <p className="text-xl font-bold font-mono text-emerald-500">${recovery.totalAnnualSavings.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Liability Reduction</p>
            <p className="text-xl font-bold font-mono text-amber-500">${recovery.totalLiabilities.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Total Found Money</p>
            <p className="text-xl font-bold font-mono text-foreground">${recovery.foundMoney.toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>

      {/* Recovery Roadmap */}
      {[
        { title: "🔴 Immediate (This Week)", items: recovery.immediateActions },
        { title: "🟡 Short-Term (1-4 Weeks)", items: recovery.shortTermActions },
        { title: "🔵 Medium-Term (1-3 Months)", items: recovery.mediumTermActions },
      ].map(section => section.items.length > 0 && (
        <div key={section.title}>
          <p className="text-xs font-semibold text-muted-foreground mb-2">{section.title}</p>
          <div className="space-y-2">
            {section.items.map((r, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-3 flex items-start gap-3">
                  <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0",
                    r.priority === "HIGH" ? "bg-rose-500" : r.priority === "MEDIUM" ? "bg-amber-500" : "bg-blue-400")} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">{r.action}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{r.how}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="outline" className="text-[8px] h-4 px-1">{r.module}</Badge>
                      <Badge variant="outline" className="text-[8px] h-4 px-1">
                        <DollarSign className="w-2.5 h-2.5 mr-0.5" />
                        {r.savingsMonthly > 0 ? `Save $${Math.round(r.savingsMonthly)}/mo` :
                         r.savingsMonthly < 0 ? `+$${Math.abs(Math.round(r.savingsMonthly))}/mo revenue` :
                         r.liabilityReduction ? `$${r.liabilityReduction} liability` : 'Compliance'}
                      </Badge>
                      <Badge variant="outline" className="text-[8px] h-4 px-1">{r.difficulty}</Badge>
                      <Badge variant="outline" className="text-[8px] h-4 px-1">{r.timeToEffect}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuietRecommendations;
