import { useState, useRef, useCallback, ReactNode } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh?: () => Promise<void>;
}

const PULL_THRESHOLD = 72;

const PullToRefresh = ({ children, onRefresh }: PullToRefreshProps) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isRefreshing) return;
    if (containerRef.current && containerRef.current.scrollTop > 0) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    if (diff > 0 && startY.current > 0) {
      const resistance = Math.min(diff * 0.35, PULL_THRESHOLD + 16);
      setPullDistance(resistance);
    }
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      
      if (onRefresh) {
        await onRefresh();
      } else {
        window.location.reload();
      }
      
      setIsRefreshing(false);
    }
    
    setPullDistance(0);
    startY.current = 0;
  }, [pullDistance, isRefreshing, onRefresh]);

  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);

  return (
    <div 
      ref={containerRef}
      className="h-full overflow-auto overscroll-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator — circular spinner like native iOS */}
      <motion.div
        className="flex items-center justify-center overflow-hidden"
        style={{ height: pullDistance }}
      >
        <motion.div
          className="w-8 h-8 rounded-full border-2 border-primary/30 flex items-center justify-center"
          style={{ 
            opacity: progress,
            scale: 0.6 + progress * 0.4,
            borderColor: progress >= 1 ? 'hsl(var(--primary))' : undefined,
          }}
        >
          <RefreshCw 
            className={`h-4 w-4 text-primary ${isRefreshing ? 'animate-spin' : ''}`}
            style={{ 
              transform: isRefreshing ? undefined : `rotate(${progress * 270}deg)` 
            }}
          />
        </motion.div>
      </motion.div>
      
      {children}
    </div>
  );
};

export default PullToRefresh;
