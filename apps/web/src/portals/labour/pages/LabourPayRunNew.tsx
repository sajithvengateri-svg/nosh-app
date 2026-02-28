import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Calculator, FileText, Download } from "lucide-react";
import { useOrg } from "@/contexts/OrgContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, subWeeks } from "date-fns";

// STP Phase 2 category display
interface STPBreakdown {
  gross_salary: number;
  paid_leave: number;
  paid_leave_type: string;
  allowances: { type: string; amount: number }[];
  overtime: number;
  resc: number;
  lump_sum_type: string;
  lump_sum_amount: number;
}

const DEFAULT_STP: STPBreakdown = {
  gross_salary: 0,
  paid_leave: 0,
  paid_leave_type: "",
  allowances: [],
  overtime: 0,
  resc: 0,
  lump_sum_type: "",
  lump_sum_amount: 0,
};

const LabourPayRunNew = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const navigate = useNavigate();

  const lastWeekStart = format(startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const lastWeekEnd = format(endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }), "yyyy-MM-dd");

  const [periodStart, setPeriodStart] = useState(lastWeekStart);
  const [periodEnd, setPeriodEnd] = useState(lastWeekEnd);
  const [payCycle, setPayCycle] = useState("WEEKLY");
  const [creating, setCreating] = useState(false);
  const [showSTPPreview, setShowSTPPreview] = useState(false);

  // Simulated STP breakdown (in production, calculated from timesheet data)
  const [stpData] = useState<STPBreakdown>({
    gross_salary: 4250.00,
    paid_leave: 320.00,
    paid_leave_type: "ANNUAL",
    allowances: [
      { type: "MEAL", amount: 16.73 },
      { type: "SPLIT_SHIFT", amount: 10.68 },
    ],
    overtime: 185.50,
    resc: 0,
    lump_sum_type: "",
    lump_sum_amount: 0,
  });

  const totalGross = stpData.gross_salary + stpData.paid_leave +
    stpData.allowances.reduce((s, a) => s + a.amount, 0) +
    stpData.overtime + stpData.lump_sum_amount;

  const handleCreate = async () => {
    if (!orgId) return;
    setCreating(true);
    try {
      const { data, error } = await supabase.from("payroll_runs").insert({
        org_id: orgId,
        period_start: periodStart,
        period_end: periodEnd,
        pay_cycle: payCycle,
        status: "DRAFT",
      }).select().single();
      if (error) throw error;
      toast.success("Pay run created");
      navigate("/labour/payroll");
    } catch (err: any) {
      toast.error(err.message || "Failed to create pay run");
    } finally {
      setCreating(false);
    }
  };

  const handleDownloadSTPExport = () => {
    const exportData = {
      period: { start: periodStart, end: periodEnd },
      pay_cycle: payCycle,
      stp_phase_2: {
        gross_salary: stpData.gross_salary,
        paid_leave: stpData.paid_leave,
        paid_leave_type: stpData.paid_leave_type,
        allowances: stpData.allowances,
        overtime: stpData.overtime,
        resc: stpData.resc,
        total_gross: totalGross,
      },
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stp_export_${periodStart}_${periodEnd}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/labour/payroll")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">New Pay Run</h1>
          <p className="text-muted-foreground text-sm">Create a new pay run for the selected period.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="w-4 h-4" /> Pay Period
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Period Start</Label>
              <Input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Period End</Label>
              <Input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Pay Cycle</Label>
            <Select value={payCycle} onValueChange={setPayCycle}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="WEEKLY">Weekly</SelectItem>
                <SelectItem value="FORTNIGHTLY">Fortnightly</SelectItem>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-2 flex justify-between items-center">
            <Button variant="outline" size="sm" onClick={() => setShowSTPPreview(!showSTPPreview)}>
              <FileText className="w-4 h-4 mr-1" /> {showSTPPreview ? "Hide" : "Show"} STP Preview
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate("/labour/payroll")}>Cancel</Button>
              <Button onClick={handleCreate} disabled={creating || !periodStart || !periodEnd}>
                {creating ? "Creating..." : "Create Pay Run"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* STP Phase 2 Preview */}
      {showSTPPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" /> STP Phase 2 Preview
              <Badge variant="secondary" className="text-[10px]">Preview</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              STP Phase 2 breakdown for ATO reporting. Export for upload to Xero/MYOB.
            </p>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium text-foreground">Gross Salary/Wages</TableCell>
                  <TableCell className="text-muted-foreground">—</TableCell>
                  <TableCell className="text-right font-medium">${stpData.gross_salary.toFixed(2)}</TableCell>
                </TableRow>
                {stpData.paid_leave > 0 && (
                  <TableRow>
                    <TableCell className="font-medium text-foreground">Paid Leave</TableCell>
                    <TableCell className="text-muted-foreground">
                      <Badge variant="secondary" className="text-[10px]">{stpData.paid_leave_type}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">${stpData.paid_leave.toFixed(2)}</TableCell>
                  </TableRow>
                )}
                {stpData.allowances.map((a, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium text-foreground">Allowance</TableCell>
                    <TableCell className="text-muted-foreground">
                      <Badge variant="secondary" className="text-[10px]">{a.type}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">${a.amount.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {stpData.overtime > 0 && (
                  <TableRow>
                    <TableCell className="font-medium text-foreground">Overtime</TableCell>
                    <TableCell className="text-muted-foreground">—</TableCell>
                    <TableCell className="text-right font-medium">${stpData.overtime.toFixed(2)}</TableCell>
                  </TableRow>
                )}
                {stpData.resc > 0 && (
                  <TableRow>
                    <TableCell className="font-medium text-foreground">RESC</TableCell>
                    <TableCell className="text-muted-foreground">Salary Sacrifice</TableCell>
                    <TableCell className="text-right font-medium">${stpData.resc.toFixed(2)}</TableCell>
                  </TableRow>
                )}
                <TableRow className="border-t-2 border-border">
                  <TableCell className="font-bold text-foreground">Total Gross</TableCell>
                  <TableCell />
                  <TableCell className="text-right font-bold text-foreground">${totalGross.toFixed(2)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <Button variant="outline" size="sm" onClick={handleDownloadSTPExport}>
              <Download className="w-4 h-4 mr-1" /> Export STP File
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LabourPayRunNew;
