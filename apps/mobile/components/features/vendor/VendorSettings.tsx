import { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LogOut, X, Plus, CreditCard, FileText, ChevronRight } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../../contexts/ThemeProvider";
import { useVendorAuth } from "../../../contexts/VendorAuthProvider";
import { useUpdateVendorProfile } from "../../../hooks/useVendorProfile";
import { DEMAND_CATEGORIES } from "@queitos/shared";
import { ScreenHeader } from "../../ui/ScreenHeader";
import { lightTap } from "../../../lib/haptics";

export function VendorSettings() {
  const { colors } = useTheme();
  const router = useRouter();
  const { vendorProfile, signOut } = useVendorAuth();
  const updateProfile = useUpdateVendorProfile();

  const [businessName, setBusinessName] = useState(vendorProfile?.business_name ?? "");
  const [abn, setAbn] = useState(vendorProfile?.abn ?? "");
  const [contactName, setContactName] = useState(vendorProfile?.contact_name ?? "");
  const [contactEmail, setContactEmail] = useState(vendorProfile?.contact_email ?? "");
  const [contactPhone, setContactPhone] = useState(vendorProfile?.contact_phone ?? "");
  const [address, setAddress] = useState(vendorProfile?.address ?? "");
  const [postcode, setPostcode] = useState(vendorProfile?.postcode ?? "");
  const [deliveryAreas, setDeliveryAreas] = useState<string[]>(vendorProfile?.delivery_areas ?? []);
  const [categories, setCategories] = useState<string[]>(vendorProfile?.categories ?? []);
  const [newPostcode, setNewPostcode] = useState("");

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        business_name: businessName,
        abn: abn || null,
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone || null,
        address: address || null,
        postcode: postcode || null,
        delivery_areas: deliveryAreas,
        categories,
      });
      Alert.alert("Saved", "Profile updated successfully");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => signOut(),
      },
    ]);
  };

  const inputStyle = {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 14,
    fontSize: 15,
    marginBottom: 16,
    backgroundColor: colors.inputBg,
    color: colors.text,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <ScreenHeader title="Settings" showBack={false} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        {/* Business Info */}
        <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 12 }}>
          Business Info
        </Text>

        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 }}>
          Business Name
        </Text>
        <TextInput value={businessName} onChangeText={setBusinessName} style={inputStyle} placeholderTextColor={colors.textMuted} />

        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 }}>
          ABN
        </Text>
        <TextInput value={abn} onChangeText={setAbn} style={inputStyle} placeholder="Optional" placeholderTextColor={colors.textMuted} />

        {/* Contact */}
        <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginTop: 8, marginBottom: 12 }}>
          Contact Details
        </Text>

        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 }}>
          Contact Name
        </Text>
        <TextInput value={contactName} onChangeText={setContactName} style={inputStyle} placeholderTextColor={colors.textMuted} />

        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 }}>
          Email
        </Text>
        <TextInput
          value={contactEmail}
          onChangeText={setContactEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={inputStyle}
          placeholderTextColor={colors.textMuted}
        />

        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 }}>
          Phone
        </Text>
        <TextInput
          value={contactPhone}
          onChangeText={setContactPhone}
          keyboardType="phone-pad"
          style={inputStyle}
          placeholder="Optional"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 }}>
          Address
        </Text>
        <TextInput value={address} onChangeText={setAddress} style={inputStyle} placeholder="Optional" placeholderTextColor={colors.textMuted} />

        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 }}>
          Postcode
        </Text>
        <TextInput value={postcode} onChangeText={setPostcode} keyboardType="numeric" style={inputStyle} placeholderTextColor={colors.textMuted} />

        {/* Delivery Areas */}
        <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginTop: 8, marginBottom: 12 }}>
          Delivery Areas
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {deliveryAreas.map((area) => (
            <View
              key={area}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingLeft: 12,
                paddingRight: 6,
                paddingVertical: 6,
                borderRadius: 9999,
                backgroundColor: colors.surface,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>{area}</Text>
              <Pressable
                onPress={() => {
                  lightTap();
                  setDeliveryAreas((prev) => prev.filter((a) => a !== area));
                }}
                style={{ padding: 2 }}
              >
                <X size={14} color={colors.textMuted} strokeWidth={2} />
              </Pressable>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
          <TextInput
            value={newPostcode}
            onChangeText={setNewPostcode}
            placeholder="Add postcode"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            style={{ ...inputStyle, flex: 1, marginBottom: 0 }}
          />
          <Pressable
            onPress={() => {
              if (newPostcode.trim() && !deliveryAreas.includes(newPostcode.trim())) {
                lightTap();
                setDeliveryAreas((prev) => [...prev, newPostcode.trim()]);
                setNewPostcode("");
              }
            }}
            style={{
              width: 48,
              height: 48,
              borderRadius: 8,
              backgroundColor: colors.accent,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Plus size={20} color="#FFF" strokeWidth={2} />
          </Pressable>
        </View>

        {/* Categories */}
        <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginTop: 8, marginBottom: 12 }}>
          Categories Supplied
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
          {DEMAND_CATEGORIES.map((cat) => {
            const selected = categories.includes(cat);
            return (
              <Pressable
                key={cat}
                onPress={() => {
                  lightTap();
                  setCategories((prev) =>
                    selected ? prev.filter((c) => c !== cat) : [...prev, cat]
                  );
                }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 9999,
                  backgroundColor: selected ? colors.accent : colors.surface,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: selected ? "#FFF" : colors.textSecondary,
                  }}
                >
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Save */}
        <Pressable
          onPress={handleSave}
          disabled={updateProfile.isPending}
          style={({ pressed }) => ({
            backgroundColor: colors.accent,
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: "center",
            opacity: updateProfile.isPending ? 0.6 : pressed ? 0.85 : 1,
            marginBottom: 16,
          })}
        >
          <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 16 }}>
            {updateProfile.isPending ? "Saving..." : "Save Changes"}
          </Text>
        </Pressable>

        {/* Billing */}
        <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginTop: 8, marginBottom: 12 }}>
          Billing
        </Text>
        <Pressable
          onPress={() => { lightTap(); router.push("/(app)/vendor/payment" as any); }}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: 16,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <CreditCard size={20} color={colors.textSecondary} strokeWidth={1.5} />
          <Text style={{ flex: 1, fontSize: 15, fontWeight: "600", color: colors.text, marginLeft: 12 }}>
            Payment Method
          </Text>
          <ChevronRight size={18} color={colors.textMuted} strokeWidth={1.5} />
        </Pressable>
        <Pressable
          onPress={() => { lightTap(); router.push("/(app)/vendor/invoices" as any); }}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <FileText size={20} color={colors.textSecondary} strokeWidth={1.5} />
          <Text style={{ flex: 1, fontSize: 15, fontWeight: "600", color: colors.text, marginLeft: 12 }}>
            Invoices
          </Text>
          <ChevronRight size={18} color={colors.textMuted} strokeWidth={1.5} />
        </Pressable>

        {/* Sign Out */}
        <Pressable
          onPress={handleSignOut}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            borderWidth: 1,
            borderColor: colors.destructive,
            borderRadius: 12,
            paddingVertical: 16,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <LogOut size={18} color={colors.destructive} strokeWidth={1.5} />
          <Text style={{ color: colors.destructive, fontWeight: "700", fontSize: 16 }}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
