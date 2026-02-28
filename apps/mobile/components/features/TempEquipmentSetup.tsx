import { useState } from "react";
import { View, Text, Pressable, ScrollView, Alert, Switch } from "react-native";
import { useTheme } from "../../contexts/ThemeProvider";
import { useAuth } from "../../contexts/AuthProvider";
import { Card, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Badge } from "../ui/Badge";
import { FormSheet } from "../ui/FormSheet";
import { FAB } from "../ui/FAB";
import { EmptyState } from "../ui/EmptyState";
import { SkeletonCard } from "../ui/Skeleton";
import { Thermometer, Snowflake, Flame, Trash2, Pencil } from "lucide-react-native";
import {
  useTempEquipment,
  useTempEquipmentMutations,
  BCC_TEMP_DEFAULTS,
  DEFAULT_CONFIGS,
  type TempEquipmentConfig,
  type LocationType,
} from "../../hooks/useTempEquipment";

const TYPE_OPTIONS: { key: LocationType; label: string; icon: React.ComponentType<any>; color: string }[] = [
  { key: "fridge", label: "Fridge", icon: Snowflake, color: "#3B82F6" },
  { key: "freezer", label: "Freezer", icon: Snowflake, color: "#8B5CF6" },
  { key: "hot_hold", label: "Hot Hold", icon: Flame, color: "#EF4444" },
];

const SHIFT_OPTIONS = [
  { key: "am", label: "AM" },
  { key: "pm", label: "PM" },
  { key: "both", label: "Both" },
];

