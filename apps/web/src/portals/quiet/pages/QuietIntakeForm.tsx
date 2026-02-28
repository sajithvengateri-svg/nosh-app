import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, CheckCircle2, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface Question {
  id: string;
  section: string;
  question: string;
  type: "select" | "number" | "slider" | "text";
  options?: { label: string; value: string }[];
  min?: number; max?: number; step?: number;
  hint?: string;
  module?: string;
}

const QUESTIONS: Question[] = [
  { id: "Q1", section: "Your Venue", question: "What type of venue do you operate?", type: "select",
    options: [
      { label: "Fine Dining", value: "fine_dining" }, { label: "Casual Dining", value: "casual_dining" },
      { label: "Café", value: "cafe" }, { label: "Bar / Pub", value: "bar_pub" }, { label: "Fast Casual", value: "fast_casual" },
    ]},
  { id: "Q2", section: "Your Venue", question: "How many seats does your venue have?", type: "number", min: 10, max: 500, hint: "Total capacity including outdoor" },
  { id: "Q3", section: "Your Venue", question: "How many days per week do you trade?", type: "select",
    options: [{ label: "5 days", value: "5" }, { label: "6 days", value: "6" }, { label: "7 days", value: "7" }] },
  { id: "Q4", section: "Your Venue", question: "How many services per day?", type: "select",
    options: [
      { label: "Lunch only", value: "lunch" }, { label: "Dinner only", value: "dinner" },
      { label: "Lunch + Dinner", value: "lunch_dinner" }, { label: "All day", value: "all_day" },
    ]},
  { id: "Q5", section: "Your Venue", question: "How long has the venue been operating?", type: "select",
    options: [
      { label: "< 6 months", value: "<6m" }, { label: "6-12 months", value: "6-12m" },
      { label: "1-2 years", value: "1-2y" }, { label: "2-5 years", value: "2-5y" }, { label: "5+ years", value: "5y+" },
    ]},
  { id: "Q6", section: "Revenue", question: "What's your approximate weekly revenue?", type: "number", min: 5000, max: 200000, hint: "Average casual dining: $25-45k/week", module: "OVERHEAD" },
  { id: "Q7", section: "Revenue", question: "What percentage of revenue comes from beverages?", type: "number", min: 0, max: 80, hint: "Restaurants: 25-35%. Bars: 60-80%.", module: "BEVERAGE" },
  { id: "Q9", section: "Revenue", question: "What's your average spend per head?", type: "number", min: 10, max: 300, hint: "Casual dining: $55-75. Fine dining: $120-180." },
  { id: "Q10", section: "Food & Beverage", question: "What is your food cost percentage?", type: "number", min: 15, max: 50, hint: "Food purchases ÷ food revenue", module: "FOOD" },
  { id: "Q11", section: "Food & Beverage", question: "How many food suppliers do you use regularly?", type: "select",
    options: [{ label: "1-2", value: "1" }, { label: "3-5", value: "4" }, { label: "6-10", value: "8" }, { label: "10+", value: "12" }], module: "FOOD" },
  { id: "Q13", section: "Food & Beverage", question: "How much food waste per week ($)?", type: "number", min: 0, max: 5000, hint: "Estimate including trim, spoilage, returns", module: "FOOD" },
  { id: "Q14", section: "Food & Beverage", question: "What is your beverage cost percentage?", type: "number", min: 10, max: 45, module: "BEVERAGE" },
  { id: "Q15", section: "Food & Beverage", question: "How often do you do a full stocktake?", type: "select",
    options: [{ label: "Weekly", value: "weekly" }, { label: "Fortnightly", value: "fortnightly" }, { label: "Monthly", value: "monthly" }, { label: "Rarely/Never", value: "rarely" }], module: "BEVERAGE" },
  { id: "Q16", section: "Labour", question: "How many staff do you employ? (total headcount)", type: "number", min: 1, max: 100, module: "LABOUR" },
  { id: "Q17", section: "Labour", question: "What's your weekly wages bill? (gross incl super)", type: "number", min: 1000, max: 100000, module: "LABOUR" },
  { id: "Q18", section: "Labour", question: "Average overtime hours per week?", type: "select",
    options: [{ label: "0", value: "0" }, { label: "1-5", value: "3" }, { label: "5-10", value: "7" }, { label: "10-20", value: "15" }, { label: "20+", value: "25" }], module: "LABOUR" },
  { id: "Q19", section: "Labour", question: "Do all casuals receive 25% casual loading?", type: "select",
    options: [{ label: "Yes", value: "yes" }, { label: "I think so", value: "maybe" }, { label: "Not sure", value: "unsure" }], module: "LABOUR" },
  { id: "Q21", section: "Labour", question: "What superannuation rate do you pay?", type: "select",
    options: [{ label: "12%", value: "12" }, { label: "11.5%", value: "11.5" }, { label: "11%", value: "11" }, { label: "Not sure", value: "unsure" }], module: "COMPLIANCE" },
  { id: "Q23", section: "Overheads", question: "What's your monthly rent (including outgoings)?", type: "number", min: 0, max: 50000, module: "OVERHEAD" },
  { id: "Q29", section: "Marketing", question: "How do you currently run marketing?", type: "select",
    options: [
      { label: "Regular campaigns", value: "regular" }, { label: "Social media only", value: "social" },
      { label: "Word of mouth", value: "wom" }, { label: "We don't", value: "none" },
    ], module: "MARKETING" },
  { id: "Q31", section: "Compliance", question: "Is your Liquor License current?", type: "select",
    options: [{ label: "Yes", value: "yes" }, { label: "Expired", value: "no" }, { label: "No alcohol", value: "na" }], module: "COMPLIANCE" },
  { id: "Q32", section: "Compliance", question: "Do you have a current Food Safety Supervisor certificate?", type: "select",
    options: [{ label: "Yes", value: "yes" }, { label: "Expired", value: "no" }, { label: "Not sure", value: "unsure" }], module: "COMPLIANCE" },
  { id: "Q34", section: "Compliance", question: "How far back do your payroll records go?", type: "select",
    options: [{ label: "7+ years", value: "7" }, { label: "5-7 years", value: "6" }, { label: "3-5 years", value: "4" }, { label: "< 3 years", value: "2" }], module: "COMPLIANCE" },
  { id: "Q35", section: "Compliance", question: "Do all staff have written employment contracts?", type: "select",
    options: [{ label: "Yes, all", value: "yes" }, { label: "Most", value: "most" }, { label: "Some", value: "some" }, { label: "No", value: "no" }], module: "COMPLIANCE" },
];

