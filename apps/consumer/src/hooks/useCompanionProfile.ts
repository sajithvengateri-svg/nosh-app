import { useEffect, useRef } from "react";
import { Alert } from "react-native";
import { supabase } from "../lib/supabase";
import { useCompanionStore } from "../lib/companion/companionStore";
import type { CompanionPersona } from "../lib/companion/companionStore";
import { useAuth } from "../contexts/AuthProvider";
import { useFeedStore } from "../lib/stores/feedStore";
import { useFavouritesStore } from "../lib/stores/favouritesStore";

/**
 * Hydrates companionStore with the user's companion_profiles row on mount.
 * Also checks for "mistake dismissals" — recipes the user swiped away
 * that match their cuisine preferences. After 14 days, asks about them.
 */
export function useCompanionProfile() {
  const { session } = useAuth();
  const setCompanionName = useCompanionStore((s) => s.setCompanionName);
  const setPersona = useCompanionStore((s) => s.setPersona);
  const pushResponse = useCompanionStore((s) => s.pushResponse);
  const companionName = useCompanionStore((s) => s.companionName);
  const loaded = useRef(false);

  useEffect(() => {
    if (!session?.user?.id || loaded.current) return;
    loaded.current = true;

    (async () => {
      // 1. Hydrate companion profile
      const { data, error } = await supabase
        .from("companion_profiles")
        .select("companion_name, persona")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error) {
        console.warn("companion profile fetch:", error.message);
        return;
      }

      const name = data?.companion_name || "Buddy";
      if (data) {
        if (data.companion_name) setCompanionName(data.companion_name);
        if (data.persona) setPersona(data.persona as CompanionPersona);
      }

      // 2. Check for mature mismatch dismissals (14+ days old, not yet asked)
      const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const { data: mismatches } = await supabase
        .from("ds_dismiss_mismatches")
        .select("id, recipe_id, recipe_title, cuisine")
        .eq("asked", false)
        .lte("dismissed_at", cutoff)
        .limit(1);

      if (mismatches && mismatches.length > 0) {
        const m = mismatches[0];
        // Mark as asked so we don't ask again
        supabase
          .from("ds_dismiss_mismatches")
          .update({ asked: true })
          .eq("id", m.id)
          .then(() => {});

        // Surface as companion nudge after a short delay
        setTimeout(() => {
          Alert.alert(
            `${name} noticed something`,
            `You seem to love ${m.cuisine} food, but you swiped away "${m.recipe_title}" a while back. Was that a mistake?`,
            [
              {
                text: "Bring it back!",
                onPress: () => {
                  // Restore: remove permanent cooldown + add to favourites
                  supabase
                    .from("ds_recipe_cooldowns")
                    .delete()
                    .eq("recipe_id", m.recipe_id)
                    .then(() => {});
                  supabase
                    .from("ds_dismiss_mismatches")
                    .update({ restored: true })
                    .eq("id", m.id)
                    .then(() => {});
                  useFavouritesStore.getState().addFavourite(m.recipe_id);
                },
              },
              {
                text: "No thanks",
                style: "cancel",
              },
            ],
          );
        }, 3000); // 3s delay so it doesn't fire immediately on app open
      }
    })();
  }, [session?.user?.id]);
}
