 import { useEffect, useState } from "react";
 import { motion } from "framer-motion";
 import { 
   TrendingUp, 
   MapPin, 
   Package, 
   BarChart3,
   Loader2,
   AlertCircle
 } from "lucide-react";
 import { supabase } from "@/integrations/supabase/client";
 import { Badge } from "@/components/ui/badge";
 import { cn } from "@/lib/utils";
 
 interface DemandInsight {
   id: string;
   ingredient_category: string;
   postcode: string;
   week_ending: string;
   total_quantity: number;
   order_count: number;
   unit: string;
   avg_price_paid: number;
 }
 
 interface DemandInsightsPanelProps {
   className?: string;
   showPostcodeFilter?: boolean;
   maxItems?: number;
 }
 
 const categoryColors: Record<string, string> = {
   "Seafood": "bg-blue-500",
   "Produce": "bg-green-500",
   "Dairy": "bg-yellow-500",
   "Meat": "bg-red-500",
   "Dry Goods": "bg-amber-600",
   "Pantry": "bg-orange-500",
   "Other": "bg-gray-500",
 };
 
 const DemandInsightsPanel = ({ 
   className, 
   showPostcodeFilter = true,
   maxItems = 10 
 }: DemandInsightsPanelProps) => {
   const [insights, setInsights] = useState<DemandInsight[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [selectedPostcode, setSelectedPostcode] = useState<string | null>(null);
 
   useEffect(() => {
     fetchInsights();
   }, []);
 
   const fetchInsights = async () => {
     setLoading(true);
     setError(null);
     
     try {
       const { data, error: fetchError } = await supabase
         .from("demand_insights")
         .select("*")
         .order("total_quantity", { ascending: false })
         .limit(maxItems);
 
       if (fetchError) {
         // Check if it's an RLS restriction (vendors see delayed data)
         if (fetchError.code === "42501") {
           setError("Demand data is delayed by 7 days for privacy protection.");
         } else {
           throw fetchError;
         }
       } else {
         setInsights(data || []);
       }
     } catch (err) {
       console.error("Error fetching demand insights:", err);
       setError("Unable to load demand insights");
     } finally {
       setLoading(false);
     }
   };
 
   const postcodes = [...new Set(insights.map(i => i.postcode))];
   const filteredInsights = selectedPostcode
     ? insights.filter(i => i.postcode === selectedPostcode)
     : insights;
 
   // Calculate max quantity for relative bar sizing
   const maxQuantity = Math.max(...filteredInsights.map(i => i.total_quantity), 1);
 
   if (loading) {
     return (
       <div className={cn("card-elevated p-6", className)}>
         <div className="flex items-center justify-center py-8">
           <Loader2 className="w-6 h-6 animate-spin text-primary" />
         </div>
       </div>
     );
   }
 
   if (error) {
     return (
       <div className={cn("card-elevated p-6", className)}>
         <div className="flex items-center gap-3 text-muted-foreground">
           <AlertCircle className="w-5 h-5" />
           <p className="text-sm">{error}</p>
         </div>
       </div>
     );
   }
 
   if (insights.length === 0) {
     return (
       <div className={cn("card-elevated p-6", className)}>
         <div className="text-center py-8">
           <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
           <p className="text-muted-foreground">No demand data available yet</p>
           <p className="text-sm text-muted-foreground mt-1">
             Insights will appear as chefs add recipes
           </p>
         </div>
       </div>
     );
   }
 
   return (
     <div className={cn("card-elevated p-6", className)}>
       {/* Header */}
       <div className="flex items-center justify-between mb-6">
         <div className="flex items-center gap-2">
           <TrendingUp className="w-5 h-5 text-primary" />
           <h3 className="font-semibold">Ingredient Demand</h3>
         </div>
         <Badge variant="secondary" className="text-xs">
           Updated weekly
         </Badge>
       </div>
 
       {/* Postcode Filter */}
       {showPostcodeFilter && postcodes.length > 1 && (
         <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
           <button
             onClick={() => setSelectedPostcode(null)}
             className={cn(
               "px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
               !selectedPostcode
                 ? "bg-primary text-primary-foreground"
                 : "bg-muted text-muted-foreground hover:bg-secondary"
             )}
           >
             All Areas
           </button>
           {postcodes.map((postcode) => (
             <button
               key={postcode}
               onClick={() => setSelectedPostcode(postcode)}
               className={cn(
                 "px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1",
                 selectedPostcode === postcode
                   ? "bg-primary text-primary-foreground"
                   : "bg-muted text-muted-foreground hover:bg-secondary"
               )}
             >
               <MapPin className="w-3 h-3" />
               {postcode === "0000" ? "Unknown" : postcode}
             </button>
           ))}
         </div>
       )}
 
       {/* Demand Bars */}
       <div className="space-y-3">
         {filteredInsights.map((insight, index) => (
           <motion.div
             key={insight.id}
             initial={{ opacity: 0, x: -10 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: index * 0.05 }}
             className="group"
           >
             <div className="flex items-center justify-between mb-1">
               <div className="flex items-center gap-2">
                 <div 
                   className={cn(
                     "w-3 h-3 rounded-full",
                     categoryColors[insight.ingredient_category] || "bg-gray-500"
                   )} 
                 />
                 <span className="text-sm font-medium">{insight.ingredient_category}</span>
                 {insight.postcode !== "0000" && (
                   <span className="text-xs text-muted-foreground flex items-center gap-1">
                     <MapPin className="w-3 h-3" />
                     {insight.postcode}
                   </span>
                 )}
               </div>
               <div className="flex items-center gap-3 text-sm">
                 <span className="text-muted-foreground">
                   {insight.order_count} orders
                 </span>
                 <span className="font-mono font-medium">
                   {insight.total_quantity.toLocaleString()} {insight.unit}
                 </span>
               </div>
             </div>
             
             {/* Progress Bar */}
             <div className="h-2 bg-muted rounded-full overflow-hidden">
               <motion.div
                 initial={{ width: 0 }}
                 animate={{ width: `${(insight.total_quantity / maxQuantity) * 100}%` }}
                 transition={{ delay: index * 0.05 + 0.2, duration: 0.5 }}
                 className={cn(
                   "h-full rounded-full",
                   categoryColors[insight.ingredient_category] || "bg-gray-500"
                 )}
               />
             </div>
 
             {/* Hover details */}
             <div className="hidden group-hover:flex items-center gap-4 mt-1 text-xs text-muted-foreground">
               <span className="flex items-center gap-1">
                 <Package className="w-3 h-3" />
                 Avg price: ${Number(insight.avg_price_paid).toFixed(2)}/{insight.unit}
               </span>
               <span>Week ending: {new Date(insight.week_ending).toLocaleDateString()}</span>
             </div>
           </motion.div>
         ))}
       </div>
 
       {/* Privacy Notice */}
       <div className="mt-6 pt-4 border-t border-border">
         <p className="text-xs text-muted-foreground">
           Data is aggregated and anonymized. Individual recipe details are never shared.
         </p>
       </div>
     </div>
   );
 };
 
 export default DemandInsightsPanel;