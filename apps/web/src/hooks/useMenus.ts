import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Menu, MenuItem, Allergen, WorkflowStage, RemedialNote } from "@/types/menu";
import { toast } from "sonner";

// Convert DB row to Menu type
function dbToMenu(row: any, items: any[]): Menu {
  return {
    id: row.id,
    name: row.name,
    version: row.version,
    status: row.status as 'draft' | 'active' | 'archived',
    effectiveFrom: new Date(row.effective_from),
    effectiveTo: row.effective_to ? new Date(row.effective_to) : undefined,
    avgFoodCostPercent: Number(row.avg_food_cost_percent) || 0,
    totalItems: items.length,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    items: items.map(dbToMenuItem),
    workflowStage: (row.workflow_stage || 'input') as WorkflowStage,
    archiveNotes: row.archive_notes || undefined,
    remedialNotes: Array.isArray(row.remedial_notes) ? row.remedial_notes : [],
  };
}

// Convert DB row to MenuItem type
function dbToMenuItem(row: any): MenuItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    recipeId: row.recipe_id,
    sellPrice: Number(row.sell_price) || 0,
    foodCost: Number(row.food_cost) || 0,
    foodCostPercent: Number(row.food_cost_percent) || 0,
    contributionMargin: Number(row.contribution_margin) || 0,
    popularity: row.popularity || 0,
    profitability: row.profitability as MenuItem['profitability'],
    isActive: row.is_active,
    menuId: row.menu_id,
    allergens: (row.allergens || []) as Allergen[],
  };
}

