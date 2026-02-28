import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, 
  MessageCircle, 
  Send, 
  Image as ImageIcon,
  MoreHorizontal,
  Trash2,
  X,
  Loader2,
  Camera,
  AlertTriangle,
  Wrench,
  ClipboardList
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, differenceInMinutes } from "date-fns";

interface Post {
  id: string;
  user_id: string;
  user_name: string | null;
  user_avatar_url: string | null;
  content: string | null;
  image_url: string | null;
  post_type: string;
  created_at: string;
  reactions: { user_id: string; reaction_type: string }[];
  comments: Comment[];
}

interface Comment {
  id: string;
  user_id: string;
  user_name: string | null;
  user_avatar_url: string | null;
  content: string;
  created_at: string;
}

type PostMode = "message" | "maintenance";

interface TeamFeedProps {
  title?: string;
  subtitle?: string;
}

const TeamFeed = ({ title = "Kitchen Wall", subtitle = "Share updates, dish photos & messages" }: TeamFeedProps) => {
  const { user, profile, isHeadChef } = useAuth();
  const { currentOrg } = useOrg();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSectionMap, setUserSectionMap] = useState<Record<string, { sectionName: string; color: string }>>({});
  const [posting, setPosting] = useState(false);
  const [newPost, setNewPost] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [postMode, setPostMode] = useState<PostMode>("message");

  const scrollRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);

  const fetchPosts = useCallback(async () => {
    try {
      const query = supabase
        .from("team_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (currentOrg?.id) {
        query.eq("org_id", currentOrg.id);
      }

      const { data: postsData, error: postsError } = await query;
      if (postsError) throw postsError;

      const postsWithDetails = await Promise.all(
        (postsData || []).map(async (post) => {
          const [reactionsRes, commentsRes] = await Promise.all([
            supabase
              .from("post_reactions")
              .select("user_id, reaction_type")
              .eq("post_id", post.id),
            supabase
              .from("post_comments")
              .select("*")
              .eq("post_id", post.id)
              .order("created_at", { ascending: true }),
          ]);
          return {
            ...post,
            reactions: reactionsRes.data || [],
            comments: commentsRes.data || [],
          };
        })
      );

      setPosts(postsWithDetails);
      if (isInitialLoad.current) {
        isInitialLoad.current = false;
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  }, [currentOrg?.id]);

  // Fetch section assignments for badges
  useEffect(() => {
    if (!currentOrg?.id) return;
    const fetchSectionBadges = async () => {
      const [assignmentsRes, sectionsRes] = await Promise.all([
        supabase
          .from("section_assignments")
          .select("user_id, section_id, role")
          .eq("org_id", currentOrg.id)
          .eq("role", "leader"),
        supabase
          .from("kitchen_sections")
          .select("id, name, color")
          .eq("org_id", currentOrg.id),
      ]);

      const sectionsById: Record<string, { name: string; color: string }> = {};
      (sectionsRes.data || []).forEach(s => {
        sectionsById[s.id] = { name: s.name, color: s.color || "#6B7280" };
      });

      const map: Record<string, { sectionName: string; color: string }> = {};
      (assignmentsRes.data || []).forEach(a => {
        const section = sectionsById[a.section_id];
        if (section) {
          map[a.user_id] = { sectionName: section.name, color: section.color };
        }
      });
      setUserSectionMap(map);
    };
    fetchSectionBadges();
  }, [currentOrg?.id]);

  useEffect(() => {
    if (!currentOrg?.id) return;
    fetchPosts();

    const channel = supabase
      .channel("team-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "team_posts", filter: `org_id=eq.${currentOrg.id}` }, (payload) => {
        // New post arrived — refetch to get full details
        fetchPosts();
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "team_posts" }, (payload) => {
        // Optimistically remove deleted post
        setPosts(prev => prev.filter(p => p.id !== payload.old.id));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "post_reactions" }, () => {
        fetchPosts();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "post_comments" }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentOrg?.id, fetchPosts]);


  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  const handleSubmitPost = async () => {
    if (!newPost.trim() && !selectedImage) {
      toast.error("Add some content or an image");
      return;
    }
    if (!user) {
      toast.error("You must be logged in to post");
      return;
    }

    setPosting(true);
    try {
      let imageUrl: string | null = null;

      if (selectedImage) {
        const fileExt = selectedImage.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(fileName, selectedImage);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("post-images")
          .getPublicUrl(fileName);
        
        imageUrl = urlData.publicUrl;
      }

      // Determine post type
      let postType = "message";
      if (postMode === "maintenance") {
        postType = "maintenance_request";
      } else if (selectedImage) {
        postType = "dish_photo";
      }

      const { error } = await supabase.from("team_posts").insert({
        user_id: user.id,
        user_name: profile?.full_name || "Team Member",
        user_avatar_url: profile?.avatar_url,
        content: newPost.trim() || null,
        image_url: imageUrl,
        post_type: postType,
        org_id: currentOrg?.id || null,
      });

      if (error) throw error;

      setNewPost("");
      clearImage();
      setPostMode("message");
      toast.success(postMode === "maintenance" ? "Maintenance request logged!" : "Posted!");
    } catch (error) {
      console.error("Error posting:", error);
      toast.error("Failed to post");
    } finally {
      setPosting(false);
    }
  };

  const handleReaction = async (postId: string) => {
    if (!user) return;

    const post = posts.find((p) => p.id === postId);
    const hasReacted = post?.reactions.some((r) => r.user_id === user.id);

    // Optimistic update
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      return {
        ...p,
        reactions: hasReacted
          ? p.reactions.filter(r => r.user_id !== user.id)
          : [...p.reactions, { user_id: user.id, reaction_type: "like" }],
      };
    }));

    if (hasReacted) {
      await supabase
        .from("post_reactions")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);
    } else {
      await supabase.from("post_reactions").insert({
        post_id: postId,
        user_id: user.id,
        reaction_type: "like",
      });
    }
  };

  const handleComment = async (postId: string) => {
    const content = commentInputs[postId]?.trim();
    if (!content || !user) return;

    try {
      await supabase.from("post_comments").insert({
        post_id: postId,
        user_id: user.id,
        user_name: profile?.full_name || "Team Member",
        user_avatar_url: profile?.avatar_url,
        content,
      });

      setCommentInputs({ ...commentInputs, [postId]: "" });
    } catch (error) {
      console.error("Error commenting:", error);
      toast.error("Failed to add comment");
    }
  };

  const handleDeletePost = async (postId: string) => {
    // Optimistic removal
    setPosts(prev => prev.filter(p => p.id !== postId));
    try {
      const { error } = await supabase.from("team_posts").delete().eq("id", postId);
      if (error) {
        fetchPosts(); // Revert on error
        toast.error("Failed to delete post");
      } else {
        toast.success("Post deleted");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      fetchPosts();
      toast.error("Failed to delete post");
    }
  };

  const toggleComments = (postId: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
    }
    setExpandedComments(newExpanded);
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="card-elevated p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="card-elevated overflow-hidden">
      <div className="p-4 border-b border-border">
        <h2 className="section-header mb-0">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      {/* Compose Post */}
      {user && (
        <div className={cn(
          "p-4 border-b border-border",
          postMode === "maintenance" ? "bg-destructive/10" : "bg-muted/30"
        )}>
          {/* Post Mode Toggle */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setPostMode("message")}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                postMode === "message" 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <Camera className="w-4 h-4" />
              Post
            </button>
            <button
              onClick={() => setPostMode("maintenance")}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                postMode === "maintenance" 
                  ? "bg-destructive text-destructive-foreground" 
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <Wrench className="w-4 h-4" />
              Report Issue
            </button>
          </div>

          <div className="flex gap-3">
            <Avatar className="w-10 h-10 flex-shrink-0">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback>{getInitials(profile?.full_name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <Textarea
                placeholder={postMode === "maintenance" 
                  ? "Describe the issue... (e.g., Oven not heating, Walk-in fridge making noise)"
                  : "What's cooking? Share an update or dish photo..."
                }
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className={cn(
                  "min-h-[80px] resize-none",
                  postMode === "maintenance" && "border-destructive/50 focus:border-destructive"
                )}
              />
              
              {imagePreview && (
                <div className="relative inline-block">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="max-h-40 rounded-lg object-cover"
                  />
                  <button
                    onClick={clearImage}
                    className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                    <div className={cn(
                      "p-2 rounded-lg hover:bg-muted transition-colors inline-flex items-center gap-2",
                      postMode === "maintenance" 
                        ? "text-destructive hover:text-destructive" 
                        : "text-muted-foreground hover:text-foreground"
                    )}>
                      <Camera className="w-5 h-5" />
                      <span className="text-sm">
                        {postMode === "maintenance" ? "Add Photo of Issue" : "Add Photo"}
                      </span>
                    </div>
                  </label>
                </div>
                <Button 
                  onClick={handleSubmitPost} 
                  disabled={posting || (!newPost.trim() && !selectedImage)}
                  size="sm"
                  variant={postMode === "maintenance" ? "destructive" : "default"}
                >
                  {posting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : postMode === "maintenance" ? (
                    <>
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Log Issue
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Post
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Posts Feed */}
      <ScrollArea className="h-[500px]">
        <div className="divide-y divide-border">
          <AnimatePresence>
            {posts.map((post) => {
              const hasLiked = post.reactions.some((r) => r.user_id === user?.id);
              const likeCount = post.reactions.length;
              const commentCount = post.comments.length;
              const isExpanded = expandedComments.has(post.id);
              const isOwnPost = post.user_id === user?.id;
              const minutesSincePost = differenceInMinutes(new Date(), new Date(post.created_at));
              const canDelete = isHeadChef || (isOwnPost && minutesSincePost <= 5);
              const isAdminDelete = !isOwnPost && isHeadChef;

              const isMaintenance = post.post_type === "maintenance_request";
              const isPrepListShared = post.post_type === "prep_list_shared";

              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    "p-4",
                    isMaintenance && "bg-destructive/5 border-l-4 border-destructive",
                    isPrepListShared && "bg-primary/5 border-l-4 border-primary"
                  )}
                >
                  {/* Maintenance Badge */}
                  {isMaintenance && (
                    <div className="flex items-center gap-2 mb-3 text-destructive">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-xs font-semibold uppercase tracking-wide">
                        Maintenance Request
                      </span>
                    </div>
                  )}

                  {/* Prep List Shared Badge */}
                  {isPrepListShared && (
                    <div className="flex items-center gap-2 mb-3 text-primary">
                      <ClipboardList className="w-4 h-4" />
                      <span className="text-xs font-semibold uppercase tracking-wide">
                        Prep List Handoff
                      </span>
                    </div>
                  )}

                  {/* Post Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className={cn("w-10 h-10", isMaintenance && "ring-2 ring-destructive", isPrepListShared && "ring-2 ring-primary")}>
                        <AvatarImage src={post.user_avatar_url || undefined} />
                        <AvatarFallback>{getInitials(post.user_name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {post.user_name || "Team Member"}
                          {userSectionMap[post.user_id] && (
                            <span
                              className="ml-2 text-xs px-2 py-0.5 rounded-full inline-block"
                              style={{
                                backgroundColor: userSectionMap[post.user_id].color + "20",
                                color: userSectionMap[post.user_id].color,
                              }}
                            >
                              {userSectionMap[post.user_id].sectionName}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    {canDelete && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 rounded hover:bg-muted">
                            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDeletePost(post.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {isAdminDelete ? "Delete (Admin)" : "Delete"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  {/* Post Content */}
                  {post.content && (
                    <p className="text-sm mb-3 whitespace-pre-wrap">{post.content}</p>
                  )}

                  {/* Post Image */}
                  {post.image_url && (
                    <div className="mb-3 rounded-xl overflow-hidden bg-muted">
                      <img 
                        src={post.image_url} 
                        alt="Post" 
                        className="w-full max-h-80 object-cover"
                      />
                    </div>
                  )}

                  {/* Post Actions */}
                  <div className="flex items-center gap-4 pt-2">
                    <button
                      onClick={() => handleReaction(post.id)}
                      className={cn(
                        "flex items-center gap-1.5 text-sm transition-colors",
                        hasLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
                      )}
                    >
                      <Heart className={cn("w-5 h-5", hasLiked && "fill-current")} />
                      {likeCount > 0 && <span>{likeCount}</span>}
                    </button>
                    <button
                      onClick={() => toggleComments(post.id)}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                      {commentCount > 0 && <span>{commentCount}</span>}
                    </button>
                  </div>

                  {/* Comments Section */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 pt-3 border-t border-border space-y-3">
                          {/* Existing Comments */}
                          {post.comments.map((comment) => (
                            <div key={comment.id} className="flex gap-2">
                              <Avatar className="w-7 h-7 flex-shrink-0">
                                <AvatarImage src={comment.user_avatar_url || undefined} />
                                <AvatarFallback className="text-xs">
                                  {getInitials(comment.user_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs font-medium">{comment.user_name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                  </p>
                                </div>
                                <p className="text-sm">{comment.content}</p>
                              </div>
                            </div>
                          ))}

                          {/* Add Comment */}
                          {user && (
                            <div className="flex gap-2">
                              <Avatar className="w-7 h-7 flex-shrink-0">
                                <AvatarImage src={profile?.avatar_url || undefined} />
                                <AvatarFallback className="text-xs">
                                  {getInitials(profile?.full_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 flex gap-2">
                                <Input
                                  placeholder="Write a comment..."
                                  value={commentInputs[post.id] || ""}
                                  onChange={(e) => 
                                    setCommentInputs({ ...commentInputs, [post.id]: e.target.value })
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                      e.preventDefault();
                                      handleComment(post.id);
                                    }
                                  }}
                                  className="h-8 text-sm"
                                />
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className="h-8 px-2"
                                  onClick={() => handleComment(post.id)}
                                >
                                  <Send className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {posts.length === 0 && (
            <div className="p-8 text-center">
              <ImageIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No posts yet</p>
              <p className="text-sm text-muted-foreground/70">Be the first to share something!</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default TeamFeed;
