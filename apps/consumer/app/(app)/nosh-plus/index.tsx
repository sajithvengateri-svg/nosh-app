import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, Zap, Calendar, LineChart, Utensils, Crown } from "lucide-react-native";
import { Colors, Spacing } from "../../../src/constants/colors";
import { Fonts, FontSizes } from "../../../src/constants/typography";
import { useSubscriptionStore } from "../../../src/lib/stores/subscriptionStore";
import { lightTap, mediumTap } from "../../../src/lib/haptics";

const FEATURES = [
  {
    icon: Calendar,
    title: "Weekly Autopilot",
    desc: "Your week planned automatically every Sunday. Personality-matched recipes, shopping list ready to go.",
  },
  {
    icon: Utensils,
    title: "Leftover Intelligence",
    desc: "Track leftover portions, get recipe suggestions to use them up. Zero food waste.",
  },
  {
    icon: LineChart,
    title: "Savings Dashboard",
    desc: "See exactly how much you save by cooking at home. Weekly breakdowns and trends.",
  },
  {
    icon: Crown,
    title: "Premium Recipes",
    desc: "Exclusive recipes from top chefs. New drops every week.",
  },
];

export default function NoshPlusPage() {
  const { status, startCheckout, cancelSubscription } = useSubscriptionStore();
  const isActive = status === "active" || status === "trial";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => { lightTap(); router.back(); }} style={styles.backButton}>
          <ArrowLeft size={22} color={Colors.text.primary} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.noshPlusBadge}>
            <Zap size={20} color={Colors.primary} strokeWidth={2} fill={Colors.primary} />
            <Text style={styles.noshPlusTitle}>Prep Mi+</Text>
          </View>
          <Text style={styles.tagline}>Your week, sorted</Text>
          <Text style={styles.heroDesc}>
            Autopilot meal planning, leftover tracking, savings insights, and premium recipes.
          </Text>
        </View>

        {/* Features */}
        {FEATURES.map((feat) => (
          <View key={feat.title} style={styles.featureCard}>
            <View style={styles.featureIconWrap}>
              <feat.icon size={22} color={Colors.primary} strokeWidth={1.8} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>{feat.title}</Text>
              <Text style={styles.featureDesc}>{feat.desc}</Text>
            </View>
          </View>
        ))}

        {/* CTA */}
        {isActive ? (
          <View style={styles.activeSection}>
            <View style={styles.activeBadge}>
              <Zap size={16} color="#FFF" strokeWidth={2} fill="#FFF" />
              <Text style={styles.activeText}>Prep Mi+ Active</Text>
            </View>
            <Pressable
              onPress={() => {
                mediumTap();
                cancelSubscription();
              }}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelText}>Cancel Subscription</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.priceSection}>
            <Text style={styles.price}>$5.99/month</Text>
            <Pressable
              onPress={() => {
                mediumTap();
                startCheckout();
              }}
              style={styles.ctaButton}
            >
              <Text style={styles.ctaText}>Start 7-day free trial</Text>
            </Pressable>
            <Text style={styles.terms}>
              Cancel anytime. No charge during trial.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    justifyContent: "center",
    alignItems: "center",
  },
  content: { paddingHorizontal: Spacing.md },
  hero: { alignItems: "center", marginBottom: 32 },
  noshPlusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  noshPlusTitle: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes["3xl"],
    fontWeight: "800",
    color: Colors.secondary,
  },
  tagline: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.xl,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  heroDesc: {
    fontSize: FontSizes.sm,
    color: Colors.text.muted,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 300,
  },
  featureCard: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${Colors.primary}10`,
    justifyContent: "center",
    alignItems: "center",
  },
  featureTitle: {
    fontSize: FontSizes.base,
    fontWeight: "700",
    color: Colors.text.primary,
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: FontSizes.xs,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  priceSection: { alignItems: "center", marginTop: 16 },
  price: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes["2xl"],
    fontWeight: "700",
    color: Colors.secondary,
    marginBottom: 16,
  },
  ctaButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 24,
    marginBottom: 12,
  },
  ctaText: {
    color: "#FFF",
    fontSize: FontSizes.base,
    fontWeight: "700",
  },
  terms: {
    fontSize: FontSizes.xs,
    color: Colors.text.muted,
  },
  activeSection: { alignItems: "center", marginTop: 16 },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.success,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 24,
    marginBottom: 16,
  },
  activeText: {
    color: "#FFF",
    fontSize: FontSizes.base,
    fontWeight: "700",
  },
  cancelButton: {
    paddingVertical: 10,
  },
  cancelText: {
    fontSize: FontSizes.sm,
    color: Colors.text.muted,
  },
});
