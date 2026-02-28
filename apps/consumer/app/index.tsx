import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../src/contexts/AuthProvider";
import { useDevAccess } from "../src/lib/devAccess";
import { Colors } from "../src/constants/colors";

export default function Index() {
  const { user, profile, isLoading } = useAuth();
  const devMode = useDevAccess((s) => s.enabled);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: Colors.background,
        }}
      >
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Dev bypass → straight to feed
  if (devMode) {
    return <Redirect href="/(app)/feed" />;
  }

  // Not authenticated → landing page
  if (!user) {
    return <Redirect href="/(auth)/landing" />;
  }

  // Authenticated but onboarding not complete
  if (!profile?.onboarding_complete) {
    return <Redirect href="/(onboarding)" />;
  }

  // Fully set up → feed
  return <Redirect href="/(app)/feed" />;
}
