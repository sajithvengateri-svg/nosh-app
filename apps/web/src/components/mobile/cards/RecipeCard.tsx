 import { Clock, Users, DollarSign, AlertTriangle } from "lucide-react";
 import { cn } from "@/lib/utils";
 import { Badge } from "@/components/ui/badge";
 
 interface RecipeCardProps {
   name: string;
   category: string;
   imageUrl?: string;
   prepTime?: number;
   servings?: number;
   costPerServing?: number;
   allergens?: string[];
 }
 
 export const RecipeCard = ({
   name,
   category,
   imageUrl,
   prepTime,
   servings,
   costPerServing,
   allergens = [],
 }: RecipeCardProps) => {
   return (
     <div
       className="w-full h-[340px] rounded-2xl bg-card overflow-hidden border-2 border-border flex flex-col"
       style={{
         boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
       }}
     >
       {/* Image header */}
       <div className="relative h-40 bg-muted">
         {imageUrl ? (
           <img
             src={imageUrl}
             alt={name}
             className="w-full h-full object-cover"
           />
         ) : (
           <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
             <span className="text-4xl">🍳</span>
           </div>
         )}
         <Badge className="absolute top-3 left-3 bg-card/90 text-foreground">
           {category}
         </Badge>
       </div>
       
       {/* Content */}
       <div className="flex-1 p-4 flex flex-col">
         <h3 className="text-lg font-semibold text-foreground line-clamp-2 mb-2">
           {name}
         </h3>
         
         {/* Stats row */}
         <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
           {prepTime && (
             <div className="flex items-center gap-1">
               <Clock className="w-4 h-4" />
               <span>{prepTime}m</span>
             </div>
           )}
           {servings && (
             <div className="flex items-center gap-1">
               <Users className="w-4 h-4" />
               <span>{servings}</span>
             </div>
           )}
           {costPerServing && (
             <div className="flex items-center gap-1">
               <DollarSign className="w-4 h-4" />
               <span>${costPerServing.toFixed(2)}</span>
             </div>
           )}
         </div>
         
         {/* Allergens */}
         {allergens.length > 0 && (
           <div className="flex items-center gap-2 mt-auto">
             <AlertTriangle className="w-4 h-4 text-warning" />
             <span className="text-xs text-warning">
               {allergens.slice(0, 3).join(", ")}
               {allergens.length > 3 && ` +${allergens.length - 3}`}
             </span>
           </div>
         )}
       </div>
       
       {/* Footer hint */}
       <div className="px-4 pb-3 text-center">
         <p className="text-xs text-muted-foreground">
           Swipe right to prep • Up for details
         </p>
       </div>
     </div>
   );
 };