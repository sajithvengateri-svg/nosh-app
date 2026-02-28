import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PackageCheck, AlertTriangle, CheckCircle2, Camera } from "lucide-react";

interface ReceivingItem {
  ingredient: string; ordered: number; unit: string; received: number; variance: number;
}

interface Delivery {
  id: string; po: string; supplier: string; expected: string; status: string; items: ReceivingItem[];
}

const demoDeliveries: Delivery[] = [
  {
    id: "d1", po: "PO-2024-089", supplier: "Fresh Produce Co", expected: "Today", status: "Pending",
    items: [
      { ingredient: "Roma Tomatoes", ordered: 20, unit: "kg", received: 0, variance: 0 },
      { ingredient: "Baby Spinach", ordered: 5, unit: "kg", received: 0, variance: 0 },
      { ingredient: "Basil (bunch)", ordered: 10, unit: "ea", received: 0, variance: 0 },
      { ingredient: "Carrots", ordered: 15, unit: "kg", received: 0, variance: 0 },
    ],
  },
  {
    id: "d2", po: "PO-2024-088", supplier: "Premium Meats", expected: "Tomorrow", status: "Pending",
    items: [
      { ingredient: "Scotch Fillet", ordered: 10, unit: "kg", received: 0, variance: 0 },
      { ingredient: "Chicken Breast", ordered: 15, unit: "kg", received: 0, variance: 0 },
      { ingredient: "Pork Belly", ordered: 8, unit: "kg", received: 0, variance: 0 },
    ],
  },
  {
    id: "d3", po: "PO-2024-082", supplier: "Fresh Produce Co", expected: "Feb 8", status: "Received",
    items: [
      { ingredient: "Mixed Lettuce", ordered: 10, unit: "kg", received: 10, variance: 0 },
      { ingredient: "Avocado", ordered: 24, unit: "ea", received: 22, variance: -2 },
      { ingredient: "Lemon", ordered: 30, unit: "ea", received: 30, variance: 0 },
    ],
  },
];

export default function SupplyReceiving() {
  const [selected, setSelected] = useState<Delivery | null>(null);
  const [receivedQtys, setReceivedQtys] = useState<Record<string, number>>({});

  const handleOpen = (d: Delivery) => {
    setSelected(d);
    const qtys: Record<string, number> = {};
    d.items.forEach((item) => { qtys[item.ingredient] = item.received || item.ordered; });
    setReceivedQtys(qtys);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Goods Receiving</h1>
        <p className="text-muted-foreground text-sm">Receive deliveries against purchase orders</p>
      </div>

      <div className="space-y-4">
        {demoDeliveries.map((d) => (
          <Card key={d.id} className="hover:border-primary/30 transition-colors cursor-pointer" onClick={() => handleOpen(d)}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {d.status === "Received" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <PackageCheck className="w-5 h-5 text-amber-400" />
                )}
                <div>
                  <p className="font-semibold text-foreground">{d.po}</p>
                  <p className="text-sm text-muted-foreground">{d.supplier}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm text-foreground">{d.expected}</p>
                  <p className="text-xs text-muted-foreground">{d.items.length} items</p>
                </div>
                <Badge variant={d.status === "Received" ? "default" : "secondary"}>{d.status}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Receive Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Receive: {selected?.po}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{selected.supplier} · Expected: {selected.expected}</p>
              <div className="space-y-3">
                {selected.items.map((item) => {
                  const received = receivedQtys[item.ingredient] ?? item.ordered;
                  const variance = received - item.ordered;
                  return (
                    <div key={item.ingredient} className="flex items-center justify-between gap-3 py-2 border-b border-border">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{item.ingredient}</p>
                        <p className="text-xs text-muted-foreground">Ordered: {item.ordered} {item.unit}</p>
                      </div>
                      <Input
                        type="number"
                        className="w-20"
                        value={received}
                        onChange={(e) => setReceivedQtys({ ...receivedQtys, [item.ingredient]: Number(e.target.value) })}
                      />
                      {variance !== 0 && (
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          <span className={`text-xs font-medium ${variance < 0 ? "text-destructive" : "text-amber-400"}`}>
                            {variance > 0 ? "+" : ""}{variance}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Camera className="w-4 h-4" />
                <span>Photo capture for delivery docket (coming soon)</span>
              </div>
              <div>
                <Label>Quality Notes</Label>
                <Input placeholder="Any quality issues..." />
              </div>
              <Button className="w-full">Confirm Receipt</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
