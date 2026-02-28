import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { Wine } from "lucide-react-native";
import { Colors } from "../../constants/colors";
import { lightTap } from "../../lib/haptics";

export interface WinePairingCardData {
  id: string;
  wine_name: string;
  varietal: string;
  region?: string;
  producer?: string;
  image_url?: string;
  pairing_note: string;
  recipe_title?: string;
  price_range?: string;
  from_cellar?: boolean;
}

// Rich burgundy pastel tones
const WINE_BG = "#F8F2F4";
const WINE_ACCENT = "#8C3A5A";
const WINE_BORDER = "rgba(140, 58, 90, 0.18)";
const WINE_IMAGE_BG = "#F2E8EC";

export function WinePairingCard({ wine }: { wine: WinePairingCardData }) {
  return (
    <Pressable onPress={() => lightTap()}>
      <View
        style={{
          backgroundColor: WINE_BG,
          borderRadius: 24,
          marginHorizontal: 0,
          marginBottom: 0,
          overflow: "hidden",
          borderWidth: 1.5,
          borderColor: WINE_BORDER,
          shadowColor: "rgba(140, 58, 90, 0.10)",
          shadowOpacity: 1,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 12,
          elevation: 3,
        }}
      >
        <View style={{ flexDirection: "row" }}>
          {/* Wine image */}
          <View
            style={{
              width: 100,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: WINE_IMAGE_BG,
            }}
          >
            {wine.image_url ? (
              <Image
                source={{ uri: wine.image_url }}
                style={{ width: 60, height: 120 }}
                contentFit="contain"
              />
            ) : (
              <Wine size={48} color={WINE_ACCENT} strokeWidth={1.5} />
            )}
          </View>

          <View style={{ flex: 1, padding: 16 }}>
            {/* Type pill */}
            <View
              style={{
                alignSelf: "flex-start",
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                backgroundColor: "rgba(140, 58, 90, 0.08)",
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "rgba(140, 58, 90, 0.12)",
                marginBottom: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  color: WINE_ACCENT,
                  textTransform: "uppercase",
                  fontWeight: "700",
                  letterSpacing: 0.8,
                }}
              >
                {wine.from_cellar ? "From Your Cellar" : "Wine Pairing"}
              </Text>
            </View>

            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: Colors.text.primary,
                marginBottom: 2,
              }}
            >
              {wine.wine_name}
            </Text>

            <Text
              style={{
                fontSize: 14,
                color: Colors.text.secondary,
                marginBottom: 8,
              }}
            >
              {wine.varietal}
              {wine.region ? ` · ${wine.region}` : ""}
            </Text>

            <Text
              style={{
                fontSize: 13,
                color: Colors.text.secondary,
                lineHeight: 18,
                fontStyle: "italic",
              }}
            >
              {wine.pairing_note}
            </Text>

            {wine.price_range && (
              <Text
                style={{
                  fontSize: 12,
                  color: Colors.text.muted,
                  marginTop: 8,
                }}
              >
                {wine.price_range}
              </Text>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}
