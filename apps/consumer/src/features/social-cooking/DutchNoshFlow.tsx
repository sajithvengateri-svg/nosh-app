import { View, Text, Pressable } from "react-native";
import { Colors } from "../../constants/colors";
import { lightTap } from "../../lib/haptics";
import { useSocialCookingStore } from "../../lib/stores/socialCookingStore";
import { EventSetupForm } from "./components/EventSetupForm";
import { GuestManager } from "./components/GuestManager";
import { DishBoard } from "./components/DishBoard";
import { EventDashboard } from "./EventDashboard";

const STEPS = ["Setup", "Guests", "Dishes", "Dashboard"];

export function DutchNoshFlow() {
  const currentView = useSocialCookingStore((s) => s.currentView);
  const setView = useSocialCookingStore((s) => s.setView);

  const stepIndex =
    currentView === "setup" ? 0 :
    currentView === "invite" ? 1 :
    currentView === "dish_board" ? 2 : 3;

  const handleBack = () => {
    lightTap();
    if (currentView === "invite") setView("setup");
    else if (currentView === "dish_board") setView("invite");
    else if (currentView === "dashboard") setView("dish_board");
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
      {currentView === "setup" && <EventSetupForm eventType="dutch_nosh" />}
      {currentView === "invite" && <GuestManager />}
      {currentView === "dish_board" && <DishBoard />}
      {currentView === "dashboard" && <EventDashboard />}
    </View>
  );
}
