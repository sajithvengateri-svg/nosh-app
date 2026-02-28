import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Thermometer, Clock, AlertTriangle, GripVertical, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { RecipeCCP, CCPFormData, STEP_TYPE_CONFIG, CCPStepType, DANGER_ZONE, convertTemp } from '@/types/ccp';
import { CCPPointEditor } from './CCPPointEditor';

interface CCPTimelineEditorProps {
  ccps: RecipeCCP[];
  onAdd: (data: CCPFormData) => Promise<RecipeCCP | null>;
  onUpdate: (id: string, data: Partial<CCPFormData>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  haccpMode?: boolean;
  readOnly?: boolean;
}

export const CCPTimelineEditor = ({
  ccps,
  onAdd,
  onUpdate,
  onDelete,
  haccpMode = false,
  readOnly = false,
}: CCPTimelineEditorProps) => {
  const [selectedCCP, setSelectedCCP] = useState<RecipeCCP | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [addPosition, setAddPosition] = useState(50);
  const timelineRef = useRef<HTMLDivElement>(null);

  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (readOnly || isAdding) return;
    
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
    
    setAddPosition(position);
    setIsAdding(true);
  }, [readOnly, isAdding]);

  const handleAddCCP = async (data: CCPFormData) => {
    const result = await onAdd({ ...data, timeline_position: addPosition });
    if (result) {
      setIsAdding(false);
    }
  };

  const handleDragEnd = async (ccp: RecipeCCP, newPosition: number) => {
    await onUpdate(ccp.id, { timeline_position: newPosition });
  };

  // Group CCPs by their approximate position for collision detection
  const getYOffset = (ccp: RecipeCCP, index: number) => {
    const nearby = ccps.filter((c, i) => 
      i < index && Math.abs(c.timeline_position - ccp.timeline_position) < 12
    );
    return nearby.length * 60;
  };

  const isTempInDangerZone = (temp: number | null, unit: 'C' | 'F') => {
    if (temp === null) return false;
    const tempC = unit === 'F' ? convertTemp(temp, 'F', 'C') : temp;
    return tempC > DANGER_ZONE.min && tempC < DANGER_ZONE.max;
  };

  return (
    <div className="space-y-4">
      {/* Timeline Track */}
      <div className="relative">
        {/* Phase Labels */}
        <div className="flex justify-between text-xs text-muted-foreground mb-2 px-2">
          <span>Prep</span>
          <span>Cook</span>
          <span>Hold</span>
          <span>Serve</span>
        </div>

        {/* Main Timeline */}
        <div
          ref={timelineRef}
          className={cn(
            "relative h-32 rounded-xl overflow-hidden cursor-crosshair",
            "bg-gradient-to-r from-blue-500/10 via-orange-500/10 via-yellow-500/10 to-green-500/10",
            "border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 transition-colors",
            readOnly && "cursor-default"
          )}
          onClick={handleTimelineClick}
        >
          {/* Danger Zone Indicator */}
          <div className="absolute inset-y-0 left-[20%] right-[20%] bg-red-500/5 border-x border-red-500/20">
            <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[10px] text-red-500/60 whitespace-nowrap">
              ⚠️ Danger Zone (5-60°C)
            </span>
          </div>

          {/* Phase Dividers */}
          {[25, 50, 75].map((pos) => (
            <div
              key={pos}
              className="absolute top-0 bottom-0 w-px bg-muted-foreground/10"
              style={{ left: `${pos}%` }}
            />
          ))}

          {/* CCP Points */}
          <AnimatePresence>
            {ccps.map((ccp, index) => (
              <CCPPoint
                key={ccp.id}
                ccp={ccp}
                yOffset={getYOffset(ccp, index)}
                isSelected={selectedCCP?.id === ccp.id}
                isDanger={isTempInDangerZone(ccp.target_temp, ccp.temp_unit)}
                onClick={() => setSelectedCCP(selectedCCP?.id === ccp.id ? null : ccp)}
                onDragEnd={(pos) => handleDragEnd(ccp, pos)}
                readOnly={readOnly}
              />
            ))}
          </AnimatePresence>

          {/* Add Point Indicator */}
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20"
              style={{ left: `${addPosition}%` }}
            >
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg ring-4 ring-primary/20">
                <Plus className="w-4 h-4 text-primary-foreground" />
              </div>
            </motion.div>
          )}

          {/* Empty State */}
          {ccps.length === 0 && !isAdding && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <span className="text-sm">Click anywhere to add a control point</span>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            {ccps.filter(c => c.is_critical).length} Critical
          </span>
          <span className="flex items-center gap-1">
            <Thermometer className="w-3 h-3" />
            {ccps.filter(c => c.target_temp !== null).length} Temp Checks
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {ccps.filter(c => c.time_limit !== null).length} Time Limits
          </span>
        </div>
      </div>

      {/* Editor Panel */}
      <AnimatePresence mode="wait">
        {(isAdding || selectedCCP) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <CCPPointEditor
              ccp={selectedCCP}
              haccpMode={haccpMode}
              onSave={async (data) => {
                if (selectedCCP) {
                  await onUpdate(selectedCCP.id, data);
                  setSelectedCCP(null);
                } else {
                  await handleAddCCP(data);
                }
              }}
              onDelete={selectedCCP ? async () => {
                await onDelete(selectedCCP.id);
                setSelectedCCP(null);
              } : undefined}
              onCancel={() => {
                setSelectedCCP(null);
                setIsAdding(false);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Individual CCP Point Component
interface CCPPointProps {
  ccp: RecipeCCP;
  yOffset: number;
  isSelected: boolean;
  isDanger: boolean;
  onClick: () => void;
  onDragEnd: (position: number) => void;
  readOnly: boolean;
}

const CCPPoint = ({ ccp, yOffset, isSelected, isDanger, onClick, onDragEnd, readOnly }: CCPPointProps) => {
  const config = STEP_TYPE_CONFIG[ccp.step_type];
  const constraintsRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        y: yOffset,
      }}
      exit={{ opacity: 0, scale: 0 }}
      drag={!readOnly ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0}
      onDragEnd={(_, info) => {
        const parent = constraintsRef.current?.parentElement;
        if (!parent) return;
        const rect = parent.getBoundingClientRect();
        const newPos = Math.max(0, Math.min(100, ((ccp.timeline_position / 100) * rect.width + info.offset.x) / rect.width * 100));
        onDragEnd(newPos);
      }}
      className={cn(
        "absolute top-4 -translate-x-1/2 z-10 cursor-pointer",
        isSelected && "z-20"
      )}
      style={{ left: `${ccp.timeline_position}%` }}
      ref={constraintsRef}
    >
      <div
        onClick={onClick}
        className={cn(
          "relative group",
          !readOnly && "cursor-grab active:cursor-grabbing"
        )}
      >
        {/* Connection Line */}
        <div className={cn(
          "absolute left-1/2 -translate-x-1/2 w-0.5 h-8 -top-8",
          ccp.is_critical ? "bg-red-500" : "bg-muted-foreground/30"
        )} />

        {/* Main Point */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "relative w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all",
            config.color,
            isSelected && "ring-4 ring-primary",
            isDanger && !ccp.is_critical && "ring-2 ring-yellow-500",
            ccp.is_critical && "ring-2 ring-red-500 animate-pulse"
          )}
        >
          <span className="text-lg">{config.icon}</span>
          
          {/* Critical Badge */}
          {ccp.is_critical && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </motion.div>

        {/* Tooltip */}
        <div className={cn(
          "absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none",
          "bg-popover text-popover-foreground rounded-lg shadow-xl p-2 min-w-[120px] text-center z-30"
        )}>
          <p className="font-medium text-sm truncate">{ccp.step_name}</p>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-1">
            {ccp.target_temp !== null && (
              <span className={cn(isDanger && "text-yellow-500")}>
                {ccp.target_temp}°{ccp.temp_unit}
              </span>
            )}
            {ccp.time_limit !== null && (
              <span>{ccp.time_limit}m</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
