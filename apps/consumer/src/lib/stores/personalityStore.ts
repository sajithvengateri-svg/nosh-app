import { create } from "zustand";
import { supabase } from "../supabase";
import type {
  PersonalityType,
  PersonalityProfile,
  PersonalityConstraints,
} from "../engines/personalityEngine";
import {
  classifyFromOnboarding,
  getConstraints,
} from "../engines/personalityEngine";
import type {
  NudgeDecision,
  NudgeState,
  NudgeType,
  HybridMode,
} from "../engines/nudgeEngine";
import {
  buildSignalSummary,
  computeConfidence,
  detectHybridMode,
  detectDrift,
  evaluateNudge,
} from "../engines/nudgeEngine";
import { checkAchievements } from "../engines/achievementEngine";
import { useFavouritesStore } from "./favouritesStore";
import { useCompanionStore } from "../companion/companionStore";

// ── Store ──────────────────────────────────────────────────────────

interface PersonalityState {
  profile: PersonalityProfile | null;
  constraints: PersonalityConstraints | null;
  isLoading: boolean;

  // Nudge state
  nudgeState: NudgeState;
  earnedAchievements: string[];
  hybridMode: HybridMode | null;
  lastNudgeDecision: NudgeDecision | null;

  fetchProfile: () => Promise<void>;
  setInitialPersonality: (type: PersonalityType) => Promise<void>;
  logSignal: (signalType: string, signalValue: string) => void;
  runNudgeCheck: (noshRunCount: number, socialEventCount: number) => Promise<NudgeDecision>;
  acceptNudge: (nudgeType: NudgeType) => void;
  declineNudge: () => void;
  fetchAchievements: () => Promise<void>;
  pauseNudges: (paused: boolean) => void;
}

