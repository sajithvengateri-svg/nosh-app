import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthProvider";
import { useOrg } from "../contexts/OrgProvider";
import { useCompanionStore } from "../lib/companion/companionStore";
import type { CompanionProfile, CompanionPreferences, CompanionMemory } from "../lib/companion/companionStore";
import Constants from "expo-constants";
import { VARIANT_REGISTRY, getRegion, isHomeCook } from "@queitos/shared";
import type { AppVariant } from "@queitos/shared";

const APP_VARIANT = (Constants.expoConfig?.extra?.appVariant ?? "chefos") as AppVariant;

export function useCompanion() {
  const { user } = useAuth();
  const { currentOrg } = useOrg();
  const queryClient = useQueryClient();
  const { setProfile, setProfileLoaded } = useCompanionStore();
  const profile = useCompanionStore((s) => s.profile);

  const isHomeCookVariant = isHomeCook(APP_VARIANT);
  const regionConfig = getRegion(APP_VARIANT);

  const { data, isLoading, error } = useQuery({
    queryKey: ["companion-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("companion_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      const p = (data as CompanionProfile) ?? null;
      setProfile(p);
      setProfileLoaded(true);
      return p;
    },
    enabled: !!user?.id && isHomeCookVariant,
  });

  const createProfile = useMutation({
    mutationFn: async ({
      name,
      personality,
    }: {
      name: string;
      personality?: CompanionProfile["personality"];
    }) => {
      if (!user?.id) throw new Error("Not authenticated");
      const row: Record<string, unknown> = {
        user_id: user.id,
        companion_name: name.trim(),
        personality: personality || "friendly",
        region: VARIANT_REGISTRY[APP_VARIANT].region,
        locale: regionConfig.locale,
        units: regionConfig.units,
        currency: regionConfig.currency,
      };
      if (currentOrg?.id) row.org_id = currentOrg.id;
      const { data, error } = await supabase
        .from("companion_profiles")
        .insert(row)
        .select()
        .single();
      if (error) throw error;
      return data as CompanionProfile;
    },
    onSuccess: (data) => {
      setProfile(data);
      setProfileLoaded(true);
      queryClient.invalidateQueries({ queryKey: ["companion-profile"] });
    },
  });

  const updatePreferences = useMutation({
    mutationFn: async (prefs: Partial<CompanionPreferences>) => {
      if (!profile?.id) throw new Error("No companion profile");
      const merged = { ...profile.preferences, ...prefs };
      const { error } = await supabase
        .from("companion_profiles")
        .update({ preferences: merged })
        .eq("id", profile.id);
      if (error) throw error;
      return merged;
    },
    onSuccess: (merged) => {
      if (profile) setProfile({ ...profile, preferences: merged });
      queryClient.invalidateQueries({ queryKey: ["companion-profile"] });
    },
  });

  const updateMemory = useMutation({
    mutationFn: async (memoryUpdate: Partial<CompanionMemory>) => {
      if (!profile?.id) throw new Error("No companion profile");
      const merged = { ...profile.memory, ...memoryUpdate };
      const { error } = await supabase
        .from("companion_profiles")
        .update({ memory: merged })
        .eq("id", profile.id);
      if (error) throw error;
      return merged;
    },
    onSuccess: (merged) => {
      if (profile) setProfile({ ...profile, memory: merged });
    },
  });

  const updateCompanionName = useMutation({
    mutationFn: async (name: string) => {
      if (!profile?.id) throw new Error("No companion profile");
      const { error } = await supabase
        .from("companion_profiles")
        .update({ companion_name: name.trim() })
        .eq("id", profile.id);
      if (error) throw error;
      return name.trim();
    },
    onSuccess: (name) => {
      if (profile) setProfile({ ...profile, companion_name: name });
      queryClient.invalidateQueries({ queryKey: ["companion-profile"] });
    },
  });

  const hasCompanion = !!data;
  const needsOnboarding = !isLoading && !data;

  return {
    profile: data,
    isLoading,
    error,
    hasCompanion,
    needsOnboarding,
    isHomeCookVariant,
    regionConfig,
    createProfile,
    updatePreferences,
    updateMemory,
    updateCompanionName,
  };
}
