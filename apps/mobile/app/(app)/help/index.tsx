import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  View, Text, Pressable, ScrollView, TextInput, LayoutAnimation,
  Platform, UIManager, KeyboardAvoidingView, ActivityIndicator, Image,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "../../../contexts/ThemeProvider";
import {
  LayoutDashboard, BookOpen, UtensilsCrossed, ClipboardList, ShieldCheck,
  Camera, Gamepad2, Bot, Settings, ChevronDown, ChevronLeft, ChevronRight,
  Search, X, Workflow, FileText, Thermometer, Sparkles, Receipt, HelpCircle,
  Mic, MicOff, ArrowUp, ShoppingCart, ListChecks, Repeat,
  HeartPulse, Droplets, Truck, Flame,
  type LucideIcon,
} from "lucide-react-native";
import Constants from "expo-constants";
import { VARIANT_REGISTRY } from "@queitos/shared";
import type { AppVariant } from "@queitos/shared";
import { supabase } from "../../../lib/supabase";
import { CATEGORIES, ALL_HELP_ITEMS, HELP_WORKFLOWS, APP_VERSION, getItemsForVariant, type HelpItem, type HelpStream } from "../../../lib/help/helpData";
import { searchHelp, serializeHelpContext } from "../../../lib/help/helpSearch";
import { FAQ_CATEGORIES, FAQ_ITEMS, getFAQForVariant } from "../../../lib/help/faqData";
import { ImagePicker } from "../../../components/ui/ImagePicker";
import { useAppSettings } from "../../../hooks/useAppSettings";
import { createVoiceService } from "../../../lib/companion/voiceService";
import type { VoiceService } from "../../../lib/companion/voiceService";

const APP_VARIANT = (Constants.expoConfig?.extra?.appVariant ?? "chefos") as AppVariant;
const VARIANT_STREAM = (VARIANT_REGISTRY[APP_VARIANT]?.stream ?? "chefos") as HelpStream;
const VARIANT_REGION = VARIANT_REGISTRY[APP_VARIANT]?.region ?? "au";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type HelpTab = "ask" | "help" | "workflows" | "faq";
type ChatMessage = { role: "user" | "assistant"; content: string };

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard, BookOpen, UtensilsCrossed, ClipboardList, ShieldCheck,
  Camera, Gamepad2, Bot, Settings, Thermometer, Sparkles, Receipt,
  FileText, Workflow, HelpCircle, ShoppingCart, ListChecks, Repeat,
  HeartPulse, Droplets, Truck, Flame,
};

function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] || FileText;
}

const TAB_CONFIG: { key: HelpTab; label: string; icon: LucideIcon; color: string }[] = [
  { key: "ask", label: "Ask AI", icon: Bot, color: "#7C3AED" },
  { key: "help", label: "Help", icon: FileText, color: "#3B82F6" },
  { key: "workflows", label: "Workflows", icon: Workflow, color: "#F59E0B" },
  { key: "faq", label: "FAQ", icon: HelpCircle, color: "#10B981" },
];

// Filtered for current variant + region
const FILTERED_ITEMS = getItemsForVariant(ALL_HELP_ITEMS, VARIANT_STREAM, VARIANT_REGION);
const FILTERED_WORKFLOWS = FILTERED_ITEMS.filter((i): i is HelpItem & { type: "workflow" } => i.type === "workflow");
const FILTERED_FAQ = getFAQForVariant(FAQ_ITEMS, VARIANT_STREAM, VARIANT_REGION);

const SUGGESTED_QUESTIONS = [
  "How do I log a temperature check?",
  "How do I scan an invoice?",
  "What games can I play?",
  "How does recipe costing work?",
];

// ── Pill Tabs ──────────────────────────────────────────

