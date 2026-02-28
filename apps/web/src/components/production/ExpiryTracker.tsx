import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Trash2, Clock, Eye, Plus, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useProductionExpiry, ExpiryLogEntry } from "@/hooks/useProductionExpiry";
import { toast } from "sonner";
import { formatDistanceToNow, differenceInHours, format } from "date-fns";

type StatusFilter = "all" | "active" | "checked" | "expired" | "discarded";

function getExpiryColor(entry: ExpiryLogEntry) {
  if (entry.status === "discarded") return "bg-muted text-muted-foreground";
  if (!entry.expires_at) return "bg-muted text-muted-foreground";
  const hoursLeft = differenceInHours(new Date(entry.expires_at), new Date());
  if (hoursLeft <= 0) return "bg-destructive/10 text-destructive border-destructive/30";
  if (hoursLeft <= 24) return "bg-destructive/10 text-destructive border-destructive/30";
  if (hoursLeft <= 48) return "bg-warning/10 text-warning border-warning/30";
  return "bg-success/10 text-success border-success/30";
}

function getExpiryBadge(entry: ExpiryLogEntry) {
  if (entry.status === "discarded") return <Badge variant="outline">Discarded</Badge>;
  if (!entry.expires_at) return <Badge variant="outline">No Expiry</Badge>;
  const hoursLeft = differenceInHours(new Date(entry.expires_at), new Date());
  if (hoursLeft <= 0) return <Badge variant="destructive">Expired</Badge>;
  if (hoursLeft <= 24) return <Badge className="bg-destructive/80 text-destructive-foreground">&lt;24h</Badge>;
  if (hoursLeft <= 48) return <Badge className="bg-warning text-warning-foreground">24-48h</Badge>;
  return <Badge className="bg-success/80 text-success-foreground">OK</Badge>;
}

const ExpiryTracker = () => {
  const { entries, loading, checkEntry, discardEntry } = useProductionExpiry();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [checkDialog, setCheckDialog] = useState<string | null>(null);
  const [checkNotes, setCheckNotes] = useState("");

  // Toast alerts on load
  useEffect(() => {
    if (loading) return;
    const alerting = entries.filter(e => {
      if (e.status === "discarded" || !e.expires_at) return false;
      const alertThreshold = new Date(e.expires_at);
      alertThreshold.setHours(alertThreshold.getHours() - (e.alert_hours_before || 24));
      return new Date() >= alertThreshold && e.status === "active";
    });
    if (alerting.length > 0) {
      toast.warning(`${alerting.length} batch${alerting.length > 1 ? "es" : ""} expiring soon!`);
    }
  }, [loading, entries]);

  const filtered = entries.filter(e => {
    if (filter !== "all") {
      if (filter === "expired") {
        if (e.status === "discarded") return false;
        if (!e.expires_at) return false;
        return differenceInHours(new Date(e.expires_at), new Date()) <= 0;
      }
      if (e.status !== filter) return false;
    }
    if (search) {
      const s = search.toLowerCase();
      return (e.recipe_name || "").toLowerCase().includes(s) || (e.batch_code || "").toLowerCase().includes(s);
    }
    return true;
  });

  const handleCheck = () => {
    if (checkDialog) {
      checkEntry(checkDialog, checkNotes);
      setCheckDialog(null);
      setCheckNotes("");
    }
  };

  const filters: { label: string; value: StatusFilter }[] = [
    { label: "All", value: "all" },
    { label: "Active", value: "active" },
    { label: "Checked", value: "checked" },
    { label: "Expired", value: "expired" },
    { label: "Discarded", value: "discarded" },
  ];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search batches..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {filters.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                filter === f.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-secondary"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Entries */}
      {loading ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No expiry entries found.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry, idx) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              <Card className={`border ${getExpiryColor(entry)}`}>
                <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{entry.recipe_name || "Unknown"}</p>
                      {entry.batch_code && (
                        <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{entry.batch_code}</span>
                      )}
                      {getExpiryBadge(entry)}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      {entry.produced_at && <span>Produced: {format(new Date(entry.produced_at), "dd MMM HH:mm")}</span>}
                      {entry.expires_at && (
                        <span>
                          Expires: {format(new Date(entry.expires_at), "dd MMM HH:mm")}
                          {differenceInHours(new Date(entry.expires_at), new Date()) > 0 &&
                            ` (${formatDistanceToNow(new Date(entry.expires_at), { addSuffix: false })} left)`}
                        </span>
                      )}
                      {entry.storage_temp && <Badge variant="outline" className="text-[10px] py-0">{entry.storage_temp}</Badge>}
                    </div>
                    {entry.last_checked_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Last checked: {formatDistanceToNow(new Date(entry.last_checked_at), { addSuffix: true })}
                        {entry.check_notes && ` — "${entry.check_notes}"`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {entry.status !== "discarded" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => setCheckDialog(entry.id)}>
                          <Eye className="w-3.5 h-3.5 mr-1" /> Check
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => discardEntry(entry.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Check Dialog */}
      <Dialog open={!!checkDialog} onOpenChange={(o) => { if (!o) { setCheckDialog(null); setCheckNotes(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Log Quality Check</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Notes (optional)</Label>
              <Textarea
                value={checkNotes}
                onChange={(e) => setCheckNotes(e.target.value)}
                placeholder="e.g. Looks fine, no discoloration..."
              />
            </div>
            <Button onClick={handleCheck} className="w-full">
              <CheckCircle2 className="w-4 h-4 mr-2" /> Confirm Check
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpiryTracker;
