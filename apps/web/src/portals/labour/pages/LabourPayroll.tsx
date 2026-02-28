import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, FileText, Plus, ShieldCheck, AlertTriangle, Download, CheckCircle, Clock } from "lucide-react";
import { useOrg } from "@/contexts/OrgContext";
import { usePayrollRuns } from "@/lib/shared/queries/labourQueries";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { addDays, differenceInDays, parseISO } from "date-fns";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "secondary",
  CALCULATED: "outline",
  APPROVED: "default",
  PROCESSED: "default",
  FINALISED: "default",
};

const SUPER_STEPS = [
  { key: "super_file_generated", label: "File Generated" },
  { key: "super_uploaded", label: "Uploaded" },
  { key: "super_confirmed", label: "Confirmed" },
  { key: "super_received", label: "Received" },
];

const LabourPayroll = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const navigate = useNavigate();
  const { data: runs, isLoading } = usePayrollRuns(orgId);

  const stats = useMemo(() => {
    if (!runs?.length) return { totalGross: 0, totalSuper: 0, count: 0 };
    const recent = runs.slice(0, 4);
    return {
      totalGross: recent.reduce((s, r) => s + (r.total_gross || 0), 0),
      totalSuper: recent.reduce((s, r) => s + (r.total_super || 0), 0),
      count: runs.length,
    };
  }, [runs]);

  // Super deadline tracking for latest run
  const latestRun = runs?.[0];
  const superDeadline = useMemo(() => {
    if (!latestRun?.period_end) return null;
    const payDate = parseISO(latestRun.period_end);
    const deadline = addDays(payDate, 7);
    const daysLeft = differenceInDays(deadline, new Date());
    return { deadline, daysLeft };
  }, [latestRun]);

  // Last 4 runs for super history
  const superHistory = useMemo(() => runs?.slice(0, 4) || [], [runs]);

  // CSV download for super contributions
  const handleDownloadSuperCSV = () => {
    if (!latestRun) return;
    // Generate placeholder CSV
    const csv = "Employee,Fund Name,USI,Member Number,SG Amount\n" +
      "Sample Employee,AustralianSuper,STA0100AU,123456,$" + ((latestRun.total_super || 0) / (latestRun.total_employees || 1)).toFixed(2);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `super_contributions_${latestRun.period_start}_${latestRun.period_end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <div className="p-4 lg:p-6 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-[300px] w-full" /></div>;
  }

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payroll</h1>
          <p className="text-muted-foreground text-sm">Pay runs, STP reporting, and super tracking.</p>
        </div>
        <Button onClick={() => navigate("/labour/payroll/new")} className="gap-2">
          <Plus className="w-4 h-4" /> New Pay Run
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" /> Pay Runs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-foreground">{stats.count}</p>
            <p className="text-[11px] text-muted-foreground">total processed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5" /> Recent Gross
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-foreground">${stats.totalGross.toLocaleString()}</p>
            <p className="text-[11px] text-muted-foreground">last 4 periods</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5" /> Super
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-foreground">${stats.totalSuper.toLocaleString()}</p>
            <p className="text-[11px] text-muted-foreground">last 4 periods</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5" /> STP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-foreground">
              {runs?.filter(r => r.stp_submitted).length || 0}/{stats.count}
            </p>
            <p className="text-[11px] text-muted-foreground">submitted to ATO</p>
          </CardContent>
        </Card>
      </div>

      {/* Pay runs table */}
      {!runs?.length ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No pay runs yet. Create your first pay run to get started.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Cycle</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead>Gross</TableHead>
                  <TableHead>Tax</TableHead>
                  <TableHead>Super</TableHead>
                  <TableHead>Net</TableHead>
                  <TableHead>STP</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map(run => (
                  <TableRow key={run.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium text-foreground">
                      {run.period_start} → {run.period_end}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{run.pay_cycle}</TableCell>
                    <TableCell>{run.total_employees ?? "—"}</TableCell>
                    <TableCell className="font-medium">${(run.total_gross || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">${(run.total_tax || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">${(run.total_super || 0).toLocaleString()}</TableCell>
                    <TableCell className="font-medium">${(run.total_net || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      {run.stp_submitted ? (
                        <Badge variant="default" className="text-xs">Submitted</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[run.status] || "secondary"}>
                        {run.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Super Tracker */}
      {latestRun && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Super Status — {latestRun.period_start} to {latestRun.period_end}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total super this pay run:</span>
                <span className="font-medium text-foreground">${(latestRun.total_super || 0).toFixed(2)}</span>
              </div>
              {superDeadline && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment deadline (7 days):</span>
                  <span className={`font-medium ${superDeadline.daysLeft <= 3 ? "text-destructive" : "text-foreground"}`}>
                    {superDeadline.deadline.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}
                  </span>
                </div>
              )}
            </div>

            {/* Progress steps */}
            <div className="flex items-center gap-2">
              {SUPER_STEPS.map((step, i) => {
                const done = (latestRun as any)[step.key];
                return (
                  <div key={step.key} className="flex items-center gap-1">
                    {i > 0 && <div className={`h-0.5 w-4 ${done ? "bg-green-500" : "bg-border"}`} />}
                    <div className="flex flex-col items-center gap-0.5">
                      {done ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="text-[10px] text-muted-foreground text-center">{step.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Deadline warning */}
            {superDeadline && superDeadline.daysLeft <= 3 && superDeadline.daysLeft >= 0 && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/30">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <span className="text-sm text-destructive font-medium">
                  {superDeadline.daysLeft} day{superDeadline.daysLeft !== 1 ? "s" : ""} remaining until super deadline
                </span>
              </div>
            )}

            {/* Super CSV download */}
            <Button variant="outline" size="sm" onClick={handleDownloadSuperCSV}>
              <Download className="w-4 h-4 mr-1" /> Download Super CSV
            </Button>

            {/* History */}
            {superHistory.length > 1 && (
              <div className="border-t border-border pt-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">HISTORY</p>
                <div className="space-y-1">
                  {superHistory.slice(1).map(run => (
                    <div key={run.id} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{run.period_start} — {run.period_end}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">${(run.total_super || 0).toFixed(2)}</span>
                        {run.super_confirmed ? (
                          <Badge variant="default" className="text-[9px]">Confirmed</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[9px]">Pending</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LabourPayroll;
