import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RecipeCCP, CCPFormData } from '@/types/ccp';
import { toast } from 'sonner';

export const useRecipeCCPs = (recipeId: string | null) => {
  const [ccps, setCCPs] = useState<RecipeCCP[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCCPs = useCallback(async () => {
    if (!recipeId) {
      setCCPs([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('recipe_ccps')
        .select('*')
        .eq('recipe_id', recipeId)
        .order('step_order', { ascending: true });

      if (error) throw error;
      setCCPs((data as RecipeCCP[]) || []);
    } catch (error) {
      console.error('Error fetching CCPs:', error);
      toast.error('Failed to load control points');
    } finally {
      setLoading(false);
    }
  }, [recipeId]);

  useEffect(() => {
    fetchCCPs();
  }, [fetchCCPs]);

  const addCCP = async (data: CCPFormData): Promise<RecipeCCP | null> => {
    if (!recipeId) return null;

    try {
      const maxOrder = ccps.length > 0 ? Math.max(...ccps.map(c => c.step_order)) : -1;
      
      const { data: newCCP, error } = await supabase
        .from('recipe_ccps')
        .insert({
          recipe_id: recipeId,
          step_order: maxOrder + 1,
          ...data,
        })
        .select()
        .single();

      if (error) throw error;
      
      setCCPs(prev => [...prev, newCCP as RecipeCCP]);
      toast.success('Control point added');
      return newCCP as RecipeCCP;
    } catch (error) {
      console.error('Error adding CCP:', error);
      toast.error('Failed to add control point');
      return null;
    }
  };

  const updateCCP = async (id: string, data: Partial<CCPFormData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('recipe_ccps')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      
      setCCPs(prev => prev.map(ccp => 
        ccp.id === id ? { ...ccp, ...data } : ccp
      ));
      toast.success('Control point updated');
      return true;
    } catch (error) {
      console.error('Error updating CCP:', error);
      toast.error('Failed to update control point');
      return false;
    }
  };

  const deleteCCP = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('recipe_ccps')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setCCPs(prev => prev.filter(ccp => ccp.id !== id));
      toast.success('Control point removed');
      return true;
    } catch (error) {
      console.error('Error deleting CCP:', error);
      toast.error('Failed to remove control point');
      return false;
    }
  };

  const reorderCCPs = async (newOrder: RecipeCCP[]): Promise<boolean> => {
    try {
      const updates = newOrder.map((ccp, index) => ({
        id: ccp.id,
        step_order: index,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('recipe_ccps')
          .update({ step_order: update.step_order })
          .eq('id', update.id);
        
        if (error) throw error;
      }

      setCCPs(newOrder.map((ccp, index) => ({ ...ccp, step_order: index })));
      return true;
    } catch (error) {
      console.error('Error reordering CCPs:', error);
      toast.error('Failed to reorder control points');
      return false;
    }
  };

  return {
    ccps,
    loading,
    addCCP,
    updateCCP,
    deleteCCP,
    reorderCCPs,
    refetch: fetchCCPs,
  };
};
