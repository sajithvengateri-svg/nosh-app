import { useState } from "react";
import { usePOSTabs, useTabOrders, useTabMutations } from "../hooks/usePOSTabs";
import { Plus, CreditCard, X, ChevronRight, Clock, DollarSign, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";

export default function TabsPage() {
  const { data: openTabs, isLoading: loadingOpen } = usePOSTabs("OPEN");
  const { data: closedTabs, isLoading: loadingClosed } = usePOSTabs("CLOSED");
  const { open: openTab, close: closeTab } = useTabMutations();
  const [newTabName, setNewTabName] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTabId, setSelectedTabId] = useState<string | null>(null);
  const [view, setView] = useState<"open" | "closed">("open");

  const tabs = view === "open" ? openTabs : closedTabs;
  const loading = view === "open" ? loadingOpen : loadingClosed;

  const handleOpenTab = async () => {
    if (!newTabName.trim()) {
      toast.error("Enter a tab name");
      return;
    }
    try {
      await openTab.mutateAsync(newTabName.trim());
      toast.success(`Tab "${newTabName}" opened`);
      setNewTabName("");
      setOpenDialog(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to open tab");
    }
  };

  const handleCloseTab = async (id: string, name: string) => {
    try {
      await closeTab.mutateAsync(id);
      toast.success(`Tab "${name}" closed`);
      if (selectedTabId === id) setSelectedTabId(null);
    } catch (e: any) {
      toast.error(e?.message || "Failed to close tab");
    }
  };

  return (
    <div className="flex h-full">
      {/* Tab list */}
      <div className="w-80 border-r border-white/10 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-white">Tabs</h1>
            <Button
              size="sm"
              onClick={() => setOpenDialog(true)}
              className="bg-rose-500 hover:bg-rose-600 text-white gap-1.5 h-8"
            >
              <Plus className="h-3.5 w-3.5" />
              New Tab
            </Button>
          </div>
          {/* View toggle */}
          <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
            {(["open", "closed"] as const).map((v) => (
              <button
                key={v}
                onClick={() => { setView(v); setSelectedTabId(null); }}
                className={cn(
                  "flex-1 py-1.5 text-xs font-medium rounded-md capitalize transition-colors",
                  view === v ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
                )}
              >
                {v} ({v === "open" ? openTabs?.length ?? 0 : closedTabs?.length ?? 0})
              </button>
            ))}
          </div>
        </div>

        {/* Tab cards */}
        <div className="flex-1 overflow-auto p-3 space-y-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
            </div>
          ) : !tabs?.length ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No {view} tabs
            </div>
          ) : (
            tabs.map((tab: any) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTabId(tab.id)}
                className={cn(
                  "w-full text-left p-3 rounded-xl border transition-all",
                  selectedTabId === tab.id
                    ? "bg-white/10 border-rose-500/40"
                    : "bg-white/[0.03] border-white/10 hover:bg-white/[0.06]"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-amber-400" />
                    <span className="text-sm font-medium text-white">{tab.name}</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(tab.opened_at), "dd MMM HH:mm")}
                  </span>
                  {tab.card_last_four && (
                    <span>•••• {tab.card_last_four}</span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Tab detail panel */}
      <div className="flex-1">
        {selectedTabId ? (
          <TabDetail
            tabId={selectedTabId}
            tab={tabs?.find((t: any) => t.id === selectedTabId)}
            onClose={handleCloseTab}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm">
            <CreditCard className="h-10 w-10 mb-3 opacity-30" />
            Select a tab to view details
          </div>
        )}
      </div>

      {/* New tab dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="bg-[#1a1d27] border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle>Open New Tab</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input
              placeholder="Guest name or table..."
              value={newTabName}
              onChange={(e) => setNewTabName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleOpenTab()}
              className="bg-white/5 border-white/10 text-white"
              autoFocus
            />
            <Button
              onClick={handleOpenTab}
              disabled={openTab.isPending}
              className="w-full bg-rose-500 hover:bg-rose-600 text-white gap-2"
            >
              {openTab.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Open Tab
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Tab Detail Sub-component ─── */
function TabDetail({ tabId, tab, onClose }: {
  tabId: string;
  tab: any;
  onClose: (id: string, name: string) => void;
}) {
  const { data: orders, isLoading } = useTabOrders(tabId);

  const runningTotal = (orders ?? []).reduce((sum: number, o: any) => sum + Number(o.total ?? 0), 0);
  const isOpen = tab?.status === "OPEN";

  return (
    <div className="flex flex-col h-full">
      {/* Detail header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-amber-400" />
            {tab?.name}
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Opened {tab ? format(new Date(tab.opened_at), "dd MMM yyyy HH:mm") : ""}
            {tab?.closed_at && ` · Closed ${format(new Date(tab.closed_at), "dd MMM HH:mm")}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Running Total</p>
            <p className="text-lg font-bold text-emerald-400">${runningTotal.toFixed(2)}</p>
          </div>
          {isOpen && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onClose(tabId, tab?.name)}
              className="border-red-500/40 text-red-400 hover:bg-red-500/10 gap-1.5 h-8"
            >
              <X className="h-3.5 w-3.5" />
              Close Tab
            </Button>
          )}
        </div>
      </div>

      {/* Orders list */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
          </div>
        ) : !orders?.length ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No orders on this tab yet
          </div>
        ) : (
          orders.map((order: any) => (
            <div
              key={order.id}
              className="bg-white/[0.03] border border-white/10 rounded-xl p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">
                    #{order.order_number}
                  </span>
                  <span className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded-full font-medium uppercase",
                    order.status === "PAID" ? "bg-emerald-500/15 text-emerald-400" :
                    order.status === "SENT" ? "bg-sky-500/15 text-sky-400" :
                    order.status === "COMPLETED" ? "bg-emerald-500/15 text-emerald-400" :
                    "bg-slate-500/15 text-slate-400"
                  )}>
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <Clock className="h-3 w-3" />
                  {format(new Date(order.created_at), "HH:mm")}
                  <span className="font-medium text-white">${Number(order.total ?? 0).toFixed(2)}</span>
                </div>
              </div>
              {/* Items */}
              <div className="space-y-0.5">
                {(order.items ?? []).map((item: any) => (
                  <div key={item.id} className="flex justify-between text-[11px]">
                    <span className="text-slate-300">
                      {item.quantity}× {item.item_name}
                    </span>
                    <span className="text-slate-500">
                      ${(item.quantity * Number(item.unit_price)).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer summary */}
      {isOpen && orders && orders.length > 0 && (
        <div className="p-4 border-t border-white/10 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {orders.length} order{orders.length > 1 ? "s" : ""} on tab
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-400" />
            <span className="text-lg font-bold text-white">${runningTotal.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
