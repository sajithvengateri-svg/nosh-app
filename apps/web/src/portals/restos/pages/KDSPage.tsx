import { useState, useMemo, useEffect } from "react";
import { usePOSOrders, useOrderMutations } from "../hooks/usePOSOrders";
import KDSTicketCard from "../components/kds/KDSTicketCard";
import KDSStationFilter from "../components/kds/KDSStationFilter";
import type { POSStation } from "@/lib/shared/types/pos.types";
import { MonitorPlay, Volume2, VolumeX, Maximize, Minimize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import TimerDock from "@/components/timers/TimerDock";

const KDS_STATUSES = ["SENT", "IN_PROGRESS", "READY"];

export default function KDSPage() {
  const { data: orders = [], isLoading } = usePOSOrders();
  const { updateStatus, addEvent } = useOrderMutations();
  const [activeStation, setActiveStation] = useState<POSStation | null>(null);
  const [soundOn, setSoundOn] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  // Filter orders to KDS-relevant statuses
  const kdsOrders = useMemo(() => {
    let filtered = orders.filter((o: any) => KDS_STATUSES.includes(o.status));
    if (activeStation) {
      filtered = filtered.filter((o: any) =>
        o.items?.some((i: any) => i.station === activeStation)
      );
    }
    // Sort by created_at ascending (oldest first)
    return filtered.sort(
      (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [orders, activeStation]);

  const handleBump = async (orderId: string, currentStatus: string) => {
    const nextStatus =
      currentStatus === "SENT"
        ? "IN_PROGRESS"
        : currentStatus === "IN_PROGRESS"
        ? "READY"
        : "COMPLETED";

    try {
      await updateStatus.mutateAsync({ id: orderId, status: nextStatus });
      await addEvent.mutateAsync({
        order_id: orderId,
        event_type: `STATUS_${nextStatus}`,
        data: { from: currentStatus, to: nextStatus },
      });
      toast.success(
        nextStatus === "IN_PROGRESS"
          ? "Started"
          : nextStatus === "READY"
          ? "Ready for pickup"
          : "Completed"
      );
    } catch {
      toast.error("Failed to update order");
    }
  };

  const handleRecall = async (orderId: string) => {
    try {
      await updateStatus.mutateAsync({ id: orderId, status: "SENT" });
      toast.info("Order recalled");
    } catch {
      toast.error("Failed to recall");
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  // Count by status
  const counts = useMemo(() => {
    const c = { SENT: 0, IN_PROGRESS: 0, READY: 0 };
    kdsOrders.forEach((o: any) => {
      if (c[o.status as keyof typeof c] !== undefined) c[o.status as keyof typeof c]++;
    });
    return c;
  }, [kdsOrders]);

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] -m-4 md:-m-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/10 bg-[#0a0c10]/80 backdrop-blur-sm shrink-0">
        <MonitorPlay className="h-5 w-5 text-rose-400" />
        <h1 className="text-sm font-bold text-white tracking-wide">Kitchen Display</h1>

        {/* Status badges */}
        <div className="flex gap-2 ml-4">
          <StatusBadge label="New" count={counts.SENT} color="bg-sky-500" />
          <StatusBadge label="Cooking" count={counts.IN_PROGRESS} color="bg-amber-500" />
          <StatusBadge label="Ready" count={counts.READY} color="bg-emerald-500" />
        </div>

        <div className="flex-1" />

        <KDSStationFilter active={activeStation} onSelect={setActiveStation} />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSoundOn(!soundOn)}
          className="text-slate-400 hover:text-white h-8 w-8"
        >
          {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFullscreen}
          className="text-slate-400 hover:text-white h-8 w-8"
        >
          {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </Button>
      </div>

      {/* Timer Dock */}
      <TimerDock station={activeStation ?? undefined} category="kitchen" />

      {/* Ticket board */}
      <div className="flex-1 overflow-auto p-3">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-48 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : kdsOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <MonitorPlay className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">No active tickets</p>
            <p className="text-xs text-slate-600 mt-1">Orders will appear here when sent from POS</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {kdsOrders.map((order: any) => (
              <KDSTicketCard
                key={order.id}
                order={order}
                activeStation={activeStation}
                onBump={() => handleBump(order.id, order.status)}
                onRecall={() => handleRecall(order.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className={cn("h-2 w-2 rounded-full", color)} />
      <span className="text-slate-400">{label}</span>
      <span className="text-white font-semibold">{count}</span>
    </div>
  );
}
