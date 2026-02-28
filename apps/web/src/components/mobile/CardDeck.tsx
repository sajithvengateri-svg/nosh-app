 import { useState, useCallback, useMemo, useEffect } from "react";
 import { AnimatePresence, motion } from "framer-motion";
 import { SwipeableCard } from "./SwipeableCard";
 import { QuickActionCard } from "./cards/QuickActionCard";
 import { RecipeCard } from "./cards/RecipeCard";
 import { DashboardWidgetCard } from "./cards/DashboardWidgetCard";
 import { NotificationCard } from "./cards/NotificationCard";
 import { ChevronLeft, ChevronRight, ChevronUp, RotateCcw, Mic, MicOff, Volume2 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { cn } from "@/lib/utils";
 import { useVoiceControl } from "@/hooks/useVoiceControl";
 import { toast } from "sonner";
 
 export interface DeckCard {
   id: string;
   type: "quick-action" | "recipe" | "widget" | "notification";
   data: Record<string, any>;
 }
 
 interface CardDeckProps {
   cards: DeckCard[];
   onAction?: (card: DeckCard, action: "left" | "right" | "up") => void;
   onVoiceCommand?: (command: string) => void;
   className?: string;
 }
 
 export const CardDeck = ({
   cards,
   onAction,
   onVoiceCommand,
   className,
 }: CardDeckProps) => {
   const [currentCards, setCurrentCards] = useState(cards);
   const [removedCards, setRemovedCards] = useState<DeckCard[]>([]);
   // Voice control setup
   const voiceCommands = useMemo(() => [
     {
       keywords: ["skip", "next", "dismiss", "left"],
       action: () => handleSwipe("left"),
       description: "Skip current card",
     },
     {
       keywords: ["action", "do it", "yes", "right", "go"],
       action: () => handleSwipe("right"),
       description: "Perform action on card",
     },
     {
       keywords: ["details", "more", "info", "up", "open"],
       action: () => handleSwipe("up"),
       description: "View card details",
     },
     {
       keywords: ["undo", "back", "oops"],
       action: () => handleUndo(),
       description: "Undo last action",
     },
   ], []);
   
   const { isListening, transcript, toggleListening } = useVoiceControl({
     commands: voiceCommands,
     onTranscript: (text) => {
       onVoiceCommand?.(text);
     },
   });
 
   const handleSwipe = useCallback(
     (direction: "left" | "right" | "up") => {
       if (currentCards.length === 0) return;
       
       const card = currentCards[0];
       setRemovedCards((prev) => [...prev, card]);
       setCurrentCards((prev) => prev.slice(1));
       onAction?.(card, direction);
     },
     [currentCards, onAction]
   );
 
   const handleUndo = useCallback(() => {
     if (removedCards.length === 0) return;
     
     const lastRemoved = removedCards[removedCards.length - 1];
     setRemovedCards((prev) => prev.slice(0, -1));
     setCurrentCards((prev) => [lastRemoved, ...prev]);
   }, [removedCards]);
 
   const toggleVoice = useCallback(() => {
     toggleListening();
   }, [toggleListening]);
 
   const renderCard = useCallback((card: DeckCard) => {
     switch (card.type) {
       case "quick-action":
         return <QuickActionCard {...card.data as React.ComponentProps<typeof QuickActionCard>} />;
       case "recipe":
         return <RecipeCard {...card.data as React.ComponentProps<typeof RecipeCard>} />;
       case "widget":
         return <DashboardWidgetCard {...card.data as React.ComponentProps<typeof DashboardWidgetCard>} />;
       case "notification":
         return <NotificationCard {...card.data as React.ComponentProps<typeof NotificationCard>} />;
       default:
         return null;
     }
   }, []);
 
   const visibleCards = useMemo(() => currentCards.slice(0, 3), [currentCards]);
 
   return (
     <div className={cn("relative flex flex-col items-center", className)}>
       {/* Swipe hints */}
       <div className="flex items-center justify-center gap-8 mb-4 text-xs text-muted-foreground">
         <div className="flex items-center gap-1">
           <ChevronLeft className="w-4 h-4" />
           <span>Skip</span>
         </div>
         <div className="flex items-center gap-1">
           <ChevronUp className="w-4 h-4" />
           <span>Details</span>
         </div>
         <div className="flex items-center gap-1">
           <span>Action</span>
           <ChevronRight className="w-4 h-4" />
         </div>
       </div>
 
       {/* Card stack container */}
       <div className="relative w-full h-[380px] flex items-center justify-center">
         {currentCards.length === 0 ? (
           <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="text-center"
           >
             <p className="text-muted-foreground mb-4">All caught up!</p>
             <Button variant="outline" onClick={handleUndo} disabled={removedCards.length === 0}>
               <RotateCcw className="w-4 h-4 mr-2" />
               Undo
             </Button>
           </motion.div>
         ) : (
           <AnimatePresence mode="popLayout">
             {visibleCards.map((card, index) => (
               <SwipeableCard
                 key={card.id}
                 index={index}
                 totalCards={visibleCards.length}
                 onSwipeLeft={() => handleSwipe("left")}
                 onSwipeRight={() => handleSwipe("right")}
                 onSwipeUp={() => handleSwipe("up")}
               >
                 {renderCard(card)}
               </SwipeableCard>
             ))}
           </AnimatePresence>
         )}
       </div>
 
       {/* Bottom controls */}
       <div className="flex items-center justify-center gap-4 mt-6">
         <Button
           variant="outline"
           size="icon"
           className="rounded-full h-12 w-12"
           onClick={() => handleSwipe("left")}
           disabled={currentCards.length === 0}
         >
           <ChevronLeft className="w-6 h-6" />
         </Button>
         
         <Button
           variant={isListening ? "default" : "outline"}
           size="icon"
           className={cn(
             "rounded-full h-14 w-14 transition-all",
             isListening && "animate-pulse bg-primary"
           )}
           onClick={toggleVoice}
         >
           {isListening ? (
             <Mic className="w-6 h-6" />
           ) : (
             <MicOff className="w-6 h-6" />
           )}
         </Button>
         
         <Button
           variant="outline"
           size="icon"
           className="rounded-full h-12 w-12"
           onClick={() => handleSwipe("right")}
           disabled={currentCards.length === 0}
         >
           <ChevronRight className="w-6 h-6" />
         </Button>
       </div>
 
       {/* Card counter */}
       <p className="text-xs text-muted-foreground mt-4">
         {removedCards.length} of {cards.length} reviewed
       </p>
 
       {/* Undo button */}
       {removedCards.length > 0 && currentCards.length > 0 && (
         <Button
           variant="ghost"
           size="sm"
           className="mt-2"
           onClick={handleUndo}
         >
           <RotateCcw className="w-4 h-4 mr-1" />
           Undo last
         </Button>
       )}
     </div>
   );
 };