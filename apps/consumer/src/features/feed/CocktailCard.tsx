import { View, Text, Pressable } from "react-native";
import { Martini, GlassWater } from "lucide-react-native";
import { Colors } from "../../constants/colors";
import { lightTap } from "../../lib/haptics";

export interface CocktailCardData {
  id: string;
  name: string;
  description?: string;
  ingredients: string[];
  is_mocktail: boolean;
  image_url?: string;
  pairing_note?: string;
  can_make?: boolean;
}

// Cool lavender pastel tones
const COCKTAIL_BG = "#F5F2F8";
const COCKTAIL_ACCENT = "#7B5EA7";
const COCKTAIL_BORDER = "rgba(123, 94, 167, 0.18)";

export function CocktailCard({ cocktail }: { cocktail: CocktailCardData }) {
  return (
    <Pressable onPress={() => lightTap()}>
      <View
        style={{
          backgroundColor: COCKTAIL_BG,
          borderRadius: 24,
          marginHorizontal: 0,
          marginBottom: 0,
          padding: 20,
          borderWidth: 1.5,
          borderColor: COCKTAIL_BORDER,
          shadowColor: "rgba(123, 94, 167, 0.10)",
          shadowOpacity: 1,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 12,
          elevation: 3,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
          {/* Type pill */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              backgroundColor: "rgba(123, 94, 167, 0.08)",
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: "rgba(123, 94, 167, 0.12)",
            }}
          >
            {cocktail.is_mocktail ? (
              <GlassWater size={13} color={COCKTAIL_ACCENT} strokeWidth={1.5} />
            ) : (
              <Martini size={13} color={COCKTAIL_ACCENT} strokeWidth={1.5} />
            )}
            <Text
              style={{
                fontSize: 10,
                color: COCKTAIL_ACCENT,
                textTransform: "uppercase",
                fontWeight: "700",
                letterSpacing: 0.8,
              }}
            >
              {cocktail.is_mocktail ? "Mocktail" : "Cocktail"}
            </Text>
          </View>

          {cocktail.can_make && (
            <View
              style={{
                backgroundColor: "rgba(91, 163, 122, 0.10)",
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "rgba(91, 163, 122, 0.18)",
                marginLeft: "auto",
              }}
            >
              <Text style={{ fontSize: 10, color: Colors.success, fontWeight: "700" }}>
                You can make this!
              </Text>
            </View>
          )}
        </View>

        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            color: Colors.text.primary,
            marginBottom: 6,
          }}
        >
          {cocktail.name}
        </Text>

        {cocktail.description && (
          <Text
            style={{
              fontSize: 14,
              color: Colors.text.secondary,
              lineHeight: 20,
              marginBottom: 8,
            }}
          >
            {cocktail.description}
          </Text>
        )}

        {/* Ingredient pills */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginBottom: cocktail.pairing_note ? 8 : 0 }}>
          {cocktail.ingredients.map((ing, i) => (
            <View
              key={i}
              style={{
                backgroundColor: "rgba(123, 94, 167, 0.06)",
                borderWidth: 1,
                borderColor: "rgba(123, 94, 167, 0.12)",
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 8,
              }}
            >
              <Text style={{ fontSize: 11, color: Colors.text.secondary, fontWeight: "500" }}>
                {ing}
              </Text>
            </View>
          ))}
        </View>

        {cocktail.pairing_note && (
          <Text
            style={{
              fontSize: 13,
              color: Colors.text.muted,
              fontStyle: "italic",
              marginTop: 4,
            }}
          >
            {cocktail.pairing_note}
          </Text>
        )}
      </View>
    </Pressable>
  );
}
