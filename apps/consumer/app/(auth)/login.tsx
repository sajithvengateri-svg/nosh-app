import { useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/contexts/AuthProvider";
import { Colors } from "../../src/constants/colors";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      Alert.alert("Login failed", error.message);
    }
    // Auth state change will redirect via index.tsx
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Colors.background }}
    >
      <View style={{ flex: 1, padding: 32, justifyContent: "center" }}>
        <Text
          style={{
            fontSize: 28,
            fontWeight: "700",
            color: Colors.secondary,
            marginBottom: 32,
          }}
        >
          Welcome back
        </Text>

        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={{
            borderWidth: 1,
            borderColor: Colors.border,
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            fontSize: 16,
            backgroundColor: Colors.card,
          }}
        />

        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{
            borderWidth: 1,
            borderColor: Colors.border,
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            fontSize: 16,
            backgroundColor: Colors.card,
          }}
        />

        <Pressable
          onPress={handleLogin}
          disabled={loading}
          style={{
            backgroundColor: Colors.primary,
            paddingVertical: 16,
            borderRadius: 12,
            opacity: loading ? 0.6 : 1,
          }}
        >
          <Text
            style={{
              color: "#FFF",
              fontSize: 18,
              fontWeight: "600",
              textAlign: "center",
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          style={{ marginTop: 16 }}
        >
          <Text
            style={{
              color: Colors.text.secondary,
              fontSize: 14,
              textAlign: "center",
            }}
          >
            Back
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
