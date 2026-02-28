import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { CheckCircle, ChevronRight, BookOpen, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import TrainingChatBubble from "@/components/training/TrainingChatBubble";

const RSA_SECTIONS = [
  { id: "intoxication", title: "Signs of Intoxication", content: "Learn to identify physical & behavioural signs: slurred speech, unsteady gait, aggression, drowsiness, loss of coordination. Under Australian RSA laws you must refuse service to any intoxicated patron.", quiz: { q: "Which is NOT a sign of intoxication?", options: ["Slurred speech", "Reading a menu", "Unsteady gait", "Aggression"], answer: 1 } },
  { id: "refusal", title: "Refusal Techniques", content: "Use the CARE method: Calm approach, Advise the patron, Reason clearly, Exit the conversation. Never be confrontational. Offer alternatives like water or food. Document all refusals.", quiz: { q: "What does the 'A' in CARE stand for?", options: ["Approach", "Advise", "Assist", "Avoid"], answer: 1 } },
  { id: "id_checks", title: "ID Verification", content: "Acceptable IDs: Australian driver's licence, passport, Proof of Age card, foreign passport. Check photo, date of birth, expiry, hologram and feel for tampering. If in doubt, refuse entry.", quiz: { q: "Which is an acceptable form of ID?", options: ["Student card", "Medicare card", "Proof of Age card", "Library card"], answer: 2 } },
  { id: "legal", title: "Legal Obligations", content: "Licensees and staff face personal fines up to $11,000 and/or imprisonment for serving intoxicated persons. Venues can lose their liquor licence. You have a Duty of Care to all patrons.", quiz: { q: "What is the maximum personal fine for serving an intoxicated person?", options: ["$1,000", "$5,000", "$11,000", "$20,000"], answer: 2 } },
  { id: "incidents", title: "Incident Reporting", content: "Document all incidents in the venue's incident register including: date/time, description, staff involved, patron details, actions taken, and outcome. Report serious incidents to police and your manager immediately.", quiz: { q: "What should be recorded in an incident report?", options: ["Only the patron's name", "Date, description, actions taken", "Nothing if resolved", "Only if police attend"], answer: 1 } },
  { id: "penalties", title: "Penalties & Consequences", content: "Penalties include: personal fines, criminal charges, licence suspension/cancellation, civil liability for injuries, loss of employment. Both individuals AND the venue are liable.", quiz: { q: "Who can be held liable for RSA breaches?", options: ["Only the venue", "Only the staff member", "Both individuals and venue", "Only management"], answer: 2 } },
];

const FOOD_SAFETY_SECTIONS = [
  { id: "temp", title: "Temperature Danger Zone", content: "The danger zone is 5°C–60°C where bacteria multiply rapidly. Hot food must be held above 60°C, cold food below 5°C. The 2-hour/4-hour rule: food in the zone under 2hrs can be refrigerated; 2-4hrs must be used immediately; over 4hrs must be discarded.", quiz: { q: "What is the temperature danger zone?", options: ["0°C–50°C", "5°C–60°C", "10°C–70°C", "0°C–100°C"], answer: 1 } },
  { id: "cross", title: "Cross-Contamination", content: "Prevent by: separate cutting boards for raw/cooked, wash hands between tasks, store raw meat below cooked food, use separate utensils, clean and sanitise surfaces between tasks.", quiz: { q: "Where should raw meat be stored in a fridge?", options: ["Top shelf", "Next to cooked food", "Below cooked food", "Outside the fridge"], answer: 2 } },
  { id: "allergens", title: "Allergen Management", content: "Australia's 10 major allergens: peanuts, tree nuts, milk, eggs, wheat, soy, fish, shellfish, sesame, lupin. Always check labels, communicate with kitchen, never guess. Anaphylaxis can be fatal.", quiz: { q: "How many major allergens are recognised in Australia?", options: ["5", "8", "10", "14"], answer: 2 } },
  { id: "hygiene", title: "Personal Hygiene", content: "Wash hands: before handling food, after touching raw food, after using the toilet, after touching face/hair, after handling waste. Wear clean uniform, tie back hair, cover cuts with blue waterproof bandages.", quiz: { q: "When should you wash your hands?", options: ["Only before shift", "Before and after handling food", "Only when visibly dirty", "Once per hour"], answer: 1 } },
  { id: "haccp", title: "HACCP Principles", content: "7 principles: Hazard analysis, Critical Control Points, Critical Limits, Monitoring, Corrective Actions, Verification, Record Keeping. HACCP is a systematic approach to food safety management.", quiz: { q: "How many HACCP principles are there?", options: ["3", "5", "7", "10"], answer: 2 } },
];

const PublicTrainingWidget = () => {
  const { orgSlug, type } = useParams<{ orgSlug: string; type: string }>();
  const isRSA = type === "rsa";
  const sections = isRSA ? RSA_SECTIONS : FOOD_SAFETY_SECTIONS;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const [finished, setFinished] = useState(false);
  const [orgName, setOrgName] = useState("");

  useEffect(() => {
    if (!orgSlug) return;
    supabase.from("organizations").select("name, slug").eq("slug", orgSlug).maybeSingle()
      .then(({ data }) => { if (data) setOrgName(data.name); });
  }, [orgSlug]);

  const section = sections[currentIdx];
  const progress = (completed.size / sections.length) * 100;
  const allDone = completed.size === sections.length;

  const handleQuizSubmit = () => {
    setQuizSubmitted(true);
    if (quizAnswer === section.quiz.answer) {
      setCompleted(prev => new Set(prev).add(section.id));
    }
  };

  const nextSection = () => {
    setQuizAnswer(null);
    setQuizSubmitted(false);
    if (currentIdx < sections.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handleFinish = async () => {
    if (!email.trim() || !orgSlug) return;
    // Look up org_id from slug
    const { data: org } = await supabase.from("organizations").select("id").eq("slug", orgSlug).maybeSingle();
    if (org) {
      await supabase.from("training_completions").insert({
        org_id: org.id,
        user_email: email,
        training_type: isRSA ? "rsa" : "food_safety",
        sections_completed: Array.from(completed),
        quiz_score: Math.round((completed.size / sections.length) * 100),
        completed_at: new Date().toISOString(),
      });
    }
    setFinished(true);
  };

  if (finished) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <Award className="w-16 h-16 text-primary mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Training Complete!</h1>
            <p className="text-muted-foreground">You've completed the {isRSA ? "RSA" : "Food Safety"} training.</p>
            <p className="text-sm text-muted-foreground">Completed: {new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
            <Badge variant="default" className="text-sm">Score: {Math.round((completed.size / sections.length) * 100)}%</Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">{isRSA ? "RSA Training" : "Food Safety Training"}</h1>
            {orgName && <p className="text-xs text-muted-foreground">{orgName}</p>}
          </div>
          <Badge variant="outline"><BookOpen className="w-3 h-3 mr-1" />{completed.size}/{sections.length}</Badge>
        </div>
      </div>

      {/* Progress */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground mt-1">{Math.round(progress)}% complete</p>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {!allDone ? (
          <>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant={completed.has(section.id) ? "default" : "secondary"} className="text-xs">
                    {currentIdx + 1}/{sections.length}
                  </Badge>
                  {completed.has(section.id) && <CheckCircle className="w-4 h-4 text-green-600" />}
                </div>
                <h2 className="text-xl font-bold text-foreground">{section.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{section.content}</p>
              </CardContent>
            </Card>

            {/* Quiz */}
            <Card>
              <CardContent className="pt-4 space-y-3">
                <p className="text-sm font-semibold text-foreground">{section.quiz.q}</p>
                <div className="space-y-2">
                  {section.quiz.options.map((opt, i) => (
                    <button key={i} onClick={() => !quizSubmitted && setQuizAnswer(i)}
                      className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-colors ${
                        quizSubmitted && i === section.quiz.answer ? "border-green-600 bg-green-600/10 text-green-700" :
                        quizSubmitted && i === quizAnswer && i !== section.quiz.answer ? "border-destructive bg-destructive/10 text-destructive" :
                        quizAnswer === i ? "border-primary bg-primary/5 text-foreground" : "border-border text-foreground hover:bg-muted"
                      }`}
                    >{opt}</button>
                  ))}
                </div>
                <div className="flex gap-2">
                  {!quizSubmitted ? (
                    <Button size="sm" disabled={quizAnswer === null} onClick={handleQuizSubmit}>Check Answer</Button>
                  ) : (
                    <Button size="sm" onClick={nextSection}>
                      {currentIdx < sections.length - 1 ? <>Next <ChevronRight className="w-4 h-4 ml-1" /></> : "Review"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Section nav */}
            <div className="flex gap-1 flex-wrap">
              {sections.map((s, i) => (
                <button key={s.id} onClick={() => { setCurrentIdx(i); setQuizAnswer(null); setQuizSubmitted(false); }}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                    i === currentIdx ? "bg-primary text-primary-foreground" :
                    completed.has(s.id) ? "bg-green-600/10 text-green-600 border border-green-600/30" :
                    "bg-muted text-muted-foreground"
                  }`}
                >{i + 1}</button>
              ))}
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
              <h2 className="text-xl font-bold text-foreground text-center">All Sections Complete!</h2>
              <p className="text-sm text-muted-foreground text-center">Enter your email to record your completion.</p>
              <Input placeholder="your.email@example.com" value={email} onChange={e => setEmail(e.target.value)} type="email" />
              <Button className="w-full" onClick={handleFinish} disabled={!email.trim()}>Submit & Complete Training</Button>
            </CardContent>
          </Card>
        )}
      </div>

      <TrainingChatBubble trainingType={isRSA ? "rsa" : "food_safety"} orgSlug={orgSlug || ""} />
    </div>
  );
};

export default PublicTrainingWidget;
