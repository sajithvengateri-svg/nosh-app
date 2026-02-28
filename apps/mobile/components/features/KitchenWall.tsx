import { useState } from "react";
import { View, Text, TextInput, Pressable, Image, Alert, ActivityIndicator } from "react-native";
import * as ExpoImagePicker from "expo-image-picker";
import { useTheme } from "../../contexts/ThemeProvider";
import { useAuth } from "../../contexts/AuthProvider";
import { lightTap, successNotification } from "../../lib/haptics";
import {
  Heart,
  MessageCircle,
  Send,
  Camera,
  ImageIcon,
  Wrench,
  MessageSquare,
  AlertTriangle,
  X,
  MoreHorizontal,
  Trash2,
} from "lucide-react-native";
import {
  useTeamPosts,
  useCreatePost,
  useToggleReaction,
  useAddComment,
  useDeletePost,
  usePostComments,
  type TeamPost,
} from "../../hooks/useTeamFeed";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function AvatarCircle({ name, url, size = 36 }: { name: string; url?: string | null; size?: number }) {
  const { colors } = useTheme();
  if (url) {
    return <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.accentBg, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: size * 0.38, fontWeight: "700", color: colors.accent }}>{initials}</Text>
    </View>
  );
}

function PostComments({ postId }: { postId: string }) {
  const { colors } = useTheme();
  const { data: comments, isLoading } = usePostComments(postId);
  const addComment = useAddComment();
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (!text.trim()) return;
    lightTap();
    addComment.mutate({ postId, content: text.trim() });
    setText("");
  };

  return (
    <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.accent} style={{ paddingVertical: 8 }} />
      ) : (
        (comments || []).map((c) => (
          <View key={c.id} style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
            <AvatarCircle name={c.user_name} url={c.user_avatar_url} size={26} />
            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: colors.text }}>{c.user_name}</Text>
                <Text style={{ fontSize: 10, color: colors.textMuted }}>{timeAgo(c.created_at)}</Text>
              </View>
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2, lineHeight: 18 }}>{c.content}</Text>
            </View>
          </View>
        ))
      )}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 }}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Write a reply..."
          placeholderTextColor={colors.textMuted}
          style={{
            flex: 1,
            fontSize: 13,
            color: colors.text,
            backgroundColor: colors.surface,
            borderRadius: 20,
            paddingHorizontal: 14,
            paddingVertical: 8,
          }}
          onSubmitEditing={handleSubmit}
          returnKeyType="send"
        />
        {text.trim().length > 0 && (
          <Pressable
            onPress={handleSubmit}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: colors.accent,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Send size={14} color="#FFFFFF" strokeWidth={2} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

function PostCard({ post, isHeadChef }: { post: TeamPost; isHeadChef: boolean }) {
  const { colors } = useTheme();
  const { profile } = useAuth();
  const toggleReaction = useToggleReaction();
  const deletePost = useDeletePost();
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isMaintenance = post.post_type === "maintenance_request";
  const isPrepShare = post.post_type === "prep_list_shared";
  const isOwn = post.user_id === profile?.id;
  const canDelete = isOwn || isHeadChef;

  const handleDelete = () => {
    setShowMenu(false);
    Alert.alert("Delete Post", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deletePost.mutate(post.id) },
    ]);
  };

  const handleLike = () => {
    lightTap();
    toggleReaction.mutate({ postId: post.id, currentlyReacted: post.user_reacted });
  };

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        borderLeftWidth: isMaintenance ? 3 : isPrepShare ? 3 : 1,
        borderLeftColor: isMaintenance ? colors.destructive : isPrepShare ? colors.accent : colors.cardBorder,
        overflow: "hidden",
      }}
    >
      {/* Header row */}
      <View style={{ flexDirection: "row", alignItems: "center", padding: 14, paddingBottom: 0 }}>
        <AvatarCircle name={post.user_name} url={post.user_avatar_url} size={40} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>{post.user_name}</Text>
            {isMaintenance && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: colors.destructiveBg, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                <AlertTriangle size={10} color={colors.destructive} strokeWidth={2} />
                <Text style={{ fontSize: 10, fontWeight: "700", color: colors.destructive }}>ISSUE</Text>
              </View>
            )}
            {isPrepShare && (
              <View style={{ backgroundColor: colors.accentBg, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                <Text style={{ fontSize: 10, fontWeight: "700", color: colors.accent }}>PREP</Text>
              </View>
            )}
          </View>
          <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>{timeAgo(post.created_at)}</Text>
        </View>
        {canDelete && (
          <Pressable
            onPress={() => setShowMenu(!showMenu)}
            hitSlop={8}
            style={{ padding: 4 }}
          >
            <MoreHorizontal size={18} color={colors.textMuted} strokeWidth={1.5} />
          </Pressable>
        )}
      </View>

      {/* Delete dropdown */}
      {showMenu && canDelete && (
        <View style={{ position: "absolute", top: 48, right: 12, zIndex: 10, backgroundColor: colors.card, borderRadius: 10, borderWidth: 1, borderColor: colors.border, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 }}>
          <Pressable onPress={handleDelete} style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 10 }}>
            <Trash2 size={14} color={colors.destructive} strokeWidth={1.5} />
            <Text style={{ fontSize: 13, color: colors.destructive, fontWeight: "600" }}>Delete</Text>
          </Pressable>
        </View>
      )}

      {/* Content */}
      {post.content ? (
        <Text style={{ fontSize: 14, color: colors.text, paddingHorizontal: 14, marginTop: 10, lineHeight: 21 }}>{post.content}</Text>
      ) : null}

      {/* Image */}
      {post.image_url && (
        <Image
          source={{ uri: post.image_url }}
          style={{ width: "100%", height: 220, marginTop: 10, backgroundColor: colors.surface }}
          resizeMode="cover"
        />
      )}

      {/* Reaction summary bar */}
      {(post.reaction_count > 0 || post.comment_count > 0) && (
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingTop: 10, gap: 12 }}>
          {post.reaction_count > 0 && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: colors.destructive, alignItems: "center", justifyContent: "center" }}>
                <Heart size={10} color="#FFFFFF" strokeWidth={0} fill="#FFFFFF" />
              </View>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>{post.reaction_count}</Text>
            </View>
          )}
          {post.comment_count > 0 && (
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
              {post.comment_count} {post.comment_count === 1 ? "reply" : "replies"}
            </Text>
          )}
        </View>
      )}

      {/* Action buttons */}
      <View style={{ flexDirection: "row", borderTopWidth: 1, borderTopColor: colors.border, marginTop: 10 }}>
        <Pressable
          onPress={handleLike}
          style={({ pressed }) => ({
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            paddingVertical: 10,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Heart
            size={18}
            color={post.user_reacted ? colors.destructive : colors.textMuted}
            strokeWidth={post.user_reacted ? 0 : 1.5}
            fill={post.user_reacted ? colors.destructive : "none"}
          />
          <Text style={{ fontSize: 13, fontWeight: "600", color: post.user_reacted ? colors.destructive : colors.textSecondary }}>
            Like
          </Text>
        </Pressable>
        <View style={{ width: 1, backgroundColor: colors.border, marginVertical: 8 }} />
        <Pressable
          onPress={() => { lightTap(); setShowComments(!showComments); }}
          style={({ pressed }) => ({
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            paddingVertical: 10,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <MessageCircle size={18} color={colors.textMuted} strokeWidth={1.5} />
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary }}>Reply</Text>
        </Pressable>
      </View>

      {/* Comments */}
      {showComments && (
        <View style={{ paddingHorizontal: 14, paddingBottom: 12 }}>
          <PostComments postId={post.id} />
        </View>
      )}
    </View>
  );
}

export function KitchenWallComposer() {
  const { colors } = useTheme();
  const { profile } = useAuth();
  const createPost = useCreatePost();
  const [content, setContent] = useState("");
  const [postMode, setPostMode] = useState<"message" | "maintenance_request">("message");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  const pickImage = async () => {
    const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please grant photo library access in Settings.");
      return;
    }
    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ExpoImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please grant camera access in Settings.");
      return;
    }
    const result = await ExpoImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handlePost = () => {
    if (!content.trim() && !imageUri) return;
    successNotification();
    createPost.mutate(
      { content: content.trim(), postType: postMode, imageUri: imageUri || undefined },
      {
        onSuccess: () => {
          setContent("");
          setImageUri(null);
          setPostMode("message");
          setFocused(false);
        },
        onError: (e: any) => Alert.alert("Error", e.message || "Failed to post"),
      }
    );
  };

  const isMaintenance = postMode === "maintenance_request";
  const hasContent = content.trim().length > 0 || !!imageUri;

  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.cardBorder, overflow: "hidden" }}>
      {/* Compact composer row */}
      <View style={{ flexDirection: "row", alignItems: "center", padding: 12, gap: 10 }}>
        <AvatarCircle name={profile?.full_name || "You"} url={profile?.avatar_url} size={36} />
        <Pressable
          onPress={() => setFocused(true)}
          style={{
            flex: 1,
            backgroundColor: colors.surface,
            borderRadius: 20,
            paddingHorizontal: 14,
            paddingVertical: 10,
          }}
        >
          {!focused ? (
            <Text style={{ fontSize: 14, color: colors.textMuted }}>What's cooking?</Text>
          ) : null}
        </Pressable>
        {!focused && (
          <Pressable onPress={takePhoto} style={{ padding: 6 }}>
            <Camera size={22} color={colors.accent} strokeWidth={1.5} />
          </Pressable>
        )}
      </View>

      {/* Expanded composer */}
      {focused && (
        <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
          {/* Mode tabs */}
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
            <Pressable
              onPress={() => { lightTap(); setPostMode("message"); }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 20,
                backgroundColor: !isMaintenance ? colors.accentBg : colors.surface,
              }}
            >
              <MessageSquare size={14} color={!isMaintenance ? colors.accent : colors.textMuted} strokeWidth={1.5} />
              <Text style={{ fontSize: 12, fontWeight: "600", color: !isMaintenance ? colors.accent : colors.textSecondary }}>Post</Text>
            </Pressable>
            <Pressable
              onPress={() => { lightTap(); setPostMode("maintenance_request"); }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 20,
                backgroundColor: isMaintenance ? colors.destructiveBg : colors.surface,
              }}
            >
              <Wrench size={14} color={isMaintenance ? colors.destructive : colors.textMuted} strokeWidth={1.5} />
              <Text style={{ fontSize: 12, fontWeight: "600", color: isMaintenance ? colors.destructive : colors.textSecondary }}>Report Issue</Text>
            </Pressable>
          </View>

          {/* Text input */}
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder={isMaintenance ? "Describe the issue..." : "Share an update with your team..."}
            placeholderTextColor={colors.textMuted}
            multiline
            autoFocus
            style={{
              fontSize: 14,
              color: colors.text,
              minHeight: 70,
              textAlignVertical: "top",
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 12,
              marginBottom: 10,
              lineHeight: 20,
            }}
          />

          {/* Image preview */}
          {imageUri && (
            <View style={{ marginBottom: 10, borderRadius: 12, overflow: "hidden" }}>
              <Image source={{ uri: imageUri }} style={{ width: "100%", height: 180, backgroundColor: colors.surface }} resizeMode="cover" />
              <Pressable
                onPress={() => setImageUri(null)}
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: "rgba(0,0,0,0.6)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={14} color="#FFFFFF" strokeWidth={2} />
              </Pressable>
            </View>
          )}

          {/* Bottom actions */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Pressable onPress={takePhoto} style={{ padding: 8, borderRadius: 8 }}>
              <Camera size={20} color={colors.textSecondary} strokeWidth={1.5} />
            </Pressable>
            <Pressable onPress={pickImage} style={{ padding: 8, borderRadius: 8 }}>
              <ImageIcon size={20} color={colors.textSecondary} strokeWidth={1.5} />
            </Pressable>
            <View style={{ flex: 1 }} />
            <Pressable
              onPress={() => { setFocused(false); setContent(""); setImageUri(null); }}
              style={{ paddingHorizontal: 12, paddingVertical: 8 }}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textMuted }}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handlePost}
              disabled={createPost.isPending || !hasContent}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                backgroundColor: isMaintenance ? colors.destructive : colors.accent,
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 8,
                opacity: createPost.isPending || !hasContent ? 0.4 : 1,
              }}
            >
              {createPost.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Send size={14} color="#FFFFFF" strokeWidth={2} />
                  <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700" }}>
                    {isMaintenance ? "Log Issue" : "Post"}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

export function KitchenWallFeed({ isHeadChef }: { isHeadChef: boolean }) {
  const { colors } = useTheme();
  const { data: posts, isLoading } = useTeamPosts();

  if (isLoading) {
    return (
      <View style={{ padding: 20, alignItems: "center" }}>
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <View style={{ padding: 32, alignItems: "center", gap: 8 }}>
        <MessageCircle size={32} color={colors.textMuted} strokeWidth={1} />
        <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: "center" }}>No posts yet. Be the first to share!</Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 12 }}>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} isHeadChef={isHeadChef} />
      ))}
    </View>
  );
}

export function KitchenWallHeader() {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <MessageSquare size={18} color={colors.accent} strokeWidth={1.5} />
      <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text }}>Kitchen Wall</Text>
    </View>
  );
}
