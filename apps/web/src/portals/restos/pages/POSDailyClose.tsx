import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { usePOSDailyClose, useDailyCloseMutations } from "../hooks/usePOSData";
import { format } from "date-fns";
import { Loader2, Plus, CheckCircle, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function POSDailyClose() {
  const { data: closes = [], isLoading } = usePOSDailyClose();
  const { create } = useDailyCloseMutations();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    close_date: format(new Date(), "yyyy-MM-dd"),
    total_sales: "",
    total_cash: "",
    total_card: "",
    expected_cash: "",
    actual_cash: "",
    total_discounts: "0",
    total_voids: "0",
    total_refunds: "0",
    order_count: "0",
    notes: "",
  });

  const variance = Number(form.actual_cash || 0) - Number(form.expected_cash || 0);

  const handleSubmit = () => {
    create.mutate({
      close_date: form.close_date,
      total_sales: Number(form.total_sales),
      total_cash: Number(form.total_cash),
      total_card: Number(form.total_card),
      expected_cash: Number(form.expected_cash),
      actual_cash: Number(form.actual_cash),
      variance,
      total_discounts: Number(form.total_discounts),
      total_voids: Number(form.total_voids),
      total_refunds: Number(form.total_refunds),
      order_count: Number(form.order_count),
      notes: form.notes || null,
    }, {
      onSuccess: () => setOpen(false),
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Daily Close</h1>
          <p className="text-sm text-slate-400">End-of-day cash-up and reconciliation</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-rose-500 hover:bg-rose-600 text-white gap-1.5">
              <Plus className="h-4 w-4" /> New Close
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0f1117] border-white/10 text-white max-w-lg">
            <DialogHeader><DialogTitle>Daily Close</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-slate-300">Date</Label>
                  <Input type="date" value={form.close_date} onChange={(e) => setForm((p) => ({ ...p, close_date: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
                </div>
                <div><Label className="text-slate-300">Order Count</Label>
                  <Input type="number" value={form.order_count} onChange={(e) => setForm((p) => ({ ...p, order_count: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label className="text-slate-300">Total Sales</Label>
                  <Input type="number" step="0.01" value={form.total_sales} onChange={(e) => setForm((p) => ({ ...p, total_sales: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
                </div>
                <div><Label className="text-slate-300">Cash Total</Label>
                  <Input type="number" step="0.01" value={form.total_cash} onChange={(e) => setForm((p) => ({ ...p, total_cash: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
                </div>
                <div><Label className="text-slate-300">Card Total</Label>
                  <Input type="number" step="0.01" value={form.total_card} onChange={(e) => setForm((p) => ({ ...p, total_card: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-slate-300">Expected Cash</Label>
                  <Input type="number" step="0.01" value={form.expected_cash} onChange={(e) => setForm((p) => ({ ...p, expected_cash: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
                </div>
                <div><Label className="text-slate-300">Actual Cash</Label>
                  <Input type="number" step="0.01" value={form.actual_cash} onChange={(e) => setForm((p) => ({ ...p, actual_cash: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
                </div>
              </div>
              <div className={`text-center py-2 rounded-lg ${variance === 0 ? "bg-emerald-500/10 text-emerald-400" : Math.abs(variance) <= 5 ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"}`}>
                Variance: ${variance.toFixed(2)}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label className="text-slate-300">Discounts</Label>
                  <Input type="number" step="0.01" value={form.total_discounts} onChange={(e) => setForm((p) => ({ ...p, total_discounts: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
                </div>
                <div><Label className="text-slate-300">Voids</Label>
                  <Input type="number" step="0.01" value={form.total_voids} onChange={(e) => setForm((p) => ({ ...p, total_voids: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
                </div>
                <div><Label className="text-slate-300">Refunds</Label>
                  <Input type="number" step="0.01" value={form.total_refunds} onChange={(e) => setForm((p) => ({ ...p, total_refunds: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
                </div>
              </div>
              <div><Label className="text-slate-300">Notes</Label>
                <Textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
              </div>
              <Button onClick={handleSubmit} disabled={create.isPending} className="w-full bg-rose-500 hover:bg-rose-600">
                {create.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Submit Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* History */}
      <div className="space-y-2">
        {closes.length === 0 ? (
          <Card className="bg-white/5 border-white/10"><CardContent className="p-8 text-center text-slate-500">No daily closes recorded yet</CardContent></Card>
        ) : (
          closes.map((c: any) => (
            <Card key={c.id} className="bg-white/5 border-white/10">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {Number(c.variance) === 0 ? (
                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-white">{format(new Date(c.close_date), "EEEE, d MMM yyyy")}</p>
                    <p className="text-xs text-slate-400">{c.order_count} orders</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-right">
                    <p className="text-white font-semibold">${Number(c.total_sales).toLocaleString()}</p>
                    <p className="text-[10px] text-slate-500">Total Sales</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white">${Number(c.total_cash).toFixed(2)}</p>
                    <p className="text-[10px] text-slate-500">Cash</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white">${Number(c.total_card).toFixed(2)}</p>
                    <p className="text-[10px] text-slate-500">Card</p>
                  </div>
                  <Badge className={`text-[10px] ${Number(c.variance) === 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                    ${Number(c.variance).toFixed(2)} var
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
