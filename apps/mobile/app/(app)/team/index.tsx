import { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  Pressable,
  Alert,
  Switch,
  Modal,
  ScrollView,
  Share,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { useOrg } from "../../../contexts/OrgProvider";
import { useAuth } from "../../../contexts/AuthProvider";
import { useTheme } from "../../../contexts/ThemeProvider";
import { Input } from "../../../components/ui/Input";
import { Badge } from "../../../components/ui/Badge";
import { TabBar } from "../../../components/ui/Tabs";
import { EmptyState } from "../../../components/ui/EmptyState";
import { SkeletonCard } from "../../../components/ui/Skeleton";
import { FAB } from "../../../components/ui/FAB";
import { FormSheet } from "../../../components/ui/FormSheet";
import { Select } from "../../../components/ui/Select";
import {
  Users,
  Crown,
  ChefHat,
  Shield,
  BarChart3,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  Mail,
  Share2,
  ClipboardList,
  Activity,
  Calendar,
  User,
} from "lucide-react-native";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import Constants from "expo-constants";

// ─── Constants ──────────────────────────────────────────────────────────────────

import { isHomeCook } from "@queitos/shared";
import type { AppVariant } from "@queitos/shared";
const APP_VARIANT = (Constants.expoConfig?.extra?.appVariant ?? "chefos") as AppVariant;
const IS_HOMECHEF = isHomeCook(APP_VARIANT);

// ─── Types ──────────────────────────────────────────────────────────────────────

interface TeamMember {
  id: string;
  user_id: string;
  org_id: string;
  role: string;
  is_active: boolean;
  profiles?: {
    full_name: string | null;
    email: string | null;
    position: string | null;
  } | null;
}

interface PermissionRow {
  module: string;
  can_view: boolean;
  can_edit: boolean;
}

interface TeamInvite {
  id: string;
  email: string;
  role: string;
  status: string;
  token: string;
  org_id: string;
  created_at: string;
}

interface KitchenTask {
  id: string;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "submitted" | "completed" | "rejected";
  type: string;
  assigned_to: string | null;
  due_date: string | null;
  org_id: string;
  created_by: string;
  created_at: string;
  assignee?: { full_name: string | null; email: string | null } | null;
}

interface ActivityLogEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  user_id: string;
  org_id: string;
  created_at: string;
  profiles?: { full_name: string | null; email: string | null } | null;
}

interface ContributionStat {
  user_id: string;
  full_name: string | null;
  recipes_created: number;
  safety_logs: number;
  prep_completed: number;
}

// ─── Static Data ────────────────────────────────────────────────────────────────

const ROLES = [
  { label: "Head Chef", value: "head_chef" },
  { label: "Sous Chef", value: "sous_chef" },
  { label: "Chef de Partie", value: "chef_de_partie" },
  { label: "Commis", value: "commis" },
  { label: "Kitchen Porter", value: "kitchen_porter" },
  { label: "Trainee", value: "trainee" },
];

const MEMBER_FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
];

const TASK_FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "submitted", label: "Submitted" },
  { key: "completed", label: "Completed" },
];

const TASK_TYPES = [
  { label: "Recipe Entry", value: "recipe_entry" },
  { label: "Stock Count", value: "stock_count" },
  { label: "Prep Task", value: "prep_task" },
  { label: "Cleaning", value: "cleaning" },
  { label: "General", value: "general" },
];

const TASK_PRIORITIES = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
  { label: "Urgent", value: "urgent" },
];

const ALL_MODULES = [
  { key: "dashboard", label: "Dashboard" },
  { key: "recipes", label: "Recipes" },
  { key: "ingredients", label: "Ingredients" },
  { key: "invoices", label: "Invoices" },
  { key: "inventory", label: "Inventory" },
  { key: "prep", label: "Prep Lists" },
  { key: "production", label: "Production" },
  { key: "allergens", label: "Allergens" },
  { key: "menu-engineering", label: "Menu Engineering" },
  { key: "roster", label: "Roster" },
  { key: "calendar", label: "Calendar" },
  { key: "equipment", label: "Equipment" },
  { key: "cheatsheets", label: "Cheatsheets" },
  { key: "food-safety", label: "Food Safety" },
  { key: "training", label: "Training" },
  { key: "team", label: "Team" },
];

// ─── Helpers ────────────────────────────────────────────────────────────────────

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.charAt(0).toUpperCase();
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(dateStr);
}

