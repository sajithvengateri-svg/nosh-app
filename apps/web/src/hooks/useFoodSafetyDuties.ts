import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { format } from "date-fns";

interface DutyAssignment {
  id: string;
  org_id: string;
  user_id: string;
  shift: "am" | "pm";
  duty_date: string | null;
  assigned_by: string | null;
  created_at: string;
}

interface TeamMember {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
}

interface ResolvedDuty {
  shift: "am" | "pm";
  user_id: string | null;
  full_name: string | null;
  avatar_url: string | null;
  isDefault: boolean;
}

export const useFoodSafetyDuties = () => {
  const { user } = useAuth();
  const { currentOrg } = useOrg();
  const [duties, setDuties] = useState<DutyAssignment[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const today = format(new Date(), "yyyy-MM-dd");

  const fetchDuties = useCallback(async () => {
    if (!currentOrg?.id) return;
    const { data } = await supabase
      .from("food_safety_duties")
      .select("*")
      .eq("org_id", currentOrg.id);
    setDuties((data || []) as unknown as DutyAssignment[]);
  }, [currentOrg?.id]);

  const fetchTeamMembers = useCallback(async () => {
    if (!currentOrg?.id) return;
    const { data: members } = await supabase
      .from("org_memberships")
      .select("user_id, role")
      .eq("org_id", currentOrg.id)
      .eq("is_active", true);

    if (!members?.length) { setTeamMembers([]); return; }

    const userIds = members.map(m => m.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url")
      .in("user_id", userIds);

    const merged: TeamMember[] = members.map(m => {
      const p = profiles?.find(pr => pr.user_id === m.user_id);
      return {
        user_id: m.user_id,
        full_name: p?.full_name || "Unknown",
        avatar_url: p?.avatar_url || null,
        role: m.role,
      };
    });
    setTeamMembers(merged);
  }, [currentOrg?.id]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchDuties(), fetchTeamMembers()]);
      setLoading(false);
    };
    load();
  }, [fetchDuties, fetchTeamMembers]);

  const resolveDuty = useCallback((shift: "am" | "pm", date?: string): ResolvedDuty => {
    const targetDate = date || today;
    // 1. Check date-specific override
    const override = duties.find(d => d.shift === shift && d.duty_date === targetDate);
    if (override) {
      const member = teamMembers.find(m => m.user_id === override.user_id);
      return { shift, user_id: override.user_id, full_name: member?.full_name || null, avatar_url: member?.avatar_url || null, isDefault: false };
    }
    // 2. Check recurring default (duty_date is null)
    const def = duties.find(d => d.shift === shift && d.duty_date === null);
    if (def) {
      const member = teamMembers.find(m => m.user_id === def.user_id);
      return { shift, user_id: def.user_id, full_name: member?.full_name || null, avatar_url: member?.avatar_url || null, isDefault: true };
    }
    return { shift, user_id: null, full_name: null, avatar_url: null, isDefault: false };
  }, [duties, teamMembers, today]);

  const assignDuty = async (shift: "am" | "pm", userId: string, dutyDate: string | null) => {
    if (!currentOrg?.id || !user?.id) return;

    // Remove existing assignment for this shift + date
    if (dutyDate) {
      await supabase.from("food_safety_duties").delete().match({ org_id: currentOrg.id, shift, duty_date: dutyDate });
    } else {
      // For defaults, delete where duty_date is null
      const { data: existing } = await supabase
        .from("food_safety_duties")
        .select("id")
        .eq("org_id", currentOrg.id)
        .eq("shift", shift)
        .is("duty_date", null);
      if (existing?.length) {
        await supabase.from("food_safety_duties").delete().in("id", existing.map(e => e.id));
      }
    }

    await supabase.from("food_safety_duties").insert({
      org_id: currentOrg.id,
      user_id: userId,
      shift,
      duty_date: dutyDate,
      assigned_by: user.id,
    } as any);

    await fetchDuties();
  };

  const removeDuty = async (dutyId: string) => {
    await supabase.from("food_safety_duties").delete().eq("id", dutyId);
    await fetchDuties();
  };

  const isCurrentUserOnDuty = useCallback((shift: "am" | "pm"): boolean => {
    if (!user?.id) return false;
    const resolved = resolveDuty(shift);
    return resolved.user_id === user.id;
  }, [user?.id, resolveDuty]);

  const getDefaultDuties = useCallback(() => {
    return duties.filter(d => d.duty_date === null);
  }, [duties]);

  return {
    duties,
    teamMembers,
    loading,
    resolveDuty,
    assignDuty,
    removeDuty,
    isCurrentUserOnDuty,
    getDefaultDuties,
    refetch: fetchDuties,
  };
};
