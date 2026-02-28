import { useState, useMemo } from "react";
import { View, Text, Pressable, TextInput } from "react-native";
import { ChevronUp, ChevronDown, X, Plus, Search } from "lucide-react-native";
import { Input } from "../ui/Input";
import { useTheme } from "../../contexts/ThemeProvider";
import { useIngredients, type Ingredient } from "../../hooks/useIngredients";

export interface RecipeIngredientLine {
  ingredient_id?: string;
  name: string;
  quantity: number | null;
  unit: string;
  cost_per_unit?: number | null;
  allergens?: string[] | null;
}

interface IngredientBuilderProps {
  items: RecipeIngredientLine[];
  onChange: (items: RecipeIngredientLine[]) => void;
}

export function IngredientBuilder({ items, onChange }: IngredientBuilderProps) {
  const { colors } = useTheme();
  const { data: dbIngredients = [] } = useIngredients();
  const [searchText, setSearchText] = useState("");
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState("kg");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);

  const filteredIngredients = useMemo(() => {
    if (!searchText.trim() || searchText.length < 2) return [];
    const q = searchText.toLowerCase();
    return dbIngredients
      .filter((i) => i.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [searchText, dbIngredients]);

  const selectFromDb = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setSearchText(ingredient.name);
    setUnit(ingredient.unit || "kg");
    setShowDropdown(false);
  };

  const addItem = () => {
    if (!searchText.trim()) return;
    const newItem: RecipeIngredientLine = {
      ingredient_id: selectedIngredient?.id,
      name: selectedIngredient?.name || searchText.trim(),
      quantity: qty ? Number(qty) : null,
      unit,
      cost_per_unit: selectedIngredient?.cost_per_unit ?? null,
      allergens: selectedIngredient?.allergens ?? null,
    };
    onChange([...items, newItem]);
    setSearchText("");
    setQty("");
    setUnit("kg");
    setSelectedIngredient(null);
    setShowDropdown(false);
  };

  const removeItem = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  const moveItem = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= items.length) return;
    const updated = [...items];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    onChange(updated);
  };

  const totalCost = items.reduce((sum, i) => sum + ((i.quantity || 0) * (i.cost_per_unit || 0)), 0);

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textSecondary }}>Ingredients ({items.length})</Text>
        {totalCost > 0 && <Text style={{ fontSize: 13, color: colors.accent, fontWeight: "600" }}>Cost: ${totalCost.toFixed(2)}</Text>}
      </View>

      {items.map((item, idx) => (
        <View key={idx} style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.surface, borderRadius: 10, padding: 10 }}>
          <View style={{ gap: 2 }}>
            <Pressable onPress={() => moveItem(idx, -1)} disabled={idx === 0}>
              <ChevronUp size={16} color={idx === 0 ? colors.border : colors.accent} strokeWidth={1.5} />
            </Pressable>
            <Pressable onPress={() => moveItem(idx, 1)} disabled={idx === items.length - 1}>
              <ChevronDown size={16} color={idx === items.length - 1 ? colors.border : colors.accent} strokeWidth={1.5} />
            </Pressable>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>{item.name}</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
              {item.quantity || "—"} {item.unit}
              {item.cost_per_unit ? ` · $${((item.quantity || 0) * item.cost_per_unit).toFixed(2)}` : ""}
            </Text>
          </View>
          {item.ingredient_id && (
            <View style={{ backgroundColor: colors.accentBg, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Text style={{ fontSize: 10, color: colors.accent, fontWeight: "600" }}>DB</Text>
            </View>
          )}
          <Pressable onPress={() => removeItem(idx)}>
            <X size={18} color={colors.destructive} strokeWidth={1.5} />
          </Pressable>
        </View>
      ))}

      {/* Search + Add */}
      <View style={{ gap: 8 }}>
        <View style={{ position: "relative", zIndex: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: showDropdown && filteredIngredients.length > 0 ? colors.accent : colors.border, paddingHorizontal: 12 }}>
            <Search size={16} color={colors.textSecondary} strokeWidth={1.5} />
            <TextInput
              value={searchText}
              onChangeText={(t) => {
                setSearchText(t);
                setSelectedIngredient(null);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search or type ingredient..."
              placeholderTextColor={colors.textSecondary}
              style={{ flex: 1, paddingVertical: 12, paddingLeft: 8, fontSize: 14, color: colors.text }}
            />
            {searchText.length > 0 && (
              <Pressable onPress={() => { setSearchText(""); setSelectedIngredient(null); setShowDropdown(false); }}>
                <X size={16} color={colors.textSecondary} strokeWidth={1.5} />
              </Pressable>
            )}
          </View>

          {/* Dropdown results */}
          {showDropdown && searchText.length >= 2 && (
            <View style={{ position: "absolute", top: "100%", left: 0, right: 0, backgroundColor: colors.card, borderRadius: 10, borderWidth: 1, borderColor: colors.border, marginTop: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5, maxHeight: 240, overflow: "hidden" }}>
              {filteredIngredients.map((ing) => (
                <Pressable
                  key={ing.id}
                  onPress={() => selectFromDb(ing)}
                  style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>{ing.name}</Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>{ing.unit || "—"}{ing.cost_per_unit ? ` · $${ing.cost_per_unit.toFixed(2)}/${ing.unit}` : ""}</Text>
                  </View>
                </Pressable>
              ))}
              {filteredIngredients.length === 0 && (
                <Pressable
                  onPress={() => { setShowDropdown(false); }}
                  style={{ paddingHorizontal: 14, paddingVertical: 12 }}
                >
                  <Text style={{ fontSize: 13, color: colors.textSecondary }}>No matches — type to add "{searchText}" as custom</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>

        <View style={{ flexDirection: "row", gap: 6 }}>
          <View style={{ flex: 1 }}>
            <Input value={qty} onChangeText={setQty} placeholder="Qty" keyboardType="decimal-pad" containerStyle={{ marginBottom: 0 }} />
          </View>
          <View style={{ flex: 1 }}>
            <Input value={unit} onChangeText={setUnit} placeholder="Unit" containerStyle={{ marginBottom: 0 }} />
          </View>
        </View>

        <Pressable onPress={addItem} style={{ flexDirection: "row", backgroundColor: colors.accent, borderRadius: 10, paddingVertical: 10, alignItems: "center", justifyContent: "center", gap: 6 }}>
          <Plus size={16} color="#FFFFFF" strokeWidth={2} />
          <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 14 }}>Add Ingredient</Text>
        </Pressable>
      </View>
    </View>
  );
}
