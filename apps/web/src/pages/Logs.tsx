import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, AlertTriangle, CheckCircle2, Clock, Filter, MessageSquareWarning } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { useFoodComplaints } from "@/hooks/useFoodComplaints";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const SEVERITY_COLORS: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/20 text-warning",
  high: "bg-destructive/20 text-destructive",
  critical: "bg-destructive text-destructive-foreground",
};

const STATUS_ICONS: Record<string, typeof Clock> = {
  open: Clock,
  investigating: AlertTriangle,
  resolved: CheckCircle2,
};

const FoodComplaintsLog = () => {
  const { complaints, loading, addComplaint, resolveComplaint } = useFoodComplaints();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState<string | null>(null);
  const [resolution, setResolution] = useState("");
  const [newComplaint, setNewComplaint] = useState({
    complaint_text: "",
    dish_name: "",
    severity: "medium",
    source: "in-person",
    category: "quality",
  });

  const filtered = complaints.filter((c) => {
    const matchesSearch =
      !search ||
      c.complaint_text?.toLowerCase().includes(search.toLowerCase()) ||
      c.dish_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: complaints.length,
    open: complaints.filter((c) => c.status === "open").length,
    critical: complaints.filter((c) => c.severity === "critical" || c.severity === "high").length,
    resolved: complaints.filter((c) => c.status === "resolved").length,
  };

  const handleAdd = async () => {
    if (!newComplaint.complaint_text) return;
    await addComplaint({
      ...newComplaint,
      complaint_date: new Date().toISOString(),
      status: "open",
    });
    setNewComplaint({ complaint_text: "", dish_name: "", severity: "medium", source: "in-person", category: "quality" });
    setAddOpen(false);
  };

  const handleResolve = async () => {
    if (!resolveOpen || !resolution) return;
    await resolveComplaint(resolveOpen, resolution);
    setResolution("");
    setResolveOpen(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, icon: "📋" },
          { label: "Open", value: stats.open, icon: "🔴" },
          { label: "Critical", value: stats.critical, icon: "⚠️" },
          { label: "Resolved", value: stats.resolved, icon: "✅" },
        ].map((s) => (
          <div key={s.label} className="card-elevated p-3 text-center">
            <div className="text-lg">{s.icon}</div>
            <div className="stat-value text-xl">{s.value}</div>
            <div className="stat-label text-xs">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search complaints..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <Filter className="w-4 h-4 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="investigating">Investigating</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1"><Plus className="w-4 h-4" /> Log Complaint</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log Food Complaint</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div><Label>Dish Name</Label><Input value={newComplaint.dish_name} onChange={(e) => setNewComplaint((p) => ({ ...p, dish_name: e.target.value }))} placeholder="e.g. Grilled Salmon" /></div>
              <div><Label>Complaint</Label><Textarea value={newComplaint.complaint_text} onChange={(e) => setNewComplaint((p) => ({ ...p, complaint_text: e.target.value }))} placeholder="Describe the complaint..." /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Severity</Label><Select value={newComplaint.severity} onValueChange={(v) => setNewComplaint((p) => ({ ...p, severity: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="critical">Critical</SelectItem></SelectContent></Select></div>
                <div><Label>Source</Label><Select value={newComplaint.source} onValueChange={(v) => setNewComplaint((p) => ({ ...p, source: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="in-person">In Person</SelectItem><SelectItem value="online">Online Review</SelectItem><SelectItem value="phone">Phone</SelectItem><SelectItem value="social">Social Media</SelectItem></SelectContent></Select></div>
              </div>
              <Button onClick={handleAdd} className="w-full">Submit Complaint</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {filtered.length === 0 ? (
        <div className="card-elevated p-8 text-center text-muted-foreground">No complaints found</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c, i) => {
            const StatusIcon = STATUS_ICONS[c.status] || Clock;
            return (
              <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="card-elevated p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <StatusIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                      {c.dish_name && <span className="font-medium text-sm">{c.dish_name}</span>}
                      <Badge variant="outline" className={SEVERITY_COLORS[c.severity] || ""}>{c.severity}</Badge>
                      <Badge variant="outline" className="text-xs">{c.source}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{c.complaint_text}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(c.complaint_date).toLocaleDateString()}</p>
                    {c.resolution && <p className="text-xs text-accent mt-1">Resolution: {c.resolution}</p>}
                  </div>
                  {c.status !== "resolved" && (
                    <Button size="sm" variant="outline" onClick={() => setResolveOpen(c.id)}>Resolve</Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Dialog open={!!resolveOpen} onOpenChange={(o) => !o && setResolveOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Resolve Complaint</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div><Label>Resolution</Label><Textarea value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="How was this resolved?" /></div>
            <Button onClick={handleResolve} className="w-full">Mark Resolved</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Logs = () => {
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="page-title font-display">Master Logs</h1>
          <p className="page-subtitle">Track complaints, incidents, and operational events</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex gap-2 overflow-x-auto pb-1">
          <button className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all", "bg-primary text-primary-foreground shadow-md")}>
            <MessageSquareWarning className="w-4 h-4" />
            Food Complaints
          </button>
        </motion.div>

        <FoodComplaintsLog />
      </div>
    </AppLayout>
  );
};

export default Logs;
