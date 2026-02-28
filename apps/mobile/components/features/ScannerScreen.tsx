import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ImagePicker } from "../ui/ImagePicker";
import { useScanner } from "../../hooks/useScanner";
import { useTheme } from "../../contexts/ThemeProvider";

interface ScannerScreenProps<T> {
  title: string;
  edgeFunctionName: string;
  instructions?: string;
  onResultsConfirmed: (data: T) => void;
  ResultsRenderer: React.ComponentType<{ data: T }>;
}

export function ScannerScreen<T>({ title, edgeFunctionName, instructions, onResultsConfirmed, ResultsRenderer }: ScannerScreenProps<T>) {
  const router = useRouter();
  const { state, scan, results, error, reset, scanning } = useScanner<T>(edgeFunctionName);
  const { colors } = useTheme();

  const handleImage = (base64: string) => {
    scan(base64);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Pressable onPress={() => router.back()}>
          <Text style={{ fontSize: 16, color: colors.accent }}>Back</Text>
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text }}>{title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
        {state === "idle" && (
          <>
            {instructions && (
              <View style={{ backgroundColor: colors.accentBg, borderRadius: 12, padding: 14 }}>
                <Text style={{ fontSize: 14, color: colors.accent, lineHeight: 20 }}>{instructions}</Text>
              </View>
            )}
            <ImagePicker onImageSelected={handleImage} label="Capture or select an image" buttonText="Scan Now" />
          </>
        )}

        {state === "processing" && (
          <View style={{ alignItems: "center", paddingVertical: 60, gap: 16 }}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={{ fontSize: 16, color: colors.textMuted }}>Processing image...</Text>
            <Text style={{ fontSize: 13, color: colors.textMuted }}>This may take a few seconds</Text>
          </View>
        )}

        {state === "error" && (
          <View style={{ alignItems: "center", paddingVertical: 40, gap: 16 }}>
            <Text style={{ fontSize: 40 }}>⚠️</Text>
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.destructive }}>Scan Failed</Text>
            <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: "center" }}>{error}</Text>
            <Pressable onPress={reset} style={{ backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 }}>
              <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>Try Again</Text>
            </Pressable>
          </View>
        )}

        {state === "results" && results && (
          <>
            <ResultsRenderer data={results} />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable onPress={reset} style={{ flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 14, alignItems: "center" }}>
                <Text style={{ fontWeight: "600", color: colors.textMuted }}>Scan Again</Text>
              </Pressable>
              <Pressable onPress={() => onResultsConfirmed(results)} style={{ flex: 1, backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 14, alignItems: "center" }}>
                <Text style={{ fontWeight: "700", color: "#FFFFFF" }}>Confirm & Save</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
