import { useState } from "react";
import { View, Text, Pressable, ScrollView, TextInput } from "react-native";
import { X } from "lucide-react-native";
import { Colors } from "../../../constants/colors";
import { lightTap, selectionTap } from "../../../lib/haptics";
import { useSocialCookingStore } from "../../../lib/stores/socialCookingStore";
import type { SocialRole } from "../../../lib/stores/socialCookingStore";
import { getRoleSuggestions } from "../../../lib/utils/socialCookingUtils";

export function RoleAssigner() {
  const activeEvent = useSocialCookingStore((s) => s.activeEvent);
  const guests = useSocialCookingStore((s) => s.guests);
  const roles = useSocialCookingStore((s) => s.roles);
  const assignRole = useSocialCookingStore((s) => s.assignRole);
  const removeRole = useSocialCookingStore((s) => s.removeRole);
  const setView = useSocialCookingStore((s) => s.setView);

  const [customRole, setCustomRole] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);

  if (!activeEvent) return null;

  const suggestions = getRoleSuggestions();
  const assignedRoles = new Set(roles.map((r) => r.role_name));
  const guestNames = guests.map((g) => g.name);

  const handleAssignSuggested = (suggestion: { roleName: string; tasks: string[] }) => {
    if (!selectedPerson) return;
    selectionTap();
    assignRole(selectedPerson, suggestion.roleName, suggestion.tasks);
    setSelectedPerson(null);
  };

  const handleAssignCustom = () => {
    if (!selectedPerson || !customRole.trim()) return;
    lightTap();
    assignRole(selectedPerson, customRole.trim(), []);
    setCustomRole("");
    setSelectedPerson(null);
  };

  const handleDone = () => {
    lightTap();
    setView("dashboard");
  };

  const renderRole = (role: SocialRole) => (
    <View
      key={role.id}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.text.primary }}>
          {role.role_name}
        </Text>
        <Text style={{ fontSize: 13, color: Colors.text.secondary, marginTop: 2 }}>
          {role.person_name}
        </Text>
        {role.tasks.length > 0 && (
          <Text style={{ fontSize: 12, color: Colors.text.muted, marginTop: 2 }}>
            {role.tasks.join(" · ")}
          </Text>
        )}
      </View>
      <Pressable onPress={() => removeRole(role.id)}>
        <X size={18} color={Colors.text.muted} strokeWidth={1.5} />
      </Pressable>
    </View>
  );

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 20 }}>
      <Text style={{ fontSize: 14, color: Colors.text.secondary, textAlign: "center" }}>
        Assign cooking roles to your guests
      </Text>

      {/* Person picker */}
      <View>
        <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.text.primary, marginBottom: 8 }}>
          Who's cooking?
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {guestNames.map((name) => (
            <Pressable
              key={name}
              onPress={() => {
                selectionTap();
                setSelectedPerson(selectedPerson === name ? null : name);
              }}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: selectedPerson === name ? Colors.primary + "15" : Colors.background,
                borderWidth: 1,
                borderColor: selectedPerson === name ? Colors.primary : Colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: selectedPerson === name ? Colors.primary : Colors.text.secondary,
                  fontWeight: selectedPerson === name ? "600" : "400",
                }}
              >
                {name}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Suggested roles */}
      {selectedPerson && (
        <View>
          <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.text.primary, marginBottom: 8 }}>
            Pick a role for {selectedPerson}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {suggestions
              .filter((s) => !assignedRoles.has(s.roleName))
              .map((sug) => (
                <Pressable
                  key={sug.roleName}
                  onPress={() => handleAssignSuggested(sug)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: Colors.background,
                    borderWidth: 1,
                    borderColor: Colors.border,
                  }}
                >
                  <Text style={{ fontSize: 14, color: Colors.text.secondary }}>
                    {sug.roleName}
                  </Text>
                </Pressable>
              ))}
          </View>

          {/* Custom role */}
          <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
            <TextInput
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: Colors.border,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 8,
                fontSize: 14,
                color: Colors.text.primary,
              }}
              placeholder="Or type a custom role..."
              placeholderTextColor={Colors.text.muted}
              value={customRole}
              onChangeText={setCustomRole}
              onSubmitEditing={handleAssignCustom}
            />
            {customRole.trim() && (
              <Pressable
                onPress={handleAssignCustom}
                style={{
                  backgroundColor: Colors.secondary,
                  paddingHorizontal: 14,
                  borderRadius: 10,
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#FFF", fontWeight: "600" }}>Assign</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* Assigned roles */}
      {roles.length > 0 && (
        <View>
          <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.text.secondary, marginBottom: 8 }}>
            Assigned ({roles.length})
          </Text>
          {roles.map(renderRole)}
        </View>
      )}

      {/* Done CTA */}
      <Pressable
        onPress={handleDone}
        style={{
          backgroundColor: Colors.primary,
          paddingVertical: 14,
          borderRadius: 12,
          marginTop: 8,
        }}
      >
        <Text style={{ color: "#FFF", fontSize: 16, fontWeight: "700", textAlign: "center" }}>
          View Dashboard
        </Text>
      </Pressable>
    </ScrollView>
  );
}
