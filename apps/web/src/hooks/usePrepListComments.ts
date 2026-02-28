import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface PrepListComment {
  id: string;
  prep_list_id: string;
  task_id: string | null;
  content: string;
  user_id: string;
  user_name: string | null;
  created_at: string;
}

export function usePrepListComments(prepListId: string | null) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<PrepListComment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = async () => {
    if (!prepListId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("prep_list_comments")
      .select("*")
      .eq("prep_list_id", prepListId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error);
    } else {
      setComments(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchComments();
  }, [prepListId]);

  const addComment = async (content: string, taskId?: string) => {
    if (!prepListId || !user) return null;

    const { data, error } = await supabase
      .from("prep_list_comments")
      .insert({
        prep_list_id: prepListId,
        task_id: taskId || null,
        content,
        user_id: user.id,
        user_name: profile?.full_name || user.email?.split("@")[0],
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
      return null;
    }

    fetchComments();
    return data;
  };

  const deleteComment = async (commentId: string) => {
    const { error } = await supabase
      .from("prep_list_comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
      return false;
    }

    fetchComments();
    return true;
  };

  return {
    comments,
    loading,
    fetchComments,
    addComment,
    deleteComment,
  };
}
