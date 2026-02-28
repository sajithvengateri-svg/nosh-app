import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { usePOSWasteLogs, useWasteMutations, usePOSMenuItems } from "../hooks/usePOSData";
import { format } from "date-fns";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const REASONS = ["Expired", "Overcooked", "Dropped", "Wrong Order", "Quality Issue", "Spillage", "Other"];

export default function POSWasteLog() {
  const { data: logs = [], isLoading } = usePOSWasteLogs();
  const { data: menuItems = [] } = usePOSMenuItems();
  const { create } = useWasteMutations();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ menu_item_id: "", item_name: "", quantity: "1", cost: "", reason: "Expired" });

  const handleItemSelect = (id: string) => {
    const item = menuItems.find((i: any) => i.id === id);
    setForm((p) => ({ ...p, menu_item_id: id, item_name: item?.name || "", cost: String(Number(item?.price || 0).toFixed(2)) }));
  };

  const handleSubmit = () => {
    create.mutate({
      menu_item_id: form.menu_item_id || null,
      item_name: form.item_name,
      quantity: Number(form.quantity),
      cost: Number(form.cost) * Number(form.quantity),
      reason: form.reason,
    }, {
      onSuccess: () => {
        setOpen(false);
        setForm({ menu_item_id: "", item_name: "", quantity: "1", cost: "", reason: "Expired" });
      },
    });
  };

  const totalWaste = logs.reduce((s: number, l: any) => s + Number(l.cost || 0), 0);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Waste Log</h1>
          <p className="text-sm text-slate-400">Track wasted items, reasons, and cost impact</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-rose-500 hover:bg-rose-600 text-white gap-1.5">
              <Plus className="h-4 w-4" /> Log Waste
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0f1117] border-white/10 text-white">
            <DialogHeader><DialogTitle>Log Waste</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label className="text-slate-300">Menu Item</Label>
                <Select value={form.menu_item_id} onValueChange={handleItemSelect}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue placeholder="Select item" /></SelectTrigger>
                  <SelectContent className="bg-[#1e293b] border-white/10">
                    {menuItems.map((i: any) => (
                      <SelectItem key={i.id} value={i.id} className="text-white">{i.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-slate-300">Or Enter Name</Label>
                <Input value={form.item_name} onChange={(e) => setForm((p) => ({ ...p, item_name: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-slate-300">Quantity</Label>
                  <Input type="number" value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
                </div>
                <div><Label className="text-slate-300">Unit Cost ($)</Label>
                  <Input type="number" step="0.01" value={form.cost} onChange={(e) => setForm((p) => ({ ...p, cost: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
                </div>
              </div>
              <div><Label className="text-slate-300">Reason</Label>
                <Select value={form.reason} onValueChange={(v) => setForm((p) => ({ ...p, reason: v }))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#1e293b] border-white/10">
                    {REASONS.map((r) => <SelectItem key={r} value={r} className="text-white">{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSubmit} disabled={create.isPending} className="w-full bg-rose-500 hover:bg-rose-600">
                {create.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Log Waste
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <Card className="bg-white/5 border-white/10"><CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trash2 className="h-5 w-5 text-rose-400" />
          <div>
            <p className="text-sm text-white font-medium">Total Waste Cost</p>
            <p className="text-xs text-slate-400">{logs.length} items logged</p>
          </div>
        </div>
        <p className="text-xl font-bold text-rose-400">${totalWaste.toFixed(2)}</p>
      </CardContent></Card>

      {/* Log list */}
      <div className="space-y-2">
        {logs.map((l: any) => (
          <Card key={l.id} className="bg-white/5 border-white/10">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-white font-medium">{l.item_name}</p>
                <p className="text-xs text-slate-400">{format(new Date(l.created_at), "d MMM HH:mm")} · Qty {l.quantity}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-white/10 text-slate-300 text-[10px]">{l.reason}</Badge>
                <span className="text-sm font-semibold text-rose-400">${Number(l.cost).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
