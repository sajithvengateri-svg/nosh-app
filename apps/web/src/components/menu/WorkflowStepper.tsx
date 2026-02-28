import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WorkflowStage } from "@/lib/shared/types/menu.types";

const STAGES: { key: WorkflowStage; label: string; actionLabel: string }[] = [
  { key: "input", label: "Input", actionLabel: "Mark Saved" },
  { key: "saved", label: "Saved", actionLabel: "Approve" },
  { key: "approved", label: "Approved", actionLabel: "Add Sales" },
  { key: "sales_added", label: "Sales Added", actionLabel: "Analyse" },
  { key: "analysed", label: "Analysed", actionLabel: "Take Action" },
  { key: "acted", label: "Acted", actionLabel: "Archive" },
  { key: "archived", label: "Archived", actionLabel: "" },
];

interface WorkflowStepperProps {
  currentStage: WorkflowStage;
  onAdvance: (nextStage: WorkflowStage) => void;
}

export default function WorkflowStepper({ currentStage, onAdvance }: WorkflowStepperProps) {
  const currentIndex = STAGES.findIndex((s) => s.key === currentStage);
  const nextStage = currentIndex < STAGES.length - 1 ? STAGES[currentIndex + 1] : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-0.5">
        {STAGES.map((stage, i) => {
          const isCompleted = i < currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <div key={stage.key} className="flex items-center flex-1 min-w-0">
              <div
                className={cn(
                  "flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold shrink-0",
                  isCompleted && "bg-success text-white",
                  isCurrent && "bg-primary text-primary-foreground",
                  !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-[10px] ml-1 truncate hidden sm:inline",
                  isCurrent ? "font-semibold text-foreground" : "text-muted-foreground"
                )}
              >
                {stage.label}
              </span>
              {i < STAGES.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-1 min-w-2",
                    i < currentIndex ? "bg-success" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      {nextStage && nextStage.key !== "archived" && (
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onAdvance(nextStage.key)}>
          {STAGES[currentIndex].actionLabel}
        </Button>
      )}
    </div>
  );
}
