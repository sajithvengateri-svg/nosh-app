import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabaseClient";

// ============ Recruitment Positions ============
export const useRecruitmentPositions = (orgId: string | undefined) =>
  useQuery({
    queryKey: ["recruitment_positions", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recruitment_positions")
        .select("*")
        .eq("org_id", orgId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

export const useCreatePosition = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const { data, error } = await supabase.from("recruitment_positions").insert(values as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recruitment_positions"] }),
  });
};

export const useUpdatePosition = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: { id: string } & Record<string, unknown>) => {
      const { data, error } = await supabase.from("recruitment_positions").update(values as any).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recruitment_positions"] }),
  });
};

// ============ Recruitment Applicants ============
export const useRecruitmentApplicants = (orgId: string | undefined, positionId?: string) =>
  useQuery({
    queryKey: ["recruitment_applicants", orgId, positionId],
    queryFn: async () => {
      let q = supabase.from("recruitment_applicants").select("*, recruitment_positions(title, section)").eq("org_id", orgId!);
      if (positionId) q = q.eq("position_id", positionId);
      const { data, error } = await q.order("applied_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

export const useCreateApplicant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const { data, error } = await supabase.from("recruitment_applicants").insert(values as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recruitment_applicants"] }),
  });
};

export const useUpdateApplicant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: { id: string } & Record<string, unknown>) => {
      const { data, error } = await supabase.from("recruitment_applicants").update(values as any).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recruitment_applicants"] }),
  });
};

// ============ Recruitment Interviews ============
export const useRecruitmentInterviews = (applicantId: string | undefined) =>
  useQuery({
    queryKey: ["recruitment_interviews", applicantId],
    queryFn: async () => {
      const { data, error } = await supabase.from("recruitment_interviews").select("*").eq("applicant_id", applicantId!).order("scheduled_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!applicantId,
  });

export const useCreateInterview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const { data, error } = await supabase.from("recruitment_interviews").insert(values as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recruitment_interviews"] }),
  });
};

// ============ Onboarding Checklists ============
export const useOnboardingChecklists = (orgId: string | undefined) =>
  useQuery({
    queryKey: ["onboarding_checklists", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("onboarding_checklists").select("*").eq("org_id", orgId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

export const useUpdateChecklist = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: { id: string } & Record<string, unknown>) => {
      const { data, error } = await supabase.from("onboarding_checklists").update(values as any).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["onboarding_checklists"] }),
  });
};

// ============ Employee Documents ============
export const useEmployeeDocuments = (userId: string | undefined, orgId: string | undefined) =>
  useQuery({
    queryKey: ["employee_documents", userId, orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("employee_documents").select("*").eq("org_id", orgId!).eq("user_id", userId!).order("uploaded_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId && !!orgId,
  });

export const useCreateDocument = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const { data, error } = await supabase.from("employee_documents").insert(values as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employee_documents"] }),
  });
};

// ============ Performance Reviews ============
export const usePerformanceReviews = (orgId: string | undefined, userId?: string) =>
  useQuery({
    queryKey: ["performance_reviews", orgId, userId],
    queryFn: async () => {
      let q = supabase.from("performance_reviews").select("*").eq("org_id", orgId!);
      if (userId) q = q.eq("user_id", userId);
      const { data, error } = await q.order("review_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

export const useCreateReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const { data, error } = await supabase.from("performance_reviews").insert(values as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["performance_reviews"] }),
  });
};

export const useUpdateReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: { id: string } & Record<string, unknown>) => {
      const { data, error } = await supabase.from("performance_reviews").update(values as any).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["performance_reviews"] }),
  });
};

// ============ Employee Warnings ============
export const useEmployeeWarnings = (orgId: string | undefined, userId?: string) =>
  useQuery({
    queryKey: ["employee_warnings", orgId, userId],
    queryFn: async () => {
      let q = supabase.from("employee_warnings").select("*").eq("org_id", orgId!);
      if (userId) q = q.eq("user_id", userId);
      const { data, error } = await q.order("issued_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

export const useCreateWarning = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const { data, error } = await supabase.from("employee_warnings").insert(values as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employee_warnings"] }),
  });
};

// ============ Employee Milestones ============
export const useEmployeeMilestones = (orgId: string | undefined, userId?: string) =>
  useQuery({
    queryKey: ["employee_milestones", orgId, userId],
    queryFn: async () => {
      let q = supabase.from("employee_milestones").select("*").eq("org_id", orgId!);
      if (userId) q = q.eq("user_id", userId);
      const { data, error } = await q.order("milestone_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
