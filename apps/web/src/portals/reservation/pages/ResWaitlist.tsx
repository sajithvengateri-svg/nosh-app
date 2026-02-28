import { useQuery } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, Bell, Check, X, Plus } from "lucide-react";
import AddWaitlistDialog from "../components/AddWaitlistDialog";
import { useState } from "react";
import { fetchActiveWaitlist, updateWaitlistStatus } from "@/lib/shared/queries/resQueries";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const ResWaitlist = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);

  const { data: waitlist = [], isLoading } = useQuery({
    queryKey: ["res_waitlist", orgId],
    queryFn: async () => { const { data } = await fetchActiveWaitlist(orgId!); return data ?? []; },
    enabled: !!orgId,
  });

  const handleAction = async (id: string, status: string) => {
    await updateWaitlistStatus(id, status);
    qc.invalidateQueries({ queryKey: ["res_waitlist"] });
    toast.success(`Guest ${status.toLowerCase()}`);
  };

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Clock className="w-6 h-6 text-primary" /> Waitlist
        </h1>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add to Waitlist
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : waitlist.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No one on the waitlist</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {waitlist.map((w: any, i: number) => (
            <Card key={w.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-medium">{w.guest_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {w.party_size} pax · Waiting {formatDistanceToNow(new Date(w.joined_at))}
                        {w.estimated_wait_minutes && ` · Est. ${w.estimated_wait_minutes} min`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Badge variant={w.status === 'NOTIFIED' ? 'default' : 'secondary'}>{w.status}</Badge>
                    {w.status === 'WAITING' && (
                      <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleAction(w.id, 'NOTIFIED')}>
                        <Bell className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleAction(w.id, 'SEATED')}>
                      <Check className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleAction(w.id, 'LEFT')}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <AddWaitlistDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
};

export default ResWaitlist;
