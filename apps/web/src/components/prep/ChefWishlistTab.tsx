import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Send, Trash2, Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useChefWishlists, WishlistItem } from "@/hooks/useChefWishlists";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";

export function ChefWishlistTab() {
  const { wishlists, isLoading, createWishlist, deleteWishlist } = useChefWishlists({ mine: true });
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [newItem, setNewItem] = useState({ name: "", quantity: "", unit: "", notes: "" });
  const [targetDate, setTargetDate] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd"));

  const addItem = () => {
    if (!newItem.name.trim()) return;
    setItems(prev => [...prev, { ...newItem }]);
    setNewItem({ name: "", quantity: "", unit: "", notes: "" });
  };

  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (items.length === 0) { toast.error("Add at least one item"); return; }
    try {
      await createWishlist.mutateAsync({ target_date: targetDate, items });
      setItems([]);
      toast.success("Wishlist submitted to Head Chef");
    } catch {
      toast.error("Failed to submit");
    }
  };

  const statusColors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    submitted: "bg-primary/10 text-primary",
    reviewed: "bg-warning/10 text-warning",
    ordered: "bg-success/10 text-success",
  };

  return (
    <div className="space-y-6">
      {/* New Wishlist Form */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Package className="w-4 h-4" /> New Wishlist
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground shrink-0">Needed by:</span>
            <Input
              type="date"
              value={targetDate}
              onChange={e => setTargetDate(e.target.value)}
              className="w-auto"
            />
          </div>

          {/* Items list */}
          {items.length > 0 && (
            <div className="space-y-1.5">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted text-sm">
                  <span className="flex-1 font-medium">{item.name}</span>
                  {item.quantity && <span className="text-muted-foreground">{item.quantity} {item.unit}</span>}
                  <button onClick={() => removeItem(i)} className="p-1 rounded hover:bg-destructive/10">
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add item row */}
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Item name"
              value={newItem.name}
              onChange={e => setNewItem({ ...newItem, name: e.target.value })}
              onKeyDown={e => e.key === "Enter" && addItem()}
              className="flex-1 min-w-[140px]"
            />
            <Input
              placeholder="Qty"
              value={newItem.quantity}
              onChange={e => setNewItem({ ...newItem, quantity: e.target.value })}
              className="w-16"
            />
            <Input
              placeholder="Unit"
              value={newItem.unit}
              onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
              className="w-16"
            />
            <Button variant="outline" size="icon" onClick={addItem}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <Button onClick={handleSubmit} disabled={items.length === 0 || createWishlist.isPending} className="w-full">
            {createWishlist.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            Submit to Head Chef
          </Button>
        </CardContent>
      </Card>

      {/* Previous wishlists */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">My Wishlists</h3>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : wishlists.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No wishlists yet</p>
        ) : (
          wishlists.map(wl => (
            <Card key={wl.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    Needed by {format(new Date(wl.target_date), "EEE d MMM")}
                  </span>
                  <Badge className={cn("text-xs", statusColors[wl.status] || statusColors.draft)}>
                    {wl.status}
                  </Badge>
                </div>
                <div className="space-y-1">
                  {wl.items.map((item: WishlistItem, i: number) => (
                    <p key={i} className="text-sm text-muted-foreground">
                      • {item.name} {item.quantity && `(${item.quantity} ${item.unit || ""})`}
                    </p>
                  ))}
                </div>
                {wl.chef_notes && (
                  <div className="mt-2 p-2 rounded-lg bg-warning/10 border border-warning/20">
                    <p className="text-xs font-medium text-warning">Head Chef Notes</p>
                    <p className="text-xs text-foreground mt-0.5">{wl.chef_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
