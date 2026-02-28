import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useOrg } from "../contexts/OrgProvider";
import { useAuth } from "../contexts/AuthProvider";

export interface TeamPost {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar_url: string | null;
  content: string;
  image_url: string | null;
  post_type: "message" | "maintenance_request" | "dish_photo" | "prep_list_shared";
  org_id: string;
  created_at: string;
  reaction_count: number;
  comment_count: number;
  user_reacted: boolean;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  user_name: string;
  user_avatar_url: string | null;
  content: string;
  created_at: string;
}

export function useTeamPosts() {
  const { currentOrg } = useOrg();
  const { profile } = useAuth();
  const orgId = currentOrg?.id;
  const userId = profile?.id;

  return useQuery<TeamPost[]>({
    queryKey: ["team-posts", orgId],
    queryFn: async () => {
      if (!orgId || !userId) return [];

      const { data: posts, error } = await supabase
        .from("team_posts")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      if (!posts || posts.length === 0) return [];

      const postIds = posts.map((p) => p.id);

      // Fetch reaction counts
      const { data: reactions } = await supabase
        .from("post_reactions")
        .select("post_id, user_id")
        .in("post_id", postIds);

      // Fetch comment counts
      const { data: comments } = await supabase
        .from("post_comments")
        .select("post_id")
        .in("post_id", postIds);

      return posts.map((post) => ({
        ...post,
        reaction_count: (reactions || []).filter((r) => r.post_id === post.id).length,
        comment_count: (comments || []).filter((c) => c.post_id === post.id).length,
        user_reacted: (reactions || []).some((r) => r.post_id === post.id && r.user_id === userId),
      }));
    },
    enabled: !!orgId && !!userId,
  });
}

export function usePostComments(postId: string | null) {
  return useQuery<PostComment[]>({
    queryKey: ["post-comments", postId],
    queryFn: async () => {
      if (!postId) return [];
      const { data, error } = await supabase
        .from("post_comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data as PostComment[]) || [];
    },
    enabled: !!postId,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  const { currentOrg } = useOrg();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({
      content,
      postType,
      imageUri,
    }: {
      content: string;
      postType: "message" | "maintenance_request";
      imageUri?: string;
    }) => {
      let imageUrl: string | null = null;

      if (imageUri) {
        const ext = imageUri.split(".").pop() || "jpg";
        const path = `${profile?.id}/${Date.now()}.${ext}`;
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const arrayBuffer = await new Response(blob).arrayBuffer();

        const { error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(path, arrayBuffer, { contentType: `image/${ext}`, upsert: false });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("post-images")
          .getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }

      const actualType = imageUri && postType === "message" ? "dish_photo" : postType;

      const { error } = await supabase.from("team_posts").insert({
        content,
        post_type: actualType,
        image_url: imageUrl,
        user_id: profile?.id,
        user_name: profile?.full_name || "Unknown",
        user_avatar_url: profile?.avatar_url || null,
        org_id: currentOrg?.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-posts"] });
    },
  });
}

export function useToggleReaction() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, currentlyReacted }: { postId: string; currentlyReacted: boolean }) => {
      if (currentlyReacted) {
        const { error } = await supabase
          .from("post_reactions")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", profile?.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("post_reactions").insert({
          post_id: postId,
          user_id: profile?.id,
          reaction_type: "like",
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-posts"] });
    },
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      const { error } = await supabase.from("post_comments").insert({
        post_id: postId,
        user_id: profile?.id,
        user_name: profile?.full_name || "Unknown",
        user_avatar_url: profile?.avatar_url || null,
        content,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["team-posts"] });
      queryClient.invalidateQueries({ queryKey: ["post-comments", vars.postId] });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from("team_posts").delete().eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-posts"] });
    },
  });
}
