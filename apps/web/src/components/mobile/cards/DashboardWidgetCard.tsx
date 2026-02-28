 import { TrendingUp, TrendingDown, Package, ChefHat, ClipboardList, AlertTriangle } from "lucide-react";
 import { cn } from "@/lib/utils";
 import { Progress } from "@/components/ui/progress";
 
 interface DashboardWidgetCardProps {
   title: string;
   value: string | number;
   subtitle?: string;
   trend?: "up" | "down" | "neutral";
   trendValue?: string;
   progress?: number;
   icon: string;
   status?: "good" | "warning" | "critical";
 }
 
 const iconMap: Record<string, React.ElementType> = {
   inventory: Package,
   recipe: ChefHat,
   prep: ClipboardList,
   alert: AlertTriangle,
 };
 
 export const DashboardWidgetCard = ({
   title,
   value,
   subtitle,
   trend,
   trendValue,
   progress,
   icon,
   status = "good",
 }: DashboardWidgetCardProps) => {
   const Icon = iconMap[icon] || Package;
   
   const statusColors = {
     good: "border-accent",
     warning: "border-warning",
     critical: "border-destructive",
   };
   
   const statusBg = {
     good: "bg-accent/10",
     warning: "bg-warning/10",
     critical: "bg-destructive/10",
   };
 
   return (
     <div
       className={cn(
         "w-full h-[340px] rounded-2xl bg-card p-6 flex flex-col border-2",
         statusColors[status]
       )}
       style={{
         boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
       }}
     >
       {/* Header */}
       <div className="flex items-start justify-between mb-4">
         <div className={cn("p-3 rounded-xl", statusBg[status])}>
           <Icon className={cn(
             "w-6 h-6",
             status === "good" && "text-accent",
             status === "warning" && "text-warning",
             status === "critical" && "text-destructive"
           )} />
         </div>
         
         {trend && (
           <div className={cn(
             "flex items-center gap-1 text-sm",
             trend === "up" && "text-accent",
             trend === "down" && "text-destructive",
             trend === "neutral" && "text-muted-foreground"
           )}>
             {trend === "up" && <TrendingUp className="w-4 h-4" />}
             {trend === "down" && <TrendingDown className="w-4 h-4" />}
             {trendValue && <span>{trendValue}</span>}
           </div>
         )}
       </div>
       
       {/* Main content */}
       <div className="flex-1 flex flex-col justify-center">
         <p className="text-muted-foreground text-sm mb-1">{title}</p>
         <p className="text-4xl font-bold text-foreground mb-2">{value}</p>
         {subtitle && (
           <p className="text-muted-foreground text-sm">{subtitle}</p>
         )}
         
         {progress !== undefined && (
           <div className="mt-4">
             <Progress value={progress} className="h-2" />
             <p className="text-xs text-muted-foreground mt-1">
               {progress}% complete
             </p>
           </div>
         )}
       </div>
       
       {/* Footer */}
       <div className="text-center">
         <p className="text-xs text-muted-foreground">
           Swipe to dismiss • Up for breakdown
         </p>
       </div>
     </div>
   );
 };