export const usePersonalityStore = create<PersonalityState>((set, get) => ({
  profile: null,
  constraints: null,
  isLoading: false,
  nudgeState: {
    lastNudgeAt: null,
    nudgePaused: false,
    nudgesSent: 0,
    nudgesAccepted: 0,
    nudgesDeclined: 0,
  },
  earnedAchievements: [],
  hybridMode: null,
  lastNudgeDecision: null,

  fetchProfile: async () => {
    set({ isLoading: true });
    try {
      // Try detailed personality record first
      const { data: personality } = await supabase
        .from("ds_user_personality")
        .select("*")
        .maybeSingle();

      if (personality?.primary_type) {
        const type = personality.primary_type as PersonalityType;
        const profile: PersonalityProfile = {
          primary: type,
          primaryWeight: Number(personality.primary_weight) || 0.4,
          secondary: personality.secondary_type as PersonalityType | undefined,
          secondaryWeight: personality.secondary_weight
            ? Number(personality.secondary_weight)
            : undefined,
          confidence: Number(personality.profile_confidence) || 0.4,
          style:
            (personality.preferred_style as PersonalityProfile["style"]) ??
            getConstraints(type).style,
        };

        // Hydrate nudge state from DB
        const nudgeState: NudgeState = {
          lastNudgeAt: personality.last_nudge_at ?? null,
          nudgePaused: personality.nudge_paused ?? false,
          nudgesSent: personality.nudges_sent ?? 0,
          nudgesAccepted: personality.nudges_accepted ?? 0,
          nudgesDeclined: personality.nudges_declined ?? 0,
        };

        // Hydrate hybrid mode
        const hybridMode: HybridMode | null =
          personality.weekday_mode && personality.weekend_mode
            ? {
                weekdayMode: personality.weekday_mode as PersonalityType,
                weekendMode: personality.weekend_mode as PersonalityType,
              }
            : null;

        set({
          profile,
          constraints: getConstraints(type),
          nudgeState,
          hybridMode,
          isLoading: false,
        });
        return;
      }

      // Fallback: check user profile for primary_personality
      const { data: userProfile } = await supabase
        .from("ds_user_profiles")
        .select("primary_personality")
        .maybeSingle();

      if (userProfile?.primary_personality) {
        const type = userProfile.primary_personality as PersonalityType;
        const profile = classifyFromOnboarding(type);
        set({ profile, constraints: getConstraints(type), isLoading: false });
        return;
      }

      set({ isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  setInitialPersonality: async (type: PersonalityType) => {
    const profile = classifyFromOnboarding(type);
    const constraints = getConstraints(type);
    set({ profile, constraints });

    try {
      // Update user profile
      await supabase
        .from("ds_user_profiles")
        .update({ primary_personality: type })
        .eq("id", (await supabase.auth.getUser()).data.user?.id);

      // Upsert detailed personality record
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (userId) {
        await supabase.from("ds_user_personality").upsert(
          {
            user_id: userId,
            initial_selection: type,
            primary_type: type,
            primary_weight: 0.4,
            profile_confidence: 0.4,
            preferred_style: constraints.style,
            max_cook_time_weekday: constraints.maxCookTimeWeekday,
            max_cook_time_weekend: constraints.maxCookTimeWeekend,
            max_steps: constraints.maxSteps,
            max_ingredients: constraints.maxIngredients,
          },
          { onConflict: "user_id" },
        );
      }
    } catch (err) {
      console.error("setInitialPersonality error:", err);
    }
  },

  logSignal: async (signalType: string, signalValue: string) => {
    try {
      const profile = get().profile;
      await supabase.from("ds_personality_signals").insert({
        signal_type: signalType,
        signal_value: signalValue,
        personality_indicator: profile?.primary,
        signal_weight: 0.1,
      });
    } catch {
      // Fire-and-forget
    }
  },

  runNudgeCheck: async (noshRunCount: number, socialEventCount: number) => {
    const { profile, nudgeState, earnedAchievements } = get();
    if (!profile) return { shouldNudge: false };

    const oldConfidence = profile.confidence;

    // Gather cross-store data
    const cookLog = useFavouritesStore.getState().cookLog ?? [];
    const feedInteractions: { card_id: string; type: "like" | "dismiss" | "save" | "thumbs_down" | "cta_tap"; reason?: string }[] = [];
    // Feed interactions are logged to DB — we use summary counts from signals instead

    // Build summary
    const summary = buildSignalSummary(
      cookLog,
      feedInteractions,
      noshRunCount,
      socialEventCount,
      profile.primary,
    );

    // Compute new confidence
    const newConfidence = computeConfidence(oldConfidence, summary, profile.primary);

    // Detect hybrid mode
    const hybrid = detectHybridMode(summary);

    // Detect drift
    const drift = detectDrift(summary, profile.primary);

    // Check achievements
    const newAchievements = checkAchievements(
      summary,
      earnedAchievements,
      newConfidence,
    );

    // Persist new achievements
    if (newAchievements.length > 0) {
      const allEarned = [...earnedAchievements, ...newAchievements];
      set({ earnedAchievements: allEarned });

      // Insert into DB
      for (const key of newAchievements) {
        supabase
          .from("ds_personality_achievements")
          .insert({ achievement_key: key })
          .then(() => {});
      }
    }

    // Update confidence + hybrid mode if changed
    if (newConfidence !== oldConfidence || hybrid !== get().hybridMode) {
      const updatedProfile = { ...profile, confidence: newConfidence };
      set({
        profile: updatedProfile,
        hybridMode: hybrid,
      });

      // Persist to DB
      const updates: Record<string, unknown> = {
        profile_confidence: newConfidence,
      };
      if (hybrid) {
        updates.weekday_mode = hybrid.weekdayMode;
        updates.weekend_mode = hybrid.weekendMode;
      }
      supabase
        .from("ds_user_personality")
        .update(updates)
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .then(() => {});
    }

    // Evaluate nudge
    const decision = evaluateNudge(
      summary,
      profile,
      nudgeState,
      newConfidence,
      oldConfidence,
      hybrid,
      drift,
      newAchievements,
    );

    // Deliver nudge via companion
    if (decision.shouldNudge && decision.payload) {
      const companion = useCompanionStore.getState();
      companion.showPopUp(decision.payload.message);
      companion.setBubbleState("has_suggestion");
      if (decision.payload.smartBubbles) {
        companion.setSmartBubbles(decision.payload.smartBubbles);
      }

      // Update nudge state
      set({
        lastNudgeDecision: decision,
        nudgeState: {
          ...nudgeState,
          lastNudgeAt: new Date().toISOString(),
          nudgesSent: nudgeState.nudgesSent + 1,
        },
      });

      // Persist nudge timestamp
      supabase
        .from("ds_user_personality")
        .update({
          last_nudge_at: new Date().toISOString(),
          nudges_sent: nudgeState.nudgesSent + 1,
        })
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .then(() => {});
    }

    return decision;
  },

  acceptNudge: (nudgeType: NudgeType) => {
    const { nudgeState } = get();
    set({
      nudgeState: {
        ...nudgeState,
        nudgesAccepted: nudgeState.nudgesAccepted + 1,
      },
    });
    useCompanionStore.getState().hidePopUp();
    useCompanionStore.getState().setBubbleState("idle");
    useCompanionStore.getState().setSmartBubbles([]);
  },

  declineNudge: () => {
    const { nudgeState } = get();
    set({
      nudgeState: {
        ...nudgeState,
        nudgesDeclined: nudgeState.nudgesDeclined + 1,
      },
    });
    useCompanionStore.getState().hidePopUp();
    useCompanionStore.getState().setBubbleState("idle");
    useCompanionStore.getState().setSmartBubbles([]);
  },

  fetchAchievements: async () => {
    try {
      const { data } = await supabase
        .from("ds_personality_achievements")
        .select("achievement_key");
      if (data) {
        set({ earnedAchievements: data.map((r) => r.achievement_key) });
      }
    } catch {
      // Silent
    }
  },

  pauseNudges: (paused: boolean) => {
    const { nudgeState } = get();
    set({ nudgeState: { ...nudgeState, nudgePaused: paused } });

    // Persist
    supabase
      .from("ds_user_personality")
      .update({ nudge_paused: paused })
      .then(() => {});
  },
}));
