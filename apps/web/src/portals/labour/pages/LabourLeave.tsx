import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarDays, Clock, CheckCircle, XCircle, Plus } from "lucide-react";
import { useOrg } from "@/contexts/OrgContext";
import { useLeaveRequests, useLeaveBalances, useEmployeeProfilesWithNames } from "@/lib/shared/queries/labourQueries";
import { Skeleton } from "@/components/ui/skeleton";

const LEAVE_TYPES: Record<string, { label: string; color: string }> = {
  ANNUAL: { label: "Annual", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  PERSONAL: { label: "Personal/Sick", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
  LONG_SERVICE: { label: "Long Service", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
  COMPASSIONATE: { label: "Compassionate", color: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300" },
  UNPAID: { label: "Unpaid", color: "bg-muted text-muted-foreground" },
  TOIL: { label: "TOIL", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
};

const STATUS_BADGE: Record<string, "default" | "secondary" | "destructive"> = {
  PENDING: "secondary",
  APPROVED: "default",
  DECLINED: "destructive",
  CANCELLED: "secondary",
};

const LabourLeave = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const [tab, setTab] = useState("requests");

  const { data: requests, isLoading: reqLoading } = useLeaveRequests(orgId);
  const { data: balances, isLoading: balLoading } = useLeaveBalances(orgId);
  const { data: employees } = useEmployeeProfilesWithNames(orgId);

  const nameMap = useMemo(() => {
    const m = new Map<string, string>();
    employees?.forEach(e => m.set(e.user_id, e.full_name));
    return m;
  }, [employees]);

  const isLoading = reqLoading || balLoading;

  // Aggregate balances by leave type
  const balanceSummary = useMemo(() => {
    if (!balances?.length) return [];
    const byType = new Map<string, { accrued: number; taken: number; balance: number; count: number }>();
    balances.forEach(b => {
      const existing = byType.get(b.leave_type) || { accrued: 0, taken: 0, balance: 0, count: 0 };
      existing.accrued += b.accrued_hours;
      existing.taken += b.taken_hours;
      existing.balance += b.balance_hours;
      existing.count++;
      byType.set(b.leave_type, existing);
    });
    return Array.from(byType.entries()).map(([type, data]) => ({ type, ...data }));
  }, [balances]);

  if (isLoading) {
    return <div className="p-4 lg:p-6 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-[300px] w-full" /></div>;
  }

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leave Management</h1>
          <p className="text-muted-foreground text-sm">Leave balances, requests, and approval workflow.</p>
        </div>
      </div>

      {/* Balance summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(balanceSummary.length > 0 ? balanceSummary : [
          { type: "ANNUAL", accrued: 0, taken: 0, balance: 0, count: 0 },
          { type: "PERSONAL", accrued: 0, taken: 0, balance: 0, count: 0 },
        ]).map(b => {
          const lt = LEAVE_TYPES[b.type] || { label: b.type, color: "" };
          return (
            <Card key={b.type}>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  <CalendarDays className="w-3.5 h-3.5" /> {lt.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-foreground">{b.balance.toFixed(1)}h</p>
                <p className="text-[11px] text-muted-foreground">
                  Accrued {b.accrued.toFixed(0)}h · Taken {b.taken.toFixed(0)}h
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="requests">
            Requests ({requests?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="balances">
            All Balances ({balances?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-4">
          {!requests?.length ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No leave requests yet.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map(req => {
                      const lt = LEAVE_TYPES[req.leave_type] || { label: req.leave_type, color: "" };
                      return (
                        <TableRow key={req.id}>
                          <TableCell className="font-medium text-foreground">
                            {nameMap.get(req.user_id) || req.user_id.substring(0, 8)}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${lt.color}`}>
                              {lt.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {req.start_date} → {req.end_date}
                          </TableCell>
                          <TableCell>{req.hours_requested}h</TableCell>
                          <TableCell>
                            <Badge variant={STATUS_BADGE[req.status] || "secondary"}>
                              {req.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                            {req.reason || "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            {req.status === "PENDING" && (
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" title="Approve">
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" title="Decline">
                                  <XCircle className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="balances" className="mt-4">
          {!balances?.length ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No leave balances calculated yet. Balances are updated when payroll is processed.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff</TableHead>
                      <TableHead>Leave Type</TableHead>
                      <TableHead>Accrued</TableHead>
                      <TableHead>Taken</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Last Calculated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {balances.map(b => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium text-foreground">
                          {nameMap.get(b.user_id) || b.user_id.substring(0, 8)}
                        </TableCell>
                        <TableCell>{LEAVE_TYPES[b.leave_type]?.label || b.leave_type}</TableCell>
                        <TableCell>{b.accrued_hours.toFixed(1)}h</TableCell>
                        <TableCell>{b.taken_hours.toFixed(1)}h</TableCell>
                        <TableCell className="font-medium">{b.balance_hours.toFixed(1)}h</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{b.last_calculated}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LabourLeave;
