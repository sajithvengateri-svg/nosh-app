import { useState, useCallback } from "react";
import { View, Text, TextInput, Pressable, Image, Alert, ActivityIndicator } from "react-native";
import * as ExpoImagePicker from "expo-image-picker";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Type, Camera, Upload, FileText, QrCode } from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeProvider";

type Mode = "manual" | "camera" | "upload" | "document" | "qr";

interface CaptureResult { type: string; value: string; base64?: string; uri?: string }

interface MultiInputCaptureProps {
  modes: Mode[];
  onCapture: (data: CaptureResult) => void;
  label?: string;
  placeholder?: string;
}

const MODE_CONFIG: Record<Mode, { icon: typeof Type; label: string }> = {
  manual: { icon: Type, label: "Text" },
  camera: { icon: Camera, label: "Camera" },
  upload: { icon: Upload, label: "Upload" },
  document: { icon: FileText, label: "Document" },
  qr: { icon: QrCode, label: "Scan" },
};

export function MultiInputCapture({ modes, onCapture, label, placeholder = "Enter value..." }: MultiInputCaptureProps) {
  const { colors } = useTheme();
  const [activeMode, setActiveMode] = useState<Mode>(modes[0]);
  const [loading, setLoading] = useState(false);
  const [manualText, setManualText] = useState("");
  const [preview, setPreview] = useState<{ uri?: string; name?: string; value?: string } | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [scannerActive, setScannerActive] = useState(true);

  const handleModeChange = useCallback((mode: Mode) => {
    setActiveMode(mode);
    setPreview(null);
    setScannerActive(true);
  }, []);

  const handleManualSubmit = useCallback(() => {
    if (!manualText.trim()) return;
    onCapture({ type: "manual", value: manualText.trim() });
  }, [manualText, onCapture]);

  const handleImageCapture = useCallback(async (useCamera: boolean) => {
    try {
      const permFn = useCamera ? ExpoImagePicker.requestCameraPermissionsAsync : ExpoImagePicker.requestMediaLibraryPermissionsAsync;
      const { status } = await permFn();
      if (status !== "granted") {
        Alert.alert("Permission Required", `Please grant ${useCamera ? "camera" : "photo library"} access in Settings.`);
        return;
      }
      setLoading(true);
      const launchFn = useCamera ? ExpoImagePicker.launchCameraAsync : ExpoImagePicker.launchImageLibraryAsync;
      const result = await launchFn({ mediaTypes: ["images"], quality: 0.8, base64: true, allowsEditing: false });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setPreview({ uri: asset.uri });
        onCapture({ type: useCamera ? "camera" : "upload", value: asset.uri, base64: asset.base64 ?? undefined, uri: asset.uri });
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to capture image");
    } finally { setLoading(false); }
  }, [onCapture]);

  const handleDocumentPick = useCallback(async () => {
    try {
      setLoading(true);
      const DocumentPicker = await import("expo-document-picker");
      const result = await DocumentPicker.getDocumentAsync({ type: ["application/pdf", "image/*"] });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setPreview({ name: asset.name, uri: asset.uri });
        onCapture({ type: "document", value: asset.name, uri: asset.uri });
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to pick document");
    } finally { setLoading(false); }
  }, [onCapture]);

  const handleBarcodeScan = useCallback((result: { data: string }) => {
    if (!scannerActive) return;
    setScannerActive(false);
    setPreview({ value: result.data });
    onCapture({ type: "qr", value: result.data });
  }, [scannerActive, onCapture]);

  const ActionButton = ({ onPress, disabled, text }: { onPress: () => void; disabled?: boolean; text: string }) => (
    <Pressable onPress={onPress} disabled={disabled || loading}
      style={{ backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 14, alignItems: "center", opacity: disabled || loading ? 0.5 : 1 }}>
      {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 15 }}>{text}</Text>}
    </Pressable>
  );

  const renderModePills = () => (
    <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
      {modes.map((mode) => {
        const { icon: Icon, label: pillLabel } = MODE_CONFIG[mode];
        const active = activeMode === mode;
        return (
          <Pressable key={mode} onPress={() => handleModeChange(mode)}
            style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8,
              borderRadius: 12, backgroundColor: active ? colors.accent : colors.surface, borderWidth: 1, borderColor: active ? colors.accent : colors.border }}>
            <Icon size={16} color={active ? "#FFFFFF" : colors.textSecondary} />
            <Text style={{ fontSize: 13, fontWeight: "600", color: active ? "#FFFFFF" : colors.textSecondary }}>{pillLabel}</Text>
          </Pressable>
        );
      })}
    </View>
  );

  const renderManual = () => (
    <View style={{ gap: 8 }}>
      <TextInput value={manualText} onChangeText={setManualText} placeholder={placeholder}
        placeholderTextColor={colors.textSecondary} onSubmitEditing={handleManualSubmit} returnKeyType="done"
        style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, fontSize: 16, backgroundColor: colors.inputBg, color: colors.text }} />
      <ActionButton onPress={handleManualSubmit} disabled={!manualText.trim()} text="Submit" />
    </View>
  );

  const renderImageAction = (useCamera: boolean) => (
    <View style={{ gap: 10 }}>
      {preview?.uri && (
        <Image source={{ uri: preview.uri }} style={{ width: "100%", height: 200, borderRadius: 12, backgroundColor: colors.surface }} resizeMode="cover" />
      )}
      <ActionButton onPress={() => handleImageCapture(useCamera)}
        text={preview?.uri ? (useCamera ? "Retake Photo" : "Choose Another") : (useCamera ? "Take Photo" : "Choose Photo")} />
    </View>
  );

  const renderDocument = () => (
    <View style={{ gap: 10 }}>
      {preview?.name && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 14, backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
          <FileText size={20} color={colors.accent} />
          <Text style={{ fontSize: 14, color: colors.text, flex: 1 }} numberOfLines={1}>{preview.name}</Text>
        </View>
      )}
      <ActionButton onPress={handleDocumentPick} text={preview?.name ? "Choose Another Document" : "Select Document"} />
    </View>
  );

  const renderQrScanner = () => {
    if (!cameraPermission?.granted) {
      return (
        <View style={{ gap: 10, alignItems: "center", padding: 20 }}>
          <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: "center" }}>Camera access is needed to scan barcodes.</Text>
          <ActionButton onPress={requestCameraPermission} text="Grant Permission" />
        </View>
      );
    }
    return (
      <View style={{ gap: 10 }}>
        {scannerActive ? (
          <View style={{ borderRadius: 12, overflow: "hidden" }}>
            <CameraView style={{ width: "100%", height: 250 }}
              barcodeScannerSettings={{ barcodeTypes: ["qr", "ean13", "ean8", "code128", "code39"] }}
              onBarcodeScanned={handleBarcodeScan} />
          </View>
        ) : preview?.value ? (
          <View style={{ padding: 14, backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, gap: 6 }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textSecondary }}>Scanned Value</Text>
            <Text style={{ fontSize: 16, color: colors.text }} selectable>{preview.value}</Text>
          </View>
        ) : null}
        {!scannerActive && (
          <ActionButton onPress={() => { setScannerActive(true); setPreview(null); }} text="Scan Again" />
        )}
      </View>
    );
  };

  return (
    <View style={{ gap: 4 }}>
      {label && <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textSecondary, marginBottom: 4 }}>{label}</Text>}
      {renderModePills()}
      <View style={{ backgroundColor: colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border }}>
        {activeMode === "manual" && renderManual()}
        {activeMode === "camera" && renderImageAction(true)}
        {activeMode === "upload" && renderImageAction(false)}
        {activeMode === "document" && renderDocument()}
        {activeMode === "qr" && renderQrScanner()}
      </View>
    </View>
  );
}
