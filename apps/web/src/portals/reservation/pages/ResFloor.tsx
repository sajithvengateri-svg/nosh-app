import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Users, Link, Unlink, UserPlus, Edit3 } from "lucide-react";
import WalkInDialog from "../components/WalkInDialog";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import FloorCanvas from "../components/FloorCanvas";
import {
  fetchTables,
  fetchFloorLayouts,
  fetchReservationsByDate,
  fetchActiveWaitlist,
  updateReservationStatus,
  createJourneyEvent,
  combineTables,
  uncombineGroup,
} from "@/lib/shared/queries/resQueries";
import { useResStore } from "@/lib/shared/state/resStore";
import { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import type { JourneyStage } from "@/lib/shared/types/res.types";
import { supabase } from "@/integrations/supabase/client";

const ResFloor = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const { selectedTableId, setSelectedTableId, zoneWaiterMap, tableWaiterOverrides, floorActionMode } = useResStore();
  const [combineSelection, setCombineSelection] = useState<string[]>([]);
  const [isCombining, setIsCombining] = useState(false);
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [paxDialog, setPaxDialog] = useState<{ reservationId: string; currentPax: number } | null>(null);
  const [paxValue, setPaxValue] = useState(2);

  const { data: tables = [], isLoading } = useQuery({
    queryKey: ["res_tables", orgId],
    queryFn: async () => { const { data } = await fetchTables(orgId!); return data ?? []; },
    enabled: !!orgId,
  });

  const { data: layouts = [] } = useQuery({
    queryKey: ["res_floor_layouts", orgId],
    queryFn: async () => { const { data } = await fetchFloorLayouts(orgId!); return data ?? []; },
    enabled: !!orgId,
  });

  const { data: reservations = [] } = useQuery({
    queryKey: ["res_reservations", orgId, today],
    queryFn: async () => { const { data } = await fetchReservationsByDate(orgId!, today); return data ?? []; },
    enabled: !!orgId,
  });

  const { data: waitlist = [] } = useQuery({
    queryKey: ["res_waitlist", orgId],
    queryFn: async () => { const { data } = await fetchActiveWaitlist(orgId!); return data ?? []; },
    enabled: !!orgId,
  });

  const activeLayout = layouts.find((l: any) => l.is_active) ?? layouts[0] ?? null;

  // ---- Mutations ----
  const statusMutation = useMutation({
    mutationFn: async ({ id, targetStage }: { id: string; targetStage: string }) => {
      if (targetStage === "BILL") {
        const res = reservations.find((r: any) => r.id === id);
        const existing = res?.notes || "";
        if (!existing.includes("[BILL_DROPPED]")) {
          await supabase
            .from("res_reservations")
            .update({ notes: `${existing} [BILL_DROPPED]`.trim() } as any)
            .eq("id", id);
        }
        return;
      }
      const dbStatus =
        targetStage === "ARRIVING" ? "CONFIRMED" :
        targetStage === "LEFT" ? "COMPLETED" :
        targetStage === "NO_SHOW" ? "NO_SHOW" :
        targetStage === "CANCELLED" ? "CANCELLED" : targetStage;
      await updateReservationStatus(id, dbStatus);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["res_reservations"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["res_tables"], refetchType: "all" });
    },
  });

  const journeyEventMutation = useMutation({
    mutationFn: ({ reservationId, stage }: { reservationId: string; stage: JourneyStage }) =>
      createJourneyEvent({ reservation_id: reservationId, stage, org_id: orgId }),
    onError: (err: any) => { console.error("Journey event creation failed", err); },
  });

  // ---- Combine / uncombine mutations ----
  const combineTablesMut = useMutation({
    mutationFn: async (tableIds: string[]) => {
      await combineTables(tableIds);
      // Block secondary tables, keep the first as "lead"
      const [leadId, ...secondaryIds] = tableIds;
      for (const id of secondaryIds) {
        const leadTable = tables.find((t: any) => t.id === leadId);
        await supabase.from("res_tables").update({
          is_blocked: true,
          block_reason: `Joined to ${leadTable?.name ?? "lead table"}`,
        } as any).eq("id", id);
      }
      return leadId;
    },
    onSuccess: (leadId) => {
      queryClient.invalidateQueries({ queryKey: ["res_tables"], refetchType: "all" });
      const leadTable = tables.find((t: any) => t.id === leadId);
      toast.success(`Tables combined — ${leadTable?.name ?? "Lead table"} is the service point`);
      setIsCombining(false);
      setCombineSelection([]);
    },
    onError: () => toast.error("Failed to combine tables"),
  });

  const uncombineTablesMut = useMutation({
    mutationFn: async (groupId: string) => {
      // Find all tables in the group
      const groupTables = tables.filter((t: any) => t.group_id === groupId);
      // Uncombine
      await uncombineGroup(groupId);
      // Unblock secondary tables
      for (const t of groupTables) {
        if (t.is_blocked && t.block_reason?.includes("Joined to")) {
          await supabase.from("res_tables").update({
            is_blocked: false,
            block_reason: null,
          } as any).eq("id", t.id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["res_tables"], refetchType: "all" });
      toast.success("Tables uncombined");
    },
    onError: () => toast.error("Failed to uncombine tables"),
  });

  // ---- Pax adjustment mutation ----
  const paxMutation = useMutation({
    mutationFn: async ({ id, newPax }: { id: string; newPax: number }) => {
      const { error } = await supabase.from("res_reservations").update({ party_size: newPax } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["res_reservations"], refetchType: "all" });
      toast.success("Party size updated");
      setPaxDialog(null);
    },
    onError: () => toast.error("Failed to update party size"),
  });

  const advanceReservation = useCallback(
    (reservationId: string, targetStage: string) => {
      statusMutation.mutate({ id: reservationId, targetStage });
      if (["ARRIVING", "SEATED", "ORDERED", "IN_SERVICE", "BILL", "LEFT"].includes(targetStage)) {
        journeyEventMutation.mutate({ reservationId, stage: targetStage as JourneyStage });
      }
      const label =
        targetStage === "SEATED" ? "Seated" :
        targetStage === "BILL" ? "Bill dropped" :
        targetStage === "LEFT" ? "Marked left" :
        targetStage === "NO_SHOW" ? "No show" :
        targetStage === "CANCELLED" ? "Cancelled" : targetStage;
      toast.success(label);
    },
    [statusMutation, journeyEventMutation]
  );

  // ---- Waiter initials map for FloorCanvas ----
  const getWaiterForTable = useCallback((table: any): string | null => {
    if (!table) return null;
    const override = tableWaiterOverrides[table.id];
    if (override) return override.staffName;
    const zoneAssignment = zoneWaiterMap[table.zone];
    if (zoneAssignment) return zoneAssignment.staffName;
    return null;
  }, [tableWaiterOverrides, zoneWaiterMap]);

  const waiterInitialsMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const table of tables) {
      const name = getWaiterForTable(table);
      if (name) {
        const parts = name.split(' ');
        map[table.id] = parts.map((p: string) => p[0]).join('').toUpperCase().slice(0, 2);
      }
    }
    return map;
  }, [tables, getWaiterForTable]);

  // ---- Unified table action handler (radial menu / popover) ----
  const handleTableAction = useCallback((tableId: string, action: string) => {
    const table = tables.find((t: any) => t.id === tableId);
    if (!table) return;
    const res = reservations.find((r: any) => r.table_id === tableId && (r.status === 'SEATED' || r.status === 'CONFIRMED'));

    switch (action) {
      case 'seat':
        if (res) advanceReservation(res.id, 'SEATED');
        break;
      case 'bill':
        if (res) advanceReservation(res.id, 'BILL');
        break;
      case 'left':
        if (res) advanceReservation(res.id, 'LEFT');
        break;
      case 'noshow':
        if (res) advanceReservation(res.id, 'NO_SHOW');
        break;
      case 'cancel':
        if (res) advanceReservation(res.id, 'CANCELLED');
        break;
      case 'block':
        import('@/lib/shared/queries/resQueries').then(({ blockTable, unblockTable }) => {
          if (table.is_blocked) {
            unblockTable(table.id).then(() => {
              queryClient.invalidateQueries({ queryKey: ["res_tables"], refetchType: "all" });
              toast.success("Table unblocked");
            });
          } else {
            blockTable(table.id, "Blocked from floor").then(() => {
              queryClient.invalidateQueries({ queryKey: ["res_tables"], refetchType: "all" });
              toast.success("Table blocked");
            });
          }
        });
        break;
      case 'book':
        navigate(`/reservation/reservations/new?table_id=${tableId}`);
        break;
      case 'walkin':
        setWalkInOpen(true);
        break;
      case 'uncombine':
        if (table.group_id) uncombineTablesMut.mutate(table.group_id);
        break;
      case 'adjust_pax':
        if (res) {
          setPaxValue(res.party_size ?? 2);
          setPaxDialog({ reservationId: res.id, currentPax: res.party_size ?? 2 });
        }
        break;
    }
  }, [tables, reservations, advanceReservation, navigate, queryClient, uncombineTablesMut]);

  const handleTableClick = (t: any) => {
    if (isCombining) {
      setCombineSelection(prev =>
        prev.includes(t.id) ? prev.filter((id: string) => id !== t.id) : [...prev, t.id]
      );
    } else {
      setSelectedTableId(t.id === selectedTableId ? null : t.id);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Live Floor</h1>
        <div className="flex gap-2">
          {isCombining ? (
            <>
              <Button variant="outline" onClick={() => { setIsCombining(false); setCombineSelection([]); }}>Cancel</Button>
              <Button
                disabled={combineSelection.length < 2 || combineTablesMut.isPending}
                onClick={() => combineTablesMut.mutate(combineSelection)}
              >
                {combineTablesMut.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Link className="w-4 h-4 mr-2" />}
                Combine {combineSelection.length} Tables
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsCombining(true)}>
                <Link className="w-4 h-4 mr-2" /> Combine
              </Button>
              <Button variant="outline" onClick={() => navigate("/reservation/waitlist")}>
                <Users className="w-4 h-4 mr-2" /> Waitlist ({waitlist.length})
              </Button>
              <Button onClick={() => setWalkInOpen(true)}>
                <UserPlus className="w-4 h-4 mr-2" /> Walk-in
              </Button>
            </>
          )}
        </div>
      </div>

      {isCombining && (
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm text-primary">
          Tap 2 or more tables to combine them. Selected: {combineSelection.length}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {[
          { label: "Available", color: "bg-emerald-500" },
          { label: "Reserved", color: "bg-blue-500" },
          { label: "Seated", color: "bg-red-500" },
          { label: "Bill Dropped", color: "bg-amber-400" },
          { label: "Blocked", color: "bg-muted" },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full ${s.color}`} />
            <span className="text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Combined table groups */}
      {(() => {
        const groups: Record<string, any[]> = {};
        for (const t of tables) {
          if (t.group_id) {
            if (!groups[t.group_id]) groups[t.group_id] = [];
            groups[t.group_id].push(t);
          }
        }
        const groupEntries = Object.entries(groups);
        if (groupEntries.length === 0) return null;
        return (
          <div className="flex flex-wrap gap-2">
            {groupEntries.map(([groupId, groupTables]) => {
              const totalCapacity = groupTables.reduce((sum: number, t: any) => sum + (t.max_capacity ?? 0), 0);
              const leadTable = groupTables[0];
              return (
                <div key={groupId} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-sm">
                  <Link className="w-3.5 h-3.5 text-primary" />
                  <span className="font-medium">{groupTables.map((t: any) => t.name).join(" + ")}</span>
                  <span className="text-muted-foreground">({totalCapacity} pax)</span>
                  <span className="text-xs text-muted-foreground">Lead: {leadTable?.name}</span>
                  <Button
                    variant="ghost" size="sm"
                    className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                    onClick={() => uncombineTablesMut.mutate(groupId)}
                    disabled={uncombineTablesMut.isPending}
                  >
                    <Unlink className="w-3 h-3 mr-1" /> Split
                  </Button>
                </div>
              );
            })}
          </div>
        );
      })()}

      <FloorCanvas
        tables={tables as any}
        layout={activeLayout}
        reservations={reservations as any}
        selectedTableId={isCombining ? null : selectedTableId}
        onTableClick={handleTableClick}
        onTableAction={handleTableAction}
        waiterMap={waiterInitialsMap}
        floorActionMode={floorActionMode}
        onCanvasClick={() => setSelectedTableId(null)}
      />

      {/* Pax adjustment dialog */}
      <Dialog open={!!paxDialog} onOpenChange={() => setPaxDialog(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="w-4 h-4" /> Adjust Party Size
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>New party size</Label>
              <Input
                type="number" min={1} max={50}
                value={paxValue}
                onChange={e => setPaxValue(+e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6, 8, 10].map(n => (
                <Button
                  key={n} variant={paxValue === n ? "default" : "outline"}
                  size="sm" className="flex-1 h-8 text-xs"
                  onClick={() => setPaxValue(n)}
                >
                  {n}
                </Button>
              ))}
            </div>
            <Button
              className="w-full"
              onClick={() => paxDialog && paxMutation.mutate({ id: paxDialog.reservationId, newPax: paxValue })}
              disabled={paxMutation.isPending}
            >
              {paxMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Update to {paxValue} guests
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <WalkInDialog open={walkInOpen} onOpenChange={setWalkInOpen} />
    </div>
  );
};

export default ResFloor;
