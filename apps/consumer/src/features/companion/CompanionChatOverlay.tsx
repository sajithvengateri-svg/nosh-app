import { useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { Linking } from "react-native";
import { MessageCircle } from "lucide-react-native";
import { Colors, Glass } from "../../constants/colors";
import { useCompanionStore } from "../../lib/companion/companionStore";
import { useCompanionChat } from "../../hooks/useCompanionChat";
import { lightTap } from "../../lib/haptics";
import { noshStopSpeaking } from "../../lib/companion/noshSpeak";
import { useState } from "react";

const ADMIN_URL = "https://nosh-admin-eight.vercel.app";

export function CompanionChatOverlay() {
  const messages = useCompanionStore((s) => s.messages);
  const setVoiceEnabled = useCompanionStore((s) => s.setVoiceEnabled);
  const { sendMessage, isLoading } = useCompanionChat();
  const [text, setText] = useState("");
  const listRef = useRef<FlatList>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    lightTap();
    setText("");

    // Manual typing = exit voice mode
    setVoiceEnabled(false);
    noshStopSpeaking();

    // Secret admin access
    const lower = trimmed.toLowerCase();
    if (lower === "open kitchen" || lower === "nosh admin") {
      Linking.openURL(ADMIN_URL);
      return;
    }

    sendMessage(trimmed);
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={100}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.messageList}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageBubble,
              item.role === "user" ? styles.userBubble : styles.assistantBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                item.role === "user" && styles.userText,
              ]}
            >
              {item.content}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={{ marginBottom: 8 }}>
              <MessageCircle size={32} color={Colors.text.muted} strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>Hey! I'm your Prep Mi companion</Text>
            <Text style={styles.emptyText}>
              Ask me what to cook tonight, help with substitutions, or tell me
              what's in your fridge.
            </Text>
          </View>
        }
      />

      {isLoading && (
        <View style={styles.typingRow}>
          <Text style={styles.typingText}>Thinking...</Text>
        </View>
      )}

      <View style={styles.inputRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Ask me anything..."
          placeholderTextColor={Colors.text.muted}
          style={styles.input}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          multiline
          maxLength={500}
        />
        <Pressable
          onPress={handleSend}
          style={[styles.sendButton, (!text.trim() || isLoading) && styles.sendDisabled]}
          disabled={!text.trim() || isLoading}
        >
          <Text style={styles.sendText}>↑</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  messageList: { paddingVertical: 12, paddingHorizontal: 4, flexGrow: 1 },
  messageBubble: {
    maxWidth: "80%",
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: Glass.surfaceAccent,
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: Glass.borderLight,
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: Glass.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Glass.borderLight,
  },
  messageText: { fontSize: 15, color: Colors.text.primary, lineHeight: 21 },
  userText: { color: Colors.text.primary },
  typingRow: { paddingHorizontal: 16, paddingBottom: 4 },
  typingText: { fontSize: 13, color: Colors.text.muted, fontStyle: "italic" },
  inputRow: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Glass.borderOuter,
  },
  input: {
    flex: 1,
    backgroundColor: Glass.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Glass.borderLight,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-end",
  },
  sendDisabled: { opacity: 0.4 },
  sendText: { color: "#FFF", fontSize: 20, fontWeight: "700" },
  empty: { alignItems: "center", paddingTop: 40, paddingHorizontal: 20 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.secondary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
  },
});
