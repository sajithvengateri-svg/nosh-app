import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ChevronLeft, ChevronRight, Volume2, VolumeX,
  CheckCircle2, XCircle, Award, ArrowLeft, Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useTraining, type TrainingCard, type QuizQuestion } from "@/hooks/useTraining";
import AppLayout from "@/components/layout/AppLayout";
import TrainingChatBubble from "@/components/training/TrainingChatBubble";

type Phase = "cards" | "quiz" | "results";
type Direction = "left" | "right";

interface QuizAnswer {
  questionId: string;
  selectedIndex: number;
  correct: boolean;
}

const cardVariants = {
  enter: (dir: Direction) => ({ x: dir === "left" ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: Direction) => ({ x: dir === "left" ? -300 : 300, opacity: 0 }),
};

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -24 },
};

function getGrade(pct: number) {
  if (pct >= 95) return "A+";
  if (pct >= 85) return "A";
  if (pct >= 75) return "B";
  if (pct >= 65) return "C";
  if (pct >= 50) return "D";
  return "F";
}

function gradeColor(grade: string) {
  if (grade.startsWith("A")) return "text-green-600";
  if (grade === "B") return "text-blue-600";
  if (grade === "C") return "text-yellow-600";
  return "text-red-600";
}

const OPTION_LABELS = ["A", "B", "C", "D"];

