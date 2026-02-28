import { Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLoyaltyCredits } from "@/hooks/useLoyaltyCredits";
import { format } from "date-fns";

const LoyaltyWallet = () => {
  const { data: credits = [], balance, isLoading } = useLoyaltyCredits();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-5">
          <div className="animate-pulse h-20 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Balance Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Credit Balance</p>
            <p className="text-3xl font-bold text-foreground">${balance.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <h3 className="font-semibold text-foreground">Transaction History</h3>
          {credits.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions yet. Earn credits by referring friends!</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {credits.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(c.created_at), "dd MMM")}
                    </TableCell>
                    <TableCell className="text-sm">{c.description}</TableCell>
                    <TableCell className="text-right">
                      <span className={`text-sm font-medium flex items-center justify-end gap-1 ${Number(c.amount) >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {Number(c.amount) >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        ${Math.abs(Number(c.amount)).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm">${Number(c.balance_after).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <p className="text-xs text-muted-foreground">Credits are automatically applied to your next invoice or can unlock AI features.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoyaltyWallet;
