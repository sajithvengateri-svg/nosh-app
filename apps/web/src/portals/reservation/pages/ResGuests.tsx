import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Users, Search, Crown, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchGuests } from "@/lib/shared/queries/resQueries";

const tierColor: Record<string, string> = {
  NEW: "bg-muted text-muted-foreground",
  RETURNING: "bg-blue-500/10 text-blue-600",
  REGULAR: "bg-emerald-500/10 text-emerald-600",
  VIP: "bg-amber-500/10 text-amber-600",
  CHAMPION: "bg-purple-500/10 text-purple-600",
};

const ResGuests = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: guests = [], isLoading } = useQuery({
    queryKey: ["res_guests", orgId],
    queryFn: async () => { const { data } = await fetchGuests(orgId!); return data ?? []; },
    enabled: !!orgId,
  });

  const filtered = search
    ? guests.filter((g: any) => `${g.first_name} ${g.last_name} ${g.phone || ''} ${g.email || ''}`.toLowerCase().includes(search.toLowerCase()))
    : guests;

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6 text-primary" /> Guests</h1>
        <Button onClick={() => navigate("/reservation/reservations/new")}><Plus className="w-4 h-4 mr-2" /> New Booking</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
        <Input placeholder="Search guests..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No guests found</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((g: any) => (
            <div key={g.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => navigate(`/reservation/guests/${g.id}`)}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {g.first_name?.[0]}{g.last_name?.[0]}
                </div>
                <div>
                  <p className="font-medium text-sm flex items-center gap-1">
                    {g.first_name} {g.last_name}
                    {['VIP', 'CHAMPION'].includes(g.vip_tier) && <Crown className="w-3 h-3 text-amber-500" />}
                  </p>
                  <p className="text-xs text-muted-foreground">{g.phone || g.email || 'No contact'} · {g.total_visits} visits</p>
                </div>
              </div>
              <Badge className={tierColor[g.vip_tier] || ""} variant="secondary">{g.vip_tier}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResGuests;
