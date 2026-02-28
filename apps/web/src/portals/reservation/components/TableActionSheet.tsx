import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserCheck, UtensilsCrossed, Receipt, LogOut, Ban, ArrowRight, Users, Clock } from "lucide-react";
import { updateReservationStatus, blockTable, unblockTable, fetchAvgTurnTime } from "@/lib/shared/queries/resQueries";
import type { ResTable, ResReservation } from "@/lib/shared/types/res.types";
import { useNavigate } from "react-router-dom";
import { useOrg } from "@/contexts/OrgContext";
import { formatDistanceToNow } from "date-fns";

interface TableActionSheetProps {
  table: ResTable;
  reservations: ResReservation[];
  onDone?: () => void;
}

type Step = 'AVAILABLE' | 'RESERVED' | 'SEATED' | 'BILL' | 'COMPLETED' | 'BLOCKED';

const STEPS: { key: Step; label: string; icon: React.ElementType; color: string }[] = [
  { key: 'AVAILABLE', label: 'Available', icon: Users, color: 'bg-emerald-500' },
  { key: 'RESERVED', label: 'Reserved', icon: UserCheck, color: 'bg-blue-500' },
  { key: 'SEATED', label: 'Seated', icon: UtensilsCrossed, color: 'bg-red-500' },
  { key: 'BILL', label: 'Bill', icon: Receipt, color: 'bg-amber-500' },
  { key: 'COMPLETED', label: 'Left', icon: LogOut, color: 'bg-muted-foreground' },
];

function getCurrentStep(table: ResTable, reservations: ResReservation[]): { step: Step; reservation?: any } {
  if (table.is_blocked) return { step: 'BLOCKED' };
  const seated = reservations.find(r => r.table_id === table.id && r.status === 'SEATED');
  if (seated) {
    // Check if special_requests includes BILL marker
    if ((seated as any).notes?.includes('[BILL_DROPPED]')) return { step: 'BILL', reservation: seated };
    return { step: 'SEATED', reservation: seated };
  }
  const confirmed = reservations.find(r => r.table_id === table.id && r.status === 'CONFIRMED');
  if (confirmed) return { step: 'RESERVED', reservation: confirmed };
  return { step: 'AVAILABLE' };
}

function getNextStep(current: Step): Step | null {
  const order: Step[] = ['AVAILABLE', 'RESERVED', 'SEATED', 'BILL', 'COMPLETED'];
  const idx = order.indexOf(current);
  return idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null;
}

