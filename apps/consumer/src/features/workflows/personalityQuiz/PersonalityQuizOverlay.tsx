import { useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { WorkflowStepper } from "../WorkflowStepper";
import { PERSONALITY_QUIZ_STEPS } from "./quizQuestions";
import { scoreQuiz } from "./quizScoring";
import { PersonalityRevealCard } from "./PersonalityRevealCard";
import { usePersonalityStore } from "../../../lib/stores/personalityStore";
import { useWorkflowStore } from "../../../lib/stores/workflowStore";
import { useAuth } from "../../../contexts/AuthProvider";
import { supabase } from "../../../lib/supabase";
import { Colors } from "../../../constants/colors";
import type { WorkflowConfig } from "../types";

const QUIZ_CONFIG: WorkflowConfig = {
  id: "personality_quiz",
  title: "Build Your Prep",
  steps: PERSONALITY_QUIZ_STEPS,
  showProgress: true,
  allowBack: true,
  allowSkip: false,
};

interface PersonalityQuizOverlayProps {
  onClose: () => void;
}

export function PersonalityQuizOverlay({
  onClose,
}: PersonalityQuizOverlayProps) {
  const [result, setResult] = useState<ReturnType<typeof scoreQuiz> | null>(
    null
  );
  const setInitialPersonality = usePersonalityStore(
    (s) => s.setInitialPersonality
  );
  const markComplete = useWorkflowStore((s) => s.markComplete);
  const { user } = useAuth();

  const handleComplete = useCallback(
    async (answers: Record<string, any>) => {
      const quizResult = scoreQuiz(answers);
      setResult(quizResult);

      // Save personality
      setInitialPersonality(quizResult.primary);
      markComplete("personality_quiz");

      if (user) {
        try {
          await supabase.from("ds_workflow_completions").insert({
            user_id: user.id,
            workflow_key: "personality_quiz",
            answers,
          });
        } catch (err) {
          console.error("Quiz completion save error:", err);
        }
      }

      onClose();
    },
    [setInitialPersonality, markComplete, user, onClose]
  );

  return (
    <WorkflowStepper
      config={QUIZ_CONFIG}
      onComplete={handleComplete}
      onClose={onClose}
    />
  );
}
