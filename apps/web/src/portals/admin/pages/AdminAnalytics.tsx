 import { motion } from "framer-motion";
 import { useQuery } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { BarChart3, TrendingUp, Package, Users } from "lucide-react";
 
 const AdminAnalytics = () => {
   const { data: demandInsights } = useQuery({
     queryKey: ["admin-demand-insights"],
     queryFn: async () => {
       const { data } = await supabase
         .from("demand_insights")
         .select("*")
         .order("total_quantity", { ascending: false })
         .limit(10);
       return data || [];
     },
   });
 
   const { data: orderStats } = useQuery({
     queryKey: ["admin-order-stats"],
     queryFn: async () => {
       const { count: totalOrders } = await supabase
         .from("vendor_orders")
         .select("*", { count: "exact", head: true });
 
       const { count: pendingOrders } = await supabase
         .from("vendor_orders")
         .select("*", { count: "exact", head: true })
         .eq("status", "pending");
 
       const { count: completedOrders } = await supabase
         .from("vendor_orders")
         .select("*", { count: "exact", head: true })
         .eq("status", "delivered");
 
       return {
         total: totalOrders || 0,
         pending: pendingOrders || 0,
         completed: completedOrders || 0,
       };
     },
   });
 
   return (
     <div className="space-y-6">
       <div>
         <h1 className="text-3xl font-bold flex items-center gap-3">
           <BarChart3 className="w-8 h-8 text-primary" />
           Analytics
         </h1>
         <p className="text-muted-foreground mt-1">
           Platform-wide analytics and insights
         </p>
       </div>
 
       {/* Order Stats */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
         >
           <Card>
             <CardContent className="p-6">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm text-muted-foreground">Total Orders</p>
                   <p className="text-3xl font-bold">{orderStats?.total || 0}</p>
                 </div>
                 <Package className="w-8 h-8 text-primary" />
               </div>
             </CardContent>
           </Card>
         </motion.div>
 
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.05 }}
         >
           <Card>
             <CardContent className="p-6">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm text-muted-foreground">Pending Orders</p>
                   <p className="text-3xl font-bold">{orderStats?.pending || 0}</p>
                 </div>
                 <TrendingUp className="w-8 h-8 text-yellow-500" />
               </div>
             </CardContent>
           </Card>
         </motion.div>
 
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
         >
           <Card>
             <CardContent className="p-6">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm text-muted-foreground">Completed Orders</p>
                   <p className="text-3xl font-bold">{orderStats?.completed || 0}</p>
                 </div>
                 <Users className="w-8 h-8 text-green-500" />
               </div>
             </CardContent>
           </Card>
         </motion.div>
       </div>
 
       {/* Demand Insights */}
       <Card>
         <CardHeader>
           <CardTitle>Top Ingredient Categories by Demand</CardTitle>
         </CardHeader>
         <CardContent>
           <div className="space-y-4">
             {demandInsights?.length ? (
               demandInsights.map((insight, index) => (
                 <motion.div
                   key={insight.id}
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: index * 0.05 }}
                   className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                 >
                   <div>
                     <p className="font-medium">{insight.ingredient_category}</p>
                     <p className="text-sm text-muted-foreground">
                       Postcode: {insight.postcode}
                     </p>
                   </div>
                   <div className="text-right">
                     <p className="font-bold">
                       {insight.total_quantity?.toFixed(1)} {insight.unit}
                     </p>
                     <p className="text-sm text-muted-foreground">
                       {insight.order_count} orders
                     </p>
                   </div>
                 </motion.div>
               ))
             ) : (
               <p className="text-muted-foreground text-center py-8">
                 No demand insights available yet
               </p>
             )}
           </div>
         </CardContent>
       </Card>
     </div>
   );
 };
 
 export default AdminAnalytics;