const QuietIntakeForm = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const total = QUESTIONS.length;
  const current = QUESTIONS[step];
  const progress = ((step + 1) / total) * 100;

  const setAnswer = useCallback((value: string) => {
    setAnswers(prev => ({ ...prev, [current.id]: value }));
  }, [current]);

  const next = () => { if (step < total - 1) setStep(step + 1); };
  const prev = () => { if (step > 0) setStep(step - 1); };
  const finish = () => navigate("/quiet/report");

  const currentAnswer = answers[current?.id] ?? "";
  const isLast = step === total - 1;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 max-w-[700px] mx-auto">
      {/* Progress */}
      <div className="w-full mb-8">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="text-[10px]">{current.section}</Badge>
          <span className="text-[10px] text-muted-foreground">{step + 1} of {total}</span>
        </div>
        <Progress value={progress} className="h-1.5 [&>div]:bg-indigo-500" />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.25 }} className="w-full">
          <h2 className="text-xl font-bold text-foreground mb-2">{current.question}</h2>
          {current.hint && (
            <p className="text-xs text-muted-foreground mb-6 flex items-center gap-1">
              <Info className="w-3 h-3" /> {current.hint}
            </p>
          )}

          {current.type === "select" && current.options && (
            <div className="grid grid-cols-1 gap-2">
              {current.options.map(opt => (
                <button key={opt.value}
                  onClick={() => { setAnswer(opt.value); if (!isLast) setTimeout(next, 300); }}
                  className={cn(
                    "p-4 rounded-lg border text-left text-sm transition-all",
                    currentAnswer === opt.value
                      ? "border-indigo-500 bg-indigo-500/10 text-foreground"
                      : "border-border hover:border-muted-foreground text-muted-foreground"
                  )}>
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {current.type === "number" && (
            <Input type="number" min={current.min} max={current.max} value={currentAnswer}
              onChange={e => setAnswer(e.target.value)}
              className="text-2xl font-mono h-16 text-center" placeholder="Enter a number" />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between w-full mt-8">
        <Button variant="ghost" onClick={prev} disabled={step === 0} className="gap-1">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        {isLast ? (
          <Button onClick={finish} className="gap-1 bg-indigo-600 hover:bg-indigo-700">
            <CheckCircle2 className="w-4 h-4" /> Generate Score
          </Button>
        ) : (
          <Button onClick={next} disabled={!currentAnswer} className="gap-1">
            Next <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default QuietIntakeForm;
