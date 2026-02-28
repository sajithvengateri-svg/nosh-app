import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";

export interface TodoTemplateItem {
  title: string;
  category: string;
  priority: string;
  quantity?: string;
  unit?: string;
}

export interface TodoTemplate {
  id: string;
  org_id: string;
  name: string;
  items: TodoTemplateItem[];
  created_by: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const templateTable = () => supabase.from("todo_templates" as any);
const todoTable = () => supabase.from("todo_items" as any);

export const useTodoTemplates = () => {
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const orgId = currentOrg?.id;

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["todo-templates", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await templateTable()
        .select("*")
        .eq("org_id", orgId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as TodoTemplate[];
    },
    enabled: !!orgId,
  });

  const saveAsTemplate = useMutation({
    mutationFn: async ({ name, items }: { name: string; items: TodoTemplateItem[] }) => {
      if (!orgId) throw new Error("No org");
      const { error } = await templateTable().insert({
        org_id: orgId,
        name,
        items: JSON.stringify(items),
        created_by: user?.id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todo-templates", orgId] }),
  });

  const loadTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      if (!orgId) throw new Error("No org");
      const template = templates.find(t => t.id === templateId);
      if (!template) throw new Error("Template not found");

      const items = (typeof template.items === "string" ? JSON.parse(template.items) : template.items) as TodoTemplateItem[];
      if (items.length === 0) throw new Error("Template is empty");

      const rows = items.map(item => ({
        org_id: orgId,
        title: item.title,
        category: item.category || "general",
        priority: item.priority || "medium",
        quantity: item.quantity || null,
        unit: item.unit || null,
        source_type: "template",
        created_by: user?.id || null,
      }));

      const { error } = await todoTable().insert(rows);
      if (error) throw error;
      return items.length;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todo-items", orgId] }),
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await templateTable().update({ is_active: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todo-templates", orgId] }),
  });

  return { templates, isLoading, saveAsTemplate, loadTemplate, deleteTemplate };
};
