import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollText, Download, Search } from "lucide-react";

interface AuditEvent {
  id: string; timestamp: string; user: string; action: string; amount: number | null; reason: string;
}

const demoEvents: AuditEvent[] = [
  { id: "a1", timestamp: "2026-02-18 19:42", user: "Tom Wilson", action: "Void", amount: 45.00, reason: "Customer changed mind" },
  { id: "a2", timestamp: "2026-02-18 19:15", user: "Emma Davis", action: "Discount", amount: 12.50, reason: "Loyalty — regular" },
  { id: "a3", timestamp: "2026-02-18 18:30", user: "Sophie Chen", action: "Refund", amount: 28.00, reason: "Wrong order served" },
  { id: "a4", timestamp: "2026-02-18 17:55", user: "Tom Wilson", action: "Cash Draw", amount: null, reason: "No sale — change for customer" },
  { id: "a5", timestamp: "2026-02-18 17:20", user: "Ryan Mitchell", action: "Override", amount: null, reason: "Manager override — late clock-in" },
  { id: "a6", timestamp: "2026-02-18 14:10", user: "Emma Davis", action: "Comp", amount: 35.00, reason: "VIP guest — owner comp" },
  { id: "a7", timestamp: "2026-02-17 21:00", user: "Tom Wilson", action: "Void", amount: 22.00, reason: "Duplicate entry" },
  { id: "a8", timestamp: "2026-02-17 20:15", user: "Sophie Chen", action: "Discount", amount: 8.90, reason: "Happy hour" },
  { id: "a9", timestamp: "2026-02-17 19:30", user: "Ryan Mitchell", action: "Refund", amount: 55.00, reason: "Food quality complaint" },
  { id: "a10", timestamp: "2026-02-17 18:00", user: "Emma Davis", action: "Cash Draw", amount: null, reason: "End of shift cash count" },
];

const actionColors: Record<string, string> = {
  Void: "bg-red-500/20 text-red-400",
  Refund: "bg-orange-500/20 text-orange-400",
  Discount: "bg-blue-500/20 text-blue-400",
  Comp: "bg-purple-500/20 text-purple-400",
  "Cash Draw": "bg-amber-500/20 text-amber-400",
  Override: "bg-rose-500/20 text-rose-400",
};

export default function POSAuditLog() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("All");

  const filtered = demoEvents.filter((e) => {
    const matchSearch = e.user.toLowerCase().includes(search.toLowerCase()) || e.reason.toLowerCase().includes(search.toLowerCase());
    const matchAction = actionFilter === "All" || e.action === actionFilter;
    return matchSearch && matchAction;
  });

  const handleExport = () => {
    const csv = ["Timestamp,User,Action,Amount,Reason", ...filtered.map(e =>
      `${e.timestamp},${e.user},${e.action},${e.amount ?? ""},${e.reason}`)
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "audit-log.csv"; a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Audit Log</h1>
          <p className="text-sm text-slate-400">Append-only event trail</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} className="border-white/10 text-slate-300">
          <Download className="w-4 h-4 mr-1" /> Export CSV
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input placeholder="Search events..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white" />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[140px] bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["All", "Void", "Refund", "Discount", "Comp", "Cash Draw", "Override"].map(a => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {filtered.map((e) => (
          <Card key={e.id} className="bg-white/5 border-white/10">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ScrollText className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{e.user}</span>
                    <Badge className={actionColors[e.action] || ""} variant="secondary">{e.action}</Badge>
                  </div>
                  <p className="text-xs text-slate-400">{e.reason}</p>
                </div>
              </div>
              <div className="text-right">
                {e.amount !== null && <p className="text-sm font-semibold text-white">${e.amount.toFixed(2)}</p>}
                <p className="text-xs text-slate-500">{e.timestamp}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
