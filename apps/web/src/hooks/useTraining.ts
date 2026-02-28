import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TrainingCard {
  id: string;
  title: string;
  content: string;
  tips: string[];
  encouragement?: string;
  order: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export interface TrainingModule {
  id: string;
  title: string;
  category: string;
  content: string | null;
  file_url: string | null;
  cards: TrainingCard[];
  quiz: QuizQuestion[];
  source_file_urls: string[];
  processing_status: "draft" | "processing" | "ready" | "error";
  card_count: number;
  estimated_minutes: number;
  duration_minutes: number | null;
  required_for: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  material_id: string;
  cards_completed: string[];
  last_card_index: number;
  quiz_answers: { question_id: string; selected_index: number; correct: boolean }[];
  quiz_score: number | null;
  quiz_completed_at: string | null;
  completed_at: string | null;
  started_at: string;
  score: number | null;
}

export interface TrainingNotification {
  id: string;
  org_id: string;
  user_id: string | null;
  type: string;
  payload: Record<string, any>;
  read_at: string | null;
  created_at: string;
}

export interface ModuleLimit {
  tier: string;
  current_count: number;
  max_modules: number;
  can_create: boolean;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useTraining(moduleId?: string) {
  const queryClient = useQueryClient();
  const { currentOrg } = useOrg();
  const { user, isHeadChef, isOwner } = useAuth();
  const orgId = currentOrg?.id;
  const userId = user?.id;
  const isAdmin = isHeadChef || isOwner;

  // ── Queries ─────────────────────────────────────────────────────────────

  const { data: modules = [], isLoading: modulesLoading } = useQuery({
    queryKey: ["training-modules", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_materials" as any)
        .select("*")
        .eq("org_id", orgId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as TrainingModule[]) || [];
    },
    enabled: !!orgId,
  });

  const { data: myProgress = [], isLoading: progressLoading } = useQuery({
    queryKey: ["training-progress", orgId, userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_records" as any)
        .select("*")
        .eq("user_id", userId!);
      if (error) throw error;
      return (data as unknown as UserProgress[]) || [];
    },
    enabled: !!userId,
  });

  // Team progress (admin only)
  const { data: teamProgress = [] } = useQuery({
    queryKey: ["training-team-progress", orgId],
    queryFn: async () => {
      // Get all org members
      const { data: members } = await supabase
        .from("org_memberships")
        .select("user_id, role")
        .eq("org_id", orgId!)
        .eq("is_active", true);
      if (!members?.length) return [];

      const userIds = members.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const { data: records } = await supabase
        .from("training_records" as any)
        .select("*")
        .in("user_id", userIds);

      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.full_name]));
      const recordsByUser = new Map<string, UserProgress[]>();
      for (const r of (records as unknown as UserProgress[]) || []) {
        const existing = recordsByUser.get(r.user_id) || [];
        existing.push(r);
        recordsByUser.set(r.user_id, existing);
      }

      return members.map((m) => ({
        user_id: m.user_id,
        full_name: profileMap.get(m.user_id) || "Unknown",
        role: m.role,
        records: recordsByUser.get(m.user_id) || [],
      }));
    },
    enabled: !!orgId && isAdmin,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["training-notifications", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_notifications" as any)
        .select("*")
        .eq("org_id", orgId!)
        .is("read_at", null)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data as unknown as TrainingNotification[]) || [];
    },
    enabled: !!orgId && isAdmin,
  });

  const { data: moduleLimit } = useQuery({
    queryKey: ["training-module-limit", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_training_module_limit", { p_org_id: orgId! });
      if (error) throw error;
      return data as unknown as ModuleLimit;
    },
    enabled: !!orgId && isAdmin,
  });

  // ── Single module (for TrainingPlayer) ──────────────────────────────────

  const { data: singleModule, isLoading: singleModuleLoading } = useQuery({
    queryKey: ["training-module", moduleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_materials" as any)
        .select("*")
        .eq("id", moduleId!)
        .single();
      if (error) throw error;
      return data as unknown as TrainingModule;
    },
    enabled: !!moduleId,
  });

  const cards: TrainingCard[] = singleModule?.cards
    ? [...singleModule.cards].sort((a, b) => a.order - b.order)
    : [];

  const questions: QuizQuestion[] = singleModule?.quiz || [];

  // ── Mutations ───────────────────────────────────────────────────────────

  const createModule = useMutation({
    mutationFn: async (params: { title: string; category: string; required_for?: string[] }) => {
      const { data, error } = await supabase
        .from("training_materials" as any)
        .insert({
          title: params.title,
          category: params.category,
          required_for: params.required_for || [],
          org_id: orgId,
          created_by: userId,
          processing_status: "draft",
        })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as TrainingModule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-modules", orgId] });
      queryClient.invalidateQueries({ queryKey: ["training-module-limit", orgId] });
    },
  });

  const uploadAndProcess = useMutation({
    mutationFn: async (params: { materialId: string; file: File }) => {
      // 1. Upload file to storage
      const ext = params.file.name.split(".").pop() || "pdf";
      const path = `${orgId}/${params.materialId}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("training-files")
        .upload(path, params.file);
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from("training-files").getPublicUrl(path);

      // 2. Update source_file_urls
      await supabase
        .from("training_materials" as any)
        .update({
          source_file_urls: [urlData.publicUrl],
          processing_status: "processing",
        })
        .eq("id", params.materialId);

      // 3. Invoke edge function
      const formData = new FormData();
      formData.append("file", params.file);
      formData.append("material_id", params.materialId);

      const { data, error } = await supabase.functions.invoke("process-training-file", {
        body: formData,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-modules", orgId] });
      toast.success("Training module processed successfully!");
    },
    onError: (err) => {
      toast.error("Failed to process training file: " + (err as Error).message);
      queryClient.invalidateQueries({ queryKey: ["training-modules", orgId] });
    },
  });

  const updateProgress = useMutation({
    mutationFn: async (params: { materialId: string; cardsCompleted: string[]; lastCardIndex: number }) => {
      const { data: existing } = await supabase
        .from("training_records" as any)
        .select("id")
        .eq("user_id", userId!)
        .eq("material_id", params.materialId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("training_records" as any)
          .update({
            cards_completed: params.cardsCompleted,
            last_card_index: params.lastCardIndex,
          })
          .eq("id", (existing as any).id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("training_records" as any)
          .insert({
            user_id: userId,
            material_id: params.materialId,
            cards_completed: params.cardsCompleted,
            last_card_index: params.lastCardIndex,
            started_at: new Date().toISOString(),
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-progress", orgId, userId] });
    },
  });

  const submitQuiz = useMutation({
    mutationFn: async (params: {
      materialId: string;
      answers: { question_id: string; selected_index: number; correct: boolean }[];
      score: number;
    }) => {
      const { data: existing } = await supabase
        .from("training_records" as any)
        .select("id")
        .eq("user_id", userId!)
        .eq("material_id", params.materialId)
        .maybeSingle();

      const updateData = {
        quiz_answers: params.answers,
        quiz_score: params.score,
        quiz_completed_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        score: params.score,
      };

      if (existing) {
        await supabase
          .from("training_records" as any)
          .update(updateData)
          .eq("id", (existing as any).id);
      } else {
        await supabase.from("training_records" as any).insert({
          user_id: userId,
          material_id: params.materialId,
          ...updateData,
          started_at: new Date().toISOString(),
        });
      }

      // Create notification for admin
      if (orgId) {
        const module = modules.find((m) => m.id === params.materialId);
        await supabase.from("training_notifications" as any).insert({
          org_id: orgId,
          user_id: userId,
          type: "quiz_completed",
          payload: {
            material_id: params.materialId,
            module_title: module?.title,
            score: params.score,
            user_name: user?.user_metadata?.full_name || user?.email,
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-progress", orgId, userId] });
      queryClient.invalidateQueries({ queryKey: ["training-notifications", orgId] });
    },
  });

  const markNotificationRead = useMutation({
    mutationFn: async (notificationId: string) => {
      await supabase
        .from("training_notifications" as any)
        .update({ read_at: new Date().toISOString() })
        .eq("id", notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-notifications", orgId] });
    },
  });

  const deleteModule = useMutation({
    mutationFn: async (materialId: string) => {
      const { error } = await supabase
        .from("training_materials" as any)
        .delete()
        .eq("id", materialId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-modules", orgId] });
      queryClient.invalidateQueries({ queryKey: ["training-module-limit", orgId] });
      toast.success("Module deleted");
    },
  });

  // ── Computed ────────────────────────────────────────────────────────────

  const progressMap = new Map(myProgress.map((p) => [p.material_id, p]));

  function getModuleStatus(module: TrainingModule) {
    if (module.processing_status !== "ready") return module.processing_status;
    const progress = progressMap.get(module.id);
    if (!progress) return "not-started";
    if (progress.completed_at) return "completed";
    return "in-progress";
  }

  const readyModules = modules.filter((m) => m.processing_status === "ready");
  const completedCount = readyModules.filter((m) => progressMap.get(m.id)?.completed_at).length;
  const inProgressCount = readyModules.filter(
    (m) => progressMap.has(m.id) && !progressMap.get(m.id)?.completed_at
  ).length;
  const avgQuizScore = (() => {
    const scores = myProgress.filter((p) => p.quiz_score != null).map((p) => p.quiz_score!);
    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  })();

  return {
    // Data
    modules,
    myProgress,
    progressMap,
    teamProgress,
    notifications,
    moduleLimit: {
      tier: moduleLimit?.tier ?? "free",
      used: moduleLimit?.current_count ?? 0,
      max: moduleLimit?.max_modules ?? 3,
      canCreate: moduleLimit?.can_create ?? true,
    },
    // Single module (TrainingPlayer)
    module: singleModule,
    cards,
    questions,
    // Computed
    isAdmin,
    completedCount,
    inProgressCount,
    avgQuizScore,
    getModuleStatus,
    // Loading
    isLoading: modulesLoading || progressLoading || (!!moduleId && singleModuleLoading),
    // Mutations
    createModule: createModule.mutateAsync,
    isCreating: createModule.isPending,
    uploadAndProcess: uploadAndProcess.mutateAsync,
    isProcessing: uploadAndProcess.isPending,
    updateProgress,
    submitQuiz,
    markNotificationRead: markNotificationRead.mutateAsync,
    deleteModule: deleteModule.mutateAsync,
  };
}
