import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Users, Ticket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAvailableTables, createReservation, addToWaitlist } from "@/lib/shared/queries/resQueries";
import { toast } from "sonner";
import { format, differenceInMinutes, parseISO } from "date-fns";

interface WalkInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WalkInDialog = ({ open, onOpenChange }: WalkInDialogProps) => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const qc = useQueryClient();
  const [partySize, setPartySize] = useState(2);
  const [name, setName] = useState("");
  const [noTable, setNoTable] = useState(false);
  const [isPreTheatre, setIsPreTheatre] = useState(false);
  const [showId, setShowId] = useState("");
  const [lastSeated, setLastSeated] = useState<string | null>(null);
  const keepOpenRef = useRef(false);

  const today = format(new Date(), "yyyy-MM-dd");
  const { data: shows = [] } = useQuery({
    queryKey: ["res_shows_walkin", orgId, today],
    queryFn: async () => {
      const { data } = await supabase.from("res_shows").select("*")
        .eq("org_id", orgId!)
        .eq("show_date", today)
        .eq("is_active", true)
        .eq("is_suggestion", false)
        .order("curtain_time");
      return data ?? [];
    },
    enabled: !!orgId && isPreTheatre,
  });

  const seatMut = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("No org");
      const { data: available } = await fetchAvailableTables(orgId, partySize);
      if (!available || available.length === 0) {
        setNoTable(true);
        throw new Error("NO_TABLE");
      }
      // Pick best-fit table (smallest that fits)
      const bestTable = available[0];
      const today = format(new Date(), "yyyy-MM-dd");
      const now = format(new Date(), "HH:mm:ss");
      const result = await createReservation({
        org_id: orgId,
        date: today,
        time: now,
        party_size: partySize,
        channel: "WALK_IN",
        status: "SEATED",
        seated_at: new Date().toISOString(),
        table_id: bestTable.id,
        is_pre_theatre: isPreTheatre,
        show_id: showId || null,
        notes: name ? `Walk-in: ${name}` : "Walk-in",
      });
      if (result.error) throw new Error(result.error.message);
      return bestTable;
    },
    onSuccess: (table) => {
      qc.invalidateQueries({ queryKey: ["res_reservations"], refetchType: "all" });
      qc.invalidateQueries({ queryKey: ["res_tables"], refetchType: "all" });
      toast.success(`Seated at ${table.name}`);
      if (keepOpenRef.current) {
        setPartySize(2);
        setName("");
        setNoTable(false);
        setLastSeated(table.name);
        keepOpenRef.current = false;
      } else {
        resetAndClose();
      }
    },
    onError: (err) => {
      if (err.message !== "NO_TABLE") toast.error("Failed to seat walk-in");
    },
  });

  const waitlistMut = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("No org");
      await addToWaitlist({
        org_id: orgId,
        guest_name: name || "Walk-in",
        party_size: partySize,
        status: "WAITING",
        estimated_wait_minutes: 15,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["res_waitlist"] });
      toast.success("Added to waitlist");
      resetAndClose();
    },
    onError: () => toast.error("Failed to add to waitlist"),
  });

  const resetAndClose = () => {
    setPartySize(2);
    setName("");
    setNoTable(false);
    setIsPreTheatre(false);
    setShowId("");
    setLastSeated(null);
    keepOpenRef.current = false;
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Walk-In
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {lastSeated && (
            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400">
              Seated at {lastSeated}
            </div>
          )}
          <div>
            <Label>Party Size</Label>
            <Input type="number" min={1} max={20} value={partySize} onChange={e => setPartySize(+e.target.value)} />
          </div>
          <div>
            <Label>Name (optional)</Label>
            <Input placeholder="Guest name" value={name} onChange={e => setName(e.target.value)} />
          </div>

          {/* Pre-theatre toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-2">
              <Ticket className="w-4 h-4 text-teal-600" />
              <Label className="cursor-pointer text-sm">Seeing a show?</Label>
            </div>
            <Switch checked={isPreTheatre} onCheckedChange={v => { setIsPreTheatre(v); setShowId(""); }} />
          </div>
          {isPreTheatre && (
            <div>
              <Select value={showId} onValueChange={setShowId}>
                <SelectTrigger><SelectValue placeholder="Select show..." /></SelectTrigger>
                <SelectContent>
                  {shows.map((s: any) => {
                    const curtainStr = s.curtain_time?.slice(0, 5);
                    const curtain = parseISO(`${today}T${s.curtain_time}`);
                    const minLeft = differenceInMinutes(curtain, new Date());
                    const tight = minLeft > 0 && minLeft < 60;
                    return (
                      <SelectItem key={s.id} value={s.id}>
                        <span>{s.title} — {curtainStr}</span>
                        {tight && <span className="ml-1 text-amber-600 text-xs">(Tight — {minLeft}min)</span>}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {noTable ? (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-700 dark:text-amber-400">
                No tables available for {partySize} guests.
              </div>
              <Button className="w-full" onClick={() => waitlistMut.mutate()} disabled={waitlistMut.isPending}>
                {waitlistMut.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Add to Waitlist
              </Button>
              <Button variant="outline" className="w-full" onClick={resetAndClose}>Cancel</Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => { keepOpenRef.current = false; seatMut.mutate(); }}
                disabled={seatMut.isPending}
              >
                Seat & Close
              </Button>
              <Button
                className="flex-1"
                onClick={() => { keepOpenRef.current = true; seatMut.mutate(); }}
                disabled={seatMut.isPending}
              >
                {seatMut.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Seat & Next
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalkInDialog;
