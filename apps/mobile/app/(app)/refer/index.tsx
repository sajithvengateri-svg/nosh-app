import { useState } from "react";
import { View, Text, ScrollView, Pressable, Alert, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Gift, ChefHat, Home } from "lucide-react-native";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { useAuth } from "../../../contexts/AuthProvider";
import { useTheme } from "../../../contexts/ThemeProvider";
import { lightTap } from "../../../lib/haptics";

const SHARE_VARIANTS = [
  {
    key: "pro",
    label: "ChefOS Pro",
    icon: ChefHat,
    accent: "#6366F1",
    accentBg: "#EEF2FF",
    tagline: "Professional kitchen management.",
    audience: "chefs & kitchen teams",
    shareTitle: "Invite to ChefOS Pro",
    shareMessage: (code: string, link: string) =>
      `Hey — I use ChefOS Pro to manage my kitchen. It handles prep lists, recipes, food safety, scheduling and more.\n\nJoin with my code ${code} and we both get a reward.\n\n${link}`,
    param: "chefos",
  },
  {
    key: "home",
    label: "HomeChef",
    icon: Home,
    accent: "#EA580C",
    accentBg: "#FFF7ED",
    tagline: "Your home kitchen, organised.",
    audience: "friends & family who cook",
    shareTitle: "Invite to HomeChef",
    shareMessage: (code: string, link: string) =>
      `I've been using HomeChef to organise my home cooking — recipes, prep lists, and meal planning all in one place.\n\nJoin with my code ${code} and we both get a reward.\n\n${link}`,
    param: "homechef",
  },
] as const;

export default function Refer() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState(0);

  const referralCode = user?.id ? user.id.slice(0, 8).toUpperCase() : "CHEFOS";
  const variant = SHARE_VARIANTS[activeTab];
  const referralLink = `https://chefos.ai/refer/${referralCode}?app=${variant.param}`;

  const handleCopy = () => {
    Alert.alert("Referral Code", `Your code: ${referralCode}\n\nLink copied to clipboard.`);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: variant.shareMessage(referralCode, referralLink),
        title: variant.shareTitle,
      });
    } catch {}
  };

  const Icon = variant.icon;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Refer & Save" />

      <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
        {/* Tab pills */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          {SHARE_VARIANTS.map((v, i) => {
            const active = activeTab === i;
            const TabIcon = v.icon;
            return (
              <Pressable
                key={v.key}
                onPress={() => { lightTap(); setActiveTab(i); }}
                style={{
                  flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
                  gap: 8, paddingVertical: 14, borderRadius: 14,
                  backgroundColor: active ? v.accent : colors.surface,
                  borderWidth: 1.5,
                  borderColor: active ? v.accent : colors.border,
                }}
              >
                <TabIcon size={18} color={active ? "#FFFFFF" : colors.textSecondary} strokeWidth={1.5} />
                <Text style={{ fontSize: 14, fontWeight: "700", color: active ? "#FFFFFF" : colors.text }}>
                  {v.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Hero */}
        <View style={{ alignItems: "center", paddingVertical: 16 }}>
          <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: variant.accentBg, alignItems: "center", justifyContent: "center" }}>
            <Icon size={32} color={variant.accent} strokeWidth={1.5} />
          </View>
          <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text, marginTop: 12, textAlign: "center" }}>
            Share {variant.label}
          </Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: "center", marginTop: 6, lineHeight: 20 }}>
            {variant.tagline} Share it with {variant.audience} and earn rewards.
          </Text>
        </View>

        {/* Referral code card */}
        <View style={{ backgroundColor: variant.accentBg, borderRadius: 16, padding: 20, alignItems: "center", gap: 12, borderWidth: 1, borderColor: variant.accent + "20" }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: variant.accent }}>Your Referral Code</Text>
          <Text style={{ fontSize: 28, fontWeight: "800", color: variant.accent, letterSpacing: 3 }}>{referralCode}</Text>
          <Pressable
            onPress={handleCopy}
            style={({ pressed }) => ({
              backgroundColor: variant.accent + "15", borderRadius: 10,
              paddingVertical: 10, paddingHorizontal: 20, opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ color: variant.accent, fontWeight: "700", fontSize: 13 }}>Copy Link</Text>
          </Pressable>
        </View>

        {/* Share button */}
        <Pressable
          onPress={() => { lightTap(); handleShare(); }}
          style={({ pressed }) => ({
            backgroundColor: variant.accent, borderRadius: 14,
            paddingVertical: 16, alignItems: "center", opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}>
            Share {variant.label}
          </Text>
        </Pressable>

        {/* How it works */}
        <View style={{ gap: 14 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>How it works</Text>
          {[
            { step: "1", text: "Share your unique referral code or link" },
            { step: "2", text: `They sign up for ${variant.label} with your code` },
            { step: "3", text: "Both of you earn rewards on your subscription" },
          ].map((item) => (
            <View key={item.step} style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: variant.accentBg, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 14, fontWeight: "800", color: variant.accent }}>{item.step}</Text>
              </View>
              <Text style={{ flex: 1, fontSize: 14, color: colors.textSecondary, lineHeight: 20 }}>{item.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
