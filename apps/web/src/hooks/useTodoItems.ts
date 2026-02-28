import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";

export interface TodoItem {
  id: string;
  org_id: string;
  title: string;
  description: string | null;
  category: string;
  quantity: string | null;
  unit: string | null;
  status: string;
  source_type: string | null;
  source_recipe_id: string | null;
  source_batch_code: string | null;
  priority: string;
  due_date: string | null;
  photo_url: string | null;
  photo_note: string | null;
  created_by: string | null;
  completed_at: string | null;
  archived_at: string | null;
  assigned_to_name: string | null;
  section_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AddTodoInput {
  title: string;
  description?: string;
  category?: string;
  quantity?: string;
  unit?: string;
  priority?: string;
  due_date?: string;
  source_type?: string;
  source_recipe_id?: string;
  source_batch_code?: string;
}

export interface ScaledIngredient {
  name: string;
  scaledQuantity: number;
  unit: string;
  grossQuantity: number;
}

const todoTable = () => supabase.from("todo_items" as any);

export const useTodoItems = () => {
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const orgId = currentOrg?.id;

  const { data: todos = [], isLoading } = useQuery({
    queryKey: ["todo-items", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await todoTable()
        .select("*")
        .eq("org_id", orgId)
        .order("status", { ascending: true })
        .order("priority", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as TodoItem[];
    },
    enabled: !!orgId,
  });

  const pendingCount = todos.filter(t => t.status === "pending").length;

  const addTodo = useMutation({
    mutationFn: async (input: AddTodoInput) => {
      if (!orgId) throw new Error("No org");
      const { data, error } = await todoTable()
        .insert({
          org_id: orgId,
          title: input.title,
          description: input.description || null,
          category: input.category || "general",
          quantity: input.quantity || null,
          unit: input.unit || null,
          priority: input.priority || "medium",
          due_date: input.due_date || null,
          source_type: input.source_type || "manual",
          source_recipe_id: input.source_recipe_id || null,
          source_batch_code: input.source_batch_code || null,
          created_by: user?.id || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todo-items", orgId] }),
  });

  const updateTodo = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Pick<TodoItem, "title" | "description" | "priority" | "due_date" | "photo_url" | "photo_note" | "category" | "quantity" | "unit" | "status" | "archived_at" | "assigned_to_name" | "section_id">>) => {
      const { error } = await todoTable().update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todo-items", orgId] }),
  });

  const uploadPhoto = async (file: File, itemId: string): Promise<string> => {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${orgId}/${itemId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("todo-photos").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("todo-photos").getPublicUrl(path);
    return data.publicUrl;
  };

  const addFromRecipeScale = useMutation({
    mutationFn: async ({
      recipeId,
      recipeName,
      ingredients,
    }: {
      recipeId: string;
      recipeName: string;
      ingredients: ScaledIngredient[];
    }) => {
      if (!orgId) throw new Error("No org");
      const { data: existing } = await todoTable()
        .select("id, title, quantity, unit")
        .eq("org_id", orgId)
        .eq("category", "shopping")
        .eq("status", "pending");

      const existingItems = (existing || []) as any[];
      const existingMap = new Map(
        existingItems.map((e: any) => [`${String(e.title).toLowerCase()}|${String(e.unit || "").toLowerCase()}`, e])
      );

      const toInsert: any[] = [];
      const toUpdate: { id: string; quantity: string }[] = [];

      for (const ing of ingredients) {
        const key = `${ing.name.toLowerCase()}|${ing.unit.toLowerCase()}`;
        const match = existingMap.get(key);
        if (match) {
          const oldQty = parseFloat(match.quantity || "0");
          const newQty = oldQty + ing.grossQuantity;
          toUpdate.push({ id: match.id, quantity: newQty.toFixed(2) });
        } else {
          toInsert.push({
            org_id: orgId,
            title: ing.name,
            category: "shopping",
            quantity: ing.grossQuantity.toFixed(2),
            unit: ing.unit,
            source_type: "recipe",
            source_recipe_id: recipeId,
            priority: "medium",
            created_by: user?.id || null,
            description: `From: ${recipeName}`,
          });
        }
      }

      if (toInsert.length > 0) {
        const { error } = await todoTable().insert(toInsert);
        if (error) throw error;
      }

      for (const u of toUpdate) {
        await todoTable().update({ quantity: u.quantity }).eq("id", u.id);
      }

      return toInsert.length + toUpdate.length;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todo-items", orgId] }),
  });

  const toggleComplete = useMutation({
    mutationFn: async (id: string) => {
      const item = todos.find(t => t.id === id);
      if (!item) throw new Error("Not found");
      const newStatus = item.status === "done" ? "pending" : "done";
      const { error } = await todoTable()
        .update({
          status: newStatus,
          completed_at: newStatus === "done" ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todo-items", orgId] }),
  });

  const deleteTodo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await todoTable().delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todo-items", orgId] }),
  });

  const clearCompleted = useMutation({
    mutationFn: async (category?: string) => {
      if (!orgId) throw new Error("No org");
      let query = todoTable().delete().eq("org_id", orgId).eq("status", "done");
      if (category) query = query.eq("category", category);
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todo-items", orgId] }),
  });

  return {
    todos,
    isLoading,
    pendingCount,
    addTodo,
    updateTodo,
    uploadPhoto,
    addFromRecipeScale,
    toggleComplete,
    deleteTodo,
    clearCompleted,
  };
};
