import { useCallback } from "react";
import { WorkflowStepper } from "../WorkflowStepper";
import { PROFILE_BUILDER_STEPS } from "./profileBuilderSteps";
import { useAuth } from "../../../contexts/AuthProvider";
import { supabase } from "../../../lib/supabase";
import { usePersonalityStore } from "../../../lib/stores/personalityStore";
import type { WorkflowConfig } from "../types";

const PROFILE_BUILDER_CONFIG: WorkflowConfig = {
  id: "profile_builder",
  title: "Build Your Profile",
  steps: PROFILE_BUILDER_STEPS,
  showProgress: true,
  allowBack: true,
  allowSkip: true,
};

interface ProfileBuilderOverlayProps {
  onClose: () => void;
  isOnboarding?: boolean; // true when called from onboarding flow
}

export function ProfileBuilderOverlay({
  onClose,
  isOnboarding,
}: ProfileBuilderOverlayProps) {
  const { user, refreshProfile } = useAuth();
  const setInitialPersonality = usePersonalityStore(
    (s) => s.setInitialPersonality
  );

  const handleComplete = useCallback(
    async (answers: Record<string, any>) => {
      if (!user) {
        onClose();
        return;
      }

      // Build the profile update object from answers
      const profileUpdate: Record<string, any> = {};

      if (answers.name) profileUpdate.display_name = answers.name;
      if (answers.theme) profileUpdate.preferred_theme = answers.theme;
      if (answers.household_size)
        profileUpdate.household_size = answers.household_size;
      if (answers.cuisines?.length)
        profileUpdate.cuisine_preferences = answers.cuisines;
      if (answers.adventure_level)
        profileUpdate.adventure_level = Number(answers.adventure_level);
      if (answers.spice_level)
        profileUpdate.spice_level = Number(answers.spice_level);
      if (answers.cooking_skill)
        profileUpdate.cooking_skill = answers.cooking_skill;
      if (answers.weeknight_time)
        profileUpdate.weeknight_max_minutes = answers.weeknight_time;
      if (answers.weekend_time)
        profileUpdate.weekend_max_minutes = answers.weekend_time;
      if (answers.vessels?.length)
        profileUpdate.preferred_vessels = answers.vessels;
      if (answers.budget) profileUpdate.budget_preference = answers.budget;
      if (answers.dietary?.length)
        profileUpdate.dietary_requirements = answers.dietary;
      if (answers.shopping_style)
        profileUpdate.shopping_style = answers.shopping_style;
      if (answers.drink_preference)
        profileUpdate.drink_preference = answers.drink_preference;

      if (isOnboarding) {
        profileUpdate.onboarding_complete = true;
      }

      // Save to database
      try {
        await supabase
          .from("ds_user_profiles")
          .update(profileUpdate)
          .eq("id", user.id);

        // Set personality if selected
        if (answers.personality) {
          setInitialPersonality(answers.personality);
        }

        // Save workflow completion
        await supabase.from("ds_workflow_completions").insert({
          user_id: user.id,
          workflow_key: "profile_builder",
          answers,
        });

        await refreshProfile();
      } catch (err) {
        console.error("Profile save error:", err);
      }

      onClose();
    },
    [user, onClose, isOnboarding, refreshProfile, setInitialPersonality]
  );

  // Load existing profile values as initial answers for replay mode
  const { profile } = useAuth();
  const initialAnswers =
    !isOnboarding && profile
      ? {
          name: profile.display_name ?? "",
          household_size: profile.household_size ?? 2,
          cuisines: profile.cuisine_preferences ?? [],
          spice_level: String(profile.spice_level ?? 2),
          adventure_level: String(profile.adventure_level ?? 2),
          budget: profile.budget_preference ?? "moderate",
        }
      : undefined;

  return (
    <WorkflowStepper
      config={PROFILE_BUILDER_CONFIG}
      initialAnswers={initialAnswers}
      onComplete={handleComplete}
      onClose={onClose}
    />
  );
}
