import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../../contexts/AuthProvider";
import { ToastProvider } from "../../contexts/ToastProvider";

export default function OnboardingLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/landing" />;
  }

  return (
    <ToastProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ToastProvider>
  );
}
