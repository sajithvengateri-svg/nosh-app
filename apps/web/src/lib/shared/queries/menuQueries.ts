// Menu queries — extracted from useMenus.ts
// These functions encapsulate all Supabase calls for menus/menu_items

import { supabase } from "../supabaseClient";
import { Menu, MenuItem, Allergen } from '../types/menu.types';

// Convert DB row to Menu type
export function dbToMenu(row: any, items: any[]): Menu {
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
  };
}

// Convert DB row to MenuItem type
export function dbToMenuItem(row: any): MenuItem {
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

// Fetch all menus with their items
export async function fetchAllMenus(): Promise<Menu[]> {
  const { data: menusData, error: menusError } = await supabase
    .from("menus")
    .select("*")
    .order("created_at", { ascending: false });

  if (menusError) throw menusError;
  if (!menusData?.length) return [];

  const menuIds = menusData.map(m => m.id);
  const { data: itemsData, error: itemsError } = await supabase
    .from("menu_items")
    .select("*")
    .in("menu_id", menuIds);

  if (itemsError) throw itemsError;

  const itemsByMenu = (itemsData || []).reduce((acc, item) => {
    if (!acc[item.menu_id]) acc[item.menu_id] = [];
    acc[item.menu_id].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  return menusData.map(menu => dbToMenu(menu, itemsByMenu[menu.id] || []));
}

// Create a new menu
export async function createMenuQuery(name: string, orgId: string) {
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("menus")
    .insert({ name, created_by: userData.user?.id, org_id: orgId })
    .select()
    .single();
  if (error) throw error;
  return dbToMenu(data, []);
}

// Rename a menu
export async function renameMenuQuery(menuId: string, newName: string) {
  const { error } = await supabase
    .from("menus")
    .update({ name: newName })
    .eq("id", menuId);
  if (error) throw error;
}

// Update menu status
export async function updateMenuStatusQuery(menuId: string, status: string, effectiveTo?: Date) {
  const updateData: any = { status };
  if (effectiveTo) updateData.effective_to = effectiveTo.toISOString();
  const { error } = await supabase
    .from("menus")
    .update(updateData)
    .eq("id", menuId);
  if (error) throw error;
}

// Activate a menu (archives current active)
export async function activateMenuQuery(menuId: string) {
  const { error: archiveError } = await supabase
    .from("menus")
    .update({ status: "archived", effective_to: new Date().toISOString() })
    .eq("status", "active");
  if (archiveError) throw archiveError;

  const { error } = await supabase
    .from("menus")
    .update({ status: "active", effective_to: null })
    .eq("id", menuId);
  if (error) throw error;
}

// Delete a menu
export async function deleteMenuQuery(menuId: string) {
  const { error } = await supabase
    .from("menus")
    .delete()
    .eq("id", menuId);
  if (error) throw error;
}

// Duplicate a menu
export async function duplicateMenuQuery(menuId: string, newName: string) {
  const { data: sourceItems, error: itemsError } = await supabase
    .from("menu_items")
    .select("*")
    .eq("menu_id", menuId);
  if (itemsError) throw itemsError;

  const { data: userData } = await supabase.auth.getUser();
  const { data: newMenu, error: menuError } = await supabase
    .from("menus")
    .insert({ name: newName, created_by: userData.user?.id })
    .select()
    .single();
  if (menuError) throw menuError;

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
}

// Insert a menu item
export async function insertMenuItemQuery(menuId: string, item: Omit<MenuItem, 'id' | 'menuId'>) {
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
}

// Update a menu item
export async function updateMenuItemQuery(item: MenuItem) {
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
}

// Delete a menu item
export async function deleteMenuItemQuery(itemId: string) {
  const { error } = await supabase
    .from("menu_items")
    .delete()
    .eq("id", itemId);
  if (error) throw error;
}

// Batch insert menu items
export async function batchInsertMenuItemsQuery(menuId: string, items: Omit<MenuItem, 'id' | 'menuId'>[], orgId?: string) {
  const itemsToInsert = items.map(item => ({
    menu_id: menuId,
    ...(orgId ? { org_id: orgId } : {}),
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
  }));
  
  const { data, error } = await supabase
    .from("menu_items")
    .insert(itemsToInsert)
    .select();
  if (error) throw error;
  return data.map(dbToMenuItem);
}
