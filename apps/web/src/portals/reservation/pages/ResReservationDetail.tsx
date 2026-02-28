import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Crown, Pencil, AlertTriangle, Check, DollarSign, Clock } from "lucide-react";
import { fetchReservationById, updateReservation, updateReservationStatus, fetchTables } from "@/lib/shared/queries/resQueries";
import { useOrg } from "@/contexts/OrgContext";
import { useCurrencySymbol } from "@/hooks/useCurrencySymbol";
import { toast } from "sonner";
import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

const ResReservationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  const sym = useCurrencySymbol();
  const orgId = currentOrg?.id;
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, any>>({});

  const { data: reservation, isLoading } = useQuery({
    queryKey: ["res_reservation", id],
    queryFn: async () => { const { data } = await fetchReservationById(id!); return data; },
    enabled: !!id,
  });

  const { data: tables = [] } = useQuery({
    queryKey: ["res_tables", orgId],
    queryFn: async () => { const { data } = await fetchTables(orgId!); return data ?? []; },
    enabled: !!orgId && editing,
  });

  const handleStatus = async (status: string) => {
    if (!id) return;
    await updateReservationStatus(id, status);
    qc.invalidateQueries({ queryKey: ["res_reservation", id] });
    qc.invalidateQueries({ queryKey: ["res_reservations"] });
    toast.success(`Status updated to ${status}`);
  };

  const handleBillDrop = async () => {
    if (!id || !reservation) return;
    const existingNotes = (reservation as any).notes || '';
    if (!existingNotes.includes('[BILL_DROPPED]')) {
      await supabase.from("res_reservations").update({
        notes: `${existingNotes} [BILL_DROPPED]`.trim()
      } as any).eq("id", id);
    }
    qc.invalidateQueries({ queryKey: ["res_reservation", id] });
    qc.invalidateQueries({ queryKey: ["res_reservations"] });
    toast.success("Bill dropped");
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("No id");
      await updateReservation(id, editForm);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["res_reservation", id] });
      qc.invalidateQueries({ queryKey: ["res_reservations"] });
      setEditing(false);
      toast.success("Reservation updated");
    },
    onError: () => toast.error("Failed to update"),
  });

  const startEdit = () => {
    const r = reservation as any;
    setEditForm({
      date: r.date, time: r.time, party_size: r.party_size,
      table_id: r.table_id || "", occasion: r.occasion || "",
      notes: r.notes || "", special_requests: r.special_requests || "",
    });
    setEditing(true);
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!reservation) return <div className="p-6 text-center text-muted-foreground">Reservation not found</div>;

  const r = reservation as any;
  const guest = r.res_guests;
  const table = r.res_tables;

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {guest ? `${guest.first_name} ${guest.last_name}` : 'Walk-in'}
              {guest?.vip_tier === 'VIP' && <Crown className="w-4 h-4 inline ml-2 text-amber-500" />}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge>{r.status}</Badge>
              {!editing && <Button variant="ghost" size="icon" onClick={startEdit}><Pencil className="w-4 h-4" /></Button>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* No-show warning */}
          {guest?.no_show_count > 0 && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-amber-700 dark:text-amber-400">
                This guest has {guest.no_show_count} previous no-show{guest.no_show_count > 1 ? 's' : ''}
              </span>
            </div>
          )}

          {editing ? (
            /* Edit mode */
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Date</Label><Input type="date" value={editForm.date} onChange={e => setEditForm(p => ({ ...p, date: e.target.value }))} /></div>
                <div><Label>Time</Label><Input type="time" value={editForm.time} onChange={e => setEditForm(p => ({ ...p, time: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Party Size</Label><Input type="number" min={1} value={editForm.party_size} onChange={e => setEditForm(p => ({ ...p, party_size: +e.target.value }))} /></div>
                <div>
                  <Label>Table</Label>
                  <Select value={editForm.table_id} onValueChange={v => setEditForm(p => ({ ...p, table_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                    <SelectContent>
                      {tables.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name} ({t.max_capacity}p)</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Occasion</Label><Input value={editForm.occasion} onChange={e => setEditForm(p => ({ ...p, occasion: e.target.value }))} /></div>
              <div><Label>Special Requests</Label><Textarea value={editForm.special_requests} onChange={e => setEditForm(p => ({ ...p, special_requests: e.target.value }))} /></div>
              <div><Label>Notes</Label><Textarea value={editForm.notes} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} /></div>
              <div className="flex gap-2">
                <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>Save</Button>
                <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            /* View mode */
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                <div><span className="text-muted-foreground block">Date</span>{r.date}</div>
                <div><span className="text-muted-foreground block">Time</span>{r.time?.slice(0, 5)}</div>
                <div><span className="text-muted-foreground block">Party Size</span>{r.party_size} pax</div>
                <div><span className="text-muted-foreground block">Table</span>{table?.name || 'Unassigned'}</div>
                <div><span className="text-muted-foreground block">Channel</span>{r.channel}</div>
                <div><span className="text-muted-foreground block">Occasion</span>{r.occasion || '—'}</div>
              </div>
              {r.notes && <div className="text-sm"><span className="text-muted-foreground">Notes:</span> {r.notes}</div>}
              {r.special_requests && <div className="text-sm"><span className="text-muted-foreground">Requests:</span> {r.special_requests}</div>}
            </>
          )}

          {/* Dietary from guest */}
          {guest?.dietary_requirements && (
            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div className="text-sm">
                <span className="font-medium text-amber-700 dark:text-amber-400">Dietary: </span>
                {guest.dietary_requirements}
              </div>
            </div>
          )}

          {/* Deposit tracking */}
          {r.deposit_required && (
            <div className="p-3 rounded-lg border bg-muted/30 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span>Deposit: {sym}{r.deposit_amount ?? 0}</span>
              </div>
              <Badge variant={r.deposit_paid ? "default" : "destructive"}>
                {r.deposit_paid ? <><Check className="w-3 h-3 mr-1" /> Paid</> : "Outstanding"}
              </Badge>
            </div>
          )}

          {/* Timestamps */}
          {(r.arrived_at || r.seated_at || r.completed_at) && (
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              {r.seated_at && <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> Seated: {format(new Date(r.seated_at), "HH:mm")}</div>}
              {r.completed_at && <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> Completed: {format(new Date(r.completed_at), "HH:mm")}</div>}
              {r.turn_time_minutes && <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> Turn: {Math.round(r.turn_time_minutes)} min</div>}
            </div>
          )}

          {/* Status actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            {r.status === 'CONFIRMED' && (
              <>
                <Button size="sm" onClick={() => handleStatus('SEATED')}>Seat Guest</Button>
                <Button size="sm" variant="destructive" onClick={() => handleStatus('NO_SHOW')}>No Show</Button>
                <Button size="sm" variant="outline" onClick={() => handleStatus('CANCELLED')}>Cancel</Button>
              </>
            )}
            {r.status === 'SEATED' && !r.notes?.includes('[BILL_DROPPED]') && (
              <Button size="sm" onClick={handleBillDrop}>Drop Bill</Button>
            )}
            {r.status === 'SEATED' && (
              <Button size="sm" onClick={() => handleStatus('COMPLETED')}>Complete</Button>
            )}
          </div>

          {guest && (
            <Button variant="link" className="px-0" onClick={() => navigate(`/reservation/guests/${guest.id}`)}>
              View Guest Profile →
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResReservationDetail;
