import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

type UrgencyLevel = "priority" | "end_of_day" | "within_48h";

export interface PrepTemplateItem {
  id: string;
  task: string;
  quantity: string;
  urgency: UrgencyLevel;
}

export interface PrepListTemplate {
  id: string;
  name: string;
  section_id: string | null;
  schedule_type: "daily" | "weekly" | "one_time";
  schedule_days: string[];
  items: PrepTemplateItem[];
  default_assignee_name: string | null;
  created_by: string | null;
  is_active: boolean;
  auto_generate_enabled: boolean;
  auto_generate_time: string | null;
  created_at: string;
  updated_at: string;
}

export function usePrepTemplates(sectionId?: string) {
  const { user } = useAuth();
  const { currentOrg } = useOrg();
  const [templates, setTemplates] = useState<PrepListTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    setLoading(true);
    let query = supabase
      .from("prep_list_templates")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (sectionId) {
      query = query.eq("section_id", sectionId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching templates:", error);
      toast.error("Failed to load templates");
    } else {
      const formatted = (data || []).map((t) => ({
        ...t,
        schedule_type: t.schedule_type as "daily" | "weekly" | "one_time",
        schedule_days: t.schedule_days || [],
        items: (Array.isArray(t.items) ? t.items : []) as unknown as PrepTemplateItem[],
      }));
      setTemplates(formatted);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTemplates();
  }, [sectionId]);

  const createTemplate = async (
    template: Omit<PrepListTemplate, "id" | "created_at" | "updated_at" | "created_by">
  ) => {
    const { data, error } = await supabase
      .from("prep_list_templates")
      .insert({
        ...template,
        items: JSON.parse(JSON.stringify(template.items)),
        created_by: user?.id,
        org_id: currentOrg?.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating template:", error);
      toast.error("Failed to create template");
      return null;
    }

    toast.success("Template created");
    fetchTemplates();
    return data;
  };

  const updateTemplate = async (
    id: string,
    updates: Partial<Omit<PrepListTemplate, "id" | "created_at" | "updated_at" | "created_by">>
  ) => {
    const updateData: Record<string, unknown> = { ...updates };
    if (updates.items) {
      updateData.items = JSON.parse(JSON.stringify(updates.items));
    }

    const { error } = await supabase
      .from("prep_list_templates")
      .update(updateData)
      .eq("id", id);

    if (error) {
      console.error("Error updating template:", error);
      toast.error("Failed to update template");
      return false;
    }

    toast.success("Template updated");
    fetchTemplates();
    return true;
  };

  const deleteTemplate = async (id: string) => {
    const { error } = await supabase
      .from("prep_list_templates")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      console.error("Error deleting template:", error);
      toast.error("Failed to delete template");
      return false;
    }

    toast.success("Template deleted");
    fetchTemplates();
    return true;
  };

  return {
    templates,
    loading,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
}
