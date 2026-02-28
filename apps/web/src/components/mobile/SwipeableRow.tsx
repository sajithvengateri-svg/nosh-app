import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { ReactNode, useRef } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, Trash2 } from "lucide-react";

interface SwipeableRowProps {
  children: ReactNode;
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  rightLabel?: string;
  leftLabel?: string;
  rightIcon?: ReactNode;
  leftIcon?: ReactNode;
  className?: string;
  disabled?: boolean;
}

export const SwipeableRow = ({
  children,
  onSwipeRight,
  onSwipeLeft,
  rightLabel = "Done",
  leftLabel = "Delete",
  rightIcon = <CheckCircle2 className="w-5 h-5" />,
  leftIcon = <Trash2 className="w-5 h-5" />,
  className,
  disabled = false,
}: SwipeableRowProps) => {
  const x = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Background reveal opacity
  const rightBgOpacity = useTransform(x, [0, 60, 100], [0, 0.5, 1]);
  const leftBgOpacity = useTransform(x, [-100, -60, 0], [1, 0.5, 0]);

  // Scale for icons
  const rightIconScale = useTransform(x, [0, 80, 120], [0.5, 1, 1.2]);
  const leftIconScale = useTransform(x, [-120, -80, 0], [1.2, 1, 0.5]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 80;

    if (info.offset.x > threshold && onSwipeRight) {
      onSwipeRight();
    } else if (info.offset.x < -threshold && onSwipeLeft) {
      onSwipeLeft();
    }
  };

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={containerRef} className={cn("relative overflow-hidden", className)}>
      {/* Right swipe background (complete) */}
      {onSwipeRight && (
        <motion.div
          className="absolute inset-0 flex items-center pl-5 bg-emerald-500/90 dark:bg-emerald-600/90"
          style={{ opacity: rightBgOpacity }}
        >
          <motion.div
            className="flex items-center gap-2 text-white font-semibold text-sm"
            style={{ scale: rightIconScale }}
          >
            {rightIcon}
            <span>{rightLabel}</span>
          </motion.div>
        </motion.div>
      )}

      {/* Left swipe background (delete/action) */}
      {onSwipeLeft && (
        <motion.div
          className="absolute inset-0 flex items-center justify-end pr-5 bg-destructive/90"
          style={{ opacity: leftBgOpacity }}
        >
          <motion.div
            className="flex items-center gap-2 text-white font-semibold text-sm"
            style={{ scale: leftIconScale }}
          >
            <span>{leftLabel}</span>
            {leftIcon}
          </motion.div>
        </motion.div>
      )}

      {/* Draggable content */}
      <motion.div
        style={{ x }}
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: onSwipeLeft ? -140 : 0, right: onSwipeRight ? 140 : 0 }}
        dragElastic={0.3}
        onDragEnd={handleDragEnd}
        className="relative bg-background touch-pan-y"
        whileTap={{ cursor: "grabbing" }}
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
      >
        {children}
      </motion.div>
    </div>
  );
};
