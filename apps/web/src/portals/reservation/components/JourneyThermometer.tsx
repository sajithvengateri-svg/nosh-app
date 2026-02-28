import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Thermometer } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";

interface JourneyThermometerProps {
  reservations: any[];
  onStageClick?: (stage: string) => void;
}

const STAGES = [
  { key: "reserved", label: "Reserved", dbStatus: "CONFIRMED", color: "bg-blue-500", activeColor: "bg-blue-500" },
  { key: "seated", label: "Seated", dbStatus: "SEATED", color: "bg-red-500", activeColor: "bg-red-500" },
  { key: "bill", label: "Bill", dbStatus: "BILL", color: "bg-amber-400", activeColor: "bg-amber-400" },
  { key: "left", label: "Left", dbStatus: "COMPLETED", color: "bg-muted-foreground", activeColor: "bg-muted-foreground" },
] as const;

function DroppableStage({ stage, count, index, hasActivity, onStageClick }: {
  stage: typeof STAGES[number];
  count: number;
  index: number;
  hasActivity: boolean;
  onStageClick?: (stage: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `stage-${stage.key}` });
  const isFirst = index === 0;
  const isLast = index === STAGES.length - 1;

  return (
    <motion.button
      ref={setNodeRef}
      onClick={() => onStageClick?.(stage.key)}
      className={`relative flex items-center justify-center text-xs font-bold transition-all
        ${isFirst ? "rounded-l-full" : ""} ${isLast ? "rounded-r-full" : ""}
        ${hasActivity ? `${stage.activeColor} text-white` : "bg-muted text-muted-foreground"}
        ${isOver ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105 brightness-110" : ""}
        ${onStageClick ? "cursor-pointer hover:opacity-90 active:scale-[0.98]" : ""}`}
      initial={{ opacity: 0, scaleX: 0.8 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <span className="text-[11px] font-semibold">{count > 0 ? count : "–"}</span>
      {isOver && (
        <motion.div
          className="absolute inset-0 rounded-[inherit] bg-white/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
        />
      )}
    </motion.button>
  );
}

const JourneyThermometer = ({ reservations, onStageClick }: JourneyThermometerProps) => {
  const counts = useMemo(() => {
    let reserved = 0, seated = 0, bill = 0, left = 0;
    for (const r of reservations) {
      if (r.status === "CONFIRMED") reserved++;
      else if (r.status === "SEATED") {
        if (r.notes?.includes("[BILL_DROPPED]")) bill++;
        else seated++;
      } else if (r.status === "COMPLETED") left++;
    }
    return { reserved, seated, bill, left };
  }, [reservations]);

  const total = reservations.length;
  const values = [counts.reserved, counts.seated, counts.bill, counts.left];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-primary" /> Customer Journey
          <span className="text-[10px] font-normal text-muted-foreground ml-auto">
            Drag reservation or table here
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="grid grid-cols-4 gap-1 h-10">
            {STAGES.map((stage, i) => (
              <DroppableStage
                key={stage.key}
                stage={stage}
                count={0}
                index={i}
                hasActivity={false}
                onStageClick={onStageClick}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-1 h-10">
            {STAGES.map((stage, i) => (
              <DroppableStage
                key={stage.key}
                stage={stage}
                count={values[i]}
                index={i}
                hasActivity={values[i] > 0}
                onStageClick={onStageClick}
              />
            ))}
          </div>
        )}
        <div className="grid grid-cols-4 mt-2">
          {STAGES.map((stage, i) => (
            <div key={stage.key} className="flex flex-col items-center gap-0.5 text-[10px]">
              <span className={`w-2.5 h-2.5 rounded-full ${values[i] > 0 ? stage.activeColor : "bg-muted"}`} />
              <span className="text-muted-foreground">{stage.label}</span>
              <span className="font-semibold">{values[i]}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export { STAGES };
export default JourneyThermometer;