export function TempEquipmentSetup() {
  const { colors } = useTheme();
  const { isHeadChef, isDevBypass } = useAuth();
  const canManage = isHeadChef || isDevBypass;
  const { configs, isLoading } = useTempEquipment();
  const { addConfig, updateConfig, deleteConfig, seedDefaults } = useTempEquipmentMutations();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<LocationType>("fridge");
  const [shift, setShift] = useState("both");
  const [useCustom, setUseCustom] = useState(false);
  const [passMin, setPassMin] = useState("");
  const [passMax, setPassMax] = useState("");
  const [warnMin, setWarnMin] = useState("");
  const [warnMax, setWarnMax] = useState("");
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setName(""); setType("fridge"); setShift("both");
    setUseCustom(false); setPassMin(""); setPassMax(""); setWarnMin(""); setWarnMax("");
    setEditingId(null);
  };

  const openAdd = () => { resetForm(); setShowForm(true); };

  const openEdit = (config: TempEquipmentConfig) => {
    setEditingId(config.id);
    setName(config.location_name);
    setType(config.location_type);
    setShift(config.shift);
    setUseCustom(config.custom_pass_min != null);
    setPassMin(config.custom_pass_min?.toString() ?? "");
    setPassMax(config.custom_pass_max?.toString() ?? "");
    setWarnMin(config.custom_warn_min?.toString() ?? "");
    setWarnMax(config.custom_warn_max?.toString() ?? "");
    setShowForm(true);
  };

  const handleDelete = (config: TempEquipmentConfig) => {
    Alert.alert("Delete Equipment", `Remove "${config.location_name}" (${config.shift.toUpperCase()})?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteConfig.mutate(config.id) },
    ]);
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert("Error", "Name is required"); return; }
    setSaving(true);
    try {
      const base: Partial<TempEquipmentConfig> = {
        location_name: name.trim(),
        location_type: type,
        custom_pass_min: useCustom && passMin ? parseFloat(passMin) : null,
        custom_pass_max: useCustom && passMax ? parseFloat(passMax) : null,
        custom_warn_min: useCustom && warnMin ? parseFloat(warnMin) : null,
        custom_warn_max: useCustom && warnMax ? parseFloat(warnMax) : null,
        input_method: "any",
      };

      if (editingId) {
        await updateConfig.mutateAsync({ id: editingId, ...base });
      } else if (shift === "both") {
        const maxSort = Math.max(0, ...configs.map((c) => c.sort_order));
        await addConfig.mutateAsync({ ...base, shift: "am", sort_order: maxSort + 1 } as any);
        await addConfig.mutateAsync({ ...base, shift: "pm", sort_order: maxSort + 2 } as any);
      } else {
        const maxSort = Math.max(0, ...configs.map((c) => c.sort_order));
        await addConfig.mutateAsync({ ...base, shift: shift as "am" | "pm", sort_order: maxSort + 1 } as any);
      }
      setShowForm(false);
      resetForm();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSeedDefaults = () => {
    Alert.alert("Set Up Defaults", "Add standard fridge, freezer, and hot hold for AM + PM checks?", [
      { text: "Cancel", style: "cancel" },
      { text: "Set Up", onPress: () => seedDefaults.mutate() },
    ]);
  };

  // Group configs by location name
  const grouped = configs.reduce<Record<string, TempEquipmentConfig[]>>((acc, c) => {
    (acc[c.location_name] ??= []).push(c);
    return acc;
  }, {});

  if (isLoading) {
    return <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}><SkeletonCard /><SkeletonCard /><SkeletonCard /></ScrollView>;
  }

  if (configs.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", padding: 16 }}>
        <EmptyState
          icon={<Thermometer size={48} color={colors.textMuted} strokeWidth={1.5} />}
          title="No Temperature Equipment"
          description="Set up your fridges, freezers, and hot holds for daily temperature checks."
          style={{ paddingVertical: 40 }}
        />
        {canManage && (
          <View style={{ gap: 12, marginTop: 16 }}>
            <Button onPress={handleSeedDefaults} loading={seedDefaults.isPending}>Set Up BCC Defaults</Button>
            <Button variant="secondary" onPress={openAdd}>Add Custom Equipment</Button>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
          Equipment ({configs.length} checks)
        </Text>

        {Object.entries(grouped).map(([locName, items]) => {
          const typeOpt = TYPE_OPTIONS.find((t) => t.key === items[0].location_type);
          const Icon = typeOpt?.icon ?? Thermometer;
          const defaults = BCC_TEMP_DEFAULTS[items[0].location_type];
          const hasCustom = items[0].custom_pass_min != null;
          const passRange = hasCustom
            ? `${items[0].custom_pass_min}–${items[0].custom_pass_max}°C`
            : `${defaults.pass[0]}–${defaults.pass[1]}°C`;

          return (
            <Card key={locName} style={{ marginBottom: 12 }}>
              <CardContent style={{ paddingTop: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: typeOpt?.color + "20", justifyContent: "center", alignItems: "center" }}>
                      <Icon size={18} color={typeOpt?.color ?? colors.accent} strokeWidth={1.5} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>{locName}</Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 }}>
                        <Badge variant="default" style={{ paddingHorizontal: 6, paddingVertical: 2 }}>
                          {items.map((i) => i.shift.toUpperCase()).join(" + ")}
                        </Badge>
                        <Text style={{ fontSize: 12, color: colors.textMuted }}>Pass: {passRange}</Text>
                        {hasCustom && <Badge variant="warning" style={{ paddingHorizontal: 4, paddingVertical: 1 }}>Custom</Badge>}
                      </View>
                    </View>
                  </View>

                  {canManage && (
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <Pressable onPress={() => openEdit(items[0])} hitSlop={8}>
                        <Pencil size={16} color={colors.accent} strokeWidth={1.5} />
                      </Pressable>
                      <Pressable onPress={() => items.forEach((i) => handleDelete(i))} hitSlop={8}>
                        <Trash2 size={16} color={colors.destructive} strokeWidth={1.5} />
                      </Pressable>
                    </View>
                  )}
                </View>
              </CardContent>
            </Card>
          );
        })}
      </ScrollView>

      {canManage && <FAB onPress={openAdd} />}

      <FormSheet visible={showForm} onClose={() => { setShowForm(false); resetForm(); }} onSave={handleSave} title={editingId ? "Edit Equipment" : "Add Equipment"} saving={saving}>
        <Input label="Equipment Name" value={name} onChangeText={setName} placeholder="Walk-in Fridge, Bar Fridge, etc." />

        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textSecondary, marginTop: 8, marginBottom: 6 }}>Type</Text>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          {TYPE_OPTIONS.map((opt) => (
            <Pressable
              key={opt.key}
              onPress={() => setType(opt.key)}
              style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: type === opt.key ? opt.color : colors.surface, alignItems: "center" }}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: type === opt.key ? "#FFFFFF" : colors.textSecondary }}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>

        {!editingId && (
          <>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 }}>Shift</Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
              {SHIFT_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.key}
                  onPress={() => setShift(opt.key)}
                  style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: shift === opt.key ? colors.accent : colors.surface, alignItems: "center" }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "600", color: shift === opt.key ? "#FFFFFF" : colors.textSecondary }}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
          <View>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>Custom Thresholds</Text>
            <Text style={{ fontSize: 12, color: colors.textMuted }}>
              {useCustom ? "Override BCC defaults" : `BCC default: ${BCC_TEMP_DEFAULTS[type].pass[0]}–${BCC_TEMP_DEFAULTS[type].pass[1]}°C`}
            </Text>
          </View>
          <Switch value={useCustom} onValueChange={setUseCustom} trackColor={{ false: colors.border, true: colors.accent }} />
        </View>

        {useCustom && (
          <View style={{ gap: 8, paddingTop: 8 }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Input label="Pass Min (°C)" value={passMin} onChangeText={setPassMin} keyboardType="decimal-pad" style={{ flex: 1 }} />
              <Input label="Pass Max (°C)" value={passMax} onChangeText={setPassMax} keyboardType="decimal-pad" style={{ flex: 1 }} />
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Input label="Warn Min (°C)" value={warnMin} onChangeText={setWarnMin} keyboardType="decimal-pad" style={{ flex: 1 }} />
              <Input label="Warn Max (°C)" value={warnMax} onChangeText={setWarnMax} keyboardType="decimal-pad" style={{ flex: 1 }} />
            </View>
          </View>
        )}
      </FormSheet>
    </View>
  );
}
