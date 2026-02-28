// Team queries — extracted from Team.tsx, TeamFeed.tsx

import { supabase } from "../supabaseClient";

// ─── Team Members ─────────────────────────────────

export async function fetchOrgMemberships(orgId: string) {
  return supabase
    .from("org_memberships")
    .select("id, user_id, role, is_active, member_status")
    .eq("org_id", orgId);
}

export async function updateOrgMembership(membershipId: string, payload: Record<string, unknown>) {
  return supabase.from("org_memberships").update(payload as any).eq("id", membershipId);
}

export async function deleteOrgMembership(membershipId: string) {
  return supabase.from("org_memberships").delete().eq("id", membershipId);
}

export async function fetchProfiles(userIds: string[]) {
  return supabase.from("profiles").select("*").in("user_id", userIds);
}

export async function updateProfile(userId: string, payload: Record<string, unknown>) {
  return supabase.from("profiles").update(payload as any).eq("user_id", userId);
}

export async function fetchModulePermissions(userId: string) {
  return supabase.from("module_permissions").select("module, can_view, can_edit").eq("user_id", userId);
}

export async function updateModulePermission(userId: string, module: string, field: string, value: boolean) {
  return supabase.from("module_permissions").update({ [field]: value }).eq("user_id", userId).eq("module", module);
}

// ─── Invites ──────────────────────────────────────

export async function fetchTeamInvites(orgId?: string) {
  const query = supabase
    .from("team_invites")
    .select("*")
    .is("accepted_at", null)
    .order("created_at", { ascending: false });
  if (orgId) query.eq("org_id", orgId);
  return query;
}

export async function insertTeamInvite(payload: Record<string, unknown>) {
  return supabase.from("team_invites").insert(payload as any);
}

export async function deleteTeamInvite(id: string) {
  return supabase.from("team_invites").delete().eq("id", id);
}

// ─── Direct Messages ──────────────────────────────

export async function fetchDirectMessages(userId: string, otherUserId: string) {
  return supabase
    .from("direct_messages")
    .select("*")
    .or(`and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${userId})`)
    .order("created_at", { ascending: true });
}

export async function insertDirectMessage(payload: Record<string, unknown>) {
  return supabase.from("direct_messages").insert(payload as any);
}

export async function markMessagesAsRead(senderId: string, recipientId: string) {
  return supabase
    .from("direct_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("sender_id", senderId)
    .eq("recipient_id", recipientId)
    .is("read_at", null);
}

// ─── Team Posts (Kitchen Wall) ────────────────────

export async function fetchTeamPosts(orgId?: string, limit = 50) {
  const query = supabase
    .from("team_posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (orgId) query.eq("org_id", orgId);
  return query;
}

export async function insertTeamPost(payload: Record<string, unknown>) {
  return supabase.from("team_posts").insert(payload as any);
}

export async function deleteTeamPost(id: string) {
  return supabase.from("team_posts").delete().eq("id", id);
}

// ─── Post Reactions ───────────────────────────────

export async function fetchPostReactions(postId: string) {
  return supabase.from("post_reactions").select("user_id, reaction_type").eq("post_id", postId);
}

export async function insertPostReaction(payload: Record<string, unknown>) {
  return supabase.from("post_reactions").insert(payload as any);
}

export async function deletePostReaction(postId: string, userId: string) {
  return supabase.from("post_reactions").delete().eq("post_id", postId).eq("user_id", userId);
}

// ─── Post Comments ────────────────────────────────

export async function fetchPostComments(postId: string) {
  return supabase.from("post_comments").select("*").eq("post_id", postId).order("created_at", { ascending: true });
}

export async function insertPostComment(payload: Record<string, unknown>) {
  return supabase.from("post_comments").insert(payload as any);
}

// ─── Section Assignments ──────────────────────────

export async function fetchSectionAssignments(orgId: string) {
  return supabase
    .from("section_assignments")
    .select("user_id, section_id, role")
    .eq("org_id", orgId);
}

export async function fetchKitchenSections(orgId: string) {
  return supabase
    .from("kitchen_sections")
    .select("id, name, color")
    .eq("org_id", orgId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
}

// ─── Activity Log ─────────────────────────────────

export async function insertActivityLog(payload: Record<string, unknown>) {
  return supabase.from("activity_log").insert(payload as any);
}
