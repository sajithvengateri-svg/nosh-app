import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SectionLeaderInfo {
  sectionId: string;
  role: string;
}

export function useSectionLeaderStatus() {
  const { user, role } = useAuth();
  const [leaderSections, setLeaderSections] = useState<SectionLeaderInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSectionLeaderStatus = async () => {
      if (!user) {
        setLeaderSections([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .rpc("get_user_sections", { _user_id: user.id });

      if (error) {
        console.error("Error fetching section leader status:", error);
        setLeaderSections([]);
      } else {
        const sections = (data || []).map((s: { section_id: string; role: string }) => ({
          sectionId: s.section_id,
          role: s.role,
        }));
        setLeaderSections(sections);
      }
      setLoading(false);
    };

    fetchSectionLeaderStatus();
  }, [user]);

  const isSectionLeader = leaderSections.some((s) => s.role === "leader");
  const isHeadChef = role === "head_chef";
  const canManageTemplates = isHeadChef || isSectionLeader;

  const leaderSectionIds = leaderSections
    .filter((s) => s.role === "leader")
    .map((s) => s.sectionId);

  return {
    leaderSections,
    leaderSectionIds,
    isSectionLeader,
    isHeadChef,
    canManageTemplates,
    loading,
  };
}
