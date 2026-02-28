import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useVendorAuth } from "@/hooks/useVendorAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tag, Plus, Eye, MousePointer, ShoppingCart } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const VendorDealsPanel = () => {
  const { vendorProfile } = useVendorAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    deal_type: "percentage",
    deal_value: "",
    original_price: "",
    deal_price: "",
    valid_from: "",
    valid_to: "",
    stock_limit: "",
    target_apps: ["homechef", "chefos"],
    min_order_qty: "",
  });

  const { data: deals = [] } = useQuery({
    queryKey: ["vendor-beta-deals", vendorProfile?.id],
    enabled: !!vendorProfile?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("vendor_beta_deals")
        .select("*")
        .eq("vendor_id", vendorProfile!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const createDeal = useCallback(async () => {
    if (!form.deal_value || !form.valid_from || !form.valid_to) {
      toast.error("Deal value and dates are required");
      return;
    }
    const { error } = await supabase.from("vendor_beta_deals").insert({
      vendor_id: vendorProfile!.id,
      product_ids: [],
      deal_type: form.deal_type,
      deal_value: parseFloat(form.deal_value),
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      deal_price: form.deal_price ? parseFloat(form.deal_price) : null,
      valid_from: form.valid_from,
      valid_to: form.valid_to,
      stock_limit: form.stock_limit ? parseInt(form.stock_limit) : null,
      target_apps: form.target_apps,
      min_order_qty: form.min_order_qty ? parseFloat(form.min_order_qty) : null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Deal created");
    setShowCreate(false);
    setForm({ deal_type: "percentage", deal_value: "", original_price: "", deal_price: "", valid_from: "", valid_to: "", stock_limit: "", target_apps: ["homechef", "chefos"], min_order_qty: "" });
    queryClient.invalidateQueries({ queryKey: ["vendor-beta-deals"] });
  }, [form, vendorProfile, queryClient]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Tag className="w-6 h-6 text-primary" />
            Deals
          </h1>
          <p className="text-muted-foreground mt-1">Create and manage special offers for ChefOS & HomeChef users</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-1" /> Create Deal
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Your Deals</CardTitle>
        </CardHeader>
        <CardContent>
          {deals.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No deals yet — create your first deal above</p>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Valid</TableHead>
                    <TableHead className="text-center"><Eye className="w-3.5 h-3.5 mx-auto" /></TableHead>
                    <TableHead className="text-center"><MousePointer className="w-3.5 h-3.5 mx-auto" /></TableHead>
                    <TableHead className="text-center"><ShoppingCart className="w-3.5 h-3.5 mx-auto" /></TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deals.map((deal) => (
                    <TableRow key={deal.id}>
                      <TableCell className="capitalize">{deal.deal_type}</TableCell>
                      <TableCell className="font-mono">{deal.deal_value}{deal.deal_type === "percentage" ? "%" : ""}</TableCell>
                      <TableCell className="text-xs">{deal.target_apps?.join(", ")}</TableCell>
                      <TableCell className="text-xs">
                        {format(new Date(deal.valid_from), "d/M")} — {format(new Date(deal.valid_to), "d/M")}
                      </TableCell>
                      <TableCell className="text-center">{deal.impressions}</TableCell>
                      <TableCell className="text-center">{deal.clicks}</TableCell>
                      <TableCell className="text-center">{deal.redemptions}</TableCell>
                      <TableCell>
                        <Badge variant={deal.status === "active" ? "default" : "secondary"}>{deal.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create deal dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Deal</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={form.deal_type} onValueChange={(v) => setForm((p) => ({ ...p, deal_type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">% Off</SelectItem>
                <SelectItem value="fixed_price">Fixed Price</SelectItem>
                <SelectItem value="bundle">Bundle</SelectItem>
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Deal value" type="number" value={form.deal_value} onChange={(e) => setForm((p) => ({ ...p, deal_value: e.target.value }))} />
              <Input placeholder="Stock limit" type="number" value={form.stock_limit} onChange={(e) => setForm((p) => ({ ...p, stock_limit: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input type="date" value={form.valid_from} onChange={(e) => setForm((p) => ({ ...p, valid_from: e.target.value }))} />
              <Input type="date" value={form.valid_to} onChange={(e) => setForm((p) => ({ ...p, valid_to: e.target.value }))} />
            </div>
            <Button onClick={createDeal} className="w-full">Create Deal</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorDealsPanel;
