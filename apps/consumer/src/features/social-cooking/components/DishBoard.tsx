import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { Colors } from "../../../constants/colors";
import { lightTap, selectionTap } from "../../../lib/haptics";
import { useSocialCookingStore } from "../../../lib/stores/socialCookingStore";
import type { SocialDish } from "../../../lib/stores/socialCookingStore";
import { getDishCategories, getDishCategoryIcon } from "../../../lib/utils/socialCookingUtils";
import { StatusBadge } from "./StatusBadge";
import { useAuth } from "../../../contexts/AuthProvider";

const DISH_STATUS_COLORS: Record<string, string> = {
  open: Colors.text.muted,
  claimed: Colors.alert,
  prepping: Colors.primary,
  ready: Colors.success,
  dropped: "#E53E3E",
};

export function DishBoard() {
  const activeEvent = useSocialCookingStore((s) => s.activeEvent);
  const dishes = useSocialCookingStore((s) => s.dishes);
  const addDish = useSocialCookingStore((s) => s.addDish);
  const claimDish = useSocialCookingStore((s) => s.claimDish);
  const unclaimDish = useSocialCookingStore((s) => s.unclaimDish);
  const setView = useSocialCookingStore((s) => s.setView);
  const { profile } = useAuth();

  const [newDishInputs, setNewDishInputs] = useState<Record<string, string>>({});

  if (!activeEvent) return null;

  const isHost = activeEvent.host_user_id === profile?.id;
  const categories = getDishCategories();

  const handleAddDish = (category: string) => {
    const name = newDishInputs[category]?.trim();
    if (!name) return;
    lightTap();
    addDish(category, name);
    setNewDishInputs((prev) => ({ ...prev, [category]: "" }));
  };

  const handleClaim = (dish: SocialDish) => {
    selectionTap();
    claimDish(dish.id, profile?.display_name ?? "Someone");
  };

  const handleUnclaim = (dish: SocialDish) => {
    lightTap();
    unclaimDish(dish.id);
  };

  const handleDone = () => {
    lightTap();
    setView("dashboard");
  };

  const claimedCount = dishes.filter((d) => d.status !== "open").length;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 24 }}>
      {/* Summary */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontSize: 14, color: Colors.text.secondary }}>
          {claimedCount}/{dishes.length} dishes claimed
        </Text>
        {dishes.length > 0 && (
          <StatusBadge status={activeEvent.status} />
        )}
      </View>

      {categories.map((category) => {
        const categoryDishes = dishes.filter(
          (d) => d.dish_category.toLowerCase() === category.toLowerCase(),
        );

        return (
          <View key={category}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}>
              {(() => {
                const CatIcon = getDishCategoryIcon(category);
                return <CatIcon size={16} color={Colors.secondary} strokeWidth={1.5} />;
              })()}
              <Text style={{ fontSize: 16, fontWeight: "600", color: Colors.secondary }}>
                {category}
              </Text>
            </View>

            {categoryDishes.map((dish) => (
              <View
                key={dish.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: Colors.divider,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "500", color: Colors.text.primary }}>
                    {dish.dish_name}
                  </Text>
                  {dish.assigned_to_name && (
                    <Text style={{ fontSize: 13, color: Colors.text.secondary, marginTop: 2 }}>
                      {dish.assigned_to_name}
                    </Text>
                  )}
                </View>
                <View
                  style={{
                    backgroundColor: DISH_STATUS_COLORS[dish.status] + "18",
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 12,
                    marginRight: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "600",
                      color: DISH_STATUS_COLORS[dish.status],
                      textTransform: "capitalize",
                    }}
                  >
                    {dish.status}
                  </Text>
                </View>
                {dish.status === "open" && (
                  <Pressable onPress={() => handleClaim(dish)}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.primary }}>
                      I'll bring this
                    </Text>
                  </Pressable>
                )}
                {dish.status === "claimed" &&
                  dish.assigned_to_user_id === profile?.id && (
                    <Pressable onPress={() => handleUnclaim(dish)}>
                      <Text style={{ fontSize: 13, color: Colors.text.muted }}>
                        Unclaim
                      </Text>
                    </Pressable>
                  )}
              </View>
            ))}

            {/* Add dish (host only) */}
            {isHost && (
              <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
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
                  placeholder={`Add a ${category.toLowerCase()}...`}
                  placeholderTextColor={Colors.text.muted}
                  value={newDishInputs[category] ?? ""}
                  onChangeText={(v) =>
                    setNewDishInputs((prev) => ({ ...prev, [category]: v }))
                  }
                  onSubmitEditing={() => handleAddDish(category)}
                />
                {newDishInputs[category]?.trim() && (
                  <Pressable
                    onPress={() => handleAddDish(category)}
                    style={{
                      backgroundColor: Colors.secondary,
                      paddingHorizontal: 14,
                      borderRadius: 10,
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: "#FFF", fontWeight: "600" }}>Add</Text>
                  </Pressable>
                )}
              </View>
            )}

            {categoryDishes.length === 0 && !isHost && (
              <Text style={{ color: Colors.text.muted, fontSize: 13, paddingVertical: 8 }}>
                No dishes yet — host will add soon
              </Text>
            )}
          </View>
        );
      })}

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
          {isHost ? "View Dashboard" : "Done"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
