import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import Constants from "expo-constants";
import { useTheme } from "../../../contexts/ThemeProvider";

import { isHomeCook } from "@queitos/shared";
import type { AppVariant } from "@queitos/shared";
const APP_VARIANT = (Constants.expoConfig?.extra?.appVariant ?? "chefos") as AppVariant;
const IS_HOMECHEF = isHomeCook(APP_VARIANT);

const APP_NAME = IS_HOMECHEF ? "HomeChef" : "ChefOS";

function Section({ title, children, colors }: { title: string; children: string; colors: Record<string, string> }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 6 }}>
        {title}
      </Text>
      <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 22 }}>
        {children}
      </Text>
    </View>
  );
}

export default function PrivacyPolicy() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Privacy Policy" />

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: 40 }}>
        <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 20 }}>
          Last updated: February 2026
        </Text>

        <Section title="Overview" colors={colors}>
          {`${APP_NAME} ("we", "our", or "us") is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information when you use our mobile application.`}
        </Section>

        <Section title="Information We Collect" colors={colors}>
          {`We collect the following types of information:\n\n• Account information: Email address, name, and password when you create an account.\n• Kitchen data: Recipes, ingredients, inventory, prep lists, food safety logs, and other content you create.\n• Organization data: Business name, type, and team member information.\n• Usage data: App interactions, feature usage, and error reports to improve our service.\n• Device information: Device type, operating system version, and app version for compatibility.`}
        </Section>

        <Section title="How We Use Your Information" colors={colors}>
          {`Your information is used to:\n\n• Provide and maintain the ${APP_NAME} service\n• Sync your data across devices\n• Improve our features and user experience\n• Send important service notifications\n• Provide customer support\n\nWe do not sell your personal data to third parties.`}
        </Section>

        <Section title="Data Storage & Security" colors={colors}>
          {`Your data is stored securely on Supabase cloud infrastructure with:\n\n• Encryption in transit (TLS/SSL)\n• Encryption at rest\n• Row-level security (RLS) ensuring data isolation between organizations\n• Authentication tokens stored in your device's secure storage`}
        </Section>

        <Section title="Data Sharing" colors={colors}>
          {`We only share your data in these limited circumstances:\n\n• With team members in your organization (based on permissions you control)\n• With our infrastructure providers (Supabase, Expo) for service operation\n• When required by law or to protect rights and safety`}
        </Section>

        <Section title="Your Rights" colors={colors}>
          {`You have the right to:\n\n• Access your personal data\n• Export your data\n• Correct inaccurate data\n• Delete your account and all associated data\n• Withdraw consent at any time\n\nTo exercise these rights, go to Settings > Delete Account or contact us.`}
        </Section>

        <Section title="Data Retention" colors={colors}>
          {`We retain your data as long as your account is active. When you delete your account, all associated data is permanently removed within 30 days.`}
        </Section>

        <Section title="Children's Privacy" colors={colors}>
          {`${APP_NAME} is not intended for children under 13. We do not knowingly collect data from children.`}
        </Section>

        <Section title="Changes to This Policy" colors={colors}>
          {`We may update this privacy policy from time to time. We will notify you of significant changes via the app or email.`}
        </Section>

        <Section title="Contact Us" colors={colors}>
          {`If you have questions about this privacy policy, please contact us through the Feedback section in the app or email us at support@chefos.com.au.`}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
