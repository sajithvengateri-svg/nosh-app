import { useQuery } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, PartyPopper, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchFunctions } from "@/lib/shared/queries/resQueries";
import { format } from "date-fns";

const statusColor: Record<string, string> = {
  ENQUIRY: "bg-muted text-muted-foreground", QUOTED: "bg-blue-500/10 text-blue-600",
  CONFIRMED: "bg-emerald-500/10 text-emerald-600", DEPOSIT_PAID: "bg-amber-500/10 text-amber-600",
  FULLY_PAID: "bg-purple-500/10 text-purple-600", COMPLETED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-red-500/10 text-red-600",
};

const ResFunctions = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const navigate = useNavigate();

  const { data: functions = [], isLoading } = useQuery({
    queryKey: ["res_functions", orgId],
    queryFn: async () => { const { data } = await fetchFunctions(orgId!); return data ?? []; },
    enabled: !!orgId,
  });

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><PartyPopper className="w-6 h-6 text-primary" /> Functions & Events</h1>
        <Button onClick={() => navigate("/reservation/functions/new")}><Plus className="w-4 h-4 mr-2" /> New Enquiry</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : functions.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No functions yet</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {functions.map((f: any) => (
            <div key={f.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => navigate(`/reservation/functions/${f.id}`)}>
              <div>
                <p className="font-medium text-sm">{f.client_name}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(f.event_date), "d MMM yyyy")} · {f.party_size} pax · {f.event_type}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {f.quoted_total && <span className="text-sm font-medium">${f.quoted_total.toLocaleString()}</span>}
                <Badge className={statusColor[f.status] || ""} variant="secondary">{f.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResFunctions;
