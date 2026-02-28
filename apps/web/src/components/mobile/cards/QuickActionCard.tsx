 import { LucideIcon, ChefHat, Package, ClipboardList, Receipt, Thermometer, Bell } from "lucide-react";
 import { cn } from "@/lib/utils";
 
 const iconMap: Record<string, LucideIcon> = {
   recipe: ChefHat,
   inventory: Package,
   prep: ClipboardList,
   invoice: Receipt,
   temperature: Thermometer,
   alert: Bell,
 };
 
 interface QuickActionCardProps {
   title: string;
   description: string;
   icon: string;
   color?: string;
   urgency?: "low" | "medium" | "high";
 }
 
 export const QuickActionCard = ({
   title,
   description,
   icon,
   color = "primary",
   urgency = "low",
 }: QuickActionCardProps) => {
   const Icon = iconMap[icon] || ChefHat;
   
   const urgencyColors = {
     low: "border-border",
     medium: "border-warning",
     high: "border-destructive",
   };
 
   return (
     <div
       className={cn(
         "w-full h-[340px] rounded-2xl bg-card p-6 flex flex-col border-2 transition-shadow",
         urgencyColors[urgency],
         "shadow-lg"
       )}
       style={{
         boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
       }}
     >
       {/* Icon header */}
       <div className="flex-1 flex flex-col items-center justify-center">
         <div
           className={cn(
             "w-20 h-20 rounded-2xl flex items-center justify-center mb-6",
             color === "primary" && "bg-primary/10",
             color === "accent" && "bg-accent/10",
             color === "warning" && "bg-warning/10",
             color === "destructive" && "bg-destructive/10"
           )}
         >
           <Icon
             className={cn(
               "w-10 h-10",
               color === "primary" && "text-primary",
               color === "accent" && "text-accent",
               color === "warning" && "text-warning",
               color === "destructive" && "text-destructive"
             )}
           />
         </div>
         
         <h3 className="text-xl font-semibold text-foreground text-center mb-2">
           {title}
         </h3>
         <p className="text-muted-foreground text-center text-sm max-w-[200px]">
           {description}
         </p>
       </div>
       
       {/* Swipe instruction */}
       <div className="text-center">
         <p className="text-xs text-muted-foreground">
           Swipe right to start →
         </p>
       </div>
     </div>
   );
 };