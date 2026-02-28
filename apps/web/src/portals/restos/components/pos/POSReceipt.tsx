import type { CartItem, POSPaymentMethod, POSOrderType } from "@/lib/shared/types/pos.types";
import { Button } from "@/components/ui/button";
import { Printer, Check, Mail } from "lucide-react";
import { toast } from "sonner";

interface Props {
  cart: CartItem[];
  subtotal: number;
  tax: number;
  surcharge: number;
  tip: number;
  total: number;
  method: POSPaymentMethod;
  tendered?: number;
  change?: number;
  tableNumber: string;
  orderType: POSOrderType;
  onDone: () => void;
  sym?: string;
}

export default function POSReceipt({
  cart, subtotal, tax, surcharge, tip, total,
  method, tendered, change, tableNumber, orderType, onDone, sym = "$"
}: Props) {
  const now = new Date();

  return (
    <div className="space-y-4">
      {/* Receipt preview */}
      <div className="bg-white text-black rounded-lg p-5 font-mono text-xs leading-relaxed max-h-[50vh] overflow-auto">
        <div className="text-center mb-3">
          <p className="font-bold text-sm">RestOS</p>
          <p className="text-[10px] text-gray-500">{now.toLocaleDateString()} {now.toLocaleTimeString()}</p>
          {tableNumber && <p className="text-[10px]">Table: {tableNumber}</p>}
          <p className="text-[10px] text-gray-500">{orderType.replace("_", " ")}</p>
        </div>

        <div className="border-t border-dashed border-gray-300 my-2" />

        {cart.map((item) => (
          <div key={item.tempId} className="flex justify-between py-0.5">
            <div className="flex-1">
              <span>{item.quantity}× {item.name}</span>
              {item.modifiers.length > 0 && (
                <p className="text-[10px] text-gray-500 ml-4">
                  {item.modifiers.map(m => m.name).join(", ")}
                </p>
              )}
            </div>
            <span>{sym}{(item.quantity * (item.unitPrice + item.modifiers.reduce((s, m) => s + m.price, 0))).toFixed(2)}</span>
          </div>
        ))}

        <div className="border-t border-dashed border-gray-300 my-2" />

        <div className="space-y-0.5">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{sym}{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>GST</span>
            <span>{sym}{tax.toFixed(2)}</span>
          </div>
          {surcharge > 0 && (
            <div className="flex justify-between">
              <span>Card surcharge</span>
              <span>{sym}{surcharge.toFixed(2)}</span>
            </div>
          )}
          {tip > 0 && (
            <div className="flex justify-between">
              <span>Tip</span>
              <span>{sym}{tip.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="border-t border-dashed border-gray-300 my-2" />

        <div className="flex justify-between font-bold text-sm">
          <span>TOTAL</span>
          <span>{sym}{total.toFixed(2)}</span>
        </div>

        <div className="mt-2 space-y-0.5">
          <div className="flex justify-between">
            <span>Method</span>
            <span>{method}</span>
          </div>
          {tendered !== undefined && (
            <div className="flex justify-between">
              <span>Tendered</span>
              <span>{sym}{tendered.toFixed(2)}</span>
            </div>
          )}
          {change !== undefined && change > 0 && (
            <div className="flex justify-between font-bold">
              <span>Change</span>
              <span>{sym}{change.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="text-center mt-4 text-[10px] text-gray-400">
          Thank you!
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => toast.info("Print sent to receipt printer")}
          className="flex-1 border-white/10 text-slate-300 hover:text-white gap-1.5"
        >
          <Printer className="h-4 w-4" />
          Print
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.info("Email receipt sent")}
          className="flex-1 border-white/10 text-slate-300 hover:text-white gap-1.5"
        >
          <Mail className="h-4 w-4" />
          Email
        </Button>
      </div>
      <Button
        onClick={onDone}
        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-12 text-base gap-2"
      >
        <Check className="h-5 w-5" />
        Done
      </Button>
    </div>
  );
}
