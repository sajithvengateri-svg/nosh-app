// Inventory queries — extracted from useInventoryLocations.ts

import { supabase } from "../supabaseClient";
import type { InventoryLocation } from '../types/inventory.types';

export async function fetchActiveLocations() {
  const { data, error } = await supabase
    .from("inventory_locations")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;
  return data || [];
}

export async function insertLocation(name: string, description: string | null, sortOrder: number, orgId?: string | null) {
  const { data, error } = await supabase
    .from("inventory_locations")
    .insert({ name, description, sort_order: sortOrder, ...(orgId ? { org_id: orgId } : {}) })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateLocationQuery(id: string, updates: Partial<Pick<InventoryLocation, "name" | "description" | "color">>) {
  const { error } = await supabase
    .from("inventory_locations")
    .update(updates)
    .eq("id", id);
  if (error) throw error;
}

export async function softDeleteLocation(id: string) {
  const { error } = await supabase
    .from("inventory_locations")
    .update({ is_active: false })
    .eq("id", id);
  if (error) throw error;
}

export async function updateLocationSortOrder(id: string, sortOrder: number) {
  const { error } = await supabase
    .from("inventory_locations")
    .update({ sort_order: sortOrder })
    .eq("id", id);
  if (error) throw error;
}

// ─── Inventory Items ──────────────────────────────

export async function fetchInventoryItems() {
  return supabase
    .from("inventory")
    .select("*, ingredients(cost_per_unit, category, supplier)")
    .order("name");
}

export async function insertInventoryItem(payload: Record<string, unknown>) {
  return supabase.from("inventory").insert(payload as any);
}

export async function updateInventoryItem(id: string, payload: Record<string, unknown>) {
  return supabase.from("inventory").update(payload as any).eq("id", id);
}

export async function deleteInventoryItem(id: string) {
  return supabase.from("inventory").delete().eq("id", id);
}

export async function syncInventoryFromIngredients() {
  return supabase.rpc("sync_inventory_from_ingredients");
}

// ─── Cleaning Inventory ──────────────────────────

export async function fetchCleaningInventory() {
  return supabase.from("cleaning_inventory").select("*").order("category, name" as any);
}

export async function insertCleaningInventoryItem(payload: Record<string, unknown>) {
  return supabase.from("cleaning_inventory").insert(payload as any);
}

export async function updateCleaningInventoryItem(id: string, payload: Record<string, unknown>) {
  return supabase.from("cleaning_inventory").update(payload as any).eq("id", id);
}

export async function deleteCleaningInventoryItem(id: string) {
  return supabase.from("cleaning_inventory").delete().eq("id", id);
}

// ─── Equipment Inventory ─────────────────────────

export async function fetchEquipmentInventory(orgId: string) {
  return supabase.from("equipment_inventory").select("*").eq("org_id", orgId).order("name");
}

export async function insertEquipmentInventoryItem(payload: Record<string, unknown>) {
  return supabase.from("equipment_inventory").insert(payload as any);
}

export async function updateEquipmentInventoryItem(id: string, payload: Record<string, unknown>) {
  return supabase.from("equipment_inventory").update(payload as any).eq("id", id);
}

export async function deleteEquipmentInventoryItem(id: string) {
  return supabase.from("equipment_inventory").delete().eq("id", id);
}
