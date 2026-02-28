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
import { Eye, EyeOff } from "lucide-react-native";
import { useAuth } from "../../contexts/AuthProvider";
import { VARIANT_REGISTRY, getStream } from "@queitos/shared";
import type { AppVariant } from "@queitos/shared";

const chefLogo = require("../../assets/icon.png");
const APP_VARIANT = (Constants.expoConfig?.extra?.appVariant ?? "chefos") as AppVariant;
const _b = VARIANT_REGISTRY[APP_VARIANT].brand;
const _s = getStream(APP_VARIANT);

export default function Signup() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const v = { title: _b.signupTitle, subtitle: _b.signupSubtitle, storeMode: _s.storeMode, ..._b };

  const handleSignup = async () => {
    if (!email || !password || !fullName) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    const { error } = await signUp(email.trim(), password, fullName, v.storeMode);
    setLoading(false);

    if (error) {
      Alert.alert("Signup Failed", error.message);
    } else {
      Alert.alert(
        "Check Your Email",
        "We sent you a confirmation link. Please check your email to verify your account.",
        [{ text: "OK", onPress: () => router.replace("/(auth)/login") }]
      );
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: v.bg }}>
      {/* Back to landing */}
      <Pressable
        onPress={() => router.replace("/(auth)/landing")}
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

        <Text
          style={{
            fontSize: 28,
            fontWeight: "700",
            marginBottom: 8,
            textAlign: "center",
            color: v.textColor,
          }}
        >
          {v.title}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: v.subtextColor,
            marginBottom: 32,
            textAlign: "center",
          }}
        >
          {v.subtitle}
        </Text>

        <TextInput
          placeholder="Full Name"
          value={fullName}
          onChangeText={setFullName}
          placeholderTextColor={v.subtextColor}
          style={{
            borderWidth: 1,
            borderColor: v.inputBorder,
            borderRadius: 12,
            padding: 16,
            fontSize: 16,
            marginBottom: 12,
            backgroundColor: v.inputBg,
            color: v.textColor,
          }}
        />

        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor={v.subtextColor}
          style={{
            borderWidth: 1,
            borderColor: v.inputBorder,
            borderRadius: 12,
            padding: 16,
            fontSize: 16,
            marginBottom: 12,
            backgroundColor: v.inputBg,
            color: v.textColor,
          }}
        />

        <View style={{ marginBottom: 24 }}>
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholderTextColor={v.subtextColor}
            style={{
              borderWidth: 1,
              borderColor: v.inputBorder,
              borderRadius: 12,
              padding: 16,
              paddingRight: 52,
              fontSize: 16,
              backgroundColor: v.inputBg,
              color: v.textColor,
            }}
          />
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{
              position: "absolute",
              right: 14,
              top: 0,
              bottom: 0,
              justifyContent: "center",
            }}
          >
            {showPassword ? (
              <EyeOff size={20} color={v.subtextColor} strokeWidth={1.5} />
            ) : (
              <Eye size={20} color={v.subtextColor} strokeWidth={1.5} />
            )}
          </Pressable>
        </View>

        <Pressable
          onPress={handleSignup}
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
              Create Account
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => router.push("/(auth)/login")}
          style={{ marginTop: 16, alignItems: "center" }}
        >
          <Text style={{ color: v.subtextColor, fontSize: 14 }}>
            Already have an account? <Text style={{ color: v.accent, fontWeight: "600" }}>Sign In</Text>
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
