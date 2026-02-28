import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useVendorAuth } from "@/hooks/useVendorAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Plus, Leaf } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CATEGORIES = ["Produce", "Meat", "Seafood", "Dairy", "Bakery", "Pantry", "Beverages", "Other"];

const VendorCatalogue = () => {
  const { vendorProfile } = useVendorAuth();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    product_name: "", category: "Produce", unit: "kg",
    price_homechef: "", price_chefos: "", min_order_chefos: "",
    is_organic: false, organic_certified: false, certification_body: "",
  });

  const { data: products = [] } = useQuery({
    queryKey: ["vendor-catalogue", vendorProfile?.id],
    enabled: !!vendorProfile?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("vendor_beta_products")
        .select("*")
        .eq("vendor_id", vendorProfile!.id)
        .order("product_name");
      return data || [];
    },
  });

  const filtered = products.filter((p) =>
    p.product_name.toLowerCase().includes(search.toLowerCase())
  );

  const addProduct = useCallback(async () => {
    if (!form.product_name.trim()) { toast.error("Product name required"); return; }
    const { error } = await supabase.from("vendor_beta_products").insert({
      vendor_id: vendorProfile!.id,
      product_name: form.product_name.trim(),
      category: form.category,
      unit: form.unit,
      price_homechef: form.price_homechef ? parseFloat(form.price_homechef) : null,
      price_chefos: form.price_chefos ? parseFloat(form.price_chefos) : null,
      min_order_chefos: form.min_order_chefos ? parseFloat(form.min_order_chefos) : null,
      is_organic: form.is_organic,
      organic_certified: form.organic_certified,
      certification_body: form.certification_body || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Product added");
    setShowAdd(false);
    setForm({ product_name: "", category: "Produce", unit: "kg", price_homechef: "", price_chefos: "", min_order_chefos: "", is_organic: false, organic_certified: false, certification_body: "" });
    queryClient.invalidateQueries({ queryKey: ["vendor-catalogue"] });
  }, [form, vendorProfile, queryClient]);

  const toggleStock = useCallback(async (id: string, in_stock: boolean) => {
    await supabase.from("vendor_beta_products").update({ in_stock }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["vendor-catalogue"] });
  }, [queryClient]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            Product Catalogue
          </h1>
          <p className="text-muted-foreground mt-1">{products.length} products · Dual pricing for HomeChef & ChefOS</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4 mr-1" /> Add Product
        </Button>
      </div>

      <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />

      <Card>
        <CardContent className="p-0">
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">HomeChef $</TableHead>
                  <TableHead className="text-right">ChefOS $</TableHead>
                  <TableHead className="text-right">Min Order</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead className="text-center">Organic</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      {products.length === 0 ? "No products yet — add your first product" : "No matches"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.product_name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{p.category}</Badge></TableCell>
                      <TableCell className="text-sm">{p.unit}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{p.price_homechef ?? "—"}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{p.price_chefos ?? "—"}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{p.min_order_chefos ?? "—"}</TableCell>
                      <TableCell className="text-center">
                        <Switch checked={p.in_stock} onCheckedChange={(v) => toggleStock(p.id, v)} />
                      </TableCell>
                      <TableCell className="text-center">
                        {p.is_organic && <Leaf className={cn("w-4 h-4 mx-auto", p.organic_certified ? "text-emerald-500" : "text-yellow-500")} />}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add product dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Product name" value={form.product_name} onChange={(e) => setForm((p) => ({ ...p, product_name: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={form.unit} onValueChange={(v) => setForm((p) => ({ ...p, unit: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="L">L</SelectItem>
                  <SelectItem value="mL">mL</SelectItem>
                  <SelectItem value="each">each</SelectItem>
                  <SelectItem value="bunch">bunch</SelectItem>
                  <SelectItem value="box">box</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Input placeholder="HomeChef price" type="number" value={form.price_homechef} onChange={(e) => setForm((p) => ({ ...p, price_homechef: e.target.value }))} />
              <Input placeholder="ChefOS price" type="number" value={form.price_chefos} onChange={(e) => setForm((p) => ({ ...p, price_chefos: e.target.value }))} />
              <Input placeholder="Min order (ChefOS)" type="number" value={form.min_order_chefos} onChange={(e) => setForm((p) => ({ ...p, min_order_chefos: e.target.value }))} />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.is_organic} onCheckedChange={(v) => setForm((p) => ({ ...p, is_organic: v }))} />
                Organic
              </label>
              {form.is_organic && (
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={form.organic_certified} onCheckedChange={(v) => setForm((p) => ({ ...p, organic_certified: v }))} />
                  Certified
                </label>
              )}
            </div>
            <Button onClick={addProduct} className="w-full">Add Product</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorCatalogue;
