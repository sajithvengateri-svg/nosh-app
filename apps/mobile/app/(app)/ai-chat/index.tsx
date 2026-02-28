import { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TextInput,
  Animated,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../lib/supabase";
import { useOrg } from "../../../contexts/OrgProvider";
import { useAuth } from "../../../contexts/AuthProvider";
import {
  ChefHat,
  Bot,
  ThumbsUp,
  ThumbsDown,
  Mic,
  MicOff,
  Volume2,
} from "lucide-react-native";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { useTheme } from "../../../contexts/ThemeProvider";
import { useCompanion } from "../../../hooks/useCompanion";
import { useAppSettings } from "../../../hooks/useAppSettings";
import { useCompanionStore } from "../../../lib/companion/companionStore";
import { createVoiceService } from "../../../lib/companion/voiceService";
import type { VoiceService } from "../../../lib/companion/voiceService";
import Constants from "expo-constants";
import { VARIANT_REGISTRY, isHomeCook as isHomeCookFn } from "@queitos/shared";
import type { AppVariant } from "@queitos/shared";

const APP_VARIANT = (Constants.expoConfig?.extra?.appVariant ?? "chefos") as AppVariant;

// ── Region-specific suggested questions ───────────────────────────

const COMPANION_QUESTIONS: Record<string, string[]> = {
  au: [
    "What can I make with lamb and rosemary?",
    "Help me plan meals for the week",
    "What's a quick weeknight dinner?",
  ],
  in: [
    "Suggest a quick dal recipe for tonight",
    "Help me plan a vegetarian meal for the week",
    "What spices go well with paneer?",
  ],
  uae: [
    "What's a good iftar recipe for tonight?",
    "Help me make a traditional machboos",
    "Suggest a quick dinner for the family",
  ],
  uk: [
    "What can I do with leftover Sunday roast?",
    "Help me plan meals for the week",
    "What's a quick midweek supper?",
  ],
  sg: [
    "Suggest a hawker-inspired home recipe",
    "What can I make with laksa paste?",
    "Quick dinner ideas for tonight?",
  ],
  us: [
    "What's a quick 30-minute dinner?",
    "Help me plan meals for the week",
    "What can I make with chicken thighs?",
  ],
};

const CHEF_AI_QUESTIONS = [
  "What's a good marinade for chicken?",
  "How do I reduce food waste?",
  "Calculate food cost for my menu",
];

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ── Helpers ───────────────────────────────────────────────────────

function getTimeGreeting(name: string): string {
  const hour = new Date().getHours();
  if (hour < 12) return `Good morning! I'm ${name}, your kitchen buddy.`;
  if (hour < 17) return `Afternoon! I'm ${name}. Need help with dinner prep?`;
  return `Evening! I'm ${name}. Let's sort out tonight's meal.`;
}

// ── Component ─────────────────────────────────────────────────────

export default function AIChatScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const { settings } = useAppSettings();
  const { profile: companion, hasCompanion, regionConfig } = useCompanion();
  const scrollRef = useRef<ScrollView>(null);
  const voiceRef = useRef<VoiceService | null>(null);

  const isHomeCook = isHomeCookFn(APP_VARIANT);
  const useCompanionMode = isHomeCook && hasCompanion && settings.companionEnabled;

  const companionName = companion?.companion_name || "Buddy";
  const region = companion?.region || VARIANT_REGISTRY[APP_VARIANT]?.region || "au";
  const suggestedQuestions = useCompanionMode
    ? COMPANION_QUESTIONS[region] || COMPANION_QUESTIONS.au
    : CHEF_AI_QUESTIONS;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<number, -1 | 1>>({});
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Voice service setup
  const voiceEnabled =
    useCompanionMode &&
    settings.companionVoiceEnabled &&
    !!settings.companionVoiceProvider;

  useEffect(() => {
    if (voiceEnabled && settings.companionVoiceProvider) {
      voiceRef.current = createVoiceService(settings.companionVoiceProvider);
    }
    return () => {
      voiceRef.current?.cleanup();
      voiceRef.current = null;
    };
  }, [voiceEnabled, settings.companionVoiceProvider]);

  // Summarize conversation on unmount (companion mode only)
  useEffect(() => {
    return () => {
      if (useCompanionMode && messages.length > 4) {
        supabase.functions
          .invoke("companion-chat", {
            body: { messages, summarize: true },
          })
          .catch(() => {});
      }
    };
  }, [useCompanionMode, messages]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      // Secret admin access
      const lower = trimmed.toLowerCase();
      if (lower === "open kitchen" || lower === "nosh admin") {
        Linking.openURL("https://chefos.ai/admin/auth");
        setInput("");
        return;
      }

      const userMessage: ChatMessage = { role: "user", content: trimmed };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput("");
      setIsLoading(true);
      scrollToBottom();

      try {
        const edgeFunction = useCompanionMode ? "companion-chat" : "chef-ai-chat";
        const body: any = { messages: updatedMessages };
        if (!useCompanionMode) body.org_id = currentOrg?.id;

        const { data, error } = await supabase.functions.invoke(edgeFunction, { body });
        if (error) throw error;

        const assistantMessage: ChatMessage = {
          role: "assistant",
          content:
            data?.content ||
            "Sorry, I couldn't generate a response. Please try again.",
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Auto-speak response if voice is enabled
        if (voiceEnabled && voiceRef.current && data?.content) {
          setIsSpeaking(true);
          voiceRef.current.speak(data.content)
            .catch((err: any) => console.warn("TTS failed:", err))
            .finally(() => setIsSpeaking(false));
        }
      } catch (err) {
        const errorMessage: ChatMessage = {
          role: "assistant",
          content:
            "Something went wrong. Please check your connection and try again.",
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
        scrollToBottom();
      }
    },
    [messages, isLoading, currentOrg?.id, useCompanionMode, voiceEnabled, scrollToBottom]
  );

  const handleSuggestedQuestion = useCallback(
    (question: string) => sendMessage(question),
    [sendMessage]
  );

  const handleFeedback = useCallback(
    async (index: number, rating: -1 | 1) => {
      setFeedbackGiven((prev) => ({ ...prev, [index]: rating }));
      try {
        await supabase.from("companion_feedback").insert({
          user_id: user?.id,
          rating,
          message_index: index,
        });
      } catch {}
    },
    [user?.id]
  );

  const handleMicPress = useCallback(async () => {
    if (!voiceRef.current) return;

    if (isListening) {
      setIsListening(false);
      const transcript = await voiceRef.current.stopListening();
      if (transcript) {
        setInput(transcript);
        sendMessage(transcript);
      }
    } else {
      try {
        setIsListening(true);
        await voiceRef.current.startListening();
      } catch {
        setIsListening(false);
      }
    }
  }, [isListening, sendMessage]);

  // ── Derived display values ──────────────────────────────────────

  const headerTitle = useCompanionMode ? `Chat with ${companionName}` : "Chef AI";
  const emptyIcon = useCompanionMode ? (
    <Bot size={48} color={colors.accent} strokeWidth={1.5} />
  ) : (
    <ChefHat size={48} color={colors.textMuted} />
  );
  const emptyTitle = useCompanionMode
    ? getTimeGreeting(companionName)
    : "Ask Chef AI anything";
  const emptySubtitle = useCompanionMode
    ? "Ask me about recipes, meal planning, pantry tips, and more"
    : "Get help with recipes, food costs, safety tips, and more";
  const inputPlaceholder = useCompanionMode
    ? `Ask ${companionName}...`
    : "Ask Chef AI...";
  const assistantLabel = useCompanionMode ? companionName : "Chef AI";

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top", "left", "right"]}
    >
      <ScreenHeader title={headerTitle} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 8,
            flexGrow: 1,
          }}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={scrollToBottom}
        >
          {messages.length === 0 ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                paddingVertical: 48,
              }}
            >
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: useCompanionMode
                    ? (colors.accentBg || colors.accent + "15")
                    : "transparent",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                {emptyIcon}
              </View>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: colors.text,
                  marginBottom: 8,
                  textAlign: "center",
                  maxWidth: 300,
                }}
              >
                {emptyTitle}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.textSecondary,
                  textAlign: "center",
                  maxWidth: 280,
                  marginBottom: 24,
                }}
              >
                {emptySubtitle}
              </Text>
              <View style={{ gap: 8, width: "100%" }}>
                {suggestedQuestions.map((question) => (
                  <Pressable
                    key={question}
                    onPress={() => handleSuggestedQuestion(question)}
                    style={{
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 12,
                      padding: 14,
                    }}
                  >
                    <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                      {question}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            messages.map((msg, index) => (
              <View
                key={index}
                style={{
                  alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "80%",
                  marginBottom: 12,
                }}
              >
                <View
                  style={{
                    backgroundColor:
                      msg.role === "user" ? colors.accent : colors.surface,
                    borderRadius: 16,
                    borderBottomRightRadius: msg.role === "user" ? 4 : 16,
                    borderBottomLeftRadius: msg.role === "assistant" ? 4 : 16,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      lineHeight: 22,
                      color: msg.role === "user" ? "#FFFFFF" : colors.text,
                    }}
                  >
                    {msg.content}
                  </Text>
                </View>

                {/* Label + feedback */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 4,
                    gap: 8,
                    alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>
                    {msg.role === "user" ? "You" : assistantLabel}
                  </Text>

                  {/* Feedback buttons (assistant messages only, companion mode) */}
                  {useCompanionMode && msg.role === "assistant" && (
                    <View style={{ flexDirection: "row", gap: 4 }}>
                      <Pressable
                        onPress={() => handleFeedback(index, 1)}
                        disabled={feedbackGiven[index] !== undefined}
                        hitSlop={8}
                      >
                        <ThumbsUp
                          size={12}
                          color={
                            feedbackGiven[index] === 1
                              ? colors.success
                              : colors.textMuted
                          }
                          strokeWidth={feedbackGiven[index] === 1 ? 2.5 : 1.5}
                        />
                      </Pressable>
                      <Pressable
                        onPress={() => handleFeedback(index, -1)}
                        disabled={feedbackGiven[index] !== undefined}
                        hitSlop={8}
                      >
                        <ThumbsDown
                          size={12}
                          color={
                            feedbackGiven[index] === -1
                              ? colors.destructive
                              : colors.textMuted
                          }
                          strokeWidth={feedbackGiven[index] === -1 ? 2.5 : 1.5}
                        />
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}

          {/* Loading indicator */}
          {isLoading && (
            <View
              style={{
                alignSelf: "flex-start",
                maxWidth: "80%",
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  borderBottomLeftRadius: 4,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <ActivityIndicator size="small" color={colors.accent} />
                <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                  {useCompanionMode ? `${companionName} is thinking...` : "Thinking..."}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            padding: 12,
            paddingBottom: Platform.OS === "ios" ? 12 : 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.background,
            gap: 8,
          }}
        >
          {/* Mic button (voice enabled only) */}
          {voiceEnabled && (
            <Pressable
              onPress={handleMicPress}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: isListening ? colors.destructive : colors.surface,
                borderWidth: 1,
                borderColor: isListening ? colors.destructive : colors.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isListening ? (
                <MicOff size={20} color="#FFFFFF" strokeWidth={2} />
              ) : (
                <Mic size={20} color={colors.accent} strokeWidth={2} />
              )}
            </Pressable>
          )}

          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={inputPlaceholder}
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={2000}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              paddingTop: 10,
              fontSize: 15,
              maxHeight: 100,
              backgroundColor: colors.surface,
              color: colors.text,
            }}
            editable={!isLoading && !isListening}
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={() => sendMessage(input)}
          />

          {/* Send button */}
          <Pressable
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor:
                input.trim() && !isLoading ? colors.accent : colors.border,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontSize: 18,
                color: input.trim() && !isLoading ? "#FFFFFF" : colors.textMuted,
              }}
            >
              ↑
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
