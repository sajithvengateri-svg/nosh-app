 import { AlertTriangle, Package, Clock, Thermometer, CheckCircle2, XCircle } from "lucide-react";
 import { cn } from "@/lib/utils";
 import { formatDistanceToNow } from "date-fns";
 
 interface NotificationCardProps {
   title: string;
   message: string;
   type: "low-stock" | "expiry" | "temperature" | "task" | "general";
   severity: "info" | "warning" | "critical";
   timestamp: Date;
   actionLabel?: string;
 }
 
 const iconMap = {
   "low-stock": Package,
   expiry: Clock,
   temperature: Thermometer,
   task: CheckCircle2,
   general: AlertTriangle,
 };
 
 export const NotificationCard = ({
   title,
   message,
   type,
   severity,
   timestamp,
   actionLabel = "Handle",
 }: NotificationCardProps) => {
   const Icon = iconMap[type] || AlertTriangle;
   
   const severityColors = {
     info: "border-primary bg-primary/5",
     warning: "border-warning bg-warning/5",
     critical: "border-destructive bg-destructive/5",
   };
   
   const severityIcon = {
     info: "text-primary",
     warning: "text-warning",
     critical: "text-destructive",
   };
 
   return (
     <div
       className={cn(
         "w-full h-[340px] rounded-2xl p-6 flex flex-col border-2",
         severityColors[severity]
       )}
       style={{
         boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
       }}
     >
       {/* Severity indicator */}
       <div className="flex items-center justify-between mb-4">
         <div className={cn(
           "px-3 py-1 rounded-full text-xs font-medium uppercase",
           severity === "info" && "bg-primary/20 text-primary",
           severity === "warning" && "bg-warning/20 text-warning",
           severity === "critical" && "bg-destructive/20 text-destructive"
         )}>
           {severity}
         </div>
         <span className="text-xs text-muted-foreground">
           {formatDistanceToNow(timestamp, { addSuffix: true })}
         </span>
       </div>
       
       {/* Icon and content */}
       <div className="flex-1 flex flex-col items-center justify-center text-center">
         <div className={cn(
           "w-16 h-16 rounded-full flex items-center justify-center mb-4",
           severity === "info" && "bg-primary/10",
           severity === "warning" && "bg-warning/10",
           severity === "critical" && "bg-destructive/10"
         )}>
           <Icon className={cn("w-8 h-8", severityIcon[severity])} />
         </div>
         
         <h3 className="text-lg font-semibold text-foreground mb-2">
           {title}
         </h3>
         <p className="text-muted-foreground text-sm max-w-[240px]">
           {message}
         </p>
       </div>
       
       {/* Action hints */}
       <div className="flex justify-between items-center pt-4 border-t border-border">
         <div className="flex items-center gap-2 text-muted-foreground">
           <XCircle className="w-4 h-4" />
           <span className="text-xs">Dismiss</span>
         </div>
         <div className="flex items-center gap-2 text-accent">
           <span className="text-xs font-medium">{actionLabel}</span>
           <CheckCircle2 className="w-4 h-4" />
         </div>
       </div>
     </div>
   );
 };