import { useState } from "react";
import { usePOSStore } from "@/lib/shared/state/posStore";
import { calcSubtotal, calcTax } from "@/lib/shared/calculations/posCalc";
import { DEFAULT_STATION_COLORS } from "../../pages/POSOrderScreen";
import { Minus, Plus, Trash2, ChevronLeft, Send, StickyNote, DollarSign, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { POSStation } from "@/lib/shared/types/pos.types";
import PaymentDialog from "./PaymentDialog";
import { useSubmitOrder } from "../../hooks/useSubmitOrder";
import { useCurrencySymbol } from "@/hooks/useCurrencySymbol";

interface Props {
  onCollapse: () => void;
}

export default function POSCart({ onCollapse }: Props) {
  const sym = useCurrencySymbol();
  const [payOpen, setPayOpen] = useState(false);
  const cart = usePOSStore((s) => s.cart);
  const orderType = usePOSStore((s) => s.orderType);
  const tableNumber = usePOSStore((s) => s.tableNumber);
  const setTableNumber = usePOSStore((s) => s.setTableNumber);
  const orderNotes = usePOSStore((s) => s.orderNotes);
  const setOrderNotes = usePOSStore((s) => s.setOrderNotes);
  const updateCartItemQty = usePOSStore((s) => s.updateCartItemQty);
  const removeFromCart = usePOSStore((s) => s.removeFromCart);
  const clearCart = usePOSStore((s) => s.clearCart);
  const tabId = usePOSStore((s) => s.tabId);

  const submitOrder = useSubmitOrder();

  const subtotal = calcSubtotal(cart);
  const tax = calcTax(subtotal, 0.1);
  const total = subtotal + tax;

  const handleSend = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    if (orderType === "DINE_IN" && !tableNumber) {
      toast.error("Please enter a table number");
      return;
    }
    try {
      const order = await submitOrder.mutateAsync({
        cart, orderType, tableNumber, orderNotes, tabId,
      });
      toast.success(`Order #${order.order_number} sent to kitchen`);
      clearCart();
    } catch (e: any) {
      toast.error(e?.message || "Failed to send order");
    }
  };

  // Group cart items by station for visual clarity
  const stationGroups = cart.reduce<Record<string, typeof cart>>((acc, item) => {
    const key = item.station;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/10">
        <button onClick={onCollapse} className="text-slate-400 hover:text-white">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-white">
          Order
          <span className="ml-2 text-[10px] uppercase tracking-wider text-slate-500">
            {orderType.replace("_", " ")}
          </span>
        </span>
        {cart.length > 0 && (
          <button onClick={clearCart} className="text-slate-500 hover:text-red-400 text-[10px]">
            Clear
          </button>
        )}
      </div>

      {/* Table number for dine-in */}
      {orderType === "DINE_IN" && (
        <div className="px-3 py-2 border-b border-white/5">
          <Input
            placeholder="Table #"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            className="h-8 bg-white/5 border-white/10 text-white text-sm placeholder:text-slate-500"
          />
        </div>
      )}

      {/* Cart items */}
      <div className="flex-1 overflow-auto px-3 py-2 space-y-1">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-500 text-xs">
            <StickyNote className="h-6 w-6 mb-2 opacity-50" />
            Tap menu items to add
          </div>
        ) : (
          Object.entries(stationGroups).map(([station, items]) => {
            const sc = DEFAULT_STATION_COLORS[station as POSStation];
            return (
              <div key={station}>
                {/* Station label */}
                <div className="flex items-center gap-1.5 py-1">
                  <span className={cn("h-1.5 w-1.5 rounded-full", sc?.text.replace("text-", "bg-"))} />
                  <span className={cn("text-[9px] font-semibold uppercase tracking-wider", sc?.text)}>
                    {sc?.label || station}
                  </span>
                </div>
                {items.map((item) => (
                  <div
                    key={item.tempId}
                    className="flex items-center gap-2 py-1.5 group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white truncate">{item.name}</p>
                      {item.modifiers.length > 0 && (
                        <p className="text-[10px] text-slate-500 truncate">
                          {item.modifiers.map(m => m.name).join(", ")}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateCartItemQty(item.tempId, item.quantity - 1)}
                        className="h-5 w-5 rounded bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-xs font-medium text-white w-5 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartItemQty(item.tempId, item.quantity + 1)}
                        className="h-5 w-5 rounded bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <span className="text-xs text-slate-300 w-14 text-right">
                      {sym}{(item.quantity * item.unitPrice).toFixed(2)}
                    </span>

                    <button
                      onClick={() => removeFromCart(item.tempId)}
                      className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>

      {/* Notes */}
      {cart.length > 0 && (
        <div className="px-3 py-1.5 border-t border-white/5">
          <Input
            placeholder="Order notes..."
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
            className="h-7 bg-white/5 border-white/10 text-white text-[11px] placeholder:text-slate-600"
          />
        </div>
      )}

      {/* Totals */}
      <div className="px-3 py-2 border-t border-white/10 space-y-1 text-xs">
        <div className="flex justify-between text-slate-400">
          <span>Subtotal</span>
          <span>{sym}{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>GST (10%)</span>
          <span>{sym}{tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-white font-semibold text-sm pt-1">
          <span>Total</span>
          <span>{sym}{total.toFixed(2)}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="p-3 border-t border-white/10 space-y-2">
        <Button
          onClick={handleSend}
          disabled={cart.length === 0 || submitOrder.isPending}
          className="w-full bg-rose-500 hover:bg-rose-600 text-white gap-2"
        >
          {submitOrder.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {submitOrder.isPending ? "Sending..." : "Send Order"}
        </Button>
        <Button
          onClick={() => setPayOpen(true)}
          disabled={cart.length === 0}
          variant="outline"
          className="w-full border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 gap-2"
        >
          <DollarSign className="h-4 w-4" />
          Pay Now
        </Button>
      </div>

      <PaymentDialog
        open={payOpen}
        onClose={() => setPayOpen(false)}
        onComplete={() => { setPayOpen(false); clearCart(); }}
      />
    </div>
  );
}
