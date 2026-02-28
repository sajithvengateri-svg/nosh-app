import { Redirect, Stack, useRouter } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../../contexts/AuthProvider";
import { ToastProvider } from "../../contexts/ToastProvider";
import { ErrorBoundary } from "../../components/ErrorBoundary";

export default function AppLayout() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

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
      <ErrorBoundary onGoHome={() => router.replace("/(app)/(tabs)")}>
        <Stack screenOptions={{ headerShown: false }} />
      </ErrorBoundary>
    </ToastProvider>
  );
}
