 import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
 import { ReactNode, useState } from "react";
 import { cn } from "@/lib/utils";
 
 interface SwipeableCardProps {
   children: ReactNode;
   onSwipeLeft?: () => void;
   onSwipeRight?: () => void;
   onSwipeUp?: () => void;
   className?: string;
   index: number;
   totalCards: number;
 }
 
 export const SwipeableCard = ({
   children,
   onSwipeLeft,
   onSwipeRight,
   onSwipeUp,
   className,
   index,
   totalCards,
 }: SwipeableCardProps) => {
   const [exitX, setExitX] = useState(0);
   const [exitY, setExitY] = useState(0);
   
   const x = useMotionValue(0);
   const y = useMotionValue(0);
   
   // Rotation based on drag
   const rotate = useTransform(x, [-200, 200], [-15, 15]);
   
   // Opacity indicators for swipe direction
   const leftIndicatorOpacity = useTransform(x, [-100, -20], [1, 0]);
   const rightIndicatorOpacity = useTransform(x, [20, 100], [0, 1]);
   const upIndicatorOpacity = useTransform(y, [-100, -20], [1, 0]);
   
   // Scale based on card position in stack
   const stackScale = 1 - index * 0.03;
   const stackY = index * 8;
   
   const handleDragEnd = (_: any, info: PanInfo) => {
     const threshold = 100;
     const velocity = 500;
     
     if (info.offset.y < -threshold || info.velocity.y < -velocity) {
       setExitY(-800);
       onSwipeUp?.();
     } else if (info.offset.x > threshold || info.velocity.x > velocity) {
       setExitX(500);
       onSwipeRight?.();
     } else if (info.offset.x < -threshold || info.velocity.x < -velocity) {
       setExitX(-500);
       onSwipeLeft?.();
     }
   };
 
   return (
     <motion.div
       className={cn(
         "absolute w-full cursor-grab active:cursor-grabbing touch-none",
         className
       )}
       style={{
         x,
         y,
         rotate,
         scale: stackScale,
         zIndex: totalCards - index,
       }}
       initial={{ 
         scale: stackScale, 
         y: stackY,
         opacity: index < 3 ? 1 : 0 
       }}
       animate={{ 
         scale: stackScale, 
         y: stackY,
         opacity: index < 3 ? 1 : 0 
       }}
       exit={{ 
         x: exitX, 
         y: exitY,
         opacity: 0,
         transition: { duration: 0.3, ease: "easeOut" }
       }}
       drag={index === 0}
       dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
       dragElastic={0.9}
       onDragEnd={handleDragEnd}
       whileDrag={{ scale: 1.02 }}
       transition={{ type: "spring", stiffness: 300, damping: 25 }}
     >
       {/* Left swipe indicator */}
       <motion.div
         className="absolute inset-0 rounded-2xl border-4 border-destructive bg-destructive/10 flex items-center justify-center pointer-events-none z-10"
         style={{ opacity: leftIndicatorOpacity }}
       >
         <span className="text-destructive font-bold text-xl rotate-[-15deg]">
           SKIP
         </span>
       </motion.div>
       
       {/* Right swipe indicator */}
       <motion.div
         className="absolute inset-0 rounded-2xl border-4 border-accent bg-accent/10 flex items-center justify-center pointer-events-none z-10"
         style={{ opacity: rightIndicatorOpacity }}
       >
         <span className="text-accent font-bold text-xl rotate-[15deg]">
           ACTION
         </span>
       </motion.div>
       
       {/* Up swipe indicator */}
       <motion.div
         className="absolute inset-0 rounded-2xl border-4 border-primary bg-primary/10 flex items-center justify-center pointer-events-none z-10"
         style={{ opacity: upIndicatorOpacity }}
       >
         <span className="text-primary font-bold text-xl">
           DETAILS
         </span>
       </motion.div>
       
       {children}
     </motion.div>
   );
 };