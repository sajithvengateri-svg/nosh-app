import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ServiceLog } from "@/types/housekeeping";

interface ServiceReportViewProps {
  logs: ServiceLog[];
  serviceLabel: string;
}

function groupByMonth(logs: ServiceLog[]): Record<string, ServiceLog[]> {
  const grouped: Record<string, ServiceLog[]> = {};
  for (const log of logs) {
    const month = log.service_date.slice(0, 7);
    if (!grouped[month]) grouped[month] = [];
    grouped[month].push(log);
  }
  return grouped;
}

export default function ServiceReportView({ logs, serviceLabel }: ServiceReportViewProps) {
  const grouped = useMemo(() => groupByMonth(logs), [logs]);

  const monthlySummary = useMemo(() => {
    return Object.entries(grouped)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([month, entries]) => ({
        month,
        count: entries.length,
        totalCost: entries.reduce((sum, e) => sum + (e.cost ?? 0), 0),
        avgCost: entries.filter((e) => e.cost != null && e.cost > 0).length > 0
          ? entries.reduce((sum, e) => sum + (e.cost ?? 0), 0) / entries.filter((e) => e.cost != null && e.cost > 0).length
          : 0,
      }));
  }, [grouped]);

  const totalCost = logs.reduce((sum, l) => sum + (l.cost ?? 0), 0);
  const totalEntries = logs.length;

  const exportCSV = () => {
    const header = "Date,Provider,Cost,Notes,Invoice URL\n";
    const rows = logs.map((l) =>
      [
        l.service_date,
        `"${(l.provider_name || "").replace(/"/g, '""')}"`,
        l.cost?.toFixed(2) ?? "",
        `"${(l.notes || "").replace(/"/g, '""')}"`,
        l.invoice_url || "",
      ].join(",")
    ).join("\n");

    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${serviceLabel.toLowerCase().replace(/\s+/g, "_")}_report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          No data to report yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={exportCSV}>
          <Download className="w-3 h-3 mr-1" /> Export CSV
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handlePrint}>
          <Printer className="w-3 h-3 mr-1" /> Print
        </Button>
      </div>

      {/* Totals */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold tabular-nums">{totalEntries}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Total Entries</p>
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">${totalCost.toFixed(2)}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Total Cost</p>
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">
                ${totalEntries > 0 ? (totalCost / totalEntries).toFixed(2) : "0.00"}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase">Avg per Entry</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Summary Table */}
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Month</th>
                <th className="text-right p-3 text-sm font-medium text-muted-foreground">Entries</th>
                <th className="text-right p-3 text-sm font-medium text-muted-foreground">Total Cost</th>
                <th className="text-right p-3 text-sm font-medium text-muted-foreground">Avg Cost</th>
              </tr>
            </thead>
            <tbody>
              {monthlySummary.map((row) => (
                <tr key={row.month} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-medium">{format(parseISO(`${row.month}-01`), "MMMM yyyy")}</td>
                  <td className="p-3 text-right tabular-nums">{row.count}</td>
                  <td className="p-3 text-right tabular-nums font-medium">${row.totalCost.toFixed(2)}</td>
                  <td className="p-3 text-right tabular-nums text-muted-foreground">${row.avgCost.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Entries Table */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">All Entries</p>
        <div className="card-elevated overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Date</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Provider</th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">Cost</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Notes</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="p-3 text-sm">{format(parseISO(log.service_date), "d MMM yyyy")}</td>
                    <td className="p-3 text-sm">{log.provider_name || "-"}</td>
                    <td className="p-3 text-sm text-right tabular-nums font-medium">
                      {log.cost != null && log.cost > 0 ? `$${log.cost.toFixed(2)}` : "-"}
                    </td>
                    <td className="p-3 text-sm text-muted-foreground truncate max-w-[200px]">{log.notes || "-"}</td>
                    <td className="p-3 text-sm">
                      {log.invoice_url ? (
                        <a href={log.invoice_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs">
                          View
                        </a>
                      ) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
