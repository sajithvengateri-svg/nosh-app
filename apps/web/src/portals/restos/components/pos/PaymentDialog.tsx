import { useState, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { calcSubtotal, calcTax, calcSurcharge, calcChange, calcSplitAmounts } from "@/lib/shared/calculations/posCalc";
import { usePOSStore } from "@/lib/shared/state/posStore";
import type { POSPaymentMethod, CartItem } from "@/lib/shared/types/pos.types";
import { Banknote, CreditCard, Users, Receipt, ArrowLeft, Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import POSReceipt from "./POSReceipt";
import { useSubmitOrderWithPayment } from "../../hooks/useSubmitOrder";
import { useCurrencySymbol } from "@/hooks/useCurrencySymbol";

interface Props {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const QUICK_CASH = [5, 10, 20, 50, 100];
const TIP_PRESETS = [0, 5, 10, 15, 20]; // percentages

type PayStep = "method" | "cash" | "card" | "split" | "tip" | "receipt";

export default function PaymentDialog({ open, onClose, onComplete }: Props) {
  const sym = useCurrencySymbol();
  const cart = usePOSStore((s) => s.cart);
  const orderType = usePOSStore((s) => s.orderType);
  const tableNumber = usePOSStore((s) => s.tableNumber);
  const orderNotes = usePOSStore((s) => s.orderNotes);
  const tabId = usePOSStore((s) => s.tabId);
  const submitWithPayment = useSubmitOrderWithPayment();

  const [step, setStep] = useState<PayStep>("method");
  const [method, setMethod] = useState<POSPaymentMethod>("CASH");
  const [tendered, setTendered] = useState("");
  const [tipPct, setTipPct] = useState(0);
  const [tipCustom, setTipCustom] = useState("");
  const [splits, setSplits] = useState(2);
  const [splitPaid, setSplitPaid] = useState(0);

  const subtotal = calcSubtotal(cart);
  const tax = calcTax(subtotal, 0.1);
  const surcharge = method === "CARD" ? calcSurcharge(subtotal + tax, 0.015) : 0;
  const tipAmount = tipCustom ? Number(tipCustom) || 0 : Math.round((subtotal + tax) * tipPct) / 100;
  const total = Math.round((subtotal + tax + surcharge + tipAmount) * 100) / 100;

  const splitAmounts = useMemo(() => calcSplitAmounts(total, splits), [total, splits]);

  const change = calcChange(Number(tendered) || 0, total);

  const resetState = () => {
    setStep("method");
    setMethod("CASH");
    setTendered("");
    setTipPct(0);
    setTipCustom("");
    setSplits(2);
    setSplitPaid(0);
  };

  const handleSelectMethod = (m: POSPaymentMethod) => {
    setMethod(m);
    if (m === "CASH") setStep("cash");
    else if (m === "CARD") setStep("tip");
    else if (m === "SPLIT") setStep("split");
    else setStep("tip");
  };

  const handleCashComplete = async () => {
    if ((Number(tendered) || 0) < total) {
      toast.error("Insufficient amount tendered");
      return;
    }
    try {
      await submitWithPayment.mutateAsync({
        cart, orderType, tableNumber, orderNotes, tabId,
        method: "CASH", tip: tipAmount,
        tendered: Number(tendered), changeGiven: change,
      });
      setStep("receipt");
    } catch (e: any) {
      toast.error(e?.message || "Payment failed");
    }
  };

  const handleCardComplete = async () => {
    try {
      await submitWithPayment.mutateAsync({
        cart, orderType, tableNumber, orderNotes, tabId,
        method: "CARD", tip: tipAmount,
      });
      toast.success("Card payment processed");
      setStep("receipt");
    } catch (e: any) {
      toast.error(e?.message || "Payment failed");
    }
  };

  const handleSplitNext = () => {
    setSplitPaid((p) => p + 1);
    if (splitPaid + 1 >= splits) {
      setStep("receipt");
    }
  };

  const handleFinish = () => {
    toast.success("Payment complete");
    resetState();
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={() => { resetState(); onClose(); }}>
      <DialogContent className="bg-[#141720] border-white/10 text-white max-w-lg p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          {step !== "method" && step !== "receipt" && (
            <button onClick={() => setStep("method")} className="text-slate-400 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <h2 className="text-sm font-bold text-white">
            {step === "method" && "Select Payment Method"}
            {step === "cash" && "Cash Payment"}
            {step === "card" && "Card Payment"}
            {step === "split" && `Split Payment (${splitPaid + 1}/${splits})`}
            {step === "tip" && "Add Tip"}
            {step === "receipt" && "Receipt"}
          </h2>
          <div className="flex-1" />
          <span className="text-lg font-bold text-rose-400">{sym}{total.toFixed(2)}</span>
        </div>

        <div className="p-4">
          {/* METHOD SELECTION */}
          {step === "method" && (
            <div className="grid grid-cols-2 gap-3">
              {[
                { method: "CASH" as POSPaymentMethod, icon: Banknote, label: "Cash", color: "bg-emerald-500/15 border-emerald-500/40 text-emerald-400" },
                { method: "CARD" as POSPaymentMethod, icon: CreditCard, label: "Card", color: "bg-sky-500/15 border-sky-500/40 text-sky-400" },
                { method: "SPLIT" as POSPaymentMethod, icon: Users, label: "Split", color: "bg-violet-500/15 border-violet-500/40 text-violet-400" },
                { method: "TAB" as POSPaymentMethod, icon: Receipt, label: "Tab", color: "bg-amber-500/15 border-amber-500/40 text-amber-400" },
              ].map((opt) => (
                <button
                  key={opt.method}
                  onClick={() => handleSelectMethod(opt.method)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-6 rounded-xl border-2 transition-all hover:scale-[1.02] active:scale-[0.98]",
                    opt.color
                  )}
                >
                  <opt.icon className="h-8 w-8" />
                  <span className="text-sm font-semibold">{opt.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* CASH */}
          {step === "cash" && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-1">Amount Due</p>
                <p className="text-3xl font-bold text-white">{sym}{total.toFixed(2)}</p>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Tendered</label>
                <Input
                  type="number"
                  value={tendered}
                  onChange={(e) => setTendered(e.target.value)}
                  placeholder="0.00"
                  className="h-12 text-2xl text-center bg-white/5 border-white/10 text-white font-mono"
                  autoFocus
                />
              </div>

              {/* Quick cash buttons */}
              <div className="flex gap-2">
                {QUICK_CASH.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setTendered(String(amt))}
                    className="flex-1 py-2 rounded-lg bg-white/5 text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors"
                  >
                    {sym}{amt}
                  </button>
                ))}
                <button
                  onClick={() => setTendered(total.toFixed(2))}
                  className="flex-1 py-2 rounded-lg bg-emerald-500/10 text-sm font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                >
                  Exact
                </button>
              </div>

              {Number(tendered) >= total && (
                <div className="text-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <p className="text-xs text-emerald-400">Change</p>
                  <p className="text-2xl font-bold text-emerald-400">{sym}{change.toFixed(2)}</p>
                </div>
              )}

              <Button
                onClick={handleCashComplete}
                disabled={(Number(tendered) || 0) < total || submitWithPayment.isPending}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-12 text-base gap-2"
              >
                {submitWithPayment.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                {submitWithPayment.isPending ? "Processing..." : "Complete Cash Payment"}
              </Button>
            </div>
          )}

          {/* TIP (for card) */}
          {step === "tip" && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-1">Subtotal (inc. GST{surcharge > 0 ? " + surcharge" : ""})</p>
                <p className="text-2xl font-bold text-white">{sym}{(subtotal + tax + surcharge).toFixed(2)}</p>
                {surcharge > 0 && (
                  <p className="text-[10px] text-slate-500 mt-1">Card surcharge: {sym}{surcharge.toFixed(2)}</p>
                )}
              </div>

              <div>
                <p className="text-xs text-slate-400 mb-2">Tip</p>
                <div className="flex gap-2">
                  {TIP_PRESETS.map((pct) => (
                    <button
                      key={pct}
                      onClick={() => { setTipPct(pct); setTipCustom(""); }}
                      className={cn(
                        "flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        tipPct === pct && !tipCustom
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                          : "bg-white/5 text-slate-300 hover:bg-white/10"
                      )}
                    >
                      {pct === 0 ? "No tip" : `${pct}%`}
                    </button>
                  ))}
                </div>
                <div className="mt-2">
                  <Input
                    type="number"
                    value={tipCustom}
                    onChange={(e) => { setTipCustom(e.target.value); setTipPct(0); }}
                    placeholder={`Custom ${sym}`}
                    className="h-9 bg-white/5 border-white/10 text-white text-sm"
                  />
                </div>
              </div>

              {tipAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Tip</span>
                  <span className="text-rose-400 font-semibold">{sym}{tipAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-lg font-bold border-t border-white/10 pt-3">
                <span>Total</span>
                <span className="text-rose-400">{sym}{total.toFixed(2)}</span>
              </div>

              <Button
                onClick={handleCardComplete}
                className="w-full bg-sky-500 hover:bg-sky-600 text-white h-12 text-base gap-2"
              >
                <CreditCard className="h-5 w-5" />
                Process Card Payment
              </Button>
            </div>
          )}

          {/* SPLIT */}
          {step === "split" && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-1">Total to Split</p>
                <p className="text-2xl font-bold text-white">{sym}{total.toFixed(2)}</p>
              </div>

              <div>
                <p className="text-xs text-slate-400 mb-2">Number of splits</p>
                <div className="flex gap-2">
                  {[2, 3, 4, 5, 6].map((n) => (
                    <button
                      key={n}
                      onClick={() => { setSplits(n); setSplitPaid(0); }}
                      className={cn(
                        "flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        splits === n
                          ? "bg-violet-500/20 text-violet-400 border border-violet-500/40"
                          : "bg-white/5 text-slate-300 hover:bg-white/10"
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Split breakdown */}
              <div className="space-y-1.5">
                {splitAmounts.map((amt, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg border",
                      i < splitPaid
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : i === splitPaid
                        ? "bg-violet-500/10 border-violet-500/30"
                        : "bg-white/5 border-white/10"
                    )}
                  >
                    <span className="text-sm text-white">Guest {i + 1}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{sym}{amt.toFixed(2)}</span>
                      {i < splitPaid && <Check className="h-4 w-4 text-emerald-400" />}
                    </div>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleSplitNext}
                className="w-full bg-violet-500 hover:bg-violet-600 text-white h-12 text-base gap-2"
              >
                {splitPaid + 1 >= splits ? (
                  <>
                    <Check className="h-5 w-5" />
                    Complete Final Payment
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" />
                    Collect Guest {splitPaid + 1} — {sym}{splitAmounts[splitPaid]?.toFixed(2)}
                  </>
                )}
              </Button>
            </div>
          )}

          {/* RECEIPT */}
          {step === "receipt" && (
            <POSReceipt
              cart={cart}
              subtotal={subtotal}
              tax={tax}
              surcharge={surcharge}
              tip={tipAmount}
              total={total}
              method={method}
              tendered={Number(tendered) || undefined}
              change={method === "CASH" ? change : undefined}
              tableNumber={tableNumber}
              orderType={orderType}
              onDone={handleFinish}
              sym={sym}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
