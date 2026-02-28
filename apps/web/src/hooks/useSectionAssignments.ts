import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";

export interface SectionAssignment {
  id: string;
  section_id: string;
  user_id: string;
  role: "leader" | "member";
  assigned_by: string | null;
  assigned_at: string | null;
  profile?: {
    full_name: string;
    email: string;
    position: string | null;
    avatar_url: string | null;
  };
}

export interface TeamMember {
  user_id: string;
  full_name: string;
  email: string;
  position: string | null;
  avatar_url: string | null;
}

export const useSectionAssignments = () => {
  const { user } = useAuth();
  const { currentOrg } = useOrg();
  const [assignments, setAssignments] = useState<Record<string, SectionAssignment[]>>({});
  const [allTeamMembers, setAllTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllAssignments = useCallback(async () => {
    if (!currentOrg?.id) return;
    const { data, error } = await supabase
      .from("section_assignments")
      .select("*")
      .eq("org_id", currentOrg.id);

    if (error) {
      console.error("Error fetching assignments:", error);
      return;
    }

    // Group by section_id
    const grouped: Record<string, SectionAssignment[]> = {};
    
    // Fetch profiles for all assigned users
    const userIds = [...new Set(data?.map(a => a.user_id) || [])];
    
    let profilesMap: Record<string, TeamMember> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, position, avatar_url")
        .in("user_id", userIds);
      
      profilesMap = (profiles || []).reduce((acc, p) => {
        acc[p.user_id] = p;
        return acc;
      }, {} as Record<string, TeamMember>);
    }

    (data || []).forEach((assignment) => {
      if (!grouped[assignment.section_id]) {
        grouped[assignment.section_id] = [];
      }
      grouped[assignment.section_id].push({
        ...assignment,
        role: assignment.role as "leader" | "member",
        profile: profilesMap[assignment.user_id],
      });
    });

    setAssignments(grouped);
  }, [currentOrg?.id]);

  const fetchTeamMembers = useCallback(async () => {
    if (!currentOrg?.id) return;
    // Get team members from org_memberships, then join profiles
    const { data: membershipData, error: membershipError } = await supabase
      .from("org_memberships")
      .select("user_id")
      .eq("org_id", currentOrg.id)
      .eq("is_active", true);

    if (membershipError) {
      console.error("Error fetching org memberships:", membershipError);
      return;
    }

    const userIds = membershipData?.map(m => m.user_id) || [];
    if (userIds.length === 0) {
      setAllTeamMembers([]);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, full_name, email, position, avatar_url")
      .in("user_id", userIds)
      .order("full_name");

    if (error) {
      console.error("Error fetching team members:", error);
      return;
    }

    setAllTeamMembers(data || []);
  }, [currentOrg?.id]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchAllAssignments(), fetchTeamMembers()]);
      setLoading(false);
    };
    loadData();
  }, [fetchAllAssignments, fetchTeamMembers]);

  const getSectionAssignments = (sectionId: string): SectionAssignment[] => {
    return assignments[sectionId] || [];
  };

  const getSectionLeader = (sectionId: string): SectionAssignment | undefined => {
    return (assignments[sectionId] || []).find(a => a.role === "leader");
  };

  const saveAssignments = async (
    sectionId: string,
    newAssignments: { user_id: string; role: "leader" | "member" }[],
    orgId?: string
  ): Promise<boolean> => {
    if (!user) {
      toast.error("You must be logged in");
      return false;
    }

    const resolvedOrgId = orgId || currentOrg?.id;
    if (!resolvedOrgId) {
      toast.error("No organization selected");
      return false;
    }

    try {
      // Delete existing assignments for this section
      const { error: deleteError } = await supabase
        .from("section_assignments")
        .delete()
        .eq("section_id", sectionId);

      if (deleteError) throw deleteError;

      // Insert new assignments if any
      if (newAssignments.length > 0) {
        const { error: insertError } = await supabase
          .from("section_assignments")
          .insert(
            newAssignments.map(a => ({
              section_id: sectionId,
              user_id: a.user_id,
              role: a.role,
              assigned_by: user.id,
              assigned_at: new Date().toISOString(),
              org_id: resolvedOrgId,
            }))
          );

        if (insertError) throw insertError;
      }

      await fetchAllAssignments();
      toast.success("Team assignments updated");
      return true;
    } catch (error) {
      console.error("Error saving assignments:", error);
      toast.error("Failed to save assignments");
      return false;
    }
  };

  return {
    assignments,
    allTeamMembers,
    loading,
    getSectionAssignments,
    getSectionLeader,
    saveAssignments,
    refetch: fetchAllAssignments,
  };
};
