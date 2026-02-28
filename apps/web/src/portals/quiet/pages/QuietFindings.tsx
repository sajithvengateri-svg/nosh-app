import { useState, useMemo } from "react";
import {
  AlertTriangle, CheckCircle2, Clock, Filter, Search,
  ChevronDown, ChevronRight, Eye, Edit2, Trash2, Plus,
  ShieldCheck, DollarSign, Scale, Users, ChefHat, Wine,
  Megaphone, BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { runQuietAudit, getDemoAuditData } from "@/lib/shared/engines/quietAuditEngine";

// ─── Types ───
type Severity = "critical" | "high" | "medium" | "low" | "info";
type FindingStatus = "open" | "in_progress" | "resolved" | "accepted";

interface Finding {
  id: string;
  title: string;
  description: string;
  module: string;
  severity: Severity;
  status: FindingStatus;
  financialImpact?: number;
  impactType?: "annual_savings" | "liability" | "revenue";
  detectedAt: string;
  resolvedAt?: string;
  assignee?: string;
  recommendation?: string;
  notes: string[];
}

// ─── Demo Findings from Audit Engine ───
function generateFindings(): Finding[] {
  const result = runQuietAudit(getDemoAuditData());
  const findings: Finding[] = [];
  let idx = 1;

  // Generate findings from recommendations
  result.recommendations.forEach(rec => {
    findings.push({
      id: `F-${String(idx++).padStart(3, "0")}`,
      title: rec.action,
      description: rec.how,
      module: rec.module,
      severity: rec.priority === "HIGH" ? (rec.liabilityReduction ? "critical" : "high") : rec.priority === "MEDIUM" ? "medium" : "low",
      status: "open",
      financialImpact: rec.savingsMonthly > 0 ? rec.savingsMonthly * 12 : rec.liabilityReduction ?? 0,
      impactType: rec.liabilityReduction ? "liability" : rec.savingsMonthly > 0 ? "annual_savings" : "revenue",
      detectedAt: new Date().toISOString(),
      recommendation: rec.how,
      notes: [],
    });
  });

  // Add compliance red line findings
  result.complianceRedLines.forEach((rl, i) => {
    findings.push({
      id: `F-${String(idx++).padStart(3, "0")}`,
      title: rl,
      description: "Critical compliance red line detected by Quiet Audit engine. Immediate action required.",
      module: "Compliance",
      severity: "critical",
      status: "open",
      detectedAt: new Date().toISOString(),
      notes: [],
    });
  });

  return findings;
}

const SEVERITY_CONFIG: Record<Severity, { label: string; color: string; bg: string }> = {
  critical: { label: "Critical", color: "text-rose-600", bg: "bg-rose-500/10 border-rose-500/30" },
  high: { label: "High", color: "text-rose-500", bg: "bg-rose-500/10 border-rose-500/20" },
  medium: { label: "Medium", color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20" },
  low: { label: "Low", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  info: { label: "Info", color: "text-muted-foreground", bg: "bg-muted/50 border-border" },
};

const STATUS_CONFIG: Record<FindingStatus, { label: string; icon: React.ElementType; color: string }> = {
  open: { label: "Open", icon: AlertTriangle, color: "text-rose-500" },
  in_progress: { label: "In Progress", icon: Clock, color: "text-amber-500" },
  resolved: { label: "Resolved", icon: CheckCircle2, color: "text-emerald-500" },
  accepted: { label: "Risk Accepted", icon: Eye, color: "text-muted-foreground" },
};

const MODULE_ICONS: Record<string, React.ElementType> = {
  Food: ChefHat, Beverage: Wine, Labour: Users, Overhead: BarChart3,
  Service: Scale, Marketing: Megaphone, Compliance: ShieldCheck,
};

const QuietFindings = () => {
  const [findings, setFindings] = useState<Finding[]>(() => generateFindings());
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterModule, setFilterModule] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(["Compliance", "Labour", "Food"]));
  const [newNote, setNewNote] = useState("");

  const filteredFindings = useMemo(() => {
    return findings.filter(f => {
      if (filterSeverity !== "all" && f.severity !== filterSeverity) return false;
      if (filterStatus !== "all" && f.status !== filterStatus) return false;
      if (filterModule !== "all" && f.module !== filterModule) return false;
      if (searchQuery && !f.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !f.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [findings, filterSeverity, filterStatus, filterModule, searchQuery]);

  const groupedFindings = useMemo(() => {
    const groups: Record<string, Finding[]> = {};
    filteredFindings.forEach(f => {
      if (!groups[f.module]) groups[f.module] = [];
      groups[f.module].push(f);
    });
    // Sort by severity within each group
    Object.values(groups).forEach(arr => arr.sort((a, b) => {
      const order: Severity[] = ["critical", "high", "medium", "low", "info"];
      return order.indexOf(a.severity) - order.indexOf(b.severity);
    }));
    return groups;
  }, [filteredFindings]);

  const stats = useMemo(() => ({
    total: findings.length,
    critical: findings.filter(f => f.severity === "critical").length,
    open: findings.filter(f => f.status === "open").length,
    resolved: findings.filter(f => f.status === "resolved").length,
    totalImpact: findings.filter(f => f.financialImpact && f.status !== "resolved")
      .reduce((s, f) => s + (f.financialImpact ?? 0), 0),
  }), [findings]);

  const updateStatus = (id: string, status: FindingStatus) => {
    setFindings(prev => prev.map(f =>
      f.id === id ? { ...f, status, resolvedAt: status === "resolved" ? new Date().toISOString() : undefined } : f
    ));
    if (selectedFinding?.id === id) {
      setSelectedFinding(prev => prev ? { ...prev, status, resolvedAt: status === "resolved" ? new Date().toISOString() : undefined } : null);
    }
  };

  const addNote = (id: string) => {
    if (!newNote.trim()) return;
    setFindings(prev => prev.map(f =>
      f.id === id ? { ...f, notes: [...f.notes, `${new Date().toLocaleString()}: ${newNote}`] } : f
    ));
    if (selectedFinding?.id === id) {
      setSelectedFinding(prev => prev ? { ...prev, notes: [...prev.notes, `${new Date().toLocaleString()}: ${newNote}`] } : null);
    }
    setNewNote("");
  };

  const toggleModule = (mod: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      next.has(mod) ? next.delete(mod) : next.add(mod);
      return next;
    });
  };

  const modules = Object.keys(groupedFindings).sort((a, b) => {
    const order = ["Compliance", "Labour", "Food", "Overhead", "Service", "Beverage", "Marketing"];
    return order.indexOf(a) - order.indexOf(b);
  });

  return (
    <div className="p-3 lg:p-5 space-y-4 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" /> Audit Findings
          </h1>
          <p className="text-xs text-muted-foreground">
            {stats.total} findings · {stats.critical} critical · {stats.open} open
          </p>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <Card className="border-border/50">
          <CardContent className="p-2 text-center">
            <p className="text-[10px] text-muted-foreground">Total</p>
            <p className="text-lg font-bold font-mono text-foreground">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-rose-500/20">
          <CardContent className="p-2 text-center">
            <p className="text-[10px] text-muted-foreground">Critical</p>
            <p className="text-lg font-bold font-mono text-rose-500">{stats.critical}</p>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20">
          <CardContent className="p-2 text-center">
            <p className="text-[10px] text-muted-foreground">Open</p>
            <p className="text-lg font-bold font-mono text-amber-500">{stats.open}</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-500/20">
          <CardContent className="p-2 text-center">
            <p className="text-[10px] text-muted-foreground">Resolved</p>
            <p className="text-lg font-bold font-mono text-emerald-500">{stats.resolved}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-2 text-center">
            <p className="text-[10px] text-muted-foreground">Open Impact</p>
            <p className="text-lg font-bold font-mono text-foreground">${stats.totalImpact.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-muted-foreground" />
          <Input placeholder="Search findings..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="pl-8 h-7 text-xs" />
        </div>
        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
          <SelectTrigger className="w-28 h-7 text-xs"><SelectValue placeholder="Severity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-28 h-7 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterModule} onValueChange={setFilterModule}>
          <SelectTrigger className="w-28 h-7 text-xs"><SelectValue placeholder="Module" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modules</SelectItem>
            {["Compliance", "Labour", "Food", "Beverage", "Overhead", "Service", "Marketing"].map(m => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Findings by Module */}
      <div className="space-y-2">
        {modules.map(mod => {
          const moduleFindings = groupedFindings[mod];
          const ModIcon = MODULE_ICONS[mod] || AlertTriangle;
          const isExpanded = expandedModules.has(mod);
          const critCount = moduleFindings.filter(f => f.severity === "critical" || f.severity === "high").length;

          return (
            <Card key={mod} className="border-border/50">
              <button className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-muted/30 transition-colors"
                onClick={() => toggleModule(mod)}>
                {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                <ModIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground flex-1 text-left">{mod}</span>
                <Badge variant="outline" className="text-[8px] h-4 px-1">{moduleFindings.length}</Badge>
                {critCount > 0 && <Badge className="text-[8px] h-4 px-1 bg-rose-500/10 text-rose-500 border-rose-500/30">{critCount} critical</Badge>}
              </button>

              {isExpanded && (
                <CardContent className="px-4 pb-3 pt-0 space-y-1.5">
                  {moduleFindings.map(finding => {
                    const sevConfig = SEVERITY_CONFIG[finding.severity];
                    const statusConfig = STATUS_CONFIG[finding.status];
                    const StatusIcon = statusConfig.icon;
                    return (
                      <div key={finding.id}
                        className={cn("flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer hover:bg-muted/30 transition-colors", sevConfig.bg)}
                        onClick={() => { setSelectedFinding(finding); setDetailOpen(true); }}>
                        <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0",
                          finding.severity === "critical" || finding.severity === "high" ? "bg-rose-500" : finding.severity === "medium" ? "bg-amber-500" : "bg-blue-400")} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground font-mono">{finding.id}</span>
                            <Badge variant="outline" className={cn("text-[7px] h-3.5 px-1", sevConfig.color)}>{sevConfig.label}</Badge>
                            <div className={cn("flex items-center gap-0.5 text-[8px]", statusConfig.color)}>
                              <StatusIcon className="w-2.5 h-2.5" /> {statusConfig.label}
                            </div>
                          </div>
                          <p className="text-xs font-medium text-foreground mt-0.5 line-clamp-1">{finding.title}</p>
                          {finding.financialImpact !== undefined && finding.financialImpact > 0 && (
                            <Badge variant="outline" className="text-[7px] h-3.5 px-1 mt-1">
                              <DollarSign className="w-2.5 h-2.5 mr-0.5" />
                              ${finding.financialImpact.toLocaleString()} {finding.impactType === "annual_savings" ? "/yr savings" : finding.impactType === "liability" ? "liability" : "revenue"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Finding Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          {selectedFinding && (() => {
            const sevConfig = SEVERITY_CONFIG[selectedFinding.severity];
            const statusConfig = STATUS_CONFIG[selectedFinding.status];
            const StatusIcon = statusConfig.icon;
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] text-muted-foreground font-mono">{selectedFinding.id}</span>
                    <Badge variant="outline" className={cn("text-[8px]", sevConfig.color)}>{sevConfig.label}</Badge>
                    <Badge variant="outline" className={cn("text-[8px]", statusConfig.color)}>
                      <StatusIcon className="w-2.5 h-2.5 mr-0.5" />{statusConfig.label}
                    </Badge>
                  </div>
                  <DialogTitle className="text-sm">{selectedFinding.title}</DialogTitle>
                  <DialogDescription className="text-xs">{selectedFinding.description}</DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                  <div className="flex gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground">Module:</span>
                      <span className="ml-1 font-medium">{selectedFinding.module}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Detected:</span>
                      <span className="ml-1 font-medium">{new Date(selectedFinding.detectedAt).toLocaleDateString()}</span>
                    </div>
                    {selectedFinding.financialImpact !== undefined && selectedFinding.financialImpact > 0 && (
                      <div>
                        <span className="text-muted-foreground">Impact:</span>
                        <span className="ml-1 font-bold text-amber-500">${selectedFinding.financialImpact.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {selectedFinding.recommendation && (
                    <div className="p-2 rounded-lg bg-muted/30 border border-border/50">
                      <p className="text-[10px] font-bold text-muted-foreground mb-1">RECOMMENDATION</p>
                      <p className="text-xs text-foreground">{selectedFinding.recommendation}</p>
                    </div>
                  )}

                  <Separator />

                  {/* Status Update */}
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Update Status</Label>
                    <div className="flex gap-1.5">
                      {(["open", "in_progress", "resolved", "accepted"] as FindingStatus[]).map(s => (
                        <Button key={s} variant={selectedFinding.status === s ? "default" : "outline"}
                          size="sm" className="text-[10px] h-6" onClick={() => updateStatus(selectedFinding.id, s)}>
                          {STATUS_CONFIG[s].label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Notes ({selectedFinding.notes.length})</Label>
                    {selectedFinding.notes.length > 0 && (
                      <div className="space-y-1 mb-2 max-h-32 overflow-y-auto">
                        {selectedFinding.notes.map((note, i) => (
                          <p key={i} className="text-[10px] text-muted-foreground p-1.5 rounded bg-muted/30">{note}</p>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-1.5">
                      <Input placeholder="Add a note..." value={newNote} onChange={e => setNewNote(e.target.value)}
                        className="text-xs h-7 flex-1" onKeyDown={e => e.key === "Enter" && addNote(selectedFinding.id)} />
                      <Button size="sm" className="text-[10px] h-7" onClick={() => addNote(selectedFinding.id)}>Add</Button>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuietFindings;
