import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWasteLogs, useReviewWasteLog, REASON_LABELS } from "@/hooks/useWasteLogs";
import { format } from "date-fns";
import { Check, X, Loader2 } from "lucide-react";

interface WasteReviewProps {
  module?: "food" | "beverage";
}

const WasteReview = ({ module }: WasteReviewProps) => {
  const [statusFilter, setStatusFilter] = useState("pending");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: logs = [], isLoading } = useWasteLogs(module, {
    status: statusFilter || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });
  const review = useReviewWasteLog();

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const selectAll = () => {
    if (selected.size === logs.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(logs.map((l) => l.id)));
    }
  };

  const handleBatch = (action: "approved" | "rejected") => {
    if (selected.size === 0) return;
    review.mutate({ ids: Array.from(selected), action }, {
      onSuccess: () => setSelected(new Set()),
    });
  };

  const pendingCount = logs.filter((l) => l.status === "pending").length;
  const totalCost = logs.reduce((s, l) => s + (l.cost || 0), 0);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{logs.length}</p>
            <p className="text-xs text-muted-foreground">Total Entries</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-warning">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">${totalCost.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Total Cost</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{selected.size}</p>
            <p className="text-xs text-muted-foreground">Selected</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Status</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">From</label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">To</label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
        </div>
        {statusFilter === "pending" && selected.size > 0 && (
          <div className="flex gap-2 ml-auto">
            <Button size="sm" variant="default" onClick={() => handleBatch("approved")} disabled={review.isPending}>
              <Check className="w-4 h-4 mr-1" /> Approve ({selected.size})
            </Button>
            <Button size="sm" variant="destructive" onClick={() => handleBatch("rejected")} disabled={review.isPending}>
              <X className="w-4 h-4 mr-1" /> Reject ({selected.size})
            </Button>
          </div>
        )}
      </div>

      {/* Entries */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : logs.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No waste entries found</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {statusFilter === "pending" && (
            <div className="flex items-center gap-2 px-2">
              <Checkbox checked={selected.size === logs.length && logs.length > 0} onCheckedChange={selectAll} />
              <span className="text-sm text-muted-foreground">Select all</span>
            </div>
          )}
          {logs.map((log) => (
            <Card key={log.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4 flex items-center gap-4">
                {statusFilter === "pending" && (
                  <Checkbox checked={selected.has(log.id)} onCheckedChange={() => toggleSelect(log.id)} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground">{log.item_name}</span>
                    <Badge variant="outline" className="text-xs">{REASON_LABELS[log.reason] || log.reason}</Badge>
                    <Badge variant={log.status === "approved" ? "default" : log.status === "rejected" ? "destructive" : "secondary"} className="text-xs">
                      {log.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {log.quantity} {log.unit} · ${log.cost.toFixed(2)} · by {log.logged_by_name} · {format(new Date(log.created_at), "dd MMM HH:mm")}
                  </p>
                  {log.notes && <p className="text-xs text-muted-foreground mt-1 italic">{log.notes}</p>}
                </div>
                {statusFilter === "pending" && (
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={() => review.mutate({ ids: [log.id], action: "approved" })}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => review.mutate({ ids: [log.id], action: "rejected" })}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default WasteReview;
