 import { useState } from "react";
 import { motion } from "framer-motion";
 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { useVendorAuth } from "@/hooks/useVendorAuth";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Switch } from "@/components/ui/switch";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
 } from "@/components/ui/dialog";
 import { Tag, Plus, Pencil, Trash2, Calendar } from "lucide-react";
 import { toast } from "sonner";
 import { format } from "date-fns";
 
 const VendorDeals = () => {
   const { vendorProfile } = useVendorAuth();
   const queryClient = useQueryClient();
   const [isDialogOpen, setIsDialogOpen] = useState(false);
   const [editingDeal, setEditingDeal] = useState<any>(null);
 
   // Form state
   const [title, setTitle] = useState("");
   const [description, setDescription] = useState("");
   const [discountPercent, setDiscountPercent] = useState("");
   const [minOrderValue, setMinOrderValue] = useState("");
   const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
   const [endDate, setEndDate] = useState("");
   const [isActive, setIsActive] = useState(true);
 
   const { data: deals, isLoading } = useQuery({
     queryKey: ["vendor-deals", vendorProfile?.id],
     queryFn: async () => {
       if (!vendorProfile) return [];
       const { data } = await supabase
         .from("vendor_deals")
         .select("*")
         .eq("vendor_id", vendorProfile.id)
         .order("created_at", { ascending: false });
       return data || [];
     },
     enabled: !!vendorProfile,
   });
 
   const resetForm = () => {
     setTitle("");
     setDescription("");
     setDiscountPercent("");
     setMinOrderValue("");
     setStartDate(format(new Date(), "yyyy-MM-dd"));
     setEndDate("");
     setIsActive(true);
     setEditingDeal(null);
   };
 
   const openEdit = (deal: any) => {
     setEditingDeal(deal);
     setTitle(deal.title);
     setDescription(deal.description || "");
     setDiscountPercent(deal.discount_percent?.toString() || "");
     setMinOrderValue(deal.min_order_value?.toString() || "");
     setStartDate(deal.start_date);
     setEndDate(deal.end_date);
     setIsActive(deal.is_active ?? true);
     setIsDialogOpen(true);
   };
 
   const saveDeal = useMutation({
     mutationFn: async () => {
       if (!vendorProfile) throw new Error("No vendor profile");
       
       const data = {
         vendor_id: vendorProfile.id,
         title,
         description: description || null,
         discount_percent: discountPercent ? parseFloat(discountPercent) : null,
         min_order_value: minOrderValue ? parseFloat(minOrderValue) : null,
         start_date: startDate,
         end_date: endDate,
         is_active: isActive,
       };
 
       if (editingDeal) {
         const { error } = await supabase
           .from("vendor_deals")
           .update(data)
           .eq("id", editingDeal.id);
         if (error) throw error;
       } else {
         const { error } = await supabase
           .from("vendor_deals")
           .insert(data);
         if (error) throw error;
       }
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["vendor-deals"] });
       toast.success(editingDeal ? "Deal updated" : "Deal created");
       setIsDialogOpen(false);
       resetForm();
     },
     onError: () => {
       toast.error("Failed to save deal");
     },
   });
 
   const deleteDeal = useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase
         .from("vendor_deals")
         .delete()
         .eq("id", id);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["vendor-deals"] });
       toast.success("Deal removed");
     },
     onError: () => {
       toast.error("Failed to remove deal");
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
             <Tag className="w-8 h-8 text-primary" />
             Deals & Promotions
           </h1>
           <p className="text-muted-foreground mt-1">
             Create special offers for chefs
           </p>
         </div>
 
         <Dialog open={isDialogOpen} onOpenChange={(open) => {
           setIsDialogOpen(open);
           if (!open) resetForm();
         }}>
           <DialogTrigger asChild>
             <Button>
               <Plus className="w-4 h-4 mr-2" />
               Create Deal
             </Button>
           </DialogTrigger>
           <DialogContent>
             <DialogHeader>
               <DialogTitle>{editingDeal ? "Edit Deal" : "Create Deal"}</DialogTitle>
             </DialogHeader>
             <form
               onSubmit={(e) => {
                 e.preventDefault();
                 saveDeal.mutate();
               }}
               className="space-y-4"
             >
               <div className="space-y-2">
                 <Label>Title</Label>
                 <Input
                   value={title}
                   onChange={(e) => setTitle(e.target.value)}
                   placeholder="e.g. Summer Special - 15% Off"
                   required
                 />
               </div>
               <div className="space-y-2">
                 <Label>Description</Label>
                 <Textarea
                   value={description}
                   onChange={(e) => setDescription(e.target.value)}
                   placeholder="Optional description..."
                   rows={2}
                 />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label>Discount %</Label>
                   <Input
                     type="number"
                     min="0"
                     max="100"
                     value={discountPercent}
                     onChange={(e) => setDiscountPercent(e.target.value)}
                     placeholder="15"
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>Min. Order Value</Label>
                   <Input
                     type="number"
                     step="0.01"
                     value={minOrderValue}
                     onChange={(e) => setMinOrderValue(e.target.value)}
                     placeholder="100.00"
                   />
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label>Start Date</Label>
                   <Input
                     type="date"
                     value={startDate}
                     onChange={(e) => setStartDate(e.target.value)}
                     required
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>End Date</Label>
                   <Input
                     type="date"
                     value={endDate}
                     onChange={(e) => setEndDate(e.target.value)}
                     required
                   />
                 </div>
               </div>
               <div className="flex items-center gap-3">
                 <Switch
                   checked={isActive}
                   onCheckedChange={setIsActive}
                 />
                 <Label>Active</Label>
               </div>
               <Button type="submit" className="w-full" disabled={saveDeal.isPending}>
                 {saveDeal.isPending ? "Saving..." : editingDeal ? "Update Deal" : "Create Deal"}
               </Button>
             </form>
           </DialogContent>
         </Dialog>
       </motion.div>
 
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
         {isLoading ? (
           Array.from({ length: 3 }).map((_, i) => (
             <Card key={i} className="animate-pulse">
               <CardContent className="p-6">
                 <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                 <div className="h-4 bg-muted rounded w-1/2" />
               </CardContent>
             </Card>
           ))
         ) : deals && deals.length > 0 ? (
           deals.map((deal, index) => (
             <motion.div
               key={deal.id}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: index * 0.05 }}
             >
               <Card className={`hover:shadow-md transition-shadow ${!deal.is_active ? 'opacity-60' : ''}`}>
                 <CardHeader className="pb-2">
                   <CardTitle className="flex items-center justify-between">
                     <span className="truncate">{deal.title}</span>
                     <Badge variant={deal.is_active ? "default" : "secondary"}>
                       {deal.is_active ? "Active" : "Inactive"}
                     </Badge>
                   </CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="space-y-3">
                     {deal.description && (
                       <p className="text-sm text-muted-foreground line-clamp-2">
                         {deal.description}
                       </p>
                     )}
                     {deal.discount_percent && (
                       <Badge variant="secondary" className="text-lg">
                         {deal.discount_percent}% OFF
                       </Badge>
                     )}
                     <div className="flex items-center gap-2 text-xs text-muted-foreground">
                       <Calendar className="w-3 h-3" />
                       <span>
                         {format(new Date(deal.start_date), "MMM d")} - {format(new Date(deal.end_date), "MMM d, yyyy")}
                       </span>
                     </div>
                     <div className="flex items-center gap-2 pt-2">
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => openEdit(deal)}
                       >
                         <Pencil className="w-4 h-4" />
                       </Button>
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => deleteDeal.mutate(deal.id)}
                       >
                         <Trash2 className="w-4 h-4 text-destructive" />
                       </Button>
                     </div>
                   </div>
                 </CardContent>
               </Card>
             </motion.div>
           ))
         ) : (
           <div className="col-span-full text-center py-12">
             <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
             <p className="text-muted-foreground">No deals yet. Create your first promotion!</p>
           </div>
         )}
       </div>
     </div>
   );
 };
 
 export default VendorDeals;