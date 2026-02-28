import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import Constants from "expo-constants";
import { useAuth } from "../contexts/AuthProvider";
import { useOrg } from "../contexts/OrgProvider";
import { VARIANT_REGISTRY, isHomeCook } from "@queitos/shared";
import type { AppVariant } from "@queitos/shared";

const APP_VARIANT = (Constants.expoConfig?.extra?.appVariant ?? "chefos") as AppVariant;
const ACCENT = VARIANT_REGISTRY[APP_VARIANT].brand.accent;
const IS_HOME_COOK = isHomeCook(APP_VARIANT);

export default function Index() {
  const { user, isLoading } = useAuth();
  const { currentOrg, isLoading: orgLoading } = useOrg();

  if (isLoading || (user && orgLoading)) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  if (user) {
    // Food service variants: redirect to onboarding if not completed
    if (
      !IS_HOME_COOK &&
      currentOrg &&
      !currentOrg.onboarding_completed_at
    ) {
      return <Redirect href="/(onboarding)" />;
    }
    return <Redirect href="/(app)/(tabs)/dashboard" />;
  }

  return <Redirect href="/(auth)/landing" />;
}
