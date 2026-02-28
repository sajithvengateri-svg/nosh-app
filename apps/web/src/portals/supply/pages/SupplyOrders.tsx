import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter } from "lucide-react";

interface PO {
  id: string; supplier: string; date: string; total: number; status: string; items: number;
}

const demoPOs: PO[] = [
  { id: "PO-2024-089", supplier: "Fresh Produce Co", date: "2026-02-15", total: 1240, status: "Sent", items: 14 },
  { id: "PO-2024-088", supplier: "Premium Meats", date: "2026-02-14", total: 3890, status: "Partial", items: 8 },
  { id: "PO-2024-087", supplier: "Dairy Direct", date: "2026-02-13", total: 780, status: "Complete", items: 5 },
  { id: "PO-2024-086", supplier: "Baker's Supply", date: "2026-02-12", total: 560, status: "Draft", items: 3 },
  { id: "PO-2024-085", supplier: "Seafood Market", date: "2026-02-11", total: 2100, status: "Sent", items: 6 },
  { id: "PO-2024-084", supplier: "Mediterranean Imports", date: "2026-02-10", total: 1450, status: "Complete", items: 9 },
  { id: "PO-2024-083", supplier: "Organic Farms", date: "2026-02-09", total: 920, status: "Sent", items: 11 },
  { id: "PO-2024-082", supplier: "Fresh Produce Co", date: "2026-02-08", total: 1100, status: "Complete", items: 12 },
];

const statusColors: Record<string, string> = {
  Draft: "bg-muted text-muted-foreground",
  Sent: "bg-blue-500/20 text-blue-400",
  Partial: "bg-amber-500/20 text-amber-400",
  Complete: "bg-emerald-500/20 text-emerald-400",
};

const statuses = ["All", "Draft", "Sent", "Partial", "Complete"];

export default function SupplyOrders() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filtered = demoPOs.filter((po) => {
    const matchSearch = po.id.toLowerCase().includes(search.toLowerCase()) || po.supplier.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || po.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Purchase Orders</h1>
          <p className="text-muted-foreground text-sm">Manage and track purchase orders</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> New PO</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Purchase Order</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Supplier</Label>
                <Select><SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fresh-produce">Fresh Produce Co</SelectItem>
                    <SelectItem value="premium-meats">Premium Meats</SelectItem>
                    <SelectItem value="dairy-direct">Dairy Direct</SelectItem>
                    <SelectItem value="seafood">Seafood Market</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Delivery Date</Label>
                <Input type="date" />
              </div>
              <div>
                <Label>Notes</Label>
                <Input placeholder="Special instructions..." />
              </div>
              <Button className="w-full">Create Draft PO</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search POs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1">
          {statuses.map((s) => (
            <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)}>
              {s}
            </Button>
          ))}
        </div>
      </div>

      {/* PO List */}
      <div className="space-y-3">
        {filtered.map((po) => (
          <Card key={po.id} className="hover:border-primary/30 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-semibold text-foreground">{po.id}</p>
                  <p className="text-sm text-muted-foreground">{po.supplier}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">${po.total.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{po.items} items · {po.date}</p>
                </div>
                <Badge className={statusColors[po.status]} variant="secondary">{po.status}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No purchase orders match your filters</div>
        )}
      </div>
    </div>
  );
}
