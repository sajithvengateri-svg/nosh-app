import { useState } from "react";
import { View, Text, Pressable, Alert, ActivityIndicator, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react-native";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { supabase } from "../../../lib/supabase";
import { useOrg } from "../../../contexts/OrgProvider";
import { useTheme } from "../../../contexts/ThemeProvider";
import { ImagePicker } from "../../../components/ui/ImagePicker";
import { Input } from "../../../components/ui/Input";
import { useScanner } from "../../../hooks/useScanner";

interface ScannedEquipment {
  name?: string;
  model?: string;
  serial_number?: string;
  manufacturer?: string;
}

export default function EquipmentScan() {
  const router = useRouter();
  const { currentOrg } = useOrg();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const { state, scan, results, error, reset } = useScanner<ScannedEquipment>("scan-asset-label");

  const [name, setName] = useState("");
  const [model, setModel] = useState("");
  const [serial, setSerial] = useState("");

  const handleImage = async (base64: string) => {
    const data = await scan(base64);
    if (data) {
      setName(data.name || data.manufacturer || "");
      setModel(data.model || "");
      setSerial(data.serial_number || "");
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Name is required");
      const { error } = await supabase.from("equipment").insert({
        name: name.trim(), model: model.trim() || null, serial_number: serial.trim() || null,
        status: "new", org_id: currentOrg?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      Alert.alert("Added", `"${name}" added to equipment`);
      router.back();
    },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Scan Equipment" />

      <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
        {state === "idle" && (
          <>
            <View style={{ backgroundColor: colors.accentBg, borderRadius: 12, padding: 14 }}>
              <Text style={{ fontSize: 14, color: colors.accent, lineHeight: 20 }}>Take a photo of the equipment label or nameplate to auto-detect model and serial number.</Text>
            </View>
            <ImagePicker onImageSelected={handleImage} label="Equipment Label" buttonText="Scan Label" />
          </>
        )}
        {state === "processing" && (
          <View style={{ alignItems: "center", paddingVertical: 60, gap: 16 }}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={{ fontSize: 16, color: colors.textSecondary }}>Reading label...</Text>
          </View>
        )}
        {state === "error" && (
          <View style={{ alignItems: "center", paddingVertical: 40, gap: 16 }}>
            <AlertTriangle size={40} color={colors.destructive} />
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.destructive }}>Scan Failed</Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: "center" }}>{error}</Text>
            <Pressable onPress={reset} style={{ backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 }}>
              <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>Try Again</Text>
            </Pressable>
          </View>
        )}
        {state === "results" && (
          <>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>Detected Equipment</Text>
            <Input label="Name" value={name} onChangeText={setName} placeholder="Equipment name" />
            <Input label="Model" value={model} onChangeText={setModel} placeholder="Model number" />
            <Input label="Serial #" value={serial} onChangeText={setSerial} placeholder="Serial number" />
            <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
              <Pressable onPress={reset} style={{ flex: 1, borderWidth: 1, borderColor: colors.tabBarBorder, borderRadius: 12, paddingVertical: 14, alignItems: "center" }}>
                <Text style={{ fontWeight: "600", color: colors.textSecondary }}>Scan Again</Text>
              </Pressable>
              <Pressable onPress={() => saveMutation.mutate()} disabled={saveMutation.isPending} style={{ flex: 1, backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 14, alignItems: "center", opacity: saveMutation.isPending ? 0.6 : 1 }}>
                <Text style={{ fontWeight: "700", color: "#FFFFFF" }}>Add Equipment</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
