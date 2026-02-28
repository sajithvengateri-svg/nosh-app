 import { motion } from "framer-motion";
 import { useQuery } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { useVendorAuth } from "@/hooks/useVendorAuth";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import {
   Package,
   DollarSign,
   Inbox,
   MessageSquare,
   TrendingUp,
   ArrowRight,
 } from "lucide-react";
 import { useNavigate } from "react-router-dom";
 
 const StatCard = ({
   title,
   value,
   icon: Icon,
   trend,
   delay = 0,
 }: {
   title: string;
   value: string | number;
   icon: React.ElementType;
   trend?: string;
   delay?: number;
 }) => (
   <motion.div
     initial={{ opacity: 0, y: 20 }}
     animate={{ opacity: 1, y: 0 }}
     transition={{ delay }}
   >
     <Card className="hover:shadow-md transition-shadow">
       <CardContent className="p-6">
         <div className="flex items-center justify-between">
           <div>
             <p className="text-sm text-muted-foreground">{title}</p>
             <p className="text-2xl font-bold mt-1">{value}</p>
             {trend && (
               <Badge variant="secondary" className="mt-2 text-xs">
                 <TrendingUp className="w-3 h-3 mr-1" />
                 {trend}
               </Badge>
             )}
           </div>
           <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
             <Icon className="w-6 h-6 text-primary" />
           </div>
         </div>
       </CardContent>
     </Card>
   </motion.div>
 );
 
 const VendorDashboard = () => {
   const { vendorProfile } = useVendorAuth();
   const navigate = useNavigate();
 
   const { data: orders } = useQuery({
     queryKey: ["vendor-orders-count", vendorProfile?.id],
     queryFn: async () => {
       if (!vendorProfile) return { total: 0, pending: 0 };
       const { count: total } = await supabase
         .from("vendor_orders")
         .select("*", { count: "exact", head: true })
         .eq("vendor_id", vendorProfile.id);
       const { count: pending } = await supabase
         .from("vendor_orders")
         .select("*", { count: "exact", head: true })
         .eq("vendor_id", vendorProfile.id)
         .eq("status", "pending");
       return { total: total || 0, pending: pending || 0 };
     },
     enabled: !!vendorProfile,
   });
 
   const { data: products } = useQuery({
     queryKey: ["vendor-products-count", vendorProfile?.id],
     queryFn: async () => {
       if (!vendorProfile) return 0;
       const { count } = await supabase
         .from("vendor_pricing")
         .select("*", { count: "exact", head: true })
         .eq("vendor_id", vendorProfile.id);
       return count || 0;
     },
     enabled: !!vendorProfile,
   });
 
   const { data: messages } = useQuery({
     queryKey: ["vendor-messages-count", vendorProfile?.id],
     queryFn: async () => {
       if (!vendorProfile) return 0;
       const { count } = await supabase
         .from("vendor_messages")
         .select("*", { count: "exact", head: true })
         .eq("vendor_id", vendorProfile.id)
         .is("read_at", null);
       return count || 0;
     },
     enabled: !!vendorProfile,
   });
 
   return (
     <div className="p-6 lg:p-8 space-y-8">
       {/* Header */}
       <motion.div
         initial={{ opacity: 0, y: -20 }}
         animate={{ opacity: 1, y: 0 }}
         className="space-y-1"
       >
         <h1 className="text-3xl font-bold">
           Welcome back, {vendorProfile?.contact_name?.split(" ")[0] || "Vendor"}
         </h1>
         <p className="text-muted-foreground">
           Here's what's happening with your business today
         </p>
       </motion.div>
 
       {/* Status Banner */}
       {vendorProfile?.status === "pending" && (
         <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           className="bg-warning/10 border border-warning/20 rounded-lg p-4"
         >
           <p className="text-warning font-medium">
             Your vendor account is pending approval. Some features may be limited.
           </p>
         </motion.div>
       )}
 
       {/* Stats Grid */}
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
         <StatCard
           title="Total Products"
           value={products || 0}
           icon={Package}
           delay={0}
         />
         <StatCard
           title="Total Orders"
           value={orders?.total || 0}
           icon={Inbox}
           delay={0.1}
         />
         <StatCard
           title="Pending Orders"
           value={orders?.pending || 0}
           icon={DollarSign}
           delay={0.2}
         />
         <StatCard
           title="Unread Messages"
           value={messages || 0}
           icon={MessageSquare}
           delay={0.3}
         />
       </div>
 
       {/* Quick Actions */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <motion.div
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 0.4 }}
         >
           <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/vendor/pricing")}>
             <CardHeader>
               <CardTitle className="flex items-center justify-between">
                 <span>Manage Pricing</span>
                 <ArrowRight className="w-5 h-5 text-muted-foreground" />
               </CardTitle>
             </CardHeader>
             <CardContent>
               <p className="text-muted-foreground">
                 Update your product prices and availability for chefs
               </p>
             </CardContent>
           </Card>
         </motion.div>
 
         <motion.div
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 0.5 }}
         >
           <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/vendor/insights")}>
             <CardHeader>
               <CardTitle className="flex items-center justify-between">
                 <span>View Demand Insights</span>
                 <ArrowRight className="w-5 h-5 text-muted-foreground" />
               </CardTitle>
             </CardHeader>
             <CardContent>
               <p className="text-muted-foreground">
                 See what ingredients chefs are looking for in your area
               </p>
             </CardContent>
           </Card>
         </motion.div>
       </div>
     </div>
   );
 };
 
 export default VendorDashboard;