function roleDisplayName(role: string): string {
  return role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getPriorityColor(priority: string): {
  bg: string;
  text: string;
  variant: "default" | "secondary" | "success" | "warning" | "destructive";
} {
  switch (priority) {
    case "urgent":
      return { bg: "#FEE2E2", text: "#991B1B", variant: "destructive" };
    case "high":
      return { bg: "#FEF3C7", text: "#92400E", variant: "warning" };
    case "medium":
      return { bg: "#EEF2FF", text: "#3730A3", variant: "default" };
    default:
      return { bg: "#F3F4F6", text: "#374151", variant: "secondary" };
  }
}

function getStatusVariant(
  status: string
): "default" | "secondary" | "success" | "warning" | "destructive" {
  switch (status) {
    case "completed":
      return "success";
    case "submitted":
      return "warning";
    case "rejected":
      return "destructive";
    case "in_progress":
      return "default";
    default:
      return "secondary";
  }
}

function getActivityIcon(action: string) {
  if (action.includes("recipe")) return "recipe";
  if (action.includes("safety") || action.includes("log")) return "safety";
  if (action.includes("prep")) return "prep";
  if (action.includes("task")) return "task";
  if (action.includes("invite")) return "invite";
  return "general";
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function Team() {
  const { currentOrg } = useOrg();
  const { isHeadChef, profile } = useAuth();
  const { colors } = useTheme();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();

  // ─── Top-level tab state ────────────────────────────────────────────────────
  const MAIN_TABS = useMemo(() => {
    const tabs = [
      { key: "members", label: "Members" },
      { key: "invites", label: "Invites" },
      { key: "orgchart", label: "Org Chart" },
    ];
    if (!IS_HOMECHEF) {
      tabs.push({ key: "tasks", label: "Tasks" });
      tabs.push({ key: "activity", label: "Activity" });
    }
    return tabs;
  }, []);

  const [mainTab, setMainTab] = useState("members");

  // ═══════════════════════════════════════════════════════════════════════════════
  // MEMBERS TAB STATE & QUERIES
  // ═══════════════════════════════════════════════════════════════════════════════

  const [memberFilter, setMemberFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [saving, setSaving] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("commis");
  const [permMember, setPermMember] = useState<TeamMember | null>(null);

  const {
    data: members,
    isLoading: membersLoading,
    refetch: refetchMembers,
    isRefetching: membersRefetching,
  } = useQuery<TeamMember[]>({
    queryKey: ["team", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("org_memberships")
        .select("*, profiles(full_name, email, position)")
        .eq("org_id", orgId);
      if (error) throw error;
      return (data as TeamMember[]) || [];
    },
    enabled: !!orgId,
  });

  const updateRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const { error } = await supabase
        .from("org_memberships")
        .update({ role })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team"] }),
  });

  const toggleActive = useMutation({
    mutationFn: async ({
      id,
      is_active,
    }: {
      id: string;
      is_active: boolean;
    }) => {
      const { error } = await supabase
        .from("org_memberships")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team"] }),
  });

  const removeMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("org_memberships")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team"] }),
  });

  const updatePermission = useMutation({
    mutationFn: async ({
      userId,
      module,
      field,
      value,
    }: {
      userId: string;
      module: string;
      field: "can_view" | "can_edit";
      value: boolean;
    }) => {
      const { error } = await supabase
        .from("module_permissions")
        .update({ [field]: value })
        .eq("user_id", userId)
        .eq("module", module);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["member-permissions"] }),
  });

  const { data: memberPerms } = useQuery<PermissionRow[]>({
    queryKey: ["member-permissions", permMember?.user_id],
    queryFn: async () => {
      if (!permMember?.user_id) return [];
      const { data, error } = await supabase
        .from("module_permissions")
        .select("module, can_view, can_edit")
        .eq("user_id", permMember.user_id);
      if (error) throw error;
      return (data as PermissionRow[]) || [];
    },
    enabled: !!permMember?.user_id,
  });

  const getPermValue = (
    module: string,
    field: "can_view" | "can_edit"
  ): boolean => {
    const row = memberPerms?.find((p) => p.module === module);
    return row ? row[field] : false;
  };

  const filteredMembers = useMemo(() => {
    if (!members) return [];
    let list = members;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.profiles?.full_name?.toLowerCase().includes(q) ||
          m.profiles?.email?.toLowerCase().includes(q)
      );
    }
    if (memberFilter === "active") list = list.filter((m) => m.is_active);
    if (memberFilter === "inactive") list = list.filter((m) => !m.is_active);
    return list;
  }, [members, search, memberFilter]);

  const openInvite = () => {
    setInviteEmail("");
    setInviteRole("commis");
    setEditingMember(null);
    setShowForm(true);
  };

  const openEdit = (member: TeamMember) => {
    setEditingMember(member);
    setInviteRole(member.role);
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingMember) {
        await updateRole.mutateAsync({
          id: editingMember.id,
          role: inviteRole,
        });
      } else {
        if (!inviteEmail.trim()) {
          Alert.alert("Error", "Email is required");
          setSaving(false);
          return;
        }
        const trimmedEmail = inviteEmail.trim().toLowerCase();
        const inviteToken = `inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const { error: insertErr } = await supabase
          .from("team_invites")
          .insert({
            email: trimmedEmail,
            role: inviteRole,
            org_id: orgId,
            token: inviteToken,
            status: "pending",
          });
        if (insertErr) throw insertErr;
        const { error: emailErr } = await supabase.functions.invoke(
          "send-invite-email",
          {
            body: {
              inviteId: inviteToken,
              email: trimmedEmail,
              inviterName: "Head Chef",
              orgName: currentOrg?.name || "Your Kitchen",
              role: inviteRole,
              portal: "chef",
              orgId: orgId,
              token: inviteToken,
            },
          }
        );
        if (emailErr) {
          console.warn("Email send failed:", emailErr);
        }
        Alert.alert("Invite Sent", `Invitation sent to ${trimmedEmail}`);
        queryClient.invalidateQueries({ queryKey: ["team"] });
        queryClient.invalidateQueries({ queryKey: ["team-invites"] });
      }
      setShowForm(false);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const isLineCook = (member: TeamMember) => {
    return member.role !== "head_chef" && member.role !== "owner";
  };

  const handleLongPress = (member: TeamMember) => {
    const options: {
      text: string;
      onPress?: () => void;
      style?: "cancel" | "destructive";
    }[] = [
      { text: "Edit Role", onPress: () => openEdit(member) },
      {
        text: member.is_active ? "Deactivate" : "Activate",
        onPress: () =>
          toggleActive.mutate({
            id: member.id,
            is_active: !member.is_active,
          }),
      },
    ];

    if (isHeadChef && isLineCook(member)) {
      options.push({
        text: "Manage Permissions",
        onPress: () => setPermMember(member),
      });
    }

    options.push(
      {
        text: "Remove",
        style: "destructive",
        onPress: () =>
          Alert.alert("Remove Member", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Remove",
              style: "destructive",
              onPress: () => removeMember.mutate(member.id),
            },
          ]),
      },
      { text: "Cancel", style: "cancel" }
    );

    Alert.alert(
      member.profiles?.full_name || "Team Member",
      "What would you like to do?",
      options
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // INVITES TAB QUERIES
  // ═══════════════════════════════════════════════════════════════════════════════

  const {
    data: invites,
    isLoading: invitesLoading,
    refetch: refetchInvites,
    isRefetching: invitesRefetching,
  } = useQuery<TeamInvite[]>({
    queryKey: ["team-invites", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("team_invites")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as TeamInvite[]) || [];
    },
    enabled: !!orgId && mainTab === "invites",
  });

  const revokeInvite = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("team_invites")
        .update({ status: "revoked" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["team-invites"] }),
  });

  const resendInvite = useMutation({
    mutationFn: async (invite: TeamInvite) => {
      const { error } = await supabase.functions.invoke("send-invite-email", {
        body: {
          inviteId: invite.token,
          email: invite.email,
          inviterName: profile?.full_name || "Head Chef",
          orgName: currentOrg?.name || "Your Kitchen",
          role: invite.role,
          portal: "chef",
          orgId: orgId,
          token: invite.token,
        },
      });
      if (error) throw error;
    },
    onSuccess: () => Alert.alert("Success", "Invite email resent"),
    onError: (e: any) =>
      Alert.alert("Error", e.message || "Failed to resend invite"),
  });

  const handleShareInvite = async (invite: TeamInvite) => {
    const inviteLink = `https://chefos.ai/join/${invite.token}`;
    const message = `You've been invited to join ${currentOrg?.name || "our kitchen"} on ChefOS as ${roleDisplayName(invite.role)}. Join here: ${inviteLink}`;

    try {
      await Share.share({
        message,
        url: Platform.OS === "ios" ? inviteLink : undefined,
      });
    } catch (e: any) {
      if (e.message !== "User did not share") {
        Alert.alert("Error", "Failed to share invite link");
      }
    }
  };

  const handleInviteLongPress = (invite: TeamInvite) => {
    if (invite.status !== "pending") return;
    const options: {
      text: string;
      onPress?: () => void;
      style?: "cancel" | "destructive";
    }[] = [
      { text: "Share Invite Link", onPress: () => handleShareInvite(invite) },
      {
        text: "Resend Email",
        onPress: () => resendInvite.mutate(invite),
      },
      {
        text: "Revoke Invite",
        style: "destructive",
        onPress: () =>
          Alert.alert("Revoke Invite", `Revoke invite for ${invite.email}?`, [
            { text: "Cancel", style: "cancel" },
            {
              text: "Revoke",
              style: "destructive",
              onPress: () => revokeInvite.mutate(invite.id),
            },
          ]),
      },
      { text: "Cancel", style: "cancel" },
    ];

    Alert.alert(invite.email, "What would you like to do?", options);
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // ORG CHART TAB QUERIES
  // ═══════════════════════════════════════════════════════════════════════════════

  const {
    data: orgChartMembers,
    isLoading: orgChartLoading,
    refetch: refetchOrgChart,
    isRefetching: orgChartRefetching,
  } = useQuery<TeamMember[]>({
    queryKey: ["org-chart", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("org_memberships")
        .select("*, profiles(full_name, email, position)")
        .eq("org_id", orgId)
        .eq("is_active", true);
      if (error) throw error;
      return (data as TeamMember[]) || [];
    },
    enabled: !!orgId && mainTab === "orgchart",
  });

  const orgChartTiers = useMemo(() => {
    if (!orgChartMembers) return { owners: [], headChefs: [], lineCooks: [] };
    const owners = orgChartMembers.filter((m) => m.role === "owner");
    const headChefs = orgChartMembers.filter((m) => m.role === "head_chef");
    const lineCooks = orgChartMembers.filter(
      (m) => m.role !== "owner" && m.role !== "head_chef"
    );
    return { owners, headChefs, lineCooks };
  }, [orgChartMembers]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // TASKS TAB STATE & QUERIES
  // ═══════════════════════════════════════════════════════════════════════════════

  const [taskFilter, setTaskFilter] = useState("all");
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskSaving, setTaskSaving] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
  const [newTaskType, setNewTaskType] = useState("general");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");

  const {
    data: tasks,
    isLoading: tasksLoading,
    refetch: refetchTasks,
    isRefetching: tasksRefetching,
  } = useQuery<KitchenTask[]>({
    queryKey: ["kitchen-tasks", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("kitchen_tasks")
        .select("*, assignee:profiles!kitchen_tasks_assigned_to_fkey(full_name, email)")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as KitchenTask[]) || [];
    },
    enabled: !!orgId && !IS_HOMECHEF && mainTab === "tasks",
  });

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    if (taskFilter === "all") return tasks;
    return tasks.filter((t) => t.status === taskFilter);
  }, [tasks, taskFilter]);

  const assigneeOptions = useMemo(() => {
    if (!members) return [];
    return members
      .filter((m) => m.is_active)
      .map((m) => ({
        label: m.profiles?.full_name || m.profiles?.email || "Unknown",
        value: m.user_id,
      }));
  }, [members]);

  const createTask = useMutation({
    mutationFn: async (task: {
      title: string;
      description: string;
      priority: string;
      type: string;
      assigned_to: string | null;
      due_date: string | null;
    }) => {
      const { error } = await supabase.from("kitchen_tasks").insert({
        ...task,
        org_id: orgId,
        created_by: profile?.user_id,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchen-tasks"] });
      setShowTaskForm(false);
      resetTaskForm();
    },
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: string;
    }) => {
      const { error } = await supabase
        .from("kitchen_tasks")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["kitchen-tasks"] }),
  });

  const resetTaskForm = () => {
    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskPriority("medium");
    setNewTaskType("general");
    setNewTaskAssignee("");
    setNewTaskDueDate("");
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) {
      Alert.alert("Error", "Task title is required");
      return;
    }
    setTaskSaving(true);
    try {
      await createTask.mutateAsync({
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || null as any,
        priority: newTaskPriority,
        type: newTaskType,
        assigned_to: newTaskAssignee || null,
        due_date: newTaskDueDate || null,
      });
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to create task");
    } finally {
      setTaskSaving(false);
    }
  };

  const handleTaskAction = (task: KitchenTask) => {
    if (!isHeadChef) return;
    if (task.status === "submitted") {
      Alert.alert("Review Task", `"${task.title}" has been submitted.`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: () =>
            updateTaskStatus.mutate({ id: task.id, status: "rejected" }),
        },
        {
          text: "Approve",
          onPress: () =>
            updateTaskStatus.mutate({ id: task.id, status: "completed" }),
        },
      ]);
    } else if (task.status === "pending") {
      Alert.alert("Task Options", `"${task.title}"`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark In Progress",
          onPress: () =>
            updateTaskStatus.mutate({ id: task.id, status: "in_progress" }),
        },
      ]);
    } else if (task.status === "in_progress") {
      Alert.alert("Task Options", `"${task.title}"`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark Submitted",
          onPress: () =>
            updateTaskStatus.mutate({ id: task.id, status: "submitted" }),
        },
      ]);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // ACTIVITY TAB QUERIES
  // ═══════════════════════════════════════════════════════════════════════════════

  const {
    data: activityLog,
    isLoading: activityLoading,
    refetch: refetchActivity,
    isRefetching: activityRefetching,
  } = useQuery<ActivityLogEntry[]>({
    queryKey: ["activity-log", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("activity_log")
        .select("*, profiles(full_name, email)")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data as ActivityLogEntry[]) || [];
    },
    enabled: !!orgId && !IS_HOMECHEF && mainTab === "activity",
  });

  const { data: contributionStats } = useQuery<ContributionStat[]>({
    queryKey: ["contribution-stats", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const since = sevenDaysAgo.toISOString();

      // Get active members
      const { data: activeMembers } = await supabase
        .from("org_memberships")
        .select("user_id, profiles(full_name)")
        .eq("org_id", orgId)
        .eq("is_active", true);

      if (!activeMembers) return [];

      const stats: ContributionStat[] = [];

      for (const member of activeMembers) {
        const userId = member.user_id;
        const fullName = (member.profiles as any)?.full_name || null;

        // Count recipes created in last 7 days
        const { count: recipesCount } = await supabase
          .from("activity_log")
          .select("id", { count: "exact", head: true })
          .eq("org_id", orgId)
          .eq("user_id", userId)
          .eq("entity_type", "recipe")
          .gte("created_at", since);

        // Count safety logs in last 7 days
        const { count: safetyCount } = await supabase
          .from("activity_log")
          .select("id", { count: "exact", head: true })
          .eq("org_id", orgId)
          .eq("user_id", userId)
          .eq("entity_type", "safety_log")
          .gte("created_at", since);

        // Count prep completed in last 7 days
        const { count: prepCount } = await supabase
          .from("activity_log")
          .select("id", { count: "exact", head: true })
          .eq("org_id", orgId)
          .eq("user_id", userId)
          .eq("entity_type", "prep")
          .gte("created_at", since);

        stats.push({
          user_id: userId,
          full_name: fullName,
          recipes_created: recipesCount || 0,
          safety_logs: safetyCount || 0,
          prep_completed: prepCount || 0,
        });
      }

      // Sort by total contributions descending
      stats.sort(
        (a, b) =>
          b.recipes_created +
          b.safety_logs +
          b.prep_completed -
          (a.recipes_created + a.safety_logs + a.prep_completed)
      );

      return stats;
    },
    enabled: !!orgId && !IS_HOMECHEF && mainTab === "activity",
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER: Members Tab
  // ═══════════════════════════════════════════════════════════════════════════════

  const renderMembersTab = () => (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 24, paddingBottom: 0 }}>
        <Input
          placeholder="Search team..."
          value={search}
          onChangeText={setSearch}
          containerStyle={{ marginBottom: 12 }}
        />
        <TabBar
          tabs={MEMBER_FILTER_TABS}
          activeTab={memberFilter}
          onTabChange={setMemberFilter}
          accentColor={colors.accent}
          style={{ marginBottom: 8 }}
        />
      </View>

      {membersLoading ? (
        <View style={{ padding: 24, gap: 10 }}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : filteredMembers.length === 0 ? (
        <EmptyState
          icon={
            <View>
              <Users size={24} color={colors.textMuted} />
            </View>
          }
          title="No team members"
          description="Tap + to invite a team member"
        />
      ) : (
        <FlatList
          data={filteredMembers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={membersRefetching}
              onRefresh={refetchMembers}
            />
          }
          renderItem={({ item }) => (
            <Pressable
              onLongPress={() => handleLongPress(item)}
              onPress={() => openEdit(item)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.accentBg,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: colors.accent,
                  }}
                >
                  {getInitials(item.profiles?.full_name)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: colors.text,
                  }}
                >
                  {item.profiles?.full_name || "Unknown"}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>
                  {item.profiles?.email}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end", gap: 4 }}>
                <Badge
                  variant={item.is_active ? "default" : "secondary"}
                >
                  {item.role.replace(/_/g, " ")}
                </Badge>
                {!item.is_active && (
                  <Text
                    style={{ fontSize: 10, color: colors.destructive }}
                  >
                    Inactive
                  </Text>
                )}
              </View>
            </Pressable>
          )}
        />
      )}

      {isHeadChef && <FAB onPress={openInvite} />}
    </View>
  );

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER: Invites Tab
  // ═══════════════════════════════════════════════════════════════════════════════

  const getInviteStatusVariant = (
    status: string
  ): "default" | "secondary" | "success" | "warning" | "destructive" => {
    switch (status) {
      case "pending":
        return "warning";
      case "accepted":
        return "success";
      case "revoked":
        return "destructive";
      case "expired":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const renderInvitesTab = () => {
    if (!isHeadChef) {
      return (
        <EmptyState
          icon={
            <View>
              <Shield size={24} color={colors.textMuted} />
            </View>
          }
          title="Access Restricted"
          description="Only head chefs and owners can manage invitations"
        />
      );
    }

    if (invitesLoading) {
      return (
        <View style={{ padding: 24, gap: 10 }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      );
    }

    if (!invites || invites.length === 0) {
      return (
        <EmptyState
          icon={
            <View>
              <Send size={24} color={colors.textMuted} />
            </View>
          }
          title="No invitations"
          description="Invite team members from the Members tab"
        />
      );
    }

    return (
      <FlatList
        data={invites}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={invitesRefetching}
            onRefresh={refetchInvites}
          />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              item.status === "pending" ? handleShareInvite(item) : undefined
            }
            onLongPress={() => handleInviteLongPress(item)}
            style={{
              paddingVertical: 16,
              paddingHorizontal: 20,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.warningBg,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Mail size={18} color={colors.warning} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: colors.text,
                  }}
                >
                  {item.email}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textMuted,
                    marginTop: 2,
                  }}
                >
                  Role: {roleDisplayName(item.role)}
                </Text>
              </View>
              <Badge variant={getInviteStatusVariant(item.status)}>
                {item.status}
              </Badge>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginLeft: 52,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <Clock size={12} color={colors.textMuted} />
                <Text style={{ fontSize: 11, color: colors.textMuted }}>
                  Sent {formatDate(item.created_at)}
                </Text>
              </View>
              {item.status === "pending" && (
                <Pressable
                  onPress={() => handleShareInvite(item)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    backgroundColor: colors.accentBg,
                    borderRadius: 8,
                  }}
                >
                  <Share2 size={12} color={colors.accent} />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: colors.accent,
                    }}
                  >
                    Share Link
                  </Text>
                </Pressable>
              )}
            </View>
          </Pressable>
        )}
      />
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER: Org Chart Tab
  // ═══════════════════════════════════════════════════════════════════════════════

  const renderOrgChartNode = (
    member: TeamMember,
    bgColor: string,
    accentColor: string
  ) => (
    <View
      key={member.id}
      style={{
        alignItems: "center",
        marginHorizontal: 8,
        marginBottom: 12,
        minWidth: 90,
      }}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: bgColor,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 6,
          borderWidth: 2,
          borderColor: accentColor,
        }}
      >
        <Text
          style={{ fontSize: 18, fontWeight: "700", color: accentColor }}
        >
          {getInitials(member.profiles?.full_name)}
        </Text>
      </View>
      <Text
        style={{
          fontSize: 13,
          fontWeight: "600",
          color: colors.text,
          textAlign: "center",
          maxWidth: 100,
        }}
        numberOfLines={2}
      >
        {member.profiles?.full_name || "Unknown"}
      </Text>
      <Text
        style={{
          fontSize: 11,
          color: colors.textMuted,
          textAlign: "center",
          marginTop: 2,
        }}
        numberOfLines={1}
      >
        {member.profiles?.position || roleDisplayName(member.role)}
      </Text>
    </View>
  );

  const renderConnectingLine = () => (
    <View
      style={{
        alignItems: "center",
        marginVertical: 4,
      }}
    >
      <View
        style={{
          width: 2,
          height: 24,
          backgroundColor: colors.border,
        }}
      />
      <View
        style={{
          width: 80,
          height: 2,
          backgroundColor: colors.border,
        }}
      />
    </View>
  );

  const renderOrgChartTab = () => {
    if (orgChartLoading) {
      return (
        <View style={{ padding: 24, gap: 10 }}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      );
    }

    const { owners, headChefs, lineCooks } = orgChartTiers;
    const hasMembers =
      owners.length > 0 || headChefs.length > 0 || lineCooks.length > 0;

    if (!hasMembers) {
      return (
        <EmptyState
          icon={
            <View>
              <Users size={24} color={colors.textMuted} />
            </View>
          }
          title="No active members"
          description="Add team members to see the org chart"
        />
      );
    }

    // Amber/Gold for owners
    const ownerBg = "#FFFBEB";
    const ownerAccent = "#D97706";
    // Accent for head chefs
    const headChefBg = colors.accentBg;
    const headChefAccent = colors.accent;
    // Neutral for line cooks
    const lineCookBg = colors.surface;
    const lineCookAccent = colors.textSecondary;

    return (
      <ScrollView
        contentContainerStyle={{
          paddingVertical: 24,
          paddingHorizontal: 16,
          paddingBottom: 100,
        }}
        refreshControl={
          <RefreshControl
            refreshing={orgChartRefetching}
            onRefresh={refetchOrgChart}
          />
        }
      >
        {/* Owners Tier */}
        {owners.length > 0 && (
          <View style={{ marginBottom: 8 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
                gap: 6,
              }}
            >
              <Crown size={16} color={ownerAccent} />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: ownerAccent,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Owners
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              {owners.map((m) => renderOrgChartNode(m, ownerBg, ownerAccent))}
            </View>
          </View>
        )}

        {/* Connecting line from owners to head chefs */}
        {owners.length > 0 && headChefs.length > 0 && renderConnectingLine()}

        {/* Head Chefs Tier */}
        {headChefs.length > 0 && (
          <View style={{ marginBottom: 8 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
                gap: 6,
              }}
            >
              <ChefHat size={16} color={headChefAccent} />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: headChefAccent,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Head Chefs
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              {headChefs.map((m) =>
                renderOrgChartNode(m, headChefBg, headChefAccent)
              )}
            </View>
          </View>
        )}

        {/* Connecting line from head chefs to line cooks */}
        {(owners.length > 0 || headChefs.length > 0) &&
          lineCooks.length > 0 &&
          renderConnectingLine()}

        {/* Line Cooks Tier */}
        {lineCooks.length > 0 && (
          <View style={{ marginBottom: 8 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
                gap: 6,
              }}
            >
              <Users size={16} color={lineCookAccent} />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: lineCookAccent,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Team Members
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              {lineCooks.map((m) =>
                renderOrgChartNode(m, lineCookBg, lineCookAccent)
              )}
            </View>
          </View>
        )}
      </ScrollView>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER: Tasks Tab
  // ═══════════════════════════════════════════════════════════════════════════════

  const renderTasksTab = () => {
    if (!isHeadChef) {
      return (
        <EmptyState
          icon={
            <View>
              <Shield size={24} color={colors.textMuted} />
            </View>
          }
          title="Access Restricted"
          description="Only head chefs and owners can manage tasks"
        />
      );
    }

    return (
      <View style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 24, paddingBottom: 0 }}>
          <TabBar
            tabs={TASK_FILTER_TABS}
            activeTab={taskFilter}
            onTabChange={setTaskFilter}
            accentColor={colors.accent}
            style={{ marginBottom: 8 }}
          />
        </View>

        {tasksLoading ? (
          <View style={{ padding: 24, gap: 10 }}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : filteredTasks.length === 0 ? (
          <EmptyState
            icon={
              <View>
                <ClipboardList size={24} color={colors.textMuted} />
              </View>
            }
            title={
              taskFilter === "all"
                ? "No tasks yet"
                : `No ${taskFilter} tasks`
            }
            description={
              taskFilter === "all"
                ? "Tap + to create a task for your team"
                : "No tasks match this filter"
            }
          />
        ) : (
          <FlatList
            data={filteredTasks}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={
              <RefreshControl
                refreshing={tasksRefetching}
                onRefresh={refetchTasks}
              />
            }
            renderItem={({ item }) => {
              const priorityInfo = getPriorityColor(item.priority);
              return (
                <Pressable
                  onPress={() => handleTaskAction(item)}
                  style={{
                    paddingVertical: 14,
                    paddingHorizontal: 20,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                      marginBottom: 8,
                    }}
                  >
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "600",
                          color: colors.text,
                          marginBottom: 4,
                        }}
                      >
                        {item.title}
                      </Text>
                      {item.description && (
                        <Text
                          style={{
                            fontSize: 13,
                            color: colors.textSecondary,
                            marginBottom: 6,
                          }}
                          numberOfLines={2}
                        >
                          {item.description}
                        </Text>
                      )}
                    </View>
                    <Badge variant={priorityInfo.variant}>
                      {item.priority}
                    </Badge>
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <Badge variant={getStatusVariant(item.status)}>
                      {item.status.replace(/_/g, " ")}
                    </Badge>

                    {item.assignee?.full_name && (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <User size={12} color={colors.textMuted} />
                        <Text
                          style={{
                            fontSize: 12,
                            color: colors.textMuted,
                          }}
                        >
                          {item.assignee.full_name}
                        </Text>
                      </View>
                    )}

                    {item.due_date && (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Calendar size={12} color={colors.textMuted} />
                        <Text
                          style={{
                            fontSize: 12,
                            color:
                              new Date(item.due_date) < new Date()
                                ? colors.destructive
                                : colors.textMuted,
                          }}
                        >
                          {formatDate(item.due_date)}
                        </Text>
                      </View>
                    )}

                    <Text
                      style={{
                        fontSize: 11,
                        color: colors.textMuted,
                        marginLeft: "auto",
                      }}
                    >
                      {item.type.replace(/_/g, " ")}
                    </Text>
                  </View>

                  {item.status === "submitted" && isHeadChef && (
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 10,
                        marginTop: 10,
                      }}
                    >
                      <Pressable
                        onPress={() =>
                          updateTaskStatus.mutate({
                            id: item.id,
                            status: "rejected",
                          })
                        }
                        style={{
                          flex: 1,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          paddingVertical: 8,
                          backgroundColor: colors.destructiveBg,
                          borderRadius: 8,
                        }}
                      >
                        <XCircle size={14} color={colors.destructive} />
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: "600",
                            color: colors.destructive,
                          }}
                        >
                          Reject
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() =>
                          updateTaskStatus.mutate({
                            id: item.id,
                            status: "completed",
                          })
                        }
                        style={{
                          flex: 1,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          paddingVertical: 8,
                          backgroundColor: colors.successBg,
                          borderRadius: 8,
                        }}
                      >
                        <CheckCircle2 size={14} color={colors.success} />
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: "600",
                            color: colors.success,
                          }}
                        >
                          Approve
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </Pressable>
              );
            }}
          />
        )}

        <FAB
          onPress={() => {
            resetTaskForm();
            setShowTaskForm(true);
          }}
        />
      </View>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER: Activity Tab
  // ═══════════════════════════════════════════════════════════════════════════════

  const renderActivityIcon = (action: string) => {
    const type = getActivityIcon(action);
    switch (type) {
      case "recipe":
        return <ChefHat size={16} color={colors.accent} />;
      case "safety":
        return <Shield size={16} color={colors.success} />;
      case "prep":
        return <ClipboardList size={16} color={colors.warning} />;
      case "task":
        return <CheckCircle2 size={16} color={colors.accent} />;
      case "invite":
        return <Send size={16} color={colors.warning} />;
      default:
        return <Activity size={16} color={colors.textMuted} />;
    }
  };

  const renderActivityTab = () => {
    if (activityLoading) {
      return (
        <View style={{ padding: 24, gap: 10 }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      );
    }

    return (
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={activityRefetching}
            onRefresh={refetchActivity}
          />
        }
      >
        {/* Contribution Stats - Past 7 Days */}
        {contributionStats && contributionStats.length > 0 && (
          <View style={{ padding: 20 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <BarChart3 size={18} color={colors.accent} />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: colors.text,
                }}
              >
                Contributions (7 Days)
              </Text>
            </View>

            {contributionStats.map((stat) => {
              const total =
                stat.recipes_created + stat.safety_logs + stat.prep_completed;
              if (total === 0) return null;
              return (
                <View
                  key={stat.user_id}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: colors.accentBg,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 10,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "700",
                          color: colors.accent,
                        }}
                      >
                        {getInitials(stat.full_name)}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: colors.text,
                        flex: 1,
                      }}
                    >
                      {stat.full_name || "Unknown"}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: colors.accent,
                      }}
                    >
                      {total} total
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 16,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <ChefHat size={12} color={colors.accent} />
                      <Text
                        style={{
                          fontSize: 12,
                          color: colors.textSecondary,
                        }}
                      >
                        {stat.recipes_created} recipes
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Shield size={12} color={colors.success} />
                      <Text
                        style={{
                          fontSize: 12,
                          color: colors.textSecondary,
                        }}
                      >
                        {stat.safety_logs} safety
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <ClipboardList size={12} color={colors.warning} />
                      <Text
                        style={{
                          fontSize: 12,
                          color: colors.textSecondary,
                        }}
                      >
                        {stat.prep_completed} prep
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}

            {/* Show message if all stats are zero */}
            {contributionStats.every(
              (s) =>
                s.recipes_created + s.safety_logs + s.prep_completed === 0
            ) && (
              <Text
                style={{
                  fontSize: 13,
                  color: colors.textMuted,
                  textAlign: "center",
                  paddingVertical: 16,
                }}
              >
                No contributions in the past 7 days
              </Text>
            )}
          </View>
        )}

        {/* Divider */}
        {contributionStats && contributionStats.length > 0 && (
          <View
            style={{
              height: 1,
              backgroundColor: colors.border,
              marginHorizontal: 20,
            }}
          />
        )}

        {/* Activity Feed */}
        <View style={{ padding: 20 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <Activity size={18} color={colors.accent} />
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: colors.text,
              }}
            >
              Recent Activity
            </Text>
          </View>

          {!activityLog || activityLog.length === 0 ? (
            <Text
              style={{
                fontSize: 13,
                color: colors.textMuted,
                textAlign: "center",
                paddingVertical: 32,
              }}
            >
              No recent activity
            </Text>
          ) : (
            activityLog.map((entry) => (
              <View
                key={entry.id}
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: colors.surface,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  {renderActivityIcon(entry.action)}
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      color: colors.text,
                      lineHeight: 20,
                    }}
                  >
                    <Text style={{ fontWeight: "600" }}>
                      {entry.profiles?.full_name || "Unknown"}
                    </Text>{" "}
                    {entry.action}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color: colors.textMuted,
                      marginTop: 2,
                    }}
                  >
                    {formatRelativeTime(entry.created_at)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER: Active Tab Content
  // ═══════════════════════════════════════════════════════════════════════════════

  const renderActiveTab = () => {
    switch (mainTab) {
      case "members":
        return renderMembersTab();
      case "invites":
        return renderInvitesTab();
      case "orgchart":
        return renderOrgChartTab();
      case "tasks":
        return renderTasksTab();
      case "activity":
        return renderActivityTab();
      default:
        return renderMembersTab();
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════════════════════════

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Team" />

      {/* Main Tab Bar */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 12 }}>
        <TabBar
          tabs={MAIN_TABS}
          activeTab={mainTab}
          onTabChange={setMainTab}
          accentColor={colors.accent}
        />
      </View>

      {/* Tab Content */}
      {renderActiveTab()}

      {/* ─── Invite / Edit Member FormSheet ─────────────────────────────────── */}
      <FormSheet
        visible={showForm}
        onClose={() => setShowForm(false)}
        onSave={handleSave}
        title={editingMember ? "Edit Member" : "Invite Member"}
        saving={saving}
      >
        {!editingMember && (
          <Input
            label="Email"
            value={inviteEmail}
            onChangeText={setInviteEmail}
            placeholder="chef@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        )}
        {editingMember && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 14,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: "600",
                color: colors.text,
              }}
            >
              {editingMember.profiles?.full_name}
            </Text>
            <Text
              style={{ fontSize: 13, color: colors.textMuted }}
            >
              {editingMember.profiles?.email}
            </Text>
          </View>
        )}
        <Select
          label="Role"
          value={inviteRole}
          onValueChange={setInviteRole}
          options={ROLES}
        />
      </FormSheet>

      {/* ─── Create Task FormSheet ──────────────────────────────────────────── */}
      <FormSheet
        visible={showTaskForm}
        onClose={() => setShowTaskForm(false)}
        onSave={handleCreateTask}
        title="Create Task"
        saveLabel="Create"
        saving={taskSaving}
      >
        <Input
          label="Title"
          value={newTaskTitle}
          onChangeText={setNewTaskTitle}
          placeholder="Task title"
        />
        <Input
          label="Description"
          value={newTaskDescription}
          onChangeText={setNewTaskDescription}
          placeholder="Describe the task..."
          multiline
          numberOfLines={3}
          style={{ minHeight: 80, textAlignVertical: "top" }}
        />
        <Select
          label="Type"
          value={newTaskType}
          onValueChange={setNewTaskType}
          options={TASK_TYPES}
        />
        <Select
          label="Priority"
          value={newTaskPriority}
          onValueChange={setNewTaskPriority}
          options={TASK_PRIORITIES}
        />
        <Select
          label="Assign To"
          value={newTaskAssignee}
          onValueChange={setNewTaskAssignee}
          options={[{ label: "Unassigned", value: "" }, ...assigneeOptions]}
        />
        <Input
          label="Due Date"
          value={newTaskDueDate}
          onChangeText={setNewTaskDueDate}
          placeholder="YYYY-MM-DD"
          keyboardType="numbers-and-punctuation"
        />
      </FormSheet>

      {/* ─── Permission Management Modal ────────────────────────────────────── */}
      <Modal
        visible={!!permMember}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView
          style={{ flex: 1, backgroundColor: colors.background }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Pressable onPress={() => setPermMember(null)}>
              <Text style={{ fontSize: 16, color: colors.accent }}>
                Done
              </Text>
            </Pressable>
            <Text
              style={{
                fontSize: 17,
                fontWeight: "700",
                color: colors.text,
              }}
            >
              Permissions
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <View
            style={{
              padding: 16,
              backgroundColor: colors.accentBg,
              marginHorizontal: 16,
              marginTop: 16,
              borderRadius: 12,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: "600",
                color: colors.text,
              }}
            >
              {permMember?.profiles?.full_name}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: colors.textSecondary,
                marginTop: 2,
              }}
            >
              {permMember?.profiles?.email}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: colors.textMuted,
                marginTop: 4,
              }}
            >
              Toggle which modules this team member can access and edit.
            </Text>
          </View>

          <ScrollView
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          >
            {/* Table header */}
            <View
              style={{
                flexDirection: "row",
                paddingVertical: 10,
                paddingHorizontal: 4,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Text
                style={{
                  flex: 1,
                  fontSize: 12,
                  fontWeight: "700",
                  color: colors.textMuted,
                  textTransform: "uppercase",
                }}
              >
                Module
              </Text>
              <Text
                style={{
                  width: 70,
                  fontSize: 12,
                  fontWeight: "700",
                  color: colors.textMuted,
                  textTransform: "uppercase",
                  textAlign: "center",
                }}
              >
                View
              </Text>
              <Text
                style={{
                  width: 70,
                  fontSize: 12,
                  fontWeight: "700",
                  color: colors.textMuted,
                  textTransform: "uppercase",
                  textAlign: "center",
                }}
              >
                Edit
              </Text>
            </View>

            {ALL_MODULES.map((mod) => (
              <View
                key={mod.key}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 12,
                  paddingHorizontal: 4,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <Text
                  style={{
                    flex: 1,
                    fontSize: 15,
                    fontWeight: "500",
                    color: colors.text,
                  }}
                >
                  {mod.label}
                </Text>
                <View style={{ width: 70, alignItems: "center" }}>
                  <Switch
                    value={getPermValue(mod.key, "can_view")}
                    onValueChange={(v) => {
                      if (permMember)
                        updatePermission.mutate({
                          userId: permMember.user_id,
                          module: mod.key,
                          field: "can_view",
                          value: v,
                        });
                    }}
                    trackColor={{ true: colors.accent }}
                  />
                </View>
                <View style={{ width: 70, alignItems: "center" }}>
                  <Switch
                    value={getPermValue(mod.key, "can_edit")}
                    onValueChange={(v) => {
                      if (permMember)
                        updatePermission.mutate({
                          userId: permMember.user_id,
                          module: mod.key,
                          field: "can_edit",
                          value: v,
                        });
                    }}
                    trackColor={{ true: colors.accent }}
                  />
                </View>
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