const TableActionSheet = ({ table, reservations, onDone }: TableActionSheetProps) => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const { step: currentStep, reservation } = getCurrentStep(table, reservations);
  const nextStep = currentStep === 'BLOCKED' ? null : getNextStep(currentStep);
  const stepIdx = STEPS.findIndex(s => s.key === currentStep);

  const { data: avgTurn } = useQuery({
    queryKey: ["avg_turn_time", orgId, table.id],
    queryFn: () => fetchAvgTurnTime(orgId!, table.id),
    enabled: !!orgId,
  });

  const advanceMut = useMutation({
    mutationFn: async (targetStep: Step) => {
      if (!reservation && targetStep === 'RESERVED') {
        // No reservation yet — navigate to create one
        navigate(`/reservation/reservations/new?table_id=${table.id}`);
        return;
      }
      if (reservation) {
        if (targetStep === 'BILL') {
          // Mark bill dropped via notes append (stays SEATED in DB)
          const { supabase } = await import("@/integrations/supabase/client");
          const existingNotes = reservation.notes || '';
          await supabase.from("res_reservations").update({
            notes: existingNotes.includes('[BILL_DROPPED]') ? existingNotes : `${existingNotes} [BILL_DROPPED]`.trim()
          } as any).eq("id", reservation.id);
        } else if (targetStep === 'SEATED') {
          await updateReservationStatus(reservation.id, 'SEATED');
        } else if (targetStep === 'COMPLETED') {
          await updateReservationStatus(reservation.id, 'COMPLETED');
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["res_reservations"], refetchType: "all" });
      qc.invalidateQueries({ queryKey: ["res_tables"], refetchType: "all" });
      toast.success(`Table ${table.name} → ${nextStep}`);
      onDone?.();
    },
  });

  const blockMut = useMutation({
    mutationFn: async () => table.is_blocked ? unblockTable(table.id) : blockTable(table.id, "Manually blocked"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["res_tables"], refetchType: "all" });
      toast.success(table.is_blocked ? "Table unblocked" : "Table blocked");
      onDone?.();
    },
  });

  const guest = reservation?.res_guests;
  const guestName = guest ? `${guest.first_name} ${guest.last_name}` : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg">{table.name}</h3>
          <p className="text-sm text-muted-foreground">
            {table.zone} · {table.max_capacity} pax
            {guestName && <> · <span className="font-medium text-foreground">{guestName}</span></>}
          </p>
          {avgTurn && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" /> Avg turn: {Math.floor(avgTurn / 60)}hr {avgTurn % 60}min
            </p>
          )}
          {reservation?.seated_at && currentStep === 'SEATED' && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Seated {formatDistanceToNow(new Date(reservation.seated_at))} ago
            </p>
          )}
        </div>
        <Badge
          className={`${STEPS.find(s => s.key === currentStep)?.color ?? 'bg-muted'} text-white border-0`}
        >
          {STEPS.find(s => s.key === currentStep)?.label ?? currentStep}
        </Badge>
      </div>

      {/* Progress stepper */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => {
          const isActive = i <= stepIdx;
          const isCurrent = s.key === currentStep;
          return (
            <div key={s.key} className="flex items-center gap-1 flex-1">
              <div className={`flex items-center justify-center rounded-full w-8 h-8 transition-all
                ${isCurrent ? `${s.color} text-white ring-2 ring-offset-2 ring-offset-background ring-primary` :
                  isActive ? `${s.color} text-white opacity-60` : 'bg-muted text-muted-foreground'}`}
              >
                <s.icon className="w-4 h-4" />
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 ${isActive ? 'bg-primary/40' : 'bg-muted'}`} />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground px-1">
        {STEPS.map(s => <span key={s.key} className="text-center flex-1">{s.label}</span>)}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-2">
        {nextStep && (
          <Button
            className="w-full"
            onClick={() => advanceMut.mutate(nextStep)}
            disabled={advanceMut.isPending}
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            {nextStep === 'RESERVED' && !reservation ? 'New Booking' :
             nextStep === 'SEATED' ? 'Seat Guest' :
             nextStep === 'BILL' ? 'Drop Bill' :
             nextStep === 'COMPLETED' ? 'Mark Left' : nextStep}
          </Button>
        )}
        {currentStep === 'AVAILABLE' && (
          <Button variant="outline" className="w-full" onClick={() => {
            navigate(`/reservation/reservations/new?table_id=${table.id}`);
          }}>
            <Users className="w-4 h-4 mr-2" /> Walk-in / Book
          </Button>
        )}
        <Button
          variant={table.is_blocked ? "outline" : "destructive"}
          size="sm"
          className="w-full"
          onClick={() => blockMut.mutate()}
        >
          <Ban className="w-3.5 h-3.5 mr-1" />
          {table.is_blocked ? 'Unblock Table' : 'Block Table'}
        </Button>
      </div>

      {/* Reservation info */}
      {reservation && (
        <div
          className="text-xs text-muted-foreground p-2 rounded-md bg-muted/50 cursor-pointer hover:bg-muted"
          onClick={() => navigate(`/reservation/reservations/${reservation.id}`)}
        >
          Booking: {reservation.time?.slice(0, 5)} · {reservation.party_size} pax
          {reservation.special_requests && <span> · {reservation.special_requests}</span>}
        </div>
      )}
    </div>
  );
};

export default TableActionSheet;
