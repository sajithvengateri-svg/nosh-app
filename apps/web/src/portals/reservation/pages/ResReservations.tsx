import { useQuery } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, CalendarCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fetchReservationsByDate } from "@/lib/shared/queries/resQueries";
import { useResStore } from "@/lib/shared/state/resStore";

const statusColor: Record<string, string> = {
  ENQUIRY: "bg-muted text-muted-foreground",
  CONFIRMED: "bg-blue-500/10 text-blue-600",
  SEATED: "bg-emerald-500/10 text-emerald-600",
  COMPLETED: "bg-muted text-muted-foreground",
  NO_SHOW: "bg-red-500/10 text-red-600",
  CANCELLED: "bg-red-500/10 text-red-600",
};

const ResReservations = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const navigate = useNavigate();
  const { selectedDate, setSelectedDate } = useResStore();

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ["res_reservations", orgId, selectedDate],
    queryFn: async () => { const { data } = await fetchReservationsByDate(orgId!, selectedDate); return data ?? []; },
    enabled: !!orgId,
  });

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarCheck className="w-6 h-6 text-primary" /> Reservations
        </h1>
        <Button onClick={() => navigate("/reservation/reservations/new")}>
          <Plus className="w-4 h-4 mr-2" /> New Booking
        </Button>
      </div>

      <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="max-w-xs" />

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : reservations.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No reservations for {format(new Date(selectedDate), "EEEE, d MMMM")}</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {reservations.map((r: any) => (
            <div key={r.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => navigate(`/reservation/reservations/${r.id}`)}>
              <div className="flex items-center gap-4">
                <span className="font-mono text-sm font-medium w-14">{r.time?.slice(0, 5)}</span>
                <div>
                  <p className="font-medium text-sm">
                    {r.res_guests ? `${r.res_guests.first_name} ${r.res_guests.last_name}` : "Walk-in"}
                  </p>
                  <p className="text-xs text-muted-foreground">{r.party_size} pax · {r.res_tables?.name || "No table"} · {r.channel}</p>
                </div>
              </div>
              <Badge className={statusColor[r.status] || ""} variant="secondary">{r.status}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResReservations;
