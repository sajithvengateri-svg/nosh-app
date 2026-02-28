import { useState } from "react";
import { View, Text, Pressable, Image, Alert, ActivityIndicator } from "react-native";
import * as ExpoImagePicker from "expo-image-picker";
import { useTheme } from "../../contexts/ThemeProvider";

interface ImagePickerProps {
  onImageSelected: (base64: string, metadata?: { capturedAt: string }) => void;
  label?: string;
  buttonText?: string;
  showPreview?: boolean;
  compact?: boolean;
  cameraOnly?: boolean;
  renderButton?: (props: { onPress: () => void; loading: boolean }) => React.ReactNode;
}

export function ImagePicker({ onImageSelected, label, buttonText = "Take Photo", showPreview = true, compact, cameraOnly, renderButton }: ImagePickerProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { colors } = useTheme();

  const pickImage = async (useCamera: boolean) => {
    try {
      const permMethod = useCamera
        ? ExpoImagePicker.requestCameraPermissionsAsync
        : ExpoImagePicker.requestMediaLibraryPermissionsAsync;
      const { status } = await permMethod();
      if (status !== "granted") {
        Alert.alert("Permission Required", `Please grant ${useCamera ? "camera" : "photo library"} access in Settings.`);
        return;
      }
      setLoading(true);
      const method = useCamera ? ExpoImagePicker.launchCameraAsync : ExpoImagePicker.launchImageLibraryAsync;
      const result = await method({
        mediaTypes: ["images"],
        quality: 0.8,
        base64: true,
        allowsEditing: false,
        exif: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        if (showPreview && !compact) setPreview(asset.uri);
        if (asset.base64) {
          const capturedAt = new Date().toISOString();
          onImageSelected(asset.base64, { capturedAt });
        }
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to pick image");
    } finally {
      setLoading(false);
    }
  };

  const handlePress = () => {
    if (cameraOnly) {
      pickImage(true);
    } else {
      Alert.alert("Select Image", "Choose a source", [
        { text: "Camera", onPress: () => pickImage(true) },
        { text: "Photo Library", onPress: () => pickImage(false) },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  };

  // Compact mode with custom render button
  if (renderButton) {
    return <>{renderButton({ onPress: handlePress, loading })}</>;
  }

  if (compact) {
    return (
      <Pressable
        onPress={handlePress}
        disabled={loading}
        style={{ opacity: loading ? 0.6 : 1 }}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : (
          <Text style={{ color: colors.accent, fontWeight: "700", fontSize: 13 }}>{buttonText || "Scan"}</Text>
        )}
      </Pressable>
    );
  }

  return (
    <View style={{ gap: 8 }}>
      {label && <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textSecondary }}>{label}</Text>}
      {showPreview && preview && (
        <Image source={{ uri: preview }} style={{ width: "100%", height: 200, borderRadius: 12, backgroundColor: colors.surface }} resizeMode="cover" />
      )}
      <Pressable
        onPress={handlePress}
        disabled={loading}
        style={{ backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 14, alignItems: "center", opacity: loading ? 0.6 : 1 }}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 15 }}>{buttonText}</Text>
        )}
      </Pressable>
    </View>
  );
}
