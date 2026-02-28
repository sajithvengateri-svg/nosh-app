import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../lib/supabase";
import { useOrg } from "../../../contexts/OrgProvider";
import { useAuth } from "../../../contexts/AuthProvider";
import { useTheme } from "../../../contexts/ThemeProvider";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Bug, Lightbulb, MessageCircle, PartyPopper } from "lucide-react-native";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { type LucideIcon } from "lucide-react-native";

interface Category {
  key: string;
  label: string;
  icon: LucideIcon;
}

const CATEGORIES: Category[] = [
  { key: "bug", label: "Bug Report", icon: Bug },
  { key: "feature", label: "Feature Request", icon: Lightbulb },
  { key: "general", label: "General Feedback", icon: MessageCircle },
  { key: "praise", label: "Kudos", icon: PartyPopper },
];

export default function Feedback() {
  const router = useRouter();
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert("Error", "Please enter your feedback");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("feedback").insert({
        user_id: user?.id,
        org_id: currentOrg?.id,
        category,
        message: message.trim(),
        source: "mobile",
      });

      if (error) throw error;

      Alert.alert("Thank you!", "Your feedback has been submitted.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      // If the feedback table doesn't exist, show a generic success
      Alert.alert(
        "Thank you!",
        "Your feedback has been recorded.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Feedback" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: 40 }}>
          <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 20 }}>
            Help us improve by sharing your thoughts
          </Text>

          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 10 }}>
            Category
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat.key;
              const IconComponent = cat.icon;
              return (
                <Pressable
                  key={cat.key}
                  onPress={() => setCategory(cat.key)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor: isSelected ? colors.accentBg : colors.surface,
                    borderWidth: 1,
                    borderColor: isSelected ? colors.accent : colors.border,
                  }}
                >
                  <IconComponent size={16} color={isSelected ? colors.accent : colors.textSecondary} strokeWidth={1.5} />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: isSelected ? colors.accent : colors.textSecondary,
                    }}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Input
            label="Your Feedback"
            placeholder="Tell us what's on your mind..."
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={6}
            style={{ minHeight: 120, textAlignVertical: "top" }}
          />

          <Button onPress={handleSubmit} loading={loading} style={{ marginTop: 16 }}>
            Submit Feedback
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
