import { View, Text, Pressable, ScrollView, Alert } from "react-native";
import { useTheme } from "../../contexts/ThemeProvider";
import { Circle, CheckCircle2, Trash2, ArrowRight } from "lucide-react-native";
import { lightTap } from "../../lib/haptics";
import type { PrepItem } from "../../hooks/usePrepLists";

interface KanbanSection {
  listId: string;
  title: string;
  items: PrepItem[];
  priority: string;
}

interface KanbanBoardProps {
  sections: KanbanSection[];
  onToggle: (listId: string, items: PrepItem[], idx: number) => void;
  onDeleteItem: (listId: string, items: PrepItem[], idx: number) => void;
  onDeleteList: (listId: string, name: string) => void;
}

const COLUMNS = [
  { key: "pending" as const, label: "To Do", dotColor: "#9CA3AF" },
  { key: "in_progress" as const, label: "In Progress", dotColor: "#F59E0B" },
  { key: "done" as const, label: "Done", dotColor: "#10B981" },
];

export function KanbanBoard({ sections, onToggle, onDeleteItem, onDeleteList }: KanbanBoardProps) {
  const { colors } = useTheme();

  // Group all items across all sections into columns
  const columns: Record<string, { item: PrepItem; listId: string; listItems: PrepItem[]; idx: number; listTitle: string; priority: string }[]> = {
    pending: [],
    in_progress: [],
    done: [],
  };

  sections.forEach((sec) => {
    (sec.items || []).forEach((item, idx) => {
      const status = item.completed ? "done" : "pending";
      columns[status].push({ item, listId: sec.listId, listItems: sec.items, idx, listTitle: sec.title, priority: sec.priority });
    });
  });

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 16 }}>
      {COLUMNS.map((col) => {
        const items = columns[col.key] || [];
        return (
          <View key={col.key} style={{ width: 260 }}>
            {/* Column header */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10, paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: col.dotColor + "40" }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>{col.label}</Text>
              <View style={{ backgroundColor: colors.surface, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textMuted }}>{items.length}</Text>
              </View>
            </View>

            {/* Cards */}
            <View style={{ gap: 8, minHeight: 120 }}>
              {items.map((entry, i) => (
                <View
                  key={`${entry.listId}-${entry.idx}-${i}`}
                  style={{
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                    borderRadius: 12,
                    padding: 12,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
                    <Pressable
                      onPress={() => { lightTap(); onToggle(entry.listId, entry.listItems, entry.idx); }}
                      hitSlop={8}
                    >
                      {entry.item.completed ? (
                        <CheckCircle2 size={20} color={colors.success} strokeWidth={2} />
                      ) : (
                        <Circle size={20} color={colors.textMuted} strokeWidth={1.5} />
                      )}
                    </Pressable>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: entry.item.completed ? colors.textMuted : colors.text,
                          textDecorationLine: entry.item.completed ? "line-through" : "none",
                        }}
                        numberOfLines={2}
                      >
                        {entry.item.task}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                        {entry.priority === "high" && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.destructive }} />}
                        {entry.priority === "medium" && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.warning }} />}
                        <Text style={{ fontSize: 11, color: colors.textMuted }}>{entry.listTitle}</Text>
                        {entry.item.quantity ? <Text style={{ fontSize: 11, color: colors.textSecondary }}>{entry.item.quantity}</Text> : null}
                      </View>
                    </View>
                    <Pressable
                      onPress={() => {
                        Alert.alert(entry.item.task, "Actions", [
                          { text: entry.item.completed ? "Mark Undone" : "Mark Done", onPress: () => onToggle(entry.listId, entry.listItems, entry.idx) },
                          { text: "Delete Task", style: "destructive", onPress: () => onDeleteItem(entry.listId, entry.listItems, entry.idx) },
                          { text: "Cancel", style: "cancel" },
                        ]);
                      }}
                      hitSlop={8}
                    >
                      <ArrowRight size={14} color={colors.textMuted} strokeWidth={1.5} />
                    </Pressable>
                  </View>
                </View>
              ))}
              {items.length === 0 && (
                <View style={{ alignItems: "center", paddingVertical: 24, opacity: 0.5 }}>
                  <Text style={{ fontSize: 12, color: colors.textMuted }}>Empty</Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}
