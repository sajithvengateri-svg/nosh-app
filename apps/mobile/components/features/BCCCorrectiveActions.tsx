import { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  RefreshControl,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useOrg } from "../../contexts/OrgProvider";
import { useAuth } from "../../contexts/AuthProvider";
import { useTheme } from "../../contexts/ThemeProvider";
import { Card, CardContent } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { FormSheet } from "../ui/FormSheet";
import { EmptyState } from "../ui/EmptyState";
import { FAB } from "../ui/FAB";
import { SkeletonCard } from "../ui/Skeleton";
import { DatePicker } from "../ui/DatePicker";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Severity = "critical" | "major" | "minor";
type Status = "open" | "in_progress" | "resolved" | "closed";

interface FilterTab {
  key: Status | "all";
  label: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FILTER_TABS: FilterTab[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "in_progress", label: "In Progress" },
  { key: "resolved", label: "Resolved" },
  { key: "closed", label: "Closed" },
];

const SEVERITY_OPTIONS: { key: Severity; label: string }[] = [
  { key: "critical", label: "Critical" },
  { key: "major", label: "Major" },
  { key: "minor", label: "Minor" },
];

const STATUS_FLOW: Status[] = ["open", "in_progress", "resolved", "closed"];

function getNextStatus(current: Status): Status {
  const idx = STATUS_FLOW.indexOf(current);
  if (idx < 0 || idx >= STATUS_FLOW.length - 1) return current;
  return STATUS_FLOW[idx + 1];
}

function getSeverityVariant(severity: Severity): "destructive" | "warning" | "default" {
  if (severity === "critical") return "destructive";
  if (severity === "major") return "warning";
  return "default";
}

function getStatusVariant(status: Status): "destructive" | "warning" | "success" | "secondary" {
  if (status === "open") return "destructive";
  if (status === "in_progress") return "warning";
  if (status === "resolved") return "success";
  return "secondary";
}

