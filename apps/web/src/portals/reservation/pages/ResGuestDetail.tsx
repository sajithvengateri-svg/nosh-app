import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Crown, Mail, Phone, Calendar, AlertTriangle, Megaphone } from "lucide-react";
import { fetchGuestById, updateGuest, fetchGuestReservations } from "@/lib/shared/queries/resQueries";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import TagPicker from "../components/TagPicker";

const tierColor: Record<string, string> = {
  NEW: "bg-muted", RETURNING: "bg-blue-500/10 text-blue-600",
  REGULAR: "bg-emerald-500/10 text-emerald-600", VIP: "bg-amber-500/10 text-amber-600",
  CHAMPION: "bg-purple-500/10 text-purple-600",
};

const ResGuestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState("");

  const { data: guest, isLoading } = useQuery({
    queryKey: ["res_guest", id],
    queryFn: async () => { const { data } = await fetchGuestById(id!); return data; },
    enabled: !!id,
  });

  const { data: visits = [] } = useQuery({
    queryKey: ["res_guest_visits", id],
    queryFn: async () => { const { data } = await fetchGuestReservations(id!); return data ?? []; },
    enabled: !!id,
  });

  const notesMut = useMutation({
    mutationFn: async () => { await updateGuest(id!, { notes }); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["res_guest", id] });
      setEditingNotes(false);
      toast.success("Notes saved");
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!guest) return <div className="p-6 text-center text-muted-foreground">Guest not found</div>;

  const g = guest as any;

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>

      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                {g.first_name?.[0]}{g.last_name?.[0]}
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  {g.first_name} {g.last_name}
                  {['VIP', 'CHAMPION'].includes(g.vip_tier) && <Crown className="w-5 h-5 text-amber-500" />}
                </CardTitle>
                <Badge className={tierColor[g.vip_tier] || ""} variant="secondary">{g.vip_tier}</Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{g.guest_score}</p>
              <p className="text-xs text-muted-foreground">Guest Score</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {g.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" />{g.phone}</div>}
            {g.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" />{g.email}</div>}
            {g.date_of_birth && <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" />Birthday: {g.date_of_birth}</div>}
            {g.anniversary_date && <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" />Anniversary: {g.anniversary_date}</div>}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Visits", value: g.total_visits },
              { label: "Total Spend", value: `$${g.total_spend?.toFixed(0) || 0}` },
              { label: "Avg Spend", value: `$${g.avg_spend_per_visit?.toFixed(0) || 0}` },
              { label: "No Shows", value: g.no_show_count },
            ].map(s => (
              <div key={s.label} className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Editable Tags */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Tags</p>
            <TagPicker
              selectedTags={g.tags || []}
              onChange={async (tags: string[]) => {
                try {
                  await updateGuest(id!, { tags });
                  qc.invalidateQueries({ queryKey: ["res_guest", id] });
                  toast.success("Tags updated");
                } catch { toast.error("Failed to update tags"); }
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Dietary Requirements Callout */}
      {g.dietary_requirements && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Dietary Requirements</p>
                <p className="text-sm mt-1">{g.dietary_requirements}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preferences */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Preferences</CardTitle></CardHeader>
        <CardContent>
          {g.preferences && Object.keys(g.preferences).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {Object.entries(g.preferences).map(([key, val]) => (
                <div key={key} className="flex justify-between p-2 rounded bg-muted/50">
                  <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                  <span className="font-medium">{String(val)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No preferences recorded yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Visits */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Recent Visits</CardTitle></CardHeader>
        <CardContent>
          {visits.length === 0 ? (
            <p className="text-sm text-muted-foreground">No visit history</p>
          ) : (
            <div className="space-y-2">
              {visits.map((v: any) => (
                <div key={v.id}
                  className="flex items-center justify-between p-2 rounded hover:bg-muted/50 cursor-pointer text-sm"
                  onClick={() => navigate(`/reservation/reservations/${v.id}`)}>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-muted-foreground">{format(new Date(v.date), "d MMM yy")}</span>
                    <span>{v.time?.slice(0, 5)}</span>
                    <span className="text-muted-foreground">{v.party_size} pax</span>
                    <span className="text-muted-foreground">{v.res_tables?.name || '—'}</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">{v.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Notes</CardTitle>
            {!editingNotes && (
              <Button variant="ghost" size="sm" onClick={() => { setNotes(g.notes || ""); setEditingNotes(true); }}>Edit</Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingNotes ? (
            <div className="space-y-2">
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => notesMut.mutate()} disabled={notesMut.isPending}>Save</Button>
                <Button size="sm" variant="outline" onClick={() => setEditingNotes(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{g.notes || "No notes"}</p>
          )}
        </CardContent>
      </Card>

      {/* Campaign Link */}
      <Button variant="outline" className="w-full" onClick={() => navigate(`/growth/campaigns?guest_id=${id}`)}>
        <Megaphone className="w-4 h-4 mr-2" /> Create Campaign for This Guest
      </Button>
    </div>
  );
};

export default ResGuestDetail;
