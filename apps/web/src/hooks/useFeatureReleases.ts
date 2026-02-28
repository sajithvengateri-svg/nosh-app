import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface FeatureRelease {
  id: string;
  module_slug: string;
  status: string;
  module_name: string;
  description: string | null;
  release_notes: string | null;
  released_at: string | null;
  version_tag: string | null;
}

export const useFeatureReleases = () => {
  return useQuery({
    queryKey: ["feature-releases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feature_releases")
        .select("module_slug, status, module_name");

      if (error) throw error;
      return (data || []) as { module_slug: string; status: string; module_name: string }[];
    },
    staleTime: 1000 * 60 * 10,
  });
};

export const useIsModuleReleased = () => {
  const { data: releases } = useFeatureReleases();

  return (moduleSlug: string) => {
    if (!releases) return false;
    return releases.some(
      (r) => r.module_slug === moduleSlug && r.status === "released"
    );
  };
};

export const useNewReleases = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: unseenReleases, isLoading } = useQuery({
    queryKey: ["unseen-releases", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get all released features
      const { data: released, error: relErr } = await supabase
        .from("feature_releases")
        .select("id, module_slug, module_name, description, release_notes, released_at, version_tag")
        .eq("status", "released")
        .not("released_at", "is", null)
        .order("released_at", { ascending: false });

      if (relErr) throw relErr;
      if (!released?.length) return [];

      // Get ones user has already seen
      const { data: seen, error: seenErr } = await supabase
        .from("user_seen_releases")
        .select("release_id")
        .eq("user_id", user.id);

      if (seenErr) throw seenErr;

      const seenIds = new Set((seen || []).map((s: any) => s.release_id));
      return (released as FeatureRelease[]).filter((r) => !seenIds.has(r.id));
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  const markAllSeenMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !unseenReleases?.length) return;
      const rows = unseenReleases.map((r) => ({
        user_id: user.id,
        release_id: r.id,
      }));
      const { error } = await supabase.from("user_seen_releases").upsert(rows, {
        onConflict: "user_id,release_id",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unseen-releases"] });
    },
  });

  return {
    unseenReleases: unseenReleases || [],
    isLoading,
    markAllSeen: markAllSeenMutation.mutate,
  };
};
