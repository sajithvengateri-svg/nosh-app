import {
  Modal as RNModal,
  View,
  Text,
  Pressable,
  type ViewStyle,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useTheme } from "../../contexts/ThemeProvider";

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Modal({ visible, onClose, title, children, style }: ModalProps) {
  const { colors } = useTheme();
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: colors.card,
              borderRadius: 20,
              padding: 24,
              width: "100%",
              maxWidth: 400,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 24,
              elevation: 8,
              ...style,
            }}
          >
            {title && (
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: colors.text,
                  marginBottom: 16,
                }}
              >
                {title}
              </Text>
            )}
            {children}
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </RNModal>
  );
}

interface AlertModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  destructive?: boolean;
}

export function AlertModal({
  visible,
  onClose,
  title,
  message,
  confirmText = "OK",
  cancelText = "Cancel",
  onConfirm,
  destructive = false,
}: AlertModalProps) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} onClose={onClose} title={title}>
      <Text style={{ fontSize: 15, color: colors.textSecondary, marginBottom: 24 }}>
        {message}
      </Text>
      <View style={{ flexDirection: "row", gap: 12, justifyContent: "flex-end" }}>
        <Pressable
          onPress={onClose}
          style={{
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 10,
            backgroundColor: colors.surface,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "600", color: colors.textSecondary }}>
            {cancelText}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            onConfirm?.();
            onClose();
          }}
          style={{
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 10,
            backgroundColor: destructive ? colors.destructive : colors.accent,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFFFFF" }}>
            {confirmText}
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
}
