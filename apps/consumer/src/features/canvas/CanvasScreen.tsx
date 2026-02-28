import { useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  PanResponder,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowUp, ChevronUp } from "lucide-react-native";
import { Colors, Glass } from "../../constants/colors";
import { useCompanionStore } from "../../lib/companion/companionStore";
import { useCompanionChat } from "../../hooks/useCompanionChat";
import { ResponseTicker } from "./ResponseTicker";
import { useCanvasMagic } from "./CanvasMagic";
import { lightTap, mediumTap } from "../../lib/haptics";
import type { NoshResponse } from "../../lib/companion/responseTypes";

// ── Smart Suggestion Engine (client-side, no API) ─────────────────

function getSmartSuggestion(): NoshResponse {
  const hour = new Date().getHours();
  const id = `suggestion-${Date.now()}`;
  const timestamp = Date.now();

  if (hour < 11) {
    return {
      id,
      type: "pill",
      content: "Plan tonight's dinner?",
      icon: "calendar",
      action: "open_meal_plan",
      timestamp,
    };
  } else if (hour < 16) {
    return {
      id,
      type: "action",
      content: "Start a Nosh Run",
      icon: "shopping_cart",
      action: "open_nosh_run",
      timestamp,
    };
  } else if (hour < 20) {
    return {
      id,
      type: "pill",
      content: "Ready to cook?",
      icon: "timer",
      action: "open_meal_plan",
      timestamp,
    };
  }
  return {
    id,
    type: "pill",
    content: "Plan tomorrow's dinner",
    icon: "sparkles",
    action: "open_meal_plan",
    timestamp,
  };
}

// ── Canvas Screen ─────────────────────────────────────────────────

interface CanvasScreenProps {
  onAction: (action: string, recipeId?: string) => void;
  onSuggestionTap: () => void;
}

export function CanvasScreen({ onAction, onSuggestionTap }: CanvasScreenProps) {
  const insets = useSafeAreaInsets();
  const inputVisible = useCompanionStore((s) => s.inputVisible);
  const inputText = useCompanionStore((s) => s.inputText);
  const setInputText = useCompanionStore((s) => s.setInputText);
  const setInputVisible = useCompanionStore((s) => s.setInputVisible);
  const setActiveScreen = useCompanionStore((s) => s.setActiveScreen);
  const pushResponse = useCompanionStore((s) => s.pushResponse);
  const { sendMessage, isLoading } = useCompanionChat();

  // AI-driven canvas magic
  useCanvasMagic();

  const inputSlide = useRef(new Animated.Value(0)).current;
  const inputOpacity = useRef(new Animated.Value(0)).current;

  // ── Swipe up → feed ──
  const screenPan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy < -30 && Math.abs(g.dx) < Math.abs(g.dy),
      onPanResponderRelease: (_, g) => {
        if (g.dy < -100 || g.vy < -0.5) {
          mediumTap();
          Keyboard.dismiss();
          setActiveScreen("feed");
        }
      },
    }),
  ).current;

  // ── Input swipe-down dismiss ──
  const inputPan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 10,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) {
          inputSlide.setValue(g.dy);
          inputOpacity.setValue(Math.max(0, 1 - g.dy / 100));
        }
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 50 || g.vy > 0.5) {
          lightTap();
          Animated.timing(inputOpacity, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }).start(() => {
            setInputVisible(false);
            inputSlide.setValue(0);
            inputOpacity.setValue(0);
          });
        } else {
          Animated.parallel([
            Animated.spring(inputSlide, {
              toValue: 0,
              speed: 20,
              bounciness: 8,
              useNativeDriver: true,
            }),
            Animated.timing(inputOpacity, {
              toValue: 1,
              duration: 100,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    }),
  ).current;

  // Show/hide input animation
  const prevInputVisible = useRef(inputVisible);
  if (inputVisible && !prevInputVisible.current) {
    inputSlide.setValue(30);
    inputOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(inputSlide, {
        toValue: 0,
        speed: 14,
        bounciness: 8,
        useNativeDriver: true,
      }),
      Animated.timing(inputOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }
  prevInputVisible.current = inputVisible;

  const handleSend = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;
    lightTap();
    setInputText("");
    sendMessage(trimmed);
  }, [inputText, isLoading, sendMessage, setInputText]);

  const handleAction = useCallback(
    (action: string, recipeId?: string) => {
      onAction(action, recipeId);
    },
    [onAction],
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]} {...screenPan.panHandlers}>
      {/* Response ticker — sits above the input/swipe hint */}
      <ResponseTicker
        onAction={handleAction}
        style={{ bottom: insets.bottom + (inputVisible ? 90 : 60) }}
      />

      {/* Swipe-up hint at bottom */}
      <View style={[styles.swipeHint, { bottom: insets.bottom + 24 }]}>
        <ChevronUp size={20} color={Colors.text.muted} strokeWidth={1.75} />
        <Text style={styles.swipeHintText}>Swipe up for feed</Text>
      </View>

      {/* Inline text input */}
      {inputVisible && (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.inputWrapper}
          keyboardVerticalOffset={10}
        >
          <Animated.View
            {...inputPan.panHandlers}
            style={[
              styles.inputContainer,
              {
                marginBottom: insets.bottom + 8,
                opacity: inputOpacity,
                transform: [{ translateY: inputSlide }],
              },
            ]}
          >
            <BlurView intensity={Glass.blur} tint="light" style={styles.inputGlass}>
              <View style={styles.inputInner}>
                <TextInput
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Ask NOSH anything..."
                  placeholderTextColor={Colors.text.muted}
                  style={styles.textInput}
                  onSubmitEditing={handleSend}
                  returnKeyType="send"
                  multiline
                  maxLength={500}
                  autoFocus
                />
                <Pressable
                  onPress={handleSend}
                  style={[
                    styles.sendButton,
                    (!inputText.trim() || isLoading) && styles.sendDisabled,
                  ]}
                  disabled={!inputText.trim() || isLoading}
                >
                  <ArrowUp size={20} color="#FFF" strokeWidth={2} />
                </Pressable>
              </View>
            </BlurView>
          </Animated.View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

// Expose for feed.tsx to trigger suggestion
export { getSmartSuggestion };

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Swipe hint
  swipeHint: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 4,
  },
  swipeHintText: {
    fontSize: 12,
    color: Colors.text.muted,
  },

  // Input
  inputWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
  },
  inputContainer: {
    marginHorizontal: 20,
  },
  inputGlass: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: Glass.shadow.color,
    shadowOpacity: 1,
    shadowOffset: Glass.shadow.offset,
    shadowRadius: Glass.shadow.radius,
    elevation: 6,
  },
  inputInner: {
    backgroundColor: Glass.surface,
    borderWidth: 1,
    borderColor: Glass.borderLight,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text.primary,
    maxHeight: 80,
    paddingVertical: 6,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendDisabled: {
    opacity: 0.4,
  },
});
