import { motion } from 'framer-motion';
import { Thermometer, Clock, AlertTriangle, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RecipeCCP, STEP_TYPE_CONFIG, DANGER_ZONE, convertTemp } from '@/types/ccp';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CCPMiniTimelineProps {
  ccps: RecipeCCP[];
  onClick?: () => void;
  className?: string;
}

export const CCPMiniTimeline = ({ ccps, onClick, className }: CCPMiniTimelineProps) => {
  if (ccps.length === 0) {
    return (
      <div 
        className={cn(
          "flex items-center gap-2 text-xs text-muted-foreground py-2 cursor-pointer hover:text-primary transition-colors",
          className
        )}
        onClick={onClick}
      >
        <Shield className="w-3 h-3" />
        <span>Add control points</span>
      </div>
    );
  }

  const criticalCount = ccps.filter(c => c.is_critical).length;
  const tempCount = ccps.filter(c => c.target_temp !== null).length;
  const timeCount = ccps.filter(c => c.time_limit !== null).length;

  const isTempInDangerZone = (temp: number | null, unit: 'C' | 'F') => {
    if (temp === null) return false;
    const tempC = unit === 'F' ? convertTemp(temp, 'F', 'C') : temp;
    return tempC > DANGER_ZONE.min && tempC < DANGER_ZONE.max;
  };

  return (
    <TooltipProvider>
      <div 
        className={cn(
          "relative cursor-pointer group",
          className
        )}
        onClick={onClick}
      >
        {/* Mini Timeline Track */}
        <div className="relative h-6 rounded-full overflow-hidden bg-gradient-to-r from-blue-500/20 via-orange-500/20 via-yellow-500/20 to-green-500/20">
          {/* CCP Dots */}
          {ccps.slice(0, 8).map((ccp, index) => {
            const config = STEP_TYPE_CONFIG[ccp.step_type];
            const isDanger = isTempInDangerZone(ccp.target_temp, ccp.temp_unit);
            
            return (
              <Tooltip key={ccp.id}>
                <TooltipTrigger asChild>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full flex items-center justify-center text-[8px]",
                      config.color,
                      ccp.is_critical && "ring-2 ring-red-500",
                      isDanger && !ccp.is_critical && "ring-1 ring-yellow-500"
                    )}
                    style={{ left: `${ccp.timeline_position}%` }}
                  >
                    {ccp.is_critical && (
                      <AlertTriangle className="w-2 h-2 text-white" />
                    )}
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <p className="font-medium">{ccp.step_name}</p>
                  <div className="flex gap-2 text-muted-foreground">
                    {ccp.target_temp !== null && (
                      <span>{ccp.target_temp}°{ccp.temp_unit}</span>
                    )}
                    {ccp.time_limit !== null && (
                      <span>{ccp.time_limit}m</span>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
          
          {ccps.length > 8 && (
            <div className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
              +{ccps.length - 8}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
          {criticalCount > 0 && (
            <span className="flex items-center gap-0.5 text-red-500">
              <AlertTriangle className="w-2.5 h-2.5" />
              {criticalCount}
            </span>
          )}
          {tempCount > 0 && (
            <span className="flex items-center gap-0.5">
              <Thermometer className="w-2.5 h-2.5" />
              {tempCount}
            </span>
          )}
          {timeCount > 0 && (
            <span className="flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" />
              {timeCount}
            </span>
          )}
        </div>

        {/* Hover Hint */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 rounded-lg">
          <span className="text-xs text-primary font-medium">View CCPs</span>
        </div>
      </div>
    </TooltipProvider>
  );
};
