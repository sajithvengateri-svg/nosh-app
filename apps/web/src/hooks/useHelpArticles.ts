import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HelpStep {
  step_number: number;
  title: string;
  instruction: string;
  tips?: string;
  image_url?: string;
}

export interface HelpArticle {
  id: string;
  module: string;
  page: string;
  title: string;
  subtitle: string;
  icon: string;
  category: string;
  steps: HelpStep[];
  tags: string[];
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export function useHelpArticles(filters?: { module?: string; category?: string; search?: string }) {
  return useQuery({
    queryKey: ["help-articles", filters],
    queryFn: async () => {
      let query = supabase
        .from("help_articles")
        .select("*")
        .eq("is_published", true)
        .order("sort_order", { ascending: true });

      if (filters?.module) {
        query = query.eq("module", filters.module);
      }
      if (filters?.category) {
        query = query.eq("category", filters.category);
      }

      const { data, error } = await query;
      if (error) throw error;

      let articles = (data || []) as unknown as HelpArticle[];

      if (filters?.search) {
        const s = filters.search.toLowerCase();
        articles = articles.filter(
          (a) =>
            a.title.toLowerCase().includes(s) ||
            a.subtitle.toLowerCase().includes(s) ||
            a.tags.some((t) => t.toLowerCase().includes(s)) ||
            (a.steps as HelpStep[]).some(
              (st) =>
                st.title.toLowerCase().includes(s) ||
                st.instruction.toLowerCase().includes(s)
            )
        );
      }

      return articles;
    },
  });
}

export function useAllHelpArticles() {
  return useQuery({
    queryKey: ["help-articles-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("help_articles")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as HelpArticle[];
    },
  });
}

export function useUpsertHelpArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (article: Partial<HelpArticle> & { id?: string }) => {
      const payload = {
        module: article.module,
        page: article.page || "",
        title: article.title,
        subtitle: article.subtitle || "",
        icon: article.icon || "HelpCircle",
        category: article.category || "feature",
        steps: article.steps as any,
        tags: article.tags || [],
        sort_order: article.sort_order || 0,
        is_published: article.is_published ?? true,
      };

      if (article.id) {
        const { data, error } = await supabase
          .from("help_articles")
          .update(payload)
          .eq("id", article.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("help_articles")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["help-articles"] });
      qc.invalidateQueries({ queryKey: ["help-articles-admin"] });
    },
  });
}

export function useDeleteHelpArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("help_articles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["help-articles"] });
      qc.invalidateQueries({ queryKey: ["help-articles-admin"] });
    },
  });
}
