 import { motion } from "framer-motion";
 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { useVendorAuth } from "@/hooks/useVendorAuth";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
 import { Inbox, Package, Clock, CheckCircle, Truck, XCircle } from "lucide-react";
 import { toast } from "sonner";
 import { format } from "date-fns";
 
 const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
   pending: { label: "Pending", color: "bg-yellow-500 text-white", icon: Clock },
   confirmed: { label: "Confirmed", color: "bg-primary text-primary-foreground", icon: CheckCircle },
   processing: { label: "Processing", color: "bg-blue-500 text-white", icon: Package },
   shipped: { label: "Shipped", color: "bg-purple-500 text-white", icon: Truck },
   delivered: { label: "Delivered", color: "bg-green-500 text-white", icon: CheckCircle },
   cancelled: { label: "Cancelled", color: "bg-destructive text-destructive-foreground", icon: XCircle },
 };
 
 const VendorOrders = () => {
   const { vendorProfile } = useVendorAuth();
   const queryClient = useQueryClient();
 
   const { data: orders, isLoading } = useQuery({
     queryKey: ["vendor-orders", vendorProfile?.id],
     queryFn: async () => {
       if (!vendorProfile) return [];
       const { data } = await supabase
         .from("vendor_orders")
         .select("*")
         .eq("vendor_id", vendorProfile.id)
         .order("created_at", { ascending: false });
       return data || [];
     },
     enabled: !!vendorProfile,
   });
 
   const updateStatus = useMutation({
     mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
       const { error } = await supabase
         .from("vendor_orders")
         .update({ status })
         .eq("id", orderId);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
       toast.success("Order status updated");
     },
     onError: () => {
       toast.error("Failed to update order status");
     },
   });
 
   return (
     <div className="p-6 lg:p-8 space-y-6">
       <motion.div
         initial={{ opacity: 0, y: -20 }}
         animate={{ opacity: 1, y: 0 }}
       >
         <h1 className="text-3xl font-bold flex items-center gap-3">
           <Inbox className="w-8 h-8 text-primary" />
           Orders
         </h1>
         <p className="text-muted-foreground mt-1">
           Manage incoming orders from chefs
         </p>
       </motion.div>
 
       <Card>
         <CardHeader>
           <CardTitle>All Orders</CardTitle>
         </CardHeader>
         <CardContent>
           {isLoading ? (
             <div className="flex items-center justify-center py-8">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
             </div>
           ) : orders && orders.length > 0 ? (
             <div className="overflow-x-auto">
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Order #</TableHead>
                     <TableHead>Date</TableHead>
                     <TableHead>Items</TableHead>
                     <TableHead>Total</TableHead>
                     <TableHead>Status</TableHead>
                     <TableHead>Actions</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {orders.map((order) => {
                     const status = statusConfig[order.status || "pending"];
                     const StatusIcon = status.icon;
                     const items = Array.isArray(order.items) ? order.items : [];
                     return (
                       <TableRow key={order.id}>
                         <TableCell className="font-medium">
                           {order.order_number}
                         </TableCell>
                         <TableCell>
                           {format(new Date(order.created_at), "MMM d, yyyy")}
                         </TableCell>
                         <TableCell>{items.length} items</TableCell>
                         <TableCell>${order.total?.toFixed(2)}</TableCell>
                         <TableCell>
                           <Badge className={status.color}>
                             <StatusIcon className="w-3 h-3 mr-1" />
                             {status.label}
                           </Badge>
                         </TableCell>
                         <TableCell>
                           <Select
                             value={order.status || "pending"}
                             onValueChange={(value) =>
                               updateStatus.mutate({ orderId: order.id, status: value })
                             }
                           >
                             <SelectTrigger className="w-32">
                               <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="pending">Pending</SelectItem>
                               <SelectItem value="confirmed">Confirmed</SelectItem>
                               <SelectItem value="processing">Processing</SelectItem>
                               <SelectItem value="shipped">Shipped</SelectItem>
                               <SelectItem value="delivered">Delivered</SelectItem>
                               <SelectItem value="cancelled">Cancelled</SelectItem>
                             </SelectContent>
                           </Select>
                         </TableCell>
                       </TableRow>
                     );
                   })}
                 </TableBody>
               </Table>
             </div>
           ) : (
             <div className="text-center py-12">
               <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
               <p className="text-muted-foreground">No orders yet</p>
             </div>
           )}
         </CardContent>
       </Card>
     </div>
   );
 };
 
 export default VendorOrders;