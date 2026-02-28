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
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { SafeAreaView } from "react-native-safe-area-context";
import { Eye, EyeOff } from "lucide-react-native";
import { useVendorAuth } from "../../contexts/VendorAuthProvider";
import { VARIANT_REGISTRY } from "@queitos/shared";
import type { AppVariant } from "@queitos/shared";

const chefLogo = require("../../assets/icon.png");
const APP_VARIANT = (Constants.expoConfig?.extra?.appVariant ?? "vendor") as AppVariant;
const _b = VARIANT_REGISTRY[APP_VARIANT].brand;

export default function VendorAuth() {
  const router = useRouter();
  const { signIn, signUp, devEnter } = useVendorAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDev, setShowDev] = useState(false);
  const [tapCount, setTapCount] = useState(0);

  const v = _b;

  const handleLogoTap = () => {
    if (!__DEV__) return;
    const next = tapCount + 1;
    if (next >= 5) {
      setShowDev(true);
      setTapCount(0);
    } else {
      setTapCount(next);
      setTimeout(() => setTapCount(0), 3000);
    }
  };

  const handleSubmit = async () => {
    if (mode === "login") {
      if (!email || !password) {
        Alert.alert("Error", "Please fill in all fields");
        return;
      }
      setLoading(true);
      const { error } = await signIn(email.trim(), password);
      setLoading(false);
      if (error) {
        Alert.alert("Login Failed", error.message);
      } else {
        router.replace("/(app)/(tabs)/dashboard");
      }
    } else {
      if (!email || !password || !businessName || !contactName) {
        Alert.alert("Error", "Please fill in all fields");
        return;
      }
      setLoading(true);
      const { error } = await signUp(email.trim(), password, businessName, contactName);
      setLoading(false);
      if (error) {
        Alert.alert("Signup Failed", error.message);
      } else {
        Alert.alert(
          "Check Your Email",
          "We sent you a confirmation link. Please verify your email to continue.",
          [{ text: "OK", onPress: () => setMode("login") }]
        );
      }
    }
  };

  const inputStyle = {
    borderWidth: 1,
    borderColor: v.inputBorder,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    marginBottom: 12,
    backgroundColor: v.inputBg,
    color: v.textColor,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: v.bg }}>
      {showDev && (
        <View style={{ position: "absolute", top: 54, right: 16, zIndex: 999 }}>
          <Pressable
            onPress={() => {
              devEnter();
              setTimeout(() => router.replace("/(app)/(tabs)/dashboard"), 300);
            }}
            style={({ pressed }) => ({
              backgroundColor: pressed ? "#059669" : "#10B981",
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 8,
            })}
          >
            <Text style={{ fontSize: 13, fontWeight: "800", color: "#FFF" }}>SKIP AUTH</Text>
          </Pressable>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable onPress={handleLogoTap} style={{ alignSelf: "center" }}>
            <Image
              source={chefLogo}
              style={{ width: 56, height: 56, borderRadius: 14, marginBottom: 20 }}
              contentFit="contain"
            />
          </Pressable>

          <Text
            style={{
              fontSize: 28,
              fontWeight: "700",
              marginBottom: 6,
              textAlign: "center",
              color: v.textColor,
            }}
          >
            {mode === "login" ? v.loginTitle : v.signupTitle}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: v.subtextColor,
              marginBottom: 28,
              textAlign: "center",
            }}
          >
            {mode === "login"
              ? "Sign in to your vendor account"
              : v.signupSubtitle}
          </Text>

          {/* Segment control */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: v.inputBg,
              borderRadius: 12,
              padding: 4,
              marginBottom: 24,
            }}
          >
            {(["login", "signup"] as const).map((m) => (
              <Pressable
                key={m}
                onPress={() => setMode(m)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 10,
                  alignItems: "center",
                  backgroundColor: mode === m ? v.accent : "transparent",
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: mode === m ? "#FFF" : v.subtextColor,
                  }}
                >
                  {m === "login" ? "Sign In" : "Register"}
                </Text>
              </Pressable>
            ))}
          </View>

          {mode === "signup" && (
            <>
              <TextInput
                placeholder="Business Name"
                value={businessName}
                onChangeText={setBusinessName}
                placeholderTextColor={v.subtextColor}
                style={inputStyle}
              />
              <TextInput
                placeholder="Contact Name"
                value={contactName}
                onChangeText={setContactName}
                placeholderTextColor={v.subtextColor}
                style={inputStyle}
              />
            </>
          )}

          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor={v.subtextColor}
            style={inputStyle}
          />

          <View style={{ marginBottom: mode === "login" ? 12 : 24 }}>
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholderTextColor={v.subtextColor}
              style={{
                ...inputStyle,
                marginBottom: 0,
                paddingRight: 52,
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

          {mode === "login" && (
            <Pressable
              onPress={() => router.push("/(auth)/forgot-password")}
              style={{ alignSelf: "flex-end", marginBottom: 20 }}
            >
              <Text style={{ fontSize: 13, color: v.accent, fontWeight: "600" }}>
                Forgot Password?
              </Text>
            </Pressable>
          )}

          <Pressable
            onPress={handleSubmit}
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
                {mode === "login" ? "Sign In" : "Create Account"}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