export function useMenus() {
  const queryClient = useQueryClient();

  const { data: menus = [], isLoading, error } = useQuery({
    queryKey: ["menus"],
    queryFn: async () => {
      // Fetch all menus
      const { data: menusData, error: menusError } = await supabase
        .from("menus")
        .select("*")
        .order("created_at", { ascending: false });

      if (menusError) throw menusError;
      if (!menusData?.length) return [];

      // Fetch all menu items for these menus
      const menuIds = menusData.map(m => m.id);
      const { data: itemsData, error: itemsError } = await supabase
        .from("menu_items")
        .select("*")
        .in("menu_id", menuIds);

      if (itemsError) throw itemsError;

      // Group items by menu_id
      const itemsByMenu = (itemsData || []).reduce((acc, item) => {
        if (!acc[item.menu_id]) acc[item.menu_id] = [];
        acc[item.menu_id].push(item);
        return acc;
      }, {} as Record<string, any[]>);

      // Convert to Menu objects
      return menusData.map(menu => dbToMenu(menu, itemsByMenu[menu.id] || []));
    },
  });

  // Create and activate menu via RPC (bypasses RLS)
  const createMenuMutation = useMutation({
    mutationFn: async ({ name, orgId }: { name: string; orgId: string }) => {
      const { data, error } = await supabase.rpc('create_and_activate_menu', {
        p_name: name,
        p_org_id: orgId,
      });
      if (error) throw error;
      const menuId = data as string;
      console.log(`[createMenu] RPC created and activated menu: ${menuId}`);
      if (!menuId) throw new Error('Menu creation failed: no ID returned');
      return { id: menuId, name } as any;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
    },
    onError: (err) => {
      console.error("Create menu error:", err);
      toast.error("Failed to create menu");
    },
  });

  // Rename menu mutation
  const renameMenuMutation = useMutation({
    mutationFn: async ({ menuId, newName }: { menuId: string; newName: string }) => {
      const { error } = await supabase
        .from("menus")
        .update({ name: newName })
        .eq("id", menuId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
    },
  });

  // Archive menu via RPC (bypasses RLS)
  const archiveMenuMutation = useMutation({
    mutationFn: async (menuId: string) => {
      const { data, error } = await supabase.rpc('archive_menu', { p_menu_id: menuId });
      if (error) throw error;
      if (!data) throw new Error('Archive failed: no result returned');
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["menus"] });
    },
  });

  // Unarchive menu via RPC (bypasses RLS)
  const unarchiveMenuMutation = useMutation({
    mutationFn: async (menuId: string) => {
      const { data, error } = await supabase.rpc('unarchive_menu', { p_menu_id: menuId });
      if (error) throw error;
      if (!data) throw new Error('Unarchive failed: no result returned');
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["menus"] });
    },
  });

  // Activate menu mutation (deactivates others first)
  const activateMenuMutation = useMutation({
    mutationFn: async (menuId: string) => {
      // First, archive any currently active menu
      const { error: archiveError } = await supabase
        .from("menus")
        .update({ status: "archived", effective_to: new Date().toISOString() })
        .eq("status", "active");
      
      if (archiveError) throw archiveError;

      // Then activate the target menu
      const { error } = await supabase
        .from("menus")
        .update({ status: "active", effective_to: null })
        .eq("id", menuId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
    },
  });

  // Delete menu mutation
  const deleteMenuMutation = useMutation({
    mutationFn: async (menuId: string) => {
      const { error } = await supabase
        .from("menus")
        .delete()
        .eq("id", menuId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
    },
  });

  // Duplicate menu mutation
  const duplicateMenuMutation = useMutation({
    mutationFn: async ({ menuId, newName }: { menuId: string; newName: string }) => {
      // First get the source menu items
      const { data: sourceItems, error: itemsError } = await supabase
        .from("menu_items")
        .select("*")
        .eq("menu_id", menuId);
      if (itemsError) throw itemsError;

      // Create new menu
      const { data: userData } = await supabase.auth.getUser();
      const { data: newMenu, error: menuError } = await supabase
        .from("menus")
        .insert({ name: newName, created_by: userData.user?.id })
        .select()
        .single();
      if (menuError) throw menuError;

      // Copy items to new menu
      if (sourceItems?.length) {
        const newItems = sourceItems.map(item => ({
          menu_id: newMenu.id,
          name: item.name,
          category: item.category,
          description: item.description,
          recipe_id: item.recipe_id,
          sell_price: item.sell_price,
          food_cost: item.food_cost,
          food_cost_percent: item.food_cost_percent,
          contribution_margin: item.contribution_margin,
          popularity: item.popularity,
          profitability: item.profitability,
          is_active: item.is_active,
          allergens: item.allergens,
        }));
        const { error: copyError } = await supabase
          .from("menu_items")
          .insert(newItems);
        if (copyError) throw copyError;
      }

      return newMenu;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
    },
  });

  // Add menu item mutation
  const addMenuItemMutation = useMutation({
    mutationFn: async ({ menuId, item }: { menuId: string; item: Omit<MenuItem, 'id' | 'menuId'> }) => {
      const { data, error } = await supabase
        .from("menu_items")
        .insert({
          menu_id: menuId,
          name: item.name,
          category: item.category,
          description: item.description,
          recipe_id: item.recipeId,
          sell_price: item.sellPrice,
          food_cost: item.foodCost,
          food_cost_percent: item.foodCostPercent,
          contribution_margin: item.contributionMargin,
          popularity: item.popularity,
          profitability: item.profitability,
          is_active: item.isActive,
          allergens: item.allergens,
        })
        .select()
        .single();
      if (error) throw error;
      return dbToMenuItem(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
    },
  });

  // Update menu item mutation
  const updateMenuItemMutation = useMutation({
    mutationFn: async (item: MenuItem) => {
      const { error } = await supabase
        .from("menu_items")
        .update({
          name: item.name,
          category: item.category,
          description: item.description,
          recipe_id: item.recipeId,
          sell_price: item.sellPrice,
          food_cost: item.foodCost,
          food_cost_percent: item.foodCostPercent,
          contribution_margin: item.contributionMargin,
          popularity: item.popularity,
          profitability: item.profitability,
          is_active: item.isActive,
          allergens: item.allergens,
        })
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
    },
  });

  // Delete menu item mutation
  const deleteMenuItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from("menu_items")
        .delete()
        .eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
    },
  });

  // Batch add menu items via RPC (bypasses RLS)
  const batchAddMenuItemsMutation = useMutation({
    mutationFn: async ({ menuId, items }: { menuId: string; items: Omit<MenuItem, 'id' | 'menuId'>[]; orgId?: string }) => {
      const p_items = items.map(item => ({
        name: item.name,
        description: item.description || '',
        category: item.category || 'Uncategorized',
        sell_price: item.sellPrice || 0,
      }));
      const { data, error } = await supabase.rpc('batch_insert_menu_items', {
        p_menu_id: menuId,
        p_items: p_items as any,
      });
      if (error) throw error;
      const insertedCount = data as number;
      console.log(`[batchAddMenuItems] RPC inserted ${insertedCount} items`);
      if (insertedCount === 0) throw new Error('No items were inserted');
      return insertedCount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
    },
  });

  // Batch create blank recipes via RPC (bypasses RLS)
  const batchCreateRecipesForMenuMutation = useMutation({
    mutationFn: async (menuId: string) => {
      const { data, error } = await supabase.rpc('batch_create_menu_recipes', {
        p_menu_id: menuId,
      });
      if (error) throw error;
      const createdCount = data as number;
      console.log(`[batchCreateRecipes] RPC created ${createdCount} recipes`);
      return createdCount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
    onError: (err) => {
      console.error("Batch create recipes error:", err);
      toast.error("Failed to create recipes");
    },
  });

  // Update workflow stage mutation
  const updateWorkflowStageMutation = useMutation({
    mutationFn: async ({ menuId, stage }: { menuId: string; stage: WorkflowStage }) => {
      const { error } = await supabase
        .from("menus")
        .update({ workflow_stage: stage })
        .eq("id", menuId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
    },
  });

  // Update remedial notes mutation
  const updateRemedialNotesMutation = useMutation({
    mutationFn: async ({ menuId, notes }: { menuId: string; notes: RemedialNote[] }) => {
      const { error } = await supabase
        .from("menus")
        .update({ remedial_notes: notes as any })
        .eq("id", menuId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
    },
  });

  // Helper functions
  const getActiveMenu = () => menus.find(m => m.status === 'active') || null;
  const getArchivedMenus = () => menus.filter(m => m.status === 'archived');
  const getDraftMenus = () => menus.filter(m => m.status === 'draft');
  const getMenuById = (menuId: string) => menus.find(m => m.id === menuId);

  return {
    menus,
    isLoading,
    error,
    getActiveMenu,
    getArchivedMenus,
    getDraftMenus,
    getMenuById,
    createMenu: (args: { name: string; orgId: string }) => createMenuMutation.mutateAsync(args),
    renameMenu: renameMenuMutation.mutate,
    activateMenu: activateMenuMutation.mutateAsync,
    archiveMenu: (menuId: string) => archiveMenuMutation.mutateAsync(menuId),
    unarchiveMenu: (menuId: string) => unarchiveMenuMutation.mutateAsync(menuId),
    deleteMenu: deleteMenuMutation.mutate,
    duplicateMenu: duplicateMenuMutation.mutateAsync,
    addMenuItem: addMenuItemMutation.mutateAsync,
    updateMenuItem: updateMenuItemMutation.mutate,
    deleteMenuItem: deleteMenuItemMutation.mutate,
    batchAddMenuItems: batchAddMenuItemsMutation.mutateAsync,
    batchCreateRecipesForMenu: batchCreateRecipesForMenuMutation.mutateAsync,
    updateWorkflowStage: updateWorkflowStageMutation.mutate,
    updateRemedialNotes: updateRemedialNotesMutation.mutate,
    isPending: createMenuMutation.isPending ||
               addMenuItemMutation.isPending ||
               batchAddMenuItemsMutation.isPending ||
               batchCreateRecipesForMenuMutation.isPending,
  };
}
