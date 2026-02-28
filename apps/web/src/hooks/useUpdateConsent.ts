import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCallback, useMemo } from "react";

export interface FeatureRelease {
  id: string;
  module_slug: string;
  module_name: string;
  description: string | null;
  release_notes: string | null;
  released_at: string | null;
  version_tag: string | null;
  is_essential: boolean;
}

const SNOOZE_KEY = "update_snoozed_until";
const SNOOZE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

function getIsSnoozed(): boolean {
  const raw = localStorage.getItem(SNOOZE_KEY);
  if (!raw) return false;
  const until = Number(raw);
  if (isNaN(until)) return false;
  return Date.now() < until;
}

export const useUpdateConsent = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // ── Fetch released updates the user hasn't seen ──────────────────────
  const {
    data: releasedData,
    isLoading: isReleasedLoading,
  } = useQuery({
    queryKey: ["update-consent-released", user?.id],
    queryFn: async () => {
      if (!user?.id) return { essential: [] as FeatureRelease[], optional: [] as FeatureRelease[] };

      // Get all released feature_releases
      const { data: released, error: relErr } = await supabase
        .from("feature_releases")
        .select("id, module_slug, module_name, description, release_notes, released_at, version_tag, is_essential")
        .eq("status", "released")
        .not("released_at", "is", null)
        .order("released_at", { ascending: false });

      if (relErr) throw relErr;
      if (!released?.length) return { essential: [], optional: [] };

      // Get releases user has already seen
      const { data: seen, error: seenErr } = await supabase
        .from("user_seen_releases")
        .select("release_id")
        .eq("user_id", user.id);

      if (seenErr) throw seenErr;

      const seenIds = new Set((seen || []).map((s: any) => s.release_id));
      const unseen = (released as FeatureRelease[]).filter((r) => !seenIds.has(r.id));

      const essential = unseen.filter((r) => r.is_essential);
      const optional = unseen.filter((r) => !r.is_essential);

      return { essential, optional };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  // ── Fetch upcoming teasers (beta OR future scheduled) ────────────────
  const {
    data: teasers,
    isLoading: isTeasersLoading,
  } = useQuery({
    queryKey: ["update-consent-teasers"],
    queryFn: async () => {
      const now = new Date().toISOString();

      // beta releases OR releases scheduled in the future
      const { data, error } = await supabase
        .from("feature_releases")
        .select("id, module_slug, module_name, description, release_notes, released_at, version_tag, is_essential")
        .or(`status.eq.beta,scheduled_release_at.gt.${now}`)
        .order("scheduled_release_at", { ascending: true });

      if (error) throw error;
      return (data || []) as FeatureRelease[];
    },
    staleTime: 1000 * 60 * 10,
  });

  // ── Auto-mark essential updates as seen ──────────────────────────────
  const autoMarkEssentialMutation = useMutation({
    mutationFn: async (essentialReleases: FeatureRelease[]) => {
      if (!user?.id || !essentialReleases.length) return;
      const rows = essentialReleases.map((r) => ({
        user_id: user.id,
        release_id: r.id,
      }));
      const { error } = await supabase
        .from("user_seen_releases")
        .upsert(rows, { onConflict: "user_id,release_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["update-consent-released"] });
    },
  });

  // Trigger auto-mark for essential updates whenever they appear
  const essentialUpdates = releasedData?.essential ?? [];
  const optionalUpdates = releasedData?.optional ?? [];

  useMemo(() => {
    if (essentialUpdates.length > 0) {
      autoMarkEssentialMutation.mutate(essentialUpdates);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [essentialUpdates.length]);

  // ── Accept optional updates (mark as seen) ───────────────────────────
  const acceptMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !optionalUpdates.length) return;
      const rows = optionalUpdates.map((r) => ({
        user_id: user.id,
        release_id: r.id,
      }));
      const { error } = await supabase
        .from("user_seen_releases")
        .upsert(rows, { onConflict: "user_id,release_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["update-consent-released"] });
    },
  });

  const acceptUpdates = useCallback(() => {
    acceptMutation.mutate();
  }, [acceptMutation]);

  // ── Snooze updates for 24 hours ─────────────────────────────────────
  const snoozeUpdates = useCallback(() => {
    const until = Date.now() + SNOOZE_DURATION_MS;
    localStorage.setItem(SNOOZE_KEY, String(until));
    // Force re-render by invalidating the query so consumers re-evaluate isSnoozed
    queryClient.invalidateQueries({ queryKey: ["update-consent-released"] });
  }, [queryClient]);

  const isSnoozed = getIsSnoozed();

  return {
    essentialUpdates,
    optionalUpdates,
    teasers: teasers ?? [],
    isSnoozed,
    acceptUpdates,
    snoozeUpdates,
    isLoading: isReleasedLoading || isTeasersLoading,
  };
};
