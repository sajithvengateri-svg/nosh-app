 import { useState } from "react";
 import { motion } from "framer-motion";
 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { useVendorAuth } from "@/hooks/useVendorAuth";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
 } from "@/components/ui/dialog";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from "@/components/ui/table";
 import { Switch } from "@/components/ui/switch";
 import { DollarSign, Plus, Pencil, Trash2 } from "lucide-react";
 import { toast } from "sonner";
 
 const categories = [
   "Produce",
   "Meat",
   "Seafood",
   "Dairy",
   "Bakery",
   "Dry Goods",
   "Beverages",
   "Other",
 ];
 
 const VendorPricing = () => {
   const { vendorProfile } = useVendorAuth();
   const queryClient = useQueryClient();
   const [isDialogOpen, setIsDialogOpen] = useState(false);
   const [editingItem, setEditingItem] = useState<any>(null);
 
   // Form state
   const [ingredientName, setIngredientName] = useState("");
   const [category, setCategory] = useState("Other");
   const [pricePerUnit, setPricePerUnit] = useState("");
   const [unit, setUnit] = useState("kg");
   const [minQuantity, setMinQuantity] = useState("1");
   const [isAvailable, setIsAvailable] = useState(true);
 
   const { data: pricing, isLoading } = useQuery({
     queryKey: ["vendor-pricing", vendorProfile?.id],
     queryFn: async () => {
       if (!vendorProfile) return [];
       const { data } = await supabase
         .from("vendor_pricing")
         .select("*")
         .eq("vendor_id", vendorProfile.id)
         .order("ingredient_name");
       return data || [];
     },
     enabled: !!vendorProfile,
   });
 
   const resetForm = () => {
     setIngredientName("");
     setCategory("Other");
     setPricePerUnit("");
     setUnit("kg");
     setMinQuantity("1");
     setIsAvailable(true);
     setEditingItem(null);
   };
 
   const openEdit = (item: any) => {
     setEditingItem(item);
     setIngredientName(item.ingredient_name);
     setCategory(item.category || "Other");
     setPricePerUnit(item.price_per_unit.toString());
     setUnit(item.unit);
     setMinQuantity(item.min_order_quantity?.toString() || "1");
     setIsAvailable(item.is_available ?? true);
     setIsDialogOpen(true);
   };
 
   const savePricing = useMutation({
     mutationFn: async () => {
       if (!vendorProfile) throw new Error("No vendor profile");
       
       const data = {
         vendor_id: vendorProfile.id,
         ingredient_name: ingredientName,
         category,
         price_per_unit: parseFloat(pricePerUnit),
         unit,
         min_order_quantity: parseFloat(minQuantity),
         is_available: isAvailable,
       };
 
       if (editingItem) {
         const { error } = await supabase
           .from("vendor_pricing")
           .update(data)
           .eq("id", editingItem.id);
         if (error) throw error;
       } else {
         const { error } = await supabase
           .from("vendor_pricing")
           .insert(data);
         if (error) throw error;
       }
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["vendor-pricing"] });
       toast.success(editingItem ? "Pricing updated" : "Product added");
       setIsDialogOpen(false);
       resetForm();
     },
     onError: () => {
       toast.error("Failed to save pricing");
     },
   });
 
   const deletePricing = useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase
         .from("vendor_pricing")
         .delete()
         .eq("id", id);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["vendor-pricing"] });
       toast.success("Product removed");
     },
     onError: () => {
       toast.error("Failed to remove product");
     },
   });
 
   return (
     <div className="p-6 lg:p-8 space-y-6">
       <motion.div
         initial={{ opacity: 0, y: -20 }}
         animate={{ opacity: 1, y: 0 }}
         className="flex items-center justify-between"
       >
         <div>
           <h1 className="text-3xl font-bold flex items-center gap-3">
             <DollarSign className="w-8 h-8 text-primary" />
             Pricing
           </h1>
           <p className="text-muted-foreground mt-1">
             Manage your product prices and availability
           </p>
         </div>
 
         <Dialog open={isDialogOpen} onOpenChange={(open) => {
           setIsDialogOpen(open);
           if (!open) resetForm();
         }}>
           <DialogTrigger asChild>
             <Button>
               <Plus className="w-4 h-4 mr-2" />
               Add Product
             </Button>
           </DialogTrigger>
           <DialogContent>
             <DialogHeader>
               <DialogTitle>{editingItem ? "Edit Product" : "Add Product"}</DialogTitle>
             </DialogHeader>
             <form
               onSubmit={(e) => {
                 e.preventDefault();
                 savePricing.mutate();
               }}
               className="space-y-4"
             >
               <div className="space-y-2">
                 <Label>Ingredient Name</Label>
                 <Input
                   value={ingredientName}
                   onChange={(e) => setIngredientName(e.target.value)}
                   placeholder="e.g. Organic Tomatoes"
                   required
                 />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label>Category</Label>
                   <Select value={category} onValueChange={setCategory}>
                     <SelectTrigger>
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       {categories.map((cat) => (
                         <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
                 <div className="space-y-2">
                   <Label>Unit</Label>
                   <Select value={unit} onValueChange={setUnit}>
                     <SelectTrigger>
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="kg">kg</SelectItem>
                       <SelectItem value="g">g</SelectItem>
                       <SelectItem value="L">L</SelectItem>
                       <SelectItem value="mL">mL</SelectItem>
                       <SelectItem value="unit">unit</SelectItem>
                       <SelectItem value="dozen">dozen</SelectItem>
                       <SelectItem value="box">box</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label>Price per {unit}</Label>
                   <Input
                     type="number"
                     step="0.01"
                     value={pricePerUnit}
                     onChange={(e) => setPricePerUnit(e.target.value)}
                     placeholder="0.00"
                     required
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>Min. Order Qty</Label>
                   <Input
                     type="number"
                     step="0.1"
                     value={minQuantity}
                     onChange={(e) => setMinQuantity(e.target.value)}
                     placeholder="1"
                   />
                 </div>
               </div>
               <div className="flex items-center gap-3">
                 <Switch
                   checked={isAvailable}
                   onCheckedChange={setIsAvailable}
                 />
                 <Label>Available for orders</Label>
               </div>
               <Button type="submit" className="w-full" disabled={savePricing.isPending}>
                 {savePricing.isPending ? "Saving..." : editingItem ? "Update Product" : "Add Product"}
               </Button>
             </form>
           </DialogContent>
         </Dialog>
       </motion.div>
 
       <Card>
         <CardHeader>
           <CardTitle>Your Products ({pricing?.length || 0})</CardTitle>
         </CardHeader>
         <CardContent>
           {isLoading ? (
             <div className="flex items-center justify-center py-8">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
             </div>
           ) : pricing && pricing.length > 0 ? (
             <div className="overflow-x-auto">
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Product</TableHead>
                     <TableHead>Category</TableHead>
                     <TableHead>Price</TableHead>
                     <TableHead>Min. Qty</TableHead>
                     <TableHead>Status</TableHead>
                     <TableHead>Actions</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {pricing.map((item) => (
                     <TableRow key={item.id}>
                       <TableCell className="font-medium">
                         {item.ingredient_name}
                       </TableCell>
                       <TableCell>
                         <Badge variant="secondary">{item.category}</Badge>
                       </TableCell>
                       <TableCell>
                         ${item.price_per_unit?.toFixed(2)}/{item.unit}
                       </TableCell>
                       <TableCell>
                         {item.min_order_quantity} {item.unit}
                       </TableCell>
                       <TableCell>
                         <Badge variant={item.is_available ? "default" : "secondary"}>
                           {item.is_available ? "Available" : "Unavailable"}
                         </Badge>
                       </TableCell>
                       <TableCell>
                         <div className="flex items-center gap-2">
                           <Button
                             variant="ghost"
                             size="icon"
                             onClick={() => openEdit(item)}
                           >
                             <Pencil className="w-4 h-4" />
                           </Button>
                           <Button
                             variant="ghost"
                             size="icon"
                             onClick={() => deletePricing.mutate(item.id)}
                           >
                             <Trash2 className="w-4 h-4 text-destructive" />
                           </Button>
                         </div>
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             </div>
           ) : (
             <div className="text-center py-12">
               <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
               <p className="text-muted-foreground">No products yet. Add your first product!</p>
             </div>
           )}
         </CardContent>
       </Card>
     </div>
   );
 };
 
 export default VendorPricing;