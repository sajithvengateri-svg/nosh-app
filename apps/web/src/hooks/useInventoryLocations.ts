import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type { InventoryLocation } from '@/lib/shared/types/inventory.types';
import type { InventoryLocation } from '@/lib/shared/types/inventory.types';

export const useInventoryLocations = () => {
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLocations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("inventory_locations")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");

    if (error) {
      console.error("Error fetching inventory locations:", error);
      toast.error("Failed to load locations");
    } else {
      setLocations(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const addLocation = async (name: string, description?: string) => {
    const maxOrder = locations.length > 0 
      ? Math.max(...locations.map(l => l.sort_order)) + 1 
      : 0;

    const { data, error } = await supabase
      .from("inventory_locations")
      .insert({ name, description: description || null, sort_order: maxOrder })
      .select()
      .single();

    if (error) {
      console.error("Error adding location:", error);
      toast.error("Failed to add location");
      return null;
    }

    toast.success("Location added");
    await fetchLocations();
    return data;
  };

  const updateLocation = async (id: string, updates: Partial<Pick<InventoryLocation, "name" | "description" | "color">>) => {
    const { error } = await supabase
      .from("inventory_locations")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("Error updating location:", error);
      toast.error("Failed to update location");
      return false;
    }

    toast.success("Location updated");
    await fetchLocations();
    return true;
  };

  const deleteLocation = async (id: string) => {
    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from("inventory_locations")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      console.error("Error deleting location:", error);
      toast.error("Failed to delete location");
      return false;
    }

    toast.success("Location removed");
    await fetchLocations();
    return true;
  };

  const reorderLocations = async (reorderedLocations: InventoryLocation[]) => {
    const updates = reorderedLocations.map((loc, index) => ({
      id: loc.id,
      sort_order: index,
    }));

    for (const update of updates) {
      await supabase
        .from("inventory_locations")
        .update({ sort_order: update.sort_order })
        .eq("id", update.id);
    }

    await fetchLocations();
  };

  return {
    locations,
    loading,
    addLocation,
    updateLocation,
    deleteLocation,
    reorderLocations,
    refetch: fetchLocations,
  };
};