function PillTabs({ active, onSelect, colors }: { active: HelpTab; onSelect: (t: HelpTab) => void; colors: any }) {
  return (
    <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingVertical: 10 }}>
      {TAB_CONFIG.map((tab) => {
        const isActive = active === tab.key;
        const Icon = tab.icon;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onSelect(tab.key)}
            style={({ pressed }) => ({
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: isActive ? tab.color : tab.color + "15",
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Icon size={16} color={isActive ? "#FFFFFF" : tab.color} strokeWidth={2} />
            <Text style={{ fontSize: 13, fontWeight: "600", color: isActive ? "#FFFFFF" : tab.color }}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ── Ask AI Tab ─────────────────────────────────────────

function AskAITab({
  colors, messages, input, setInput, isLoading, chatImage, setChatImage,
  sendMessage, isListening, handleMicPress, voiceEnabled,
}: {
  colors: any; messages: ChatMessage[]; input: string; setInput: (s: string) => void;
  isLoading: boolean; chatImage: string | null; setChatImage: (s: string | null) => void;
  sendMessage: (text: string) => void; isListening: boolean; handleMicPress: () => void;
  voiceEnabled: boolean;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const scrollToBottom = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 8, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={scrollToBottom}
      >
        {messages.length === 0 ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 48 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.accent + "15", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <Bot size={48} color={colors.accent} strokeWidth={1.5} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 8, textAlign: "center", maxWidth: 300 }}>
              Ask me anything
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: "center", maxWidth: 280, marginBottom: 24 }}>
              Get help with app features, cooking tips, food safety, and more
            </Text>
            <View style={{ gap: 8, width: "100%" }}>
              {SUGGESTED_QUESTIONS.map((q) => (
                <Pressable
                  key={q}
                  onPress={() => sendMessage(q)}
                  style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14 }}
                >
                  <Text style={{ fontSize: 14, color: colors.textSecondary }}>{q}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          messages.map((msg, i) => (
            <View key={i} style={{ alignSelf: msg.role === "user" ? "flex-end" : "flex-start", maxWidth: "80%", marginBottom: 12 }}>
              <View style={{
                backgroundColor: msg.role === "user" ? colors.accent : colors.surface,
                borderRadius: 16,
                borderBottomRightRadius: msg.role === "user" ? 4 : 16,
                borderBottomLeftRadius: msg.role === "assistant" ? 4 : 16,
                paddingHorizontal: 16, paddingVertical: 12,
              }}>
                <Text style={{ fontSize: 15, lineHeight: 22, color: msg.role === "user" ? "#FFFFFF" : colors.text }}>
                  {msg.content}
                </Text>
              </View>
              <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4, alignSelf: msg.role === "user" ? "flex-end" : "flex-start" }}>
                {msg.role === "user" ? "You" : "Help Assistant"}
              </Text>
            </View>
          ))
        )}

        {/* Loading */}
        {isLoading && (
          <View style={{ alignSelf: "flex-start", maxWidth: "80%", marginBottom: 12 }}>
            <View style={{ backgroundColor: colors.surface, borderRadius: 16, borderBottomLeftRadius: 4, paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 8 }}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={{ fontSize: 14, color: colors.textSecondary }}>Thinking...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Image preview */}
      {chatImage && (
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8, gap: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
          <Image source={{ uri: `data:image/jpeg;base64,${chatImage}` }} style={{ width: 60, height: 60, borderRadius: 10 }} />
          <Pressable onPress={() => setChatImage(null)} hitSlop={8}>
            <X size={18} color={colors.textMuted} strokeWidth={2} />
          </Pressable>
        </View>
      )}

      {/* Input bar */}
      <View style={{
        flexDirection: "row", alignItems: "flex-end", padding: 12, paddingBottom: Platform.OS === "ios" ? 12 : 12,
        borderTopWidth: chatImage ? 0 : 1, borderTopColor: colors.border, backgroundColor: colors.background, gap: 8,
      }}>
        {/* Image picker */}
        <ImagePicker
          onImageSelected={(base64) => setChatImage(base64)}
          renderButton={({ onPress, loading }) => (
            <Pressable
              onPress={onPress}
              disabled={loading}
              style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: chatImage ? colors.accent + "20" : colors.surface,
                borderWidth: 1, borderColor: chatImage ? colors.accent : colors.border,
                alignItems: "center", justifyContent: "center",
              }}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Camera size={20} color={chatImage ? colors.accent : colors.textMuted} strokeWidth={1.8} />
              )}
            </Pressable>
          )}
        />

        {/* Voice toggle */}
        {voiceEnabled && (
          <Pressable
            onPress={handleMicPress}
            style={{
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: isListening ? colors.destructive : colors.surface,
              borderWidth: 1, borderColor: isListening ? colors.destructive : colors.border,
              alignItems: "center", justifyContent: "center",
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
          placeholder={isListening ? "Listening..." : "Ask a question..."}
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={2000}
          style={{
            flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 20,
            paddingHorizontal: 16, paddingVertical: 10, paddingTop: 10,
            fontSize: 15, maxHeight: 100, backgroundColor: colors.surface, color: colors.text,
          }}
          editable={!isLoading && !isListening}
          returnKeyType="send"
          blurOnSubmit={false}
          onSubmitEditing={() => sendMessage(input)}
        />

        {/* Send button */}
        <Pressable
          onPress={() => sendMessage(input)}
          disabled={(!input.trim() && !chatImage) || isLoading}
          style={{
            width: 44, height: 44, borderRadius: 22,
            backgroundColor: (input.trim() || chatImage) && !isLoading ? colors.accent : colors.border,
            alignItems: "center", justifyContent: "center",
          }}
        >
          <ArrowUp size={20} color={(input.trim() || chatImage) && !isLoading ? "#FFFFFF" : colors.textMuted} strokeWidth={2} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Help Articles Tab ──────────────────────────────────

function HelpArticlesTab({ colors, router }: { colors: any; router: any }) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const articles = useMemo(() => FILTERED_ITEMS.filter((i) => i.type === "article"), []);

  const searchResults = useMemo(() => {
    if (!query.trim()) return null;
    return searchHelp(query, articles);
  }, [query, articles]);

  const articlesByCategory = useMemo(() => {
    const map: Record<string, HelpItem[]> = {};
    for (const item of articles) {
      if (!map[item.category]) map[item.category] = [];
      map[item.category].push(item);
    }
    return map;
  }, [articles]);

  const toggleCategory = useCallback((key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const openItem = (id: string) => {
    router.push({ pathname: "/(app)/help/[id]", params: { id } });
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {/* Search */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: colors.border }}>
          <Search size={18} color={colors.textMuted} strokeWidth={1.5} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search help articles..."
            placeholderTextColor={colors.textMuted}
            style={{ flex: 1, fontSize: 15, color: colors.text, marginLeft: 8, paddingVertical: 0 }}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <X size={18} color={colors.textMuted} strokeWidth={1.5} />
            </Pressable>
          )}
        </View>
      </View>

      {searchResults !== null ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          {searchResults.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 32 }}>
              <Search size={32} color={colors.textMuted} strokeWidth={1} />
              <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text, marginTop: 12 }}>No results</Text>
              <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>Try different keywords</Text>
            </View>
          ) : (
            <>
              <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 8 }}>
                {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
              </Text>
              {searchResults.map((item) => {
                const Icon = getIcon(item.icon);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => openItem(item.id)}
                    style={({ pressed }) => ({
                      flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12,
                      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: 8,
                      opacity: pressed ? 0.85 : 1,
                    })}
                  >
                    <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: item.color + "15", alignItems: "center", justifyContent: "center" }}>
                      <Icon size={18} color={item.color} strokeWidth={1.8} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>{item.title}</Text>
                    </View>
                    <ChevronRight size={16} color={colors.textMuted} strokeWidth={1.5} />
                  </Pressable>
                );
              })}
            </>
          )}
        </View>
      ) : (
        <View style={{ paddingHorizontal: 16 }}>
          {CATEGORIES.map((cat) => {
            const items = articlesByCategory[cat.key];
            if (!items || items.length === 0) return null;
            const isOpen = expanded.has(cat.key);
            const CatIcon = getIcon(cat.icon);

            return (
              <View key={cat.key} style={{ marginBottom: 8 }}>
                <Pressable
                  onPress={() => toggleCategory(cat.key)}
                  style={({ pressed }) => ({
                    flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14,
                    backgroundColor: colors.card, borderWidth: 1,
                    borderColor: isOpen ? colors.accent + "40" : colors.cardBorder,
                    gap: 12, opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: cat.color + "15", alignItems: "center", justifyContent: "center" }}>
                    <CatIcon size={20} color={cat.color} strokeWidth={1.8} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>{cat.label}</Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>{items.length} article{items.length !== 1 ? "s" : ""}</Text>
                  </View>
                  <ChevronDown
                    size={18} color={colors.textMuted} strokeWidth={2}
                    style={{ transform: [{ rotate: isOpen ? "180deg" : "0deg" }] }}
                  />
                </Pressable>

                {isOpen && (
                  <View style={{ backgroundColor: colors.card, borderWidth: 1, borderTopWidth: 0, borderColor: colors.cardBorder, borderBottomLeftRadius: 14, borderBottomRightRadius: 14, marginTop: -8, paddingTop: 14 }}>
                    {items.map((item, i) => {
                      const ItemIcon = getIcon(item.icon);
                      return (
                        <Pressable
                          key={item.id}
                          onPress={() => openItem(item.id)}
                          style={({ pressed }) => ({
                            flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, paddingHorizontal: 16,
                            borderTopWidth: i > 0 ? 1 : 0, borderTopColor: colors.border,
                            opacity: pressed ? 0.7 : 1,
                          })}
                        >
                          <ItemIcon size={16} color={item.color} strokeWidth={1.5} />
                          <Text style={{ flex: 1, fontSize: 14, color: colors.text }}>{item.title}</Text>
                          <ChevronRight size={14} color={colors.textMuted} strokeWidth={1.5} />
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}

          <View style={{ alignItems: "center", paddingVertical: 24 }}>
            <Text style={{ fontSize: 11, color: colors.textMuted }}>
              v{APP_VERSION} · {FILTERED_ITEMS.length} articles & workflows
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

// ── Workflows Tab ──────────────────────────────────────

function WorkflowsTab({ colors, router }: { colors: any; router: any }) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!query.trim()) return FILTERED_WORKFLOWS;
    return searchHelp(query, FILTERED_WORKFLOWS);
  }, [query]);

  const openItem = (id: string) => {
    router.push({ pathname: "/(app)/help/[id]", params: { id } });
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {/* Search */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: colors.border }}>
          <Search size={18} color={colors.textMuted} strokeWidth={1.5} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search workflows..."
            placeholderTextColor={colors.textMuted}
            style={{ flex: 1, fontSize: 15, color: colors.text, marginLeft: 8, paddingVertical: 0 }}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <X size={18} color={colors.textMuted} strokeWidth={1.5} />
            </Pressable>
          )}
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, gap: 10 }}>
        {results.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 32 }}>
            <Workflow size={32} color={colors.textMuted} strokeWidth={1} />
            <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text, marginTop: 12 }}>No workflows found</Text>
          </View>
        ) : (
          results.map((wf) => {
            if (wf.type !== "workflow") return null;
            const Icon = getIcon(wf.icon);
            return (
              <Pressable
                key={wf.id}
                onPress={() => openItem(wf.id)}
                style={({ pressed }) => ({
                  flexDirection: "row", alignItems: "center", gap: 14, padding: 16,
                  backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.cardBorder,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: wf.color + "15", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={22} color={wf.color} strokeWidth={1.8} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>{wf.title}</Text>
                  <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }} numberOfLines={1}>{wf.description}</Text>
                </View>
                <View style={{ backgroundColor: wf.color + "20", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ fontSize: 10, fontWeight: "700", color: wf.color }}>{wf.steps.length} steps</Text>
                </View>
                <ChevronRight size={16} color={colors.textMuted} strokeWidth={1.5} />
              </Pressable>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

// ── FAQ Tab ────────────────────────────────────────────

function FAQTab({ colors }: { colors: any }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleFaq = useCallback((id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      {FAQ_CATEGORIES.map((cat) => {
        const items = FILTERED_FAQ.filter((f) => f.category === cat.key);
        if (items.length === 0) return null;

        return (
          <View key={cat.key} style={{ marginTop: 16, paddingHorizontal: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, paddingHorizontal: 4 }}>
              {cat.label}
            </Text>

            <View style={{ backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.cardBorder, overflow: "hidden" }}>
              {items.map((faq, i) => {
                const isOpen = expanded.has(faq.id);
                return (
                  <View key={faq.id}>
                    {i > 0 && <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 16 }} />}
                    <Pressable
                      onPress={() => toggleFaq(faq.id)}
                      style={({ pressed }) => ({
                        flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16,
                        gap: 10, opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      <HelpCircle size={16} color={colors.accent} strokeWidth={1.5} />
                      <Text style={{ flex: 1, fontSize: 14, fontWeight: "600", color: colors.text }}>{faq.question}</Text>
                      <ChevronDown
                        size={16} color={colors.textMuted} strokeWidth={2}
                        style={{ transform: [{ rotate: isOpen ? "180deg" : "0deg" }] }}
                      />
                    </Pressable>
                    {isOpen && (
                      <View style={{ paddingHorizontal: 16, paddingBottom: 14, paddingLeft: 42 }}>
                        <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 21 }}>{faq.answer}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

// ── Main Screen ────────────────────────────────────────

function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, () => setVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setVisible(false));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);
  return visible;
}

export default function HelpCentre() {
  const router = useRouter();
  const { colors } = useTheme();
  const { settings } = useAppSettings();
  const keyboardVisible = useKeyboardVisible();

  // Tab state
  const [activeTab, setActiveTab] = useState<HelpTab>("ask");

  // Chat state (persists across tab switches)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatImage, setChatImage] = useState<string | null>(null);

  // Voice state
  const [isListening, setIsListening] = useState(false);
  const voiceRef = useRef<VoiceService | null>(null);
  const voiceEnabled = !!settings.companionVoiceProvider;

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed && !chatImage) return;
    if (chatLoading) return;

    const userMessage: ChatMessage = { role: "user", content: trimmed || "What is this?" };
    const updated = [...chatMessages, userMessage];
    setChatMessages(updated);
    setChatInput("");
    setChatLoading(true);

    // RAG: search help articles for context
    const helpContext = serializeHelpContext(trimmed, FILTERED_ITEMS, 5);

    // Build message content for the edge function
    const messagesToSend = updated.map((m) => ({ role: m.role, content: m.content }));

    // If image attached, modify the last user message to include it
    if (chatImage) {
      const lastMsg = messagesToSend[messagesToSend.length - 1];
      (lastMsg as any).content = [
        { type: "text", text: trimmed || "What is this?" },
        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${chatImage}` } },
      ];
    }

    setChatImage(null);

    try {
      const { data, error } = await supabase.functions.invoke("help-chat", {
        body: { messages: messagesToSend, helpContext },
      });
      if (error) throw error;
      setChatMessages((prev) => [...prev, {
        role: "assistant",
        content: data?.content || "Sorry, I couldn't generate a response.",
      }]);

      // Auto-speak if voice enabled
      if (voiceEnabled && voiceRef.current && data?.content) {
        voiceRef.current.speak(data.content).catch(() => {});
      }
    } catch {
      setChatMessages((prev) => [...prev, {
        role: "assistant",
        content: "Something went wrong. Please check your connection and try again.",
      }]);
    } finally {
      setChatLoading(false);
    }
  }, [chatMessages, chatLoading, chatImage, voiceEnabled]);

  const handleMicPress = useCallback(async () => {
    if (!voiceEnabled) return;

    // Lazy-init voice service
    if (!voiceRef.current) {
      try {
        voiceRef.current = createVoiceService(settings.companionVoiceProvider || "elevenlabs");
      } catch {
        return;
      }
    }

    if (isListening) {
      setIsListening(false);
      const transcript = await voiceRef.current.stopListening();
      if (transcript) {
        setChatInput(transcript);
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
  }, [isListening, sendMessage, voiceEnabled, settings.companionVoiceProvider]);

  const hidePills = keyboardVisible && activeTab === "ask";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      {!hidePills && (
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 12 }}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={{ padding: 4 }}>
            <ChevronLeft size={22} color={colors.text} strokeWidth={2} />
          </Pressable>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, flex: 1 }}>Help Centre</Text>
        </View>
      )}

      {/* Pill Tabs — hidden when keyboard is up on Ask AI tab */}
      {!hidePills && (
        <PillTabs active={activeTab} onSelect={setActiveTab} colors={colors} />
      )}

      {/* Content */}
      {activeTab === "ask" && (
        <AskAITab
          colors={colors}
          messages={chatMessages}
          input={chatInput}
          setInput={setChatInput}
          isLoading={chatLoading}
          chatImage={chatImage}
          setChatImage={setChatImage}
          sendMessage={sendMessage}
          isListening={isListening}
          handleMicPress={handleMicPress}
          voiceEnabled={voiceEnabled}
        />
      )}
      {activeTab === "help" && <HelpArticlesTab colors={colors} router={router} />}
      {activeTab === "workflows" && <WorkflowsTab colors={colors} router={router} />}
      {activeTab === "faq" && <FAQTab colors={colors} />}
    </SafeAreaView>
  );
}
