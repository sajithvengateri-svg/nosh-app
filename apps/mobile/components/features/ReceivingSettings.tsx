import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import { useTheme } from "../../contexts/ThemeProvider";
import { useAuth } from "../../contexts/AuthProvider";
import { Card, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Badge } from "../ui/Badge";
import { EmptyState } from "../ui/EmptyState";
import { SkeletonCard } from "../ui/Skeleton";
import { FAB } from "../ui/FAB";
import { FormSheet } from "../ui/FormSheet";
import { Settings } from "lucide-react-native";
import {
  useReceivingSettings,
  useReceivingSettingsMutations,
  PRODUCT_CATEGORY_LABELS,
  type ProductCategory,
  type ReceivingSetting,
} from "../../hooks/useReceiving";

export function ReceivingSettings() {
  const { colors } = useTheme();
  const { isHeadChef, isDevBypass } = useAuth();
  const canManage = isHeadChef || isDevBypass;
  const { settings, isLoading, refetch } = useReceivingSettings();
  const { updateSetting, seedDefaults, insertSetting } = useReceivingSettingsMutations();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMin, setEditMin] = useState("");
  const [editMax, setEditMax] = useState("");
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Add category form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newTempMin, setNewTempMin] = useState("");
  const [newTempMax, setNewTempMax] = useState("");
  const [newRequiresTemp, setNewRequiresTemp] = useState(true);
  const [newAiQuality, setNewAiQuality] = useState(false);

  const resetAddForm = () => {
    setShowAddForm(false);
    setNewCategory("");
    setNewTempMin("");
    setNewTempMax("");
    setNewRequiresTemp(true);
    setNewAiQuality(false);
  };

  const handleAddCategory = async () => {
    const name = newCategory.trim().toLowerCase().replace(/\s+/g, "_");
    if (!name) {
      Alert.alert("Error", "Category name is required");
      return;
    }
    if (settings.some((s) => s.product_category === name)) {
      Alert.alert("Error", "This category already exists");
      return;
    }
    try {
      await insertSetting.mutateAsync({
        product_category: name,
        temp_min: newRequiresTemp && newTempMin.trim() ? parseFloat(newTempMin) : null,
        temp_max: newRequiresTemp && newTempMax.trim() ? parseFloat(newTempMax) : null,
        requires_temp_check: newRequiresTemp,
        ai_quality_check_enabled: newAiQuality,
      });
      await refetch();
      resetAddForm();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  if (!canManage) {
    return (
      <EmptyState
        icon={<Settings size={48} color={colors.textMuted} strokeWidth={1.5} />}
        title="Head Chef Access Only"
        description="Only head chefs can manage receiving temperature benchmarks."
        style={{ paddingVertical: 60 }}
      />
    );
  }

  if (isLoading) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </ScrollView>
    );
  }

  if (settings.length === 0) {
    return (
      <EmptyState
        icon={<Settings size={48} color={colors.textMuted} strokeWidth={1.5} />}
        title="No Receiving Settings"
        description="Set up temperature benchmarks for each product category. These are used to auto-check incoming delivery temperatures."
        actionLabel="Seed Defaults"
        onAction={async () => {
          setSeeding(true);
          try {
            await seedDefaults.mutateAsync();
            await refetch();
          } catch (e: any) {
            Alert.alert("Error", e.message);
          } finally {
            setSeeding(false);
          }
        }}
        style={{ paddingVertical: 60 }}
      />
    );
  }

  const startEdit = (setting: ReceivingSetting) => {
    setEditingId(setting.id);
    setEditMin(setting.temp_min?.toString() ?? "");
    setEditMax(setting.temp_max?.toString() ?? "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditMin("");
    setEditMax("");
  };

  const handleSave = async (setting: ReceivingSetting) => {
    setSaving(true);
    try {
      const min = editMin.trim() ? parseFloat(editMin) : null;
      const max = editMax.trim() ? parseFloat(editMax) : null;
      await updateSetting.mutateAsync({ id: setting.id, temp_min: min, temp_max: max } as any);
      await refetch();
      cancelEdit();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleTempCheck = async (setting: ReceivingSetting) => {
    try {
      await updateSetting.mutateAsync({
        id: setting.id,
        requires_temp_check: !setting.requires_temp_check,
      } as any);
      await refetch();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const toggleAiQuality = async (setting: ReceivingSetting) => {
    try {
      await updateSetting.mutateAsync({
        id: setting.id,
        ai_quality_check_enabled: !setting.ai_quality_check_enabled,
      } as any);
      await refetch();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const formatCategoryLabel = (cat: string) =>
    PRODUCT_CATEGORY_LABELS[cat as ProductCategory] ||
    cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <Text style={{ fontSize: 20, fontWeight: "700", color: colors.text, marginBottom: 4 }}>
          Receiving Settings
        </Text>
        <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 16 }}>
          Temperature benchmarks for incoming goods. These are checked when logging deliveries.
        </Text>

        {settings.map((setting) => {
          const label = formatCategoryLabel(setting.product_category);
          const isEditing = editingId === setting.id;

          return (
            <Card key={setting.id} style={{ marginBottom: 10 }}>
              <CardContent style={{ paddingTop: 14, paddingBottom: 14 }}>
                {/* Header */}
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>{label}</Text>
                  {setting.requires_temp_check && setting.temp_min != null && setting.temp_max != null ? (
                    <Badge variant="success">
                      {`${setting.temp_min}\u2013${setting.temp_max}\u00B0C`}
                    </Badge>
                  ) : (
                    <Badge variant="default">No temp check</Badge>
                  )}
                </View>

                {/* Toggles */}
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <Text style={{ fontSize: 13, color: colors.textSecondary }}>Requires temp check</Text>
                  <Switch
                    value={setting.requires_temp_check}
                    onValueChange={() => toggleTempCheck(setting)}
                    trackColor={{ true: colors.accent, false: colors.border }}
                  />
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <Text style={{ fontSize: 13, color: colors.textSecondary }}>AI quality check</Text>
                  <Switch
                    value={setting.ai_quality_check_enabled}
                    onValueChange={() => toggleAiQuality(setting)}
                    trackColor={{ true: colors.accent, false: colors.border }}
                  />
                </View>

                {/* Temp range editing */}
                {setting.requires_temp_check && (
                  isEditing ? (
                    <View>
                      <View style={{ flexDirection: "row", gap: 10 }}>
                        <Input
                          label="Min \u00B0C"
                          value={editMin}
                          onChangeText={setEditMin}
                          keyboardType="decimal-pad"
                          containerStyle={{ flex: 1 }}
                        />
                        <Input
                          label="Max \u00B0C"
                          value={editMax}
                          onChangeText={setEditMax}
                          keyboardType="decimal-pad"
                          containerStyle={{ flex: 1 }}
                        />
                      </View>
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        <Button
                          onPress={() => handleSave(setting)}
                          loading={saving}
                          style={{ flex: 1 }}
                        >
                          Save
                        </Button>
                        <Button
                          onPress={cancelEdit}
                          variant="outline"
                          style={{ flex: 1 }}
                        >
                          Cancel
                        </Button>
                      </View>
                    </View>
                  ) : (
                    <Button
                      onPress={() => startEdit(setting)}
                      variant="outline"
                      size="sm"
                    >
                      Edit Range
                    </Button>
                  )
                )}
              </CardContent>
            </Card>
          );
        })}
      </ScrollView>

      <FAB onPress={() => { resetAddForm(); setShowAddForm(true); }} color={colors.accent} />

      <FormSheet
        visible={showAddForm}
        onClose={resetAddForm}
        onSave={handleAddCategory}
        title="Add Category"
        saving={insertSetting.isPending}
      >
        <Input
          label="Category Name"
          value={newCategory}
          onChangeText={setNewCategory}
          placeholder="e.g. Beverages, Condiments"
        />
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 }}>
          <Text style={{ fontSize: 14, fontWeight: "500", color: colors.textSecondary }}>Requires temp check</Text>
          <Switch
            value={newRequiresTemp}
            onValueChange={setNewRequiresTemp}
            trackColor={{ false: colors.border, true: colors.accent }}
          />
        </View>
        {newRequiresTemp && (
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Input
              label="Min \u00B0C"
              value={newTempMin}
              onChangeText={setNewTempMin}
              keyboardType="decimal-pad"
              containerStyle={{ flex: 1 }}
            />
            <Input
              label="Max \u00B0C"
              value={newTempMax}
              onChangeText={setNewTempMax}
              keyboardType="decimal-pad"
              containerStyle={{ flex: 1 }}
            />
          </View>
        )}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 }}>
          <Text style={{ fontSize: 14, fontWeight: "500", color: colors.textSecondary }}>AI quality check</Text>
          <Switch
            value={newAiQuality}
            onValueChange={setNewAiQuality}
            trackColor={{ false: colors.border, true: colors.accent }}
          />
        </View>
      </FormSheet>
    </View>
  );
}
