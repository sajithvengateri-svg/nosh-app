import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Colors } from "../../constants/colors";
import { lightTap } from "../../lib/haptics";
import { useNoshRunStore } from "../../lib/stores/noshRunStore";
import { usePantryStore } from "../../lib/stores/pantryStore";
import { usePersonalityStore } from "../../lib/stores/personalityStore";
import { getPersonalityBadge, getPersonalityEmoji } from "../../lib/engines/personalityEngine";
import type { RecipePersonalityTags } from "../../lib/engines/personalityEngine";

export interface RecipeCardData {
  id: string;
  title: string;
  description?: string;
  hero_image_url?: string;
  cuisine: string;
  vessel: string;
  total_time_minutes: number;
  serves: number;
  cost_per_serve?: number;
  spice_level: number;
  chef_name?: string;
  pantry_match?: { have: number; total: number };
  avg_rating?: number;
  cooked_count?: number;
  personality_tags?: RecipePersonalityTags;
}

const VESSEL_EMOJI: Record<string, string> = {
  pot: "🍲",
  pan: "🍳",
  tray: "🫕",
  bowl: "🥗",
  slow_cooker: "🥘",
  appliance: "⚡",
};

export function RecipeCard({ recipe, onOpenOverlay, disableNavigation }: { recipe: RecipeCardData; onOpenOverlay?: (key: string) => void; disableNavigation?: boolean }) {
  const startRun = useNoshRunStore((s) => s.startRun);
  const pantryItems = usePantryStore((s) => s.items);
  const personalityType = usePersonalityStore((s) => s.profile?.primary);

  // Personality badge
  const tags = recipe.personality_tags;
  const personalityFit =
    personalityType && tags?.[personalityType]?.eligible
      ? `${getPersonalityEmoji(personalityType)} ${getPersonalityBadge(personalityType)}`
      : null;

  const handleCookThis = () => {
    lightTap();
    router.push(`/(app)/cook-mode/${recipe.id}`);
  };

  const handleShopThis = () => {
    lightTap();
    startRun(
      {
        id: recipe.id,
        title: recipe.title,
        cuisine: recipe.cuisine,
        ingredients: [],
      } as any,
      pantryItems,
    );
    onOpenOverlay?.("nosh_run");
  };

  const handleCardPress = () => {
    if (disableNavigation) return;
    lightTap();
    router.push(`/(app)/recipe/${recipe.id}`);
  };

  const needsShopping = recipe.pantry_match
    ? recipe.pantry_match.have < recipe.pantry_match.total
    : true;

  return (
    <Pressable onPress={handleCardPress}>
      <View
        style={{
          backgroundColor: Colors.card,
          borderRadius: 16,
          marginHorizontal: 16,
          marginBottom: 12,
          overflow: "hidden",
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        {/* Hero image */}
        {recipe.hero_image_url ? (
          <Image
            source={{ uri: recipe.hero_image_url }}
            style={{ width: "100%", height: 220 }}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <View
            style={{
              height: 220,
              backgroundColor: "#E8E2DA",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 56 }}>
              {VESSEL_EMOJI[recipe.vessel] ?? "🍽️"}
            </Text>
          </View>
        )}

        {/* Personality fit badge */}
        {personalityFit && (
          <View
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              backgroundColor: "rgba(255,255,255,0.92)",
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 20,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: Colors.text.primary,
              }}
            >
              {personalityFit}
            </Text>
          </View>
        )}

        {/* Pantry match badge */}
        {recipe.pantry_match && (
          <View
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              backgroundColor:
                recipe.pantry_match.have === recipe.pantry_match.total
                  ? Colors.success
                  : "rgba(255,255,255,0.92)",
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 20,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color:
                  recipe.pantry_match.have === recipe.pantry_match.total
                    ? "#FFF"
                    : Colors.text.primary,
              }}
            >
              {recipe.pantry_match.have === recipe.pantry_match.total
                ? "✨ All ingredients!"
                : `✨ ${recipe.pantry_match.have}/${recipe.pantry_match.total} ingredients`}
            </Text>
          </View>
        )}

        <View style={{ padding: 16 }}>
          {/* Chef attribution */}
          {recipe.chef_name && (
            <Text
              style={{
                fontSize: 12,
                color: Colors.primary,
                fontWeight: "600",
                marginBottom: 4,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {recipe.chef_name}
            </Text>
          )}

          {/* Title */}
          <Text
            style={{
              fontSize: 22,
              fontWeight: "700",
              color: Colors.secondary,
              marginBottom: 6,
              lineHeight: 28,
            }}
          >
            {recipe.title}
          </Text>

          {/* Description */}
          {recipe.description && (
            <Text
              style={{
                fontSize: 14,
                color: Colors.text.secondary,
                marginBottom: 10,
                lineHeight: 20,
              }}
              numberOfLines={2}
            >
              {recipe.description}
            </Text>
          )}

          {/* Stats row */}
          <View
            style={{
              flexDirection: "row",
              gap: 16,
              marginBottom: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 13, color: Colors.text.secondary }}>
              {recipe.cuisine}
            </Text>
            <Text style={{ fontSize: 13, color: Colors.text.secondary }}>
              {recipe.total_time_minutes} min
            </Text>
            <Text style={{ fontSize: 13, color: Colors.text.secondary }}>
              1 {recipe.vessel.replace("_", " ")}
            </Text>
            {recipe.cost_per_serve && (
              <Text style={{ fontSize: 13, color: Colors.text.secondary }}>
                ${recipe.cost_per_serve.toFixed(2)}/serve
              </Text>
            )}
            {recipe.spice_level > 0 && (
              <Text style={{ fontSize: 13 }}>
                {"🌶️".repeat(recipe.spice_level)}
              </Text>
            )}
          </View>

          {/* Rating + cooked count */}
          {(recipe.avg_rating || recipe.cooked_count) && (
            <View
              style={{
                flexDirection: "row",
                gap: 12,
                marginBottom: 14,
              }}
            >
              {recipe.avg_rating ? (
                <Text style={{ fontSize: 13, color: Colors.text.secondary }}>
                  {"⭐".repeat(Math.round(recipe.avg_rating))}{" "}
                  {recipe.avg_rating.toFixed(1)}
                </Text>
              ) : null}
              {recipe.cooked_count ? (
                <Text style={{ fontSize: 13, color: Colors.text.secondary }}>
                  Cooked {recipe.cooked_count} times
                </Text>
              ) : null}
            </View>
          )}

          {/* Cook This CTA */}
          <Pressable
            onPress={handleCookThis}
            style={{
              backgroundColor: Colors.primary,
              paddingVertical: 14,
              borderRadius: 12,
            }}
          >
            <Text
              style={{
                color: "#FFF",
                fontSize: 16,
                fontWeight: "700",
                textAlign: "center",
                letterSpacing: 0.3,
              }}
            >
              Cook This
            </Text>
          </Pressable>

          {/* Shop This CTA — only when missing ingredients */}
          {needsShopping && (
            <Pressable
              onPress={handleShopThis}
              style={{
                borderWidth: 1.5,
                borderColor: Colors.primary,
                paddingVertical: 12,
                borderRadius: 12,
                marginTop: 8,
              }}
            >
              <Text
                style={{
                  color: Colors.primary,
                  fontSize: 15,
                  fontWeight: "600",
                  textAlign: "center",
                  letterSpacing: 0.3,
                }}
              >
                Shop This
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
}
