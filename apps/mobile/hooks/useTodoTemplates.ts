import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useOrg } from "../contexts/OrgProvider";
import { useAuth } from "../contexts/AuthProvider";
import type { PrepItem } from "./usePrepLists";

export interface TodoTemplateItem {
  title: string;
  category: string;
  priority: string;
  quantity?: string;
}

export interface TodoTemplate {
  id: string;
  org_id: string;
  name: string;
  items: TodoTemplateItem[];
  created_by: string | null;
  is_active: boolean;
  created_at: string;
}

export function useTodoTemplates() {
  const { currentOrg } = useOrg();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const orgId = currentOrg?.id;

  const { data: templates = [], isLoading } = useQuery<TodoTemplate[]>({
    queryKey: ["todo-templates", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("todo_templates" as any)
        .select("*")
        .eq("org_id", orgId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data || []) as unknown as TodoTemplate[]).map((t) => ({
        ...t,
        items: typeof t.items === "string" ? JSON.parse(t.items) : t.items,
      }));
    },
    enabled: !!orgId,
  });

  const saveAsTemplate = useMutation({
    mutationFn: async ({ name, items }: { name: string; items: TodoTemplateItem[] }) => {
      if (!orgId) throw new Error("No org");
      const { error } = await (supabase.from("todo_templates" as any) as any).insert({
        org_id: orgId,
        name,
        items: JSON.stringify(items),
        created_by: profile?.id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todo-templates", orgId] }),
  });

  const loadTemplate = useMutation({
    mutationFn: async (templateId: string): Promise<PrepItem[]> => {
      const template = templates.find((t) => t.id === templateId);
      if (!template) throw new Error("Template not found");
      const items = (typeof template.items === "string" ? JSON.parse(template.items) : template.items) as TodoTemplateItem[];
      return items.map((item, i) => ({
        id: `tpl-${Date.now()}-${i}`,
        task: item.title,
        quantity: item.quantity || "",
        completed: false,
        urgency: item.priority === "high" ? ("priority" as const) : undefined,
      }));
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("todo_templates" as any) as any)
        .update({ is_active: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todo-templates", orgId] }),
  });

  return { templates, isLoading, saveAsTemplate, loadTemplate, deleteTemplate };
}
