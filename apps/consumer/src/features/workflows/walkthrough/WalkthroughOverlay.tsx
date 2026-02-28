import { useCallback } from "react";
import { WorkflowStepper } from "../WorkflowStepper";
import { WALKTHROUGH_STEPS } from "./walkthroughSteps";
import { useWorkflowStore } from "../../../lib/stores/workflowStore";
import { useAuth } from "../../../contexts/AuthProvider";
import { supabase } from "../../../lib/supabase";
import type { WorkflowConfig } from "../types";

const WALKTHROUGH_CONFIG: WorkflowConfig = {
  id: "walkthrough",
  title: "App Walkthrough",
  steps: WALKTHROUGH_STEPS,
  showProgress: true,
  allowBack: true,
  allowSkip: false,
};

interface WalkthroughOverlayProps {
  onClose: () => void;
}

export function WalkthroughOverlay({ onClose }: WalkthroughOverlayProps) {
  const markComplete = useWorkflowStore((s) => s.markComplete);
  const { user } = useAuth();

  const handleComplete = useCallback(async () => {
    markComplete("walkthrough");

    if (user) {
      try {
        await supabase.from("ds_workflow_completions").insert({
          user_id: user.id,
          workflow_key: "walkthrough",
          answers: {},
        });
      } catch (err) {
        console.error("Walkthrough completion save error:", err);
      }
    }

    onClose();
  }, [markComplete, user, onClose]);

  return (
    <WorkflowStepper
      config={WALKTHROUGH_CONFIG}
      onComplete={handleComplete}
      onClose={onClose}
    />
  );
}
