import { useState } from "react";
import { View, Text, Pressable, TextInput, ScrollView } from "react-native";
import { Colors } from "../../constants/colors";
import { lightTap } from "../../lib/haptics";
import { useSocialCookingStore } from "../../lib/stores/socialCookingStore";
import { EventSetupForm } from "./components/EventSetupForm";
import { GuestManager } from "./components/GuestManager";
import { RoleAssigner } from "./components/RoleAssigner";
import { EventDashboard } from "./EventDashboard";

const STEPS = ["Setup", "Guests", "Menu", "Roles", "Dashboard"];

function MenuPicker() {
  const activeEvent = useSocialCookingStore((s) => s.activeEvent);
  const setMenuOption = useSocialCookingStore((s) => s.setMenuOption);
  const bossDecides = useSocialCookingStore((s) => s.bossDecides);
  const setView = useSocialCookingStore((s) => s.setView);

  const [menuItems, setMenuItems] = useState<string[]>([""]);

  if (!activeEvent) return null;

  const isBossMode = !!activeEvent.boss_user_id;

  const handleAddItem = () => {
    setMenuItems([...menuItems, ""]);
  };

  const handleUpdateItem = (index: number, value: string) => {
    const updated = [...menuItems];
    updated[index] = value;
    setMenuItems(updated);
  };

  const handleConfirmMenu = () => {
    lightTap();
    const items = menuItems.filter((m) => m.trim());
    if (items.length === 0) return;
    const menu = { items, confirmedAt: new Date().toISOString() };

    if (isBossMode) {
      bossDecides(menu);
    } else {
      setMenuOption(menu);
    }
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text style={{ fontSize: 16, fontWeight: "600", color: Colors.secondary }}>
        What's on the menu?
      </Text>
      <Text style={{ fontSize: 14, color: Colors.text.secondary }}>
        Add dishes for the party. Everyone will see the final menu.
      </Text>

      {menuItems.map((item, index) => (
        <View key={index} style={{ flexDirection: "row", gap: 8 }}>
          <TextInput
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: Colors.border,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 15,
              color: Colors.text.primary,
            }}
            placeholder={`Dish ${index + 1}`}
            placeholderTextColor={Colors.text.muted}
            value={item}
            onChangeText={(v) => handleUpdateItem(index, v)}
          />
          {index === menuItems.length - 1 && (
            <Pressable
              onPress={handleAddItem}
              style={{
                backgroundColor: Colors.background,
                borderWidth: 1,
                borderColor: Colors.border,
                width: 44,
                borderRadius: 10,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 20, color: Colors.text.secondary }}>+</Text>
            </Pressable>
          )}
        </View>
      ))}

      <Pressable
        onPress={handleConfirmMenu}
        disabled={!menuItems.some((m) => m.trim())}
        style={{
          backgroundColor: menuItems.some((m) => m.trim()) ? Colors.primary : Colors.border,
          paddingVertical: 14,
          borderRadius: 12,
          marginTop: 8,
        }}
      >
        <Text style={{ color: "#FFF", fontSize: 16, fontWeight: "700", textAlign: "center" }}>
          {isBossMode ? "Boss Says: This Menu!" : "Lock This Menu"}
        </Text>
      </Pressable>

      <Pressable onPress={() => setView("role_assign")} style={{ paddingVertical: 10 }}>
        <Text style={{ color: Colors.text.secondary, textAlign: "center", fontSize: 14 }}>
          Skip to roles →
        </Text>
      </Pressable>
    </ScrollView>
  );
}

export function PartyModeFlow() {
  const currentView = useSocialCookingStore((s) => s.currentView);
  const setView = useSocialCookingStore((s) => s.setView);

  const stepIndex =
    currentView === "setup" ? 0 :
    currentView === "invite" ? 1 :
    currentView === "menu_pick" ? 2 :
    currentView === "role_assign" ? 3 : 4;

  const handleBack = () => {
    lightTap();
    if (currentView === "invite") setView("setup");
    else if (currentView === "menu_pick") setView("invite");
    else if (currentView === "role_assign") setView("menu_pick");
    else if (currentView === "dashboard") setView("role_assign");
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Progress dots */}
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, paddingVertical: 12 }}>
        {STEPS.map((step, i) => (
          <View
            key={step}
            style={{
              width: i === stepIndex ? 24 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: i <= stepIndex ? Colors.primary : Colors.border,
            }}
          />
        ))}
      </View>

      {/* Back button */}
      {stepIndex > 0 && currentView !== "dashboard" && (
        <Pressable onPress={handleBack} style={{ paddingHorizontal: 16, paddingBottom: 4 }}>
          <Text style={{ color: Colors.text.secondary, fontSize: 14 }}>
            ← Back
          </Text>
        </Pressable>
      )}

      {/* Content */}
      {currentView === "setup" && <EventSetupForm eventType="party" />}
      {currentView === "invite" && <GuestManager />}
      {currentView === "menu_pick" && <MenuPicker />}
      {currentView === "role_assign" && <RoleAssigner />}
      {currentView === "dashboard" && <EventDashboard />}
    </View>
  );
}
