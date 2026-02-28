import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Loader2, Sparkles, ShoppingCart, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useChefWishlists, WishlistItem } from "@/hooks/useChefWishlists";
import { useTodoItems } from "@/hooks/useTodoItems";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function ChefOrdersReview() {
  const { wishlists, isLoading, updateWishlist } = useChefWishlists({
    statusFilter: ["submitted", "reviewed"],
  });
  const { addTodo } = useTodoItems();
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});

  const handleAiCheck = async (wl: typeof wishlists[0]) => {
    setCheckingId(wl.id);
    try {
      const { data, error } = await supabase.functions.invoke("check-stock-recommendations", {
        body: { items: wl.items, org_id: wl.org_id },
      });
      if (error) throw error;
      await updateWishlist.mutateAsync({
        id: wl.id,
        ai_recommendations: data?.recommendations || [],
        status: "reviewed",
        reviewed_at: new Date().toISOString(),
      });
      toast.success("AI stock check complete");
    } catch (e: any) {
      toast.error(e?.message || "AI check failed");
    }
    setCheckingId(null);
  };

  const handleApprove = async (wl: typeof wishlists[0]) => {
    try {
      // Add each item to shopping list
      for (const item of wl.items) {
        await addTodo.mutateAsync({
          title: item.name,
          category: "shopping",
          quantity: item.quantity,
          unit: item.unit,
          source_type: "wishlist",
          description: `Requested by ${wl.submitted_by_name}`,
        });
      }
      await updateWishlist.mutateAsync({
        id: wl.id,
        status: "ordered",
        chef_notes: notesMap[wl.id] || null,
        reviewed_at: new Date().toISOString(),
      });
      toast.success(`${wl.items.length} items added to shopping list`);
    } catch {
      toast.error("Failed to approve");
    }
  };

  const handleReject = async (wl: typeof wishlists[0]) => {
    try {
      await updateWishlist.mutateAsync({
        id: wl.id,
        status: "reviewed",
        chef_notes: notesMap[wl.id] || "Not needed at this time",
        reviewed_at: new Date().toISOString(),
      });
      toast.success("Wishlist reviewed");
    } catch {
      toast.error("Failed to update");
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  if (wishlists.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="font-medium">No chef orders pending</p>
        <p className="text-sm mt-1">Wishlists from your team will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {wishlists.map(wl => {
        const recs = wl.ai_recommendations as any[] | null;

        return (
          <motion.div key={wl.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold text-sm">{wl.submitted_by_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Needed by {format(new Date(wl.target_date), "EEE d MMM")}
                    </span>
                    <Badge variant="outline" className="text-xs">{wl.status}</Badge>
                  </div>
                </div>

                {/* Items with AI recommendations */}
                <div className="space-y-1.5">
                  {wl.items.map((item: WishlistItem, i: number) => {
                    const rec = recs?.[i];
                    return (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm">
                        <span className="flex-1 font-medium">{item.name}</span>
                        <span className="text-muted-foreground">
                          {item.quantity} {item.unit}
                        </span>
                        {rec && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              rec.action === "order" ? "border-success text-success" :
                              rec.action === "skip" ? "border-destructive text-destructive" :
                              "border-warning text-warning"
                            )}
                          >
                            {rec.action === "order" ? `Order ${rec.recommended_qty || ""}` :
                             rec.action === "skip" ? "In Stock" :
                             rec.note || "Review"}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Chef notes */}
                <Textarea
                  placeholder="Add notes for the team..."
                  value={notesMap[wl.id] || ""}
                  onChange={e => setNotesMap(prev => ({ ...prev, [wl.id]: e.target.value }))}
                  className="text-sm"
                  rows={2}
                />

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAiCheck(wl)}
                    disabled={checkingId === wl.id}
                  >
                    {checkingId === wl.id ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-1" />
                    )}
                    AI Stock Check
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReject(wl)}
                    className="text-destructive"
                  >
                    <X className="w-4 h-4 mr-1" /> Not Now
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApprove(wl)}
                  >
                    <Check className="w-4 h-4 mr-1" /> Approve & Order
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
