import { useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  Dimensions,
  StyleSheet,
  PanResponder,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { Colors, Glass } from "../../constants/colors";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface OverlaySheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  heightPercent?: number; // 0.85 = 85% of screen
}

export function OverlaySheet({
  visible,
  onClose,
  title,
  children,
  heightPercent = 0.88,
}: OverlaySheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetHeight = SCREEN_HEIGHT * heightPercent;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 25,
          stiffness: 200,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Pull-down-to-dismiss
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 10,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          translateY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 100 || gesture.vy > 0.5) {
          onClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 25,
            stiffness: 200,
          }).start();
        }
      },
    })
  ).current;

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View
        style={[styles.backdrop, { opacity: backdropOpacity }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.sheetWrapper}
      >
        <Animated.View
          style={[
            styles.sheet,
            {
              height: sheetHeight,
              paddingBottom: insets.bottom,
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Handle */}
          <View {...panResponder.panHandlers} style={styles.handleArea}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <X size={14} color={Colors.text.secondary} strokeWidth={2} />
            </Pressable>
          </View>

          {/* Content */}
          <View style={styles.content}>{children}</View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheetWrapper: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Glass.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: Glass.borderLight,
  },
  handleArea: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.secondary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Glass.surface,
    borderWidth: 1,
    borderColor: Glass.borderLight,
    justifyContent: "center",
    alignItems: "center",
  },
  // closeText removed — now using Lucide X icon
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
});
