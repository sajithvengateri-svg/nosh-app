import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  CheckCircle2, Circle, SkipForward, ChevronDown, ChevronRight,
  GraduationCap, X,
} from "lucide-react";
import { useInduction } from "@/hooks/useInduction";
import { useState } from "react";

const InductionTracker = () => {
  const {
    steps, currentDay, percent, completedCount, totalSteps,
    todayStep, skipStep, disable, isEnabled,
  } = useInduction();

  const [week1Open, setWeek1Open] = useState(currentDay <= 7);
  const [week2Open, setWeek2Open] = useState(currentDay > 7);

  if (!isEnabled || percent === 100) return null;

  const week1 = steps.filter(s => s.week === 1);
  const week2 = steps.filter(s => s.week === 2);
  const week1Done = week1.filter(s => s.done).length;
  const week2Done = week2.filter(s => s.done).length;

  const renderStep = (step: typeof steps[0]) => (
    <Link
      key={step.key}
      to={step.href}
      className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors group ${
        step.done ? "text-muted-foreground" : step.day === currentDay ? "bg-primary/5 border border-primary/20" : "hover:bg-muted/50"
      }`}
    >
      {step.done ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
      ) : (
        <Circle className="w-5 h-5 text-muted-foreground/40 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">Day {step.day}</span>
          {step.day === currentDay && !step.done && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">Today</span>
          )}
        </div>
        <span className={`text-sm block ${step.done ? "line-through" : "font-medium"}`}>
          {step.label}
        </span>
        <span className="text-xs text-muted-foreground">{step.description}</span>
      </div>
      {!step.done && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); skipStep(step.key); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
          title="Skip this step"
        >
          <SkipForward className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      )}
    </Link>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            Induction Guide
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-primary">{percent}%</span>
            <button onClick={disable} className="p-1 hover:bg-muted rounded" title="Dismiss induction">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Day {currentDay} of 14 — {todayStep?.label || "Keep going!"}
        </p>
        <Progress value={percent} className="h-2 mt-2" />
        <p className="text-xs text-muted-foreground mt-1">{completedCount} of {totalSteps} completed</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Week 1 */}
        <Collapsible open={week1Open} onOpenChange={setWeek1Open}>
          <CollapsibleTrigger className="flex items-center gap-2 w-full text-left p-2 hover:bg-muted/50 rounded-lg">
            {week1Open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <span className="text-sm font-semibold">Week 1: Foundation</span>
            <span className="text-xs text-muted-foreground ml-auto">{week1Done}/{week1.length}</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 mt-1">
            {week1.map(renderStep)}
          </CollapsibleContent>
        </Collapsible>

        {/* Week 2 */}
        <Collapsible open={week2Open} onOpenChange={setWeek2Open}>
          <CollapsibleTrigger className="flex items-center gap-2 w-full text-left p-2 hover:bg-muted/50 rounded-lg">
            {week2Open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <span className="text-sm font-semibold">Week 2: Advanced</span>
            <span className="text-xs text-muted-foreground ml-auto">{week2Done}/{week2.length}</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 mt-1">
            {week2.map(renderStep)}
          </CollapsibleContent>
        </Collapsible>

        <Button variant="ghost" size="sm" className="w-full mt-3 text-muted-foreground" onClick={disable}>
          I'm done, turn off induction
        </Button>
      </CardContent>
    </Card>
  );
};

export default InductionTracker;
