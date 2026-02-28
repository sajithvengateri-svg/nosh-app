import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Loader2, AlertTriangle, Ticket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { createReservation, searchGuests, fetchTables } from "@/lib/shared/queries/resQueries";
import { format } from "date-fns";

const ResNewReservation = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    date: searchParams.get("date") || format(new Date(), "yyyy-MM-dd"),
    time: "19:00",
    party_size: 2,
    channel: "PHONE",
    occasion: "",
    notes: "",
    guest_id: "",
    table_id: "",
    is_pre_theatre: false,
    show_id: "",
  });
  const [guestSearch, setGuestSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: guests = [] } = useQuery({
    queryKey: ["res_guest_search", orgId, guestSearch],
    queryFn: async () => { const { data } = await searchGuests(orgId!, guestSearch); return data ?? []; },
    enabled: !!orgId && guestSearch.length >= 2,
  });

  const { data: tables = [] } = useQuery({
    queryKey: ["res_tables", orgId],
    queryFn: async () => { const { data } = await fetchTables(orgId!); return data ?? []; },
    enabled: !!orgId,
  });

  const { data: shows = [] } = useQuery({
    queryKey: ["res_shows", orgId, form.date],
    queryFn: async () => {
      const { data } = await supabase.from("res_shows").select("*")
        .eq("org_id", orgId!)
        .eq("show_date", form.date)
        .eq("is_active", true)
        .eq("is_suggestion", false)
        .order("curtain_time");
      return data ?? [];
    },
    enabled: !!orgId && form.is_pre_theatre,
  });

  const handleSubmit = async () => {
    if (!orgId) return;
    setSaving(true);
    const { error } = await createReservation({
      org_id: orgId,
      date: form.date,
      time: form.time,
      party_size: form.party_size,
      channel: form.channel,
      occasion: form.occasion || null,
      notes: form.notes || null,
      guest_id: form.guest_id || null,
      table_id: form.table_id || null,
      is_pre_theatre: form.is_pre_theatre,
      show_id: form.show_id || null,
      status: "CONFIRMED",
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Reservation created");
    qc.invalidateQueries({ queryKey: ["res_reservations"] });
    navigate("/reservation/reservations");
  };

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>New Reservation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></div>
            <div><Label>Time</Label><Input type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Party Size</Label><Input type="number" min={1} value={form.party_size} onChange={e => setForm(p => ({ ...p, party_size: +e.target.value }))} /></div>
            <div>
              <Label>Channel</Label>
              <Select value={form.channel} onValueChange={v => setForm(p => ({ ...p, channel: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["PHONE", "WALK_IN", "IN_PERSON", "WEBSITE"].map(c => <SelectItem key={c} value={c}>{c.replace("_", " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Guest Search */}
          <div>
            <Label>Guest (optional)</Label>
            <Input placeholder="Search by name or phone..." value={guestSearch} onChange={e => { setGuestSearch(e.target.value); setForm(p => ({ ...p, guest_id: "" })); }} />
            {guests.length > 0 && !form.guest_id && (
              <div className="mt-1 border rounded-md max-h-32 overflow-y-auto">
                {guests.map((g: any) => (
                  <button key={g.id} className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted"
                    onClick={() => { setForm(p => ({ ...p, guest_id: g.id })); setGuestSearch(`${g.first_name} ${g.last_name}`); }}>
                    {g.first_name} {g.last_name} {g.phone && `· ${g.phone}`}
                  </button>
                ))}
              </div>
            )}
            {form.guest_id && (() => {
              const selectedGuest = guests.find((g: any) => g.id === form.guest_id);
              if (!selectedGuest || selectedGuest.no_show_count <= 0) return null;
              const isHigh = selectedGuest.no_show_count >= 3;
              return (
                <div className={`mt-2 p-2 rounded-lg border text-sm flex items-center gap-2 ${
                  isHigh ? 'bg-destructive/10 border-destructive/30' : 'bg-amber-500/10 border-amber-500/20'
                }`}>
                  <AlertTriangle className={`w-4 h-4 ${isHigh ? 'text-destructive' : 'text-amber-500'}`} />
                  <span>
                    This guest has {selectedGuest.no_show_count} previous no-show{selectedGuest.no_show_count > 1 ? 's' : ''}
                    {isHigh && ' — consider requiring a deposit'}
                  </span>
                </div>
              );
            })()}
          </div>

          {/* Table */}
          <div>
            <Label>Table (optional)</Label>
            <Select value={form.table_id} onValueChange={v => setForm(p => ({ ...p, table_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Auto-assign" /></SelectTrigger>
              <SelectContent>
                {tables.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name} ({t.max_capacity} pax)</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Pre-Theatre */}
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-2">
              <Ticket className="w-4 h-4 text-teal-600" />
              <Label className="cursor-pointer">Pre-theatre dining?</Label>
            </div>
            <Switch checked={form.is_pre_theatre} onCheckedChange={v => setForm(p => ({ ...p, is_pre_theatre: v, show_id: "" }))} />
          </div>
          {form.is_pre_theatre && (
            <div>
              <Label>Show</Label>
              <Select value={form.show_id} onValueChange={v => setForm(p => ({ ...p, show_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select a show..." /></SelectTrigger>
                <SelectContent>
                  {shows.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title} — {s.curtain_time?.slice(0, 5)} curtain (Session {s.session_number})
                    </SelectItem>
                  ))}
                  {shows.length === 0 && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">No shows for this date</div>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div><Label>Occasion</Label><Input placeholder="e.g. Birthday, Business" value={form.occasion} onChange={e => setForm(p => ({ ...p, occasion: e.target.value }))} /></div>
          <div><Label>Notes</Label><Textarea placeholder="Special requests..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>

          <Button className="w-full" onClick={handleSubmit} disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Create Reservation"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResNewReservation;
