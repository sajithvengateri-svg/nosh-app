import { useEffect, useState } from "react";
import { View, Text, Pressable, FlatList, TextInput, StyleSheet } from "react-native";
import { ShoppingCart, Check } from "lucide-react-native";
import { Colors, Glass } from "../../constants/colors";
import { useShoppingListStore } from "../../lib/stores/shoppingListStore";
import { lightTap, successNotification } from "../../lib/haptics";

export function ShoppingListOverlay() {
  const { items, isLoading, fetchList, addItem, toggleItem, clearChecked } =
    useShoppingListStore();
  const [newItemText, setNewItemText] = useState("");

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleAdd = () => {
    if (!newItemText.trim()) return;
    lightTap();
    addItem({ name: newItemText.trim() });
    setNewItemText("");
  };

  const handleClear = () => {
    successNotification();
    clearChecked();
  };

  const checkedCount = items.filter((i) => i.is_checked).length;

  return (
    <View style={styles.container}>
      {/* Add item input */}
      <View style={styles.inputRow}>
        <TextInput
          value={newItemText}
          onChangeText={setNewItemText}
          placeholder="Add item..."
          placeholderTextColor={Colors.text.muted}
          style={styles.input}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
          autoComplete="off"
          textContentType="none"
          autoCorrect={false}
        />
        <Pressable onPress={handleAdd} style={styles.addButton}>
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      </View>

      {/* Progress */}
      {items.length > 0 && (
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>
            {checkedCount}/{items.length} items
          </Text>
          {checkedCount > 0 && (
            <Pressable onPress={handleClear}>
              <Text style={styles.clearText}>Clear checked</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Item list */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              lightTap();
              toggleItem(item.id);
            }}
            style={[styles.itemRow, item.is_checked && styles.itemChecked]}
          >
            <View style={[styles.checkbox, item.is_checked && styles.checkboxChecked]}>
              {item.is_checked && <Check size={14} color="#FFF" strokeWidth={2} />}
            </View>
            <Text
              style={[styles.itemText, item.is_checked && styles.itemTextChecked]}
            >
              {item.name}
            </Text>
            {item.quantity && (
              <Text style={styles.quantityText}>{item.quantity} {item.unit ?? ""}</Text>
            )}
            {item.supermarket_section && (
              <Text style={styles.sectionBadge}>{item.supermarket_section}</Text>
            )}
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={{ marginBottom: 12 }}>
              <ShoppingCart size={40} color={Colors.text.muted} strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyText}>
              {isLoading
                ? "Loading..."
                : "Your shopping list is empty.\nItems from recipes you cook will appear here."}
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inputRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  input: {
    flex: 1, backgroundColor: Glass.surface, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 15,
    color: Colors.text.primary, borderWidth: 1, borderColor: Glass.borderLight,
  },
  addButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: Glass.surface, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: Glass.borderLight },
  addButtonText: { color: Colors.secondary, fontSize: 24, fontWeight: "600" },
  progressRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  progressText: { fontSize: 13, color: Colors.text.secondary },
  clearText: { fontSize: 13, color: Colors.text.secondary, fontWeight: "600" },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: Glass.borderLight },
  itemChecked: { opacity: 0.5 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: Glass.borderLight, justifyContent: "center", alignItems: "center" },
  checkboxChecked: { backgroundColor: Colors.success, borderColor: Glass.borderLight },
  checkmark: { color: "#FFF", fontSize: 14, fontWeight: "700" },
  itemText: { flex: 1, fontSize: 15, color: Colors.text.primary },
  itemTextChecked: { textDecorationLine: "line-through" },
  quantityText: { fontSize: 13, color: Colors.text.secondary },
  sectionBadge: { fontSize: 10, color: Colors.text.muted, backgroundColor: Glass.surface, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: Glass.borderLight },
  empty: { alignItems: "center", paddingTop: 40 },
  emptyText: { fontSize: 14, color: Colors.text.secondary, textAlign: "center", lineHeight: 20 },
});