const TrainingPlayer = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const { module, cards, questions, isLoading, updateProgress, submitQuiz } =
    useTraining(moduleId!);

  const [phase, setPhase] = useState<Phase>("cards");
  const [cardIndex, setCardIndex] = useState(0);
  const [direction, setDirection] = useState<Direction>("left");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);

  const totalCards = cards.length;
  const currentCard: TrainingCard | undefined = cards[cardIndex];
  const currentQuestion: QuizQuestion | undefined = questions[quizIndex];
  const hasQuiz = questions.length > 0;

  // Speech synthesis
  const speak = useCallback((text: string) => {
    if (!voiceEnabled) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  }, [voiceEnabled]);

  useEffect(() => () => speechSynthesis.cancel(), []);
  useEffect(() => { if (!voiceEnabled) speechSynthesis.cancel(); }, [voiceEnabled]);
  useEffect(() => {
    if (phase === "cards" && currentCard) speak(currentCard.content);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardIndex, phase, voiceEnabled]);

  // Card navigation
  const goNext = useCallback(() => {
    if (cardIndex < totalCards - 1) {
      setDirection("left");
      const next = cardIndex + 1;
      setCardIndex(next);
      updateProgress.mutate({
        materialId: moduleId!,
        cardsCompleted: cards.slice(0, next + 1).map((c) => c.id),
        lastCardIndex: next,
      });
    } else if (hasQuiz) {
      speechSynthesis.cancel();
      setPhase("quiz");
    } else {
      updateProgress.mutate({
        materialId: moduleId!,
        cardsCompleted: cards.map((c) => c.id),
        lastCardIndex: totalCards,
      });
      navigate("/training");
    }
  }, [cardIndex, totalCards, hasQuiz, navigate, updateProgress, moduleId, cards]);

  const goBack = useCallback(() => {
    if (cardIndex > 0) {
      setDirection("right");
      const prev = cardIndex - 1;
      setCardIndex(prev);
      updateProgress.mutate({
        materialId: moduleId!,
        cardsCompleted: cards.slice(0, prev + 1).map((c) => c.id),
        lastCardIndex: prev,
      });
    }
  }, [cardIndex, updateProgress, moduleId, cards]);

  // Quiz handlers
  const handleOptionSelect = (optIndex: number) => {
    if (showExplanation || !currentQuestion) return;
    const correct = optIndex === currentQuestion.correct_index;
    setSelectedOption(optIndex);
    setShowExplanation(true);
    setAnswers((prev) => [
      ...prev,
      { questionId: currentQuestion.id, selectedIndex: optIndex, correct },
    ]);
  };

  const handleNextQuestion = () => {
    if (quizIndex < questions.length - 1) {
      setQuizIndex((q) => q + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      const totalCorrect = answers.filter((a) => a.correct).length;
      const score = Math.round((totalCorrect / questions.length) * 100);
      submitQuiz.mutate({
        materialId: moduleId!,
        answers: answers.map((a) => ({
          question_id: a.questionId,
          selected_index: a.selectedIndex,
          correct: a.correct,
        })),
        score,
      });
      setPhase("results");
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-muted-foreground">Loading training...</div>
        </div>
      </AppLayout>
    );
  }

  // Empty state
  if (!module || totalCards === 0) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-muted-foreground">Training module not found.</p>
          <Button variant="outline" onClick={() => navigate("/training")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Training
          </Button>
        </div>
      </AppLayout>
    );
  }

  // Results phase
  if (phase === "results") {
    const totalCorrect = answers.filter((a) => a.correct).length;
    const pct = Math.round((totalCorrect / questions.length) * 100);
    const grade = getGrade(pct);
    return (
      <AppLayout>
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          >
            <Award className="w-20 h-20 text-primary" />
          </motion.div>
          <h2 className="text-2xl font-bold text-foreground">Quiz Complete!</h2>
          <div className="flex flex-col items-center gap-2">
            <p className="text-lg text-muted-foreground">
              {totalCorrect} / {questions.length} correct
            </p>
            <p className="text-4xl font-extrabold tabular-nums">{pct}%</p>
            <p className={cn("text-3xl font-bold", gradeColor(grade))}>
              Grade: {grade}
            </p>
          </div>
          <Button size="lg" className="mt-4" onClick={() => navigate("/training")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Training
          </Button>
        </motion.div>
      </AppLayout>
    );
  }

  // Quiz phase
  if (phase === "quiz" && currentQuestion) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">Quiz Time!</h2>
            <span className="text-sm text-muted-foreground">
              {quizIndex + 1} / {questions.length}
            </span>
          </div>
          <Progress value={((quizIndex + 1) / questions.length) * 100} className="h-2" />
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              <p className="text-lg font-semibold text-foreground leading-relaxed">
                {currentQuestion.question}
              </p>
              <div className="grid gap-3">
                {currentQuestion.options.map((opt, i) => {
                  const isSelected = selectedOption === i;
                  const isCorrect = i === currentQuestion.correct_index;
                  const answered = showExplanation;
                  let extraClass = "justify-start text-left h-auto py-3 px-4";
                  if (answered && isCorrect) {
                    extraClass += " border-green-500 bg-green-50 text-green-800";
                  } else if (answered && isSelected && !isCorrect) {
                    extraClass += " border-red-500 bg-red-50 text-red-800";
                  }
                  return (
                    <Button
                      key={i}
                      variant="outline"
                      className={cn("relative", extraClass)}
                      onClick={() => handleOptionSelect(i)}
                      disabled={answered}
                    >
                      <span className="font-bold mr-3 shrink-0">{OPTION_LABELS[i]}.</span>
                      <span className="flex-1">{opt}</span>
                      {answered && isCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 ml-2" />
                      )}
                      {answered && isSelected && !isCorrect && (
                        <XCircle className="w-5 h-5 text-red-600 shrink-0 ml-2" />
                      )}
                    </Button>
                  );
                })}
              </div>
              {showExplanation && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-muted rounded-lg p-4 text-sm text-muted-foreground"
                >
                  {currentQuestion.explanation}
                </motion.div>
              )}
              {showExplanation && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="flex justify-end"
                >
                  <Button onClick={handleNextQuestion}>
                    {quizIndex < questions.length - 1 ? "Next Question" : "See Results"}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </AppLayout>
    );
  }

  // Cards phase
  const progressPct = totalCards > 0 ? ((cardIndex + 1) / totalCards) * 100 : 0;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-4 flex flex-col min-h-[calc(100vh-180px)]">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold text-foreground truncate mr-4">
            {module.title}
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { speechSynthesis.cancel(); navigate("/training"); }}
            aria-label="Close training"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3 mb-4">
          <Progress value={progressPct} className="h-2 flex-1" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {cardIndex + 1} / {totalCards}
          </span>
        </div>

        {/* Card */}
        <div className="flex-1 relative overflow-hidden rounded-xl">
          <AnimatePresence mode="wait" custom={direction}>
            {currentCard && (
              <motion.div
                key={currentCard.id}
                custom={direction}
                variants={cardVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5"
              >
                <h2 className="text-xl font-bold text-foreground">{currentCard.title}</h2>
                <p className="text-base text-foreground/90 leading-relaxed whitespace-pre-line">
                  {currentCard.content}
                </p>
                {currentCard.tips.length > 0 && (
                  <ul className="space-y-2">
                    {currentCard.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/80">
                        <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {currentCard.encouragement && (
                  <p className="text-sm italic text-muted-foreground border-l-2 border-primary/30 pl-3">
                    {currentCard.encouragement}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom controls */}
        <div className="flex items-center justify-between mt-5 pb-2">
          <Button variant="outline" onClick={goBack} disabled={cardIndex === 0} className="gap-1.5">
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setVoiceEnabled((v) => !v)}
            aria-label={voiceEnabled ? "Mute voice" : "Enable voice"}
          >
            {voiceEnabled
              ? <Volume2 className="w-5 h-5 text-primary" />
              : <VolumeX className="w-5 h-5 text-muted-foreground" />}
          </Button>
          <Button onClick={goNext} className="gap-1.5">
            {cardIndex < totalCards - 1 ? (
              <>Next <ChevronRight className="w-4 h-4" /></>
            ) : hasQuiz ? "Start Quiz" : "Finish"}
          </Button>
        </div>
      </div>
      <TrainingChatBubble trainingType="food_safety" orgSlug="" materialId={moduleId} />
    </AppLayout>
  );
};

export default TrainingPlayer;
