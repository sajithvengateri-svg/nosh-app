import { ReactNode } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  Platform,
  ActivityIndicator,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useTheme } from "../../contexts/ThemeProvider";

interface FormSheetProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  title: string;
  saveLabel?: string;
  saving?: boolean;
  children: ReactNode;
}

export function FormSheet({ visible, onClose, onSave, title, saveLabel = "Save", saving = false, children }: FormSheetProps) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={{ fontSize: 16, color: colors.textSecondary }}>Cancel</Text>
          </Pressable>
          <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text }}>{title}</Text>
          <Pressable onPress={onSave} disabled={saving} hitSlop={8}>
            {saving ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.accent }}>{saveLabel}</Text>
            )}
          </Pressable>
        </View>
        {/* Body */}
        <KeyboardAwareScrollView
          contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          enableOnAndroid
          extraScrollHeight={Platform.OS === "ios" ? 20 : 80}
          enableAutomaticScroll
          enableResetScrollToCoords={false}
        >
          {children}
        </KeyboardAwareScrollView>
      </View>
    </Modal>
  );
}
