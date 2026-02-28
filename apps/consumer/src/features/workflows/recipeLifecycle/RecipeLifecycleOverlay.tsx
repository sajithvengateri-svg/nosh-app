import { useCallback } from "react";
import { WorkflowStepper } from "../WorkflowStepper";
import { RECIPE_LIFECYCLE_STEPS } from "./recipeLifecycleSteps";
import { useWorkflowStore } from "../../../lib/stores/workflowStore";
import { useAuth } from "../../../contexts/AuthProvider";
import { supabase } from "../../../lib/supabase";
import type { WorkflowConfig } from "../types";

const CONFIG: WorkflowConfig = {
  id: "recipe_lifecycle",
  title: "Recipe Lifecycle",
  steps: RECIPE_LIFECYCLE_STEPS,
  showProgress: true,
  allowBack: true,
  allowSkip: false,
};

interface RecipeLifecycleOverlayProps {
  onClose: () => void;
}

export function RecipeLifecycleOverlay({ onClose }: RecipeLifecycleOverlayProps) {
  const markComplete = useWorkflowStore((s) => s.markComplete);
  const { user } = useAuth();

  const handleComplete = useCallback(async () => {
    markComplete("recipe_lifecycle");

    if (user) {
      try {
        await supabase.from("ds_workflow_completions").insert({
          user_id: user.id,
          workflow_key: "recipe_lifecycle",
          answers: {},
        });
      } catch (err) {
        console.error("Recipe lifecycle completion save error:", err);
      }
    }

    onClose();
  }, [markComplete, user, onClose]);

  return (
    <WorkflowStepper
      config={CONFIG}
      onComplete={handleComplete}
      onClose={onClose}
    />
  );
}
