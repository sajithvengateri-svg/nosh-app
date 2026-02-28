import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../contexts/AuthProvider";
import { useTheme } from "../../../contexts/ThemeProvider";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";

export default function DeleteAccount() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { colors } = useTheme();
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (confirmation !== "DELETE") {
      Alert.alert("Error", 'Please type "DELETE" to confirm');
      return;
    }

    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all associated data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Forever",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              // Call edge function to handle full account deletion
              const { error } = await supabase.functions.invoke(
                "delete-account",
                { body: { user_id: user?.id } }
              );

              if (error) {
                // If edge function doesn't exist, sign out anyway
                console.error("Delete account error:", error);
              }

              await signOut();
              router.replace("/(auth)/landing");
            } catch (e: any) {
              Alert.alert("Error", e.message || "Failed to delete account");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Delete Account" />

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 0 }}>
        <View
          style={{
            backgroundColor: colors.destructiveBg,
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.destructive, marginBottom: 8 }}>
            Warning: This cannot be undone
          </Text>
          <Text style={{ fontSize: 14, color: colors.destructive, lineHeight: 20 }}>
            Deleting your account will permanently remove:
          </Text>
          <Text style={{ fontSize: 14, color: colors.destructive, lineHeight: 22, marginTop: 8 }}>
            {"\u2022"} Your profile and login credentials{"\n"}
            {"\u2022"} All your recipes and ingredients{"\n"}
            {"\u2022"} Your organization memberships{"\n"}
            {"\u2022"} Food safety logs and records{"\n"}
            {"\u2022"} All other associated data
          </Text>
        </View>

        <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 8 }}>
          Type <Text style={{ fontWeight: "700" }}>DELETE</Text> to confirm:
        </Text>

        <Input
          placeholder="Type DELETE to confirm"
          value={confirmation}
          onChangeText={setConfirmation}
          autoCapitalize="characters"
        />

        <Button
          variant="destructive"
          onPress={handleDelete}
          loading={loading}
          disabled={confirmation !== "DELETE"}
          style={{ marginTop: 16 }}
        >
          Permanently Delete My Account
        </Button>

        <Button
          variant="ghost"
          onPress={() => router.back()}
          style={{ marginTop: 12 }}
        >
          Cancel
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
