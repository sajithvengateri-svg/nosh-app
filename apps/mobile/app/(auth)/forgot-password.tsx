import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { VARIANT_REGISTRY } from "@queitos/shared";
import type { AppVariant } from "@queitos/shared";

const chefLogo = require("../../assets/icon.png");
const APP_VARIANT = (Constants.expoConfig?.extra?.appVariant ?? "chefos") as AppVariant;
const _b = VARIANT_REGISTRY[APP_VARIANT].brand;

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const v = _b;

  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    setLoading(false);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: v.bg }}>
      <Pressable
        onPress={() => router.back()}
        style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 }}
      >
        <Text style={{ fontSize: 14, color: v.accent }}>{"← Back"}</Text>
      </Pressable>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, justifyContent: "center", padding: 24 }}
      >
        <Image
          source={chefLogo}
          style={{ width: 56, height: 56, borderRadius: 14, alignSelf: "center", marginBottom: 20 }}
          contentFit="contain"
        />

        {sent ? (
          <View style={{ alignItems: "center", gap: 12 }}>
            <Text style={{ fontSize: 24, fontWeight: "700", color: v.textColor, textAlign: "center" }}>
              Check Your Email
            </Text>
            <Text style={{ fontSize: 15, color: v.subtextColor, textAlign: "center", lineHeight: 22 }}>
              We sent a password reset link to{"\n"}
              <Text style={{ fontWeight: "600", color: v.textColor }}>{email}</Text>
            </Text>
            <Pressable
              onPress={() => router.replace("/(auth)/login")}
              style={({ pressed }) => ({
                backgroundColor: v.accent,
                paddingVertical: 14,
                paddingHorizontal: 32,
                borderRadius: 12,
                marginTop: 16,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 16 }}>Back to Sign In</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "700",
                marginBottom: 8,
                textAlign: "center",
                color: v.textColor,
              }}
            >
              Reset Password
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: v.subtextColor,
                marginBottom: 32,
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              Enter your email and we'll send you a link to reset your password.
            </Text>

            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoFocus
              placeholderTextColor={v.subtextColor}
              style={{
                borderWidth: 1,
                borderColor: v.inputBorder,
                borderRadius: 12,
                padding: 16,
                fontSize: 16,
                marginBottom: 20,
                backgroundColor: v.inputBg,
                color: v.textColor,
              }}
            />

            <Pressable
              onPress={handleReset}
              disabled={loading}
              style={({ pressed }) => ({
                backgroundColor: v.accent,
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: "center",
                opacity: loading ? 0.6 : pressed ? 0.85 : 1,
              })}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 16 }}>
                  Send Reset Link
                </Text>
              )}
            </Pressable>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
