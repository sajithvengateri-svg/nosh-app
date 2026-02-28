import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useReferrals } from "@/hooks/useReferrals";
import { format } from "date-fns";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Invited", variant: "outline" },
  qualified: { label: "Signed Up", variant: "secondary" },
  credited: { label: "Credited", variant: "default" },
  voided: { label: "Voided", variant: "destructive" },
  completed: { label: "Credited", variant: "default" },
};

const ReferralTracker = () => {
  const { data: referrals = [], isLoading } = useReferrals();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-5">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <h3 className="font-semibold text-foreground">Referral Tracker</h3>
        {referrals.length === 0 ? (
          <p className="text-sm text-muted-foreground">No referrals yet. Share your code to get started!</p>
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referred</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Reward</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.map((r: any) => {
                  const status = r.reward_status || r.status || "pending";
                  const cfg = statusConfig[status] || statusConfig.pending;
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm">{r.referred_email || "Awaiting sign-up"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(r.shared_at || r.created_at), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell className="text-sm capitalize">{r.channel || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {r.reward_value ? `$${Number(r.reward_value).toFixed(2)}` : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReferralTracker;