function getStatusLabel(status: Status): string {
  if (status === "in_progress") return "In Progress";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatDate(dateString: string): string {
  const d = new Date(dateString);
  return d.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BCCCorrectiveActions() {
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();

  // State
  const [activeFilter, setActiveFilter] = useState<Status | "all">("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<null | string>(null);
  const [severity, setSeverity] = useState<Severity>("major");
  const [description, setDescription] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");

  // ---------------------------------------------------------------------------
  // Query
  // ---------------------------------------------------------------------------

  const queryKey = ["corrective-actions", orgId];

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("corrective_actions")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: teamMembers } = useQuery({
    queryKey: ["team-members", orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from("org_memberships")
        .select("user_id, profiles!inner(full_name, email)")
        .eq("org_id", orgId);
      return (data ?? []).map((m: any) => ({
        label: m.profiles?.full_name || m.profiles?.email || "Unknown",
        value: m.profiles?.full_name || m.profiles?.email || "Unknown",
      }));
    },
    enabled: !!orgId,
  });

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  const actions = (data as any[] | undefined) || [];

  const filteredActions = useMemo(() => {
    if (activeFilter === "all") return actions;
    return actions.filter((a: any) => a.status === activeFilter);
  }, [actions, activeFilter]);

  const openCriticals = useMemo(
    () =>
      actions.filter(
        (a: any) => a.severity === "critical" && a.status === "open"
      ),
    [actions]
  );

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("No org selected");
      if (!description.trim()) throw new Error("Description is required");

      const { error } = await supabase.from("corrective_actions").insert({
        org_id: orgId,
        severity,
        description: description.trim(),
        action_taken: actionTaken.trim() || null,
        assigned_to: assignedTo.trim() || null,
        due_date: dueDate.trim() || null,
        status: "open",
        created_by: user?.id || null,
        created_by_name: user?.email || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      resetForm();
    },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: {
      id: string;
      description?: string;
      action_taken?: string;
      severity?: string;
      assigned_to?: string;
      due_date?: string;
    }) => {
      const { id, ...rest } = updates;
      const { error } = await supabase
        .from("corrective_actions")
        .update(rest)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      resetForm();
    },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  const statusMutation = useMutation({
    mutationFn: async ({
      id,
      newStatus,
    }: {
      id: string;
      newStatus: Status;
    }) => {
      const { error } = await supabase
        .from("corrective_actions")
        .update({ status: newStatus })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const resetForm = useCallback(() => {
    setSheetOpen(false);
    setEditingAction(null);
    setSeverity("major");
    setDescription("");
    setActionTaken("");
    setAssignedTo("");
    setDueDate("");
  }, []);

  const handleSave = () => {
    if (!description.trim()) {
      Alert.alert("Missing", "Please enter a description");
      return;
    }
    if (editingAction) {
      updateMutation.mutate({
        id: editingAction,
        description: description.trim(),
        action_taken: actionTaken.trim() || undefined,
        severity,
        assigned_to: assignedTo.trim() || undefined,
        due_date: dueDate.trim() || undefined,
      });
    } else {
      createMutation.mutate();
    }
  };

  const handleEdit = (item: any) => {
    setEditingAction(item.id);
    setSeverity(item.severity || "major");
    setDescription(item.description || "");
    setActionTaken(item.action_taken || "");
    setAssignedTo(item.assigned_to || "");
    setDueDate(item.due_date || "");
    setSheetOpen(true);
  };

  const handleStatusCycle = (item: any) => {
    const next = getNextStatus(item.status);
    if (next === item.status) return;
    statusMutation.mutate({ id: item.id, newStatus: next });
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <View style={{ flex: 1 }}>
      {/* Critical alert banner */}
      {openCriticals.length > 0 && (
        <View
          style={{
            backgroundColor: colors.destructiveBg,
            borderRadius: 10,
            padding: 12,
            marginHorizontal: 16,
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: colors.destructive,
            }}
          >
            {openCriticals.length} open critical{" "}
            {openCriticals.length === 1 ? "action" : "actions"} requiring
            attention
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: colors.destructive,
              marginTop: 2,
            }}
          >
            Address critical corrective actions immediately to maintain
            compliance.
          </Text>
        </View>
      )}

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          gap: 6,
          marginBottom: 12,
        }}
      >
        {FILTER_TABS.map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveFilter(tab.key)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: isActive ? colors.accentBg : colors.surface,
                borderWidth: 1,
                borderColor: isActive ? colors.accent : colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: isActive ? colors.accent : colors.textSecondary,
                }}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* List */}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 100,
          gap: 10,
        }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {isLoading ? (
          <View style={{ gap: 10 }}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : filteredActions.length === 0 ? (
          <EmptyState
            icon="\u2705"
            title="No corrective actions"
            description={
              activeFilter === "all"
                ? "No corrective actions have been logged yet."
                : `No ${activeFilter === "in_progress" ? "in progress" : activeFilter} corrective actions.`
            }
          />
        ) : (
          filteredActions.map((item: any) => (
            <Pressable key={item.id} onPress={() => handleEdit(item)}>
            <Card>
              <CardContent style={{ paddingTop: 16 }}>
                {/* Top row: date + severity */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.textMuted,
                      fontWeight: "500",
                    }}
                  >
                    {item.created_at ? formatDate(item.created_at) : ""}
                  </Text>
                  <Badge variant={getSeverityVariant(item.severity)}>
                    {item.severity
                      ? item.severity.charAt(0).toUpperCase() +
                        item.severity.slice(1)
                      : ""}
                  </Badge>
                </View>

                {/* Description */}
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: colors.text,
                    marginBottom: 8,
                  }}
                  numberOfLines={3}
                >
                  {item.description}
                </Text>

                {/* Action taken */}
                {item.action_taken ? (
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.textSecondary,
                      marginBottom: 8,
                    }}
                    numberOfLines={2}
                  >
                    {item.action_taken}
                  </Text>
                ) : null}

                {/* Bottom row: assigned to + due date + status badge */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 4,
                  }}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    {item.assigned_to ? (
                      <Text
                        style={{
                          fontSize: 12,
                          color: colors.textSecondary,
                          fontWeight: "500",
                        }}
                      >
                        Assigned: {item.assigned_to}
                      </Text>
                    ) : null}
                    {item.due_date ? (
                      <Text
                        style={{
                          fontSize: 12,
                          color: colors.textMuted,
                        }}
                      >
                        Due: {item.due_date}
                      </Text>
                    ) : null}
                  </View>

                  <Pressable onPress={() => handleStatusCycle(item)}>
                    <Badge variant={getStatusVariant(item.status)}>
                      {getStatusLabel(item.status)}
                    </Badge>
                  </Pressable>
                </View>
              </CardContent>
            </Card>
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <FAB
        onPress={() => setSheetOpen(true)}
        icon="+"
        color={colors.accent}
      />

      {/* Create / Edit FormSheet */}
      <FormSheet
        visible={sheetOpen}
        onClose={resetForm}
        onSave={handleSave}
        title={editingAction ? "Edit Corrective Action" : "New Corrective Action"}
        saveLabel={editingAction ? "Update" : "Save"}
        saving={editingAction ? updateMutation.isPending : createMutation.isPending}
      >
        {/* Severity selector */}
        <View>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: colors.textSecondary,
              marginBottom: 8,
            }}
          >
            Severity
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {SEVERITY_OPTIONS.map((opt) => {
              const isSelected = severity === opt.key;
              const pillBg =
                opt.key === "critical"
                  ? isSelected
                    ? colors.destructiveBg
                    : colors.surface
                  : opt.key === "major"
                    ? isSelected
                      ? colors.warningBg
                      : colors.surface
                    : isSelected
                      ? colors.accentBg
                      : colors.surface;
              const pillBorder =
                opt.key === "critical"
                  ? isSelected
                    ? colors.destructive
                    : colors.border
                  : opt.key === "major"
                    ? isSelected
                      ? colors.warning
                      : colors.border
                    : isSelected
                      ? colors.accent
                      : colors.border;
              const pillText =
                opt.key === "critical"
                  ? isSelected
                    ? colors.destructive
                    : colors.textSecondary
                  : opt.key === "major"
                    ? isSelected
                      ? colors.warning
                      : colors.textSecondary
                    : isSelected
                      ? colors.accent
                      : colors.textSecondary;

              return (
                <Pressable
                  key={opt.key}
                  onPress={() => setSeverity(opt.key)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: "center",
                    backgroundColor: pillBg,
                    borderWidth: 2,
                    borderColor: pillBorder,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color: pillText,
                    }}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Description */}
        <Input
          label="Description *"
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the non-conformance..."
          multiline
          numberOfLines={3}
          style={{ minHeight: 80, textAlignVertical: "top" }}
        />

        {/* Action taken */}
        <Input
          label="Action Taken"
          value={actionTaken}
          onChangeText={setActionTaken}
          placeholder="What corrective action was taken?"
          multiline
          numberOfLines={2}
          style={{ minHeight: 60, textAlignVertical: "top" }}
        />

        {/* Assigned to */}
        {teamMembers && teamMembers.length > 0 ? (
          <Select
            label="Assigned To"
            placeholder="Select team member..."
            value={assignedTo}
            options={teamMembers}
            onValueChange={setAssignedTo}
          />
        ) : (
          <Input
            label="Assigned To"
            value={assignedTo}
            onChangeText={setAssignedTo}
            placeholder="Who is responsible?"
          />
        )}

        {/* Due date */}
        <DatePicker
          label="Due Date"
          placeholder="Select due date"
          value={dueDate ? new Date(dueDate + "T00:00:00") : new Date()}
          onChange={(date) => setDueDate(date.toISOString().split("T")[0])}
        />
      </FormSheet>
    </View>
  );
}
