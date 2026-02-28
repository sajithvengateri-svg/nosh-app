import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Camera, Image as ImageIcon, X } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { Colors, Glass } from "../../constants/colors";
import { lightTap, successNotification } from "../../lib/haptics";
import { supabase } from "../../lib/supabase";

interface AddExpenseSheetProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function AddExpenseSheet({
  visible,
  onClose,
  onSaved,
}: AddExpenseSheetProps) {
  const [storeName, setStoreName] = useState("");
  const [amount, setAmount] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setStoreName("");
    setAmount("");
    setImageUri(null);
  };

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleGallery = async () => {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    const total = parseFloat(amount);
    if (isNaN(total) || total <= 0) return;

    setSaving(true);
    let image_url: string | null = null;

    if (imageUri) {
      const ext = imageUri.split(".").pop() ?? "jpg";
      const fileName = `${Date.now()}.${ext}`;
      const arrayBuffer = await fetch(imageUri).then((r) => r.arrayBuffer());

      const { error: uploadError } = await supabase.storage
        .from("receipt-images")
        .upload(fileName, arrayBuffer, {
          contentType: `image/${ext === "png" ? "png" : "jpeg"}`,
        });

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from("receipt-images")
          .getPublicUrl(fileName);
        image_url = urlData.publicUrl;
      }
    }

    const { error } = await supabase.from("ds_receipts").insert({
      store_name: storeName.trim() || null,
      total,
      receipt_date: new Date().toISOString().slice(0, 10),
      image_url,
    });

    setSaving(false);
    if (error) {
      console.warn("Save receipt:", error.message);
      return;
    }

    successNotification();
    reset();
    onSaved();
    onClose();
  };

  const canSave = amount.trim().length > 0 && !isNaN(parseFloat(amount));

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.backdrop}
      >
        <Pressable style={styles.backdropPress} onPress={onClose} />
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Add Expense</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={Colors.text.secondary} />
            </Pressable>
          </View>

          {/* Store */}
          <Text style={styles.label}>Store</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Woolworths"
            placeholderTextColor={Colors.text.muted}
            value={storeName}
            onChangeText={setStoreName}
          />

          {/* Amount */}
          <Text style={styles.label}>Amount</Text>
          <TextInput
            style={styles.input}
            placeholder="$0.00"
            placeholderTextColor={Colors.text.muted}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />

          {/* Receipt photo */}
          <Text style={styles.label}>Receipt (optional)</Text>
          <View style={styles.photoRow}>
            <Pressable
              style={styles.photoBtn}
              onPress={() => {
                lightTap();
                handleCamera();
              }}
            >
              <Camera size={18} color={Colors.primary} />
              <Text style={styles.photoBtnText}>Camera</Text>
            </Pressable>
            <Pressable
              style={styles.photoBtn}
              onPress={() => {
                lightTap();
                handleGallery();
              }}
            >
              <ImageIcon size={18} color={Colors.primary} />
              <Text style={styles.photoBtnText}>Gallery</Text>
            </Pressable>
          </View>
          {imageUri && <Text style={styles.attached}>Photo attached</Text>}

          {/* Save */}
          <Pressable
            style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
            disabled={!canSave || saving}
            onPress={() => {
              lightTap();
              handleSave();
            }}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Save</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdropPress: { flex: 1 },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: Glass.borderLight,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: { fontSize: 18, fontWeight: "700", color: Colors.secondary },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Glass.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Glass.borderLight,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text.secondary,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: Glass.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Glass.borderLight,
  },
  photoRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  photoBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Glass.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Glass.borderLight,
  },
  photoBtnText: { fontSize: 14, color: Colors.primary, fontWeight: "600" },
  attached: { fontSize: 12, color: Colors.success, marginTop: 6 },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
