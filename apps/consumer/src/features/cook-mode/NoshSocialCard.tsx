import { forwardRef } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { Image } from "expo-image";
import ViewShot from "react-native-view-shot";
import { Star } from "lucide-react-native";
import { Colors } from "../../constants/colors";
import { Fonts } from "../../constants/typography";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 48;

interface NoshSocialCardProps {
  recipeTitle: string;
  chefName?: string;
  rating?: number;
  photoUrl?: string;
  heroImageUrl?: string;
  format?: "square" | "story";
}

export const NoshSocialCard = forwardRef<ViewShot, NoshSocialCardProps>(
  ({ recipeTitle, chefName, rating, photoUrl, heroImageUrl, format = "story" }, ref) => {
    const imageUri = photoUrl ?? heroImageUrl;
    const cardHeight = format === "square" ? CARD_WIDTH : CARD_WIDTH * (16 / 9);

    return (
      <ViewShot
        ref={ref}
        options={{ format: "png", quality: 1.0 }}
        style={[styles.card, { width: CARD_WIDTH, height: cardHeight }]}
      >
        {/* Photo area — top 60% */}
        <View style={styles.photoArea}>
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.photo}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.photo, styles.photoPlaceholder]}>
              <Text style={styles.placeholderEmoji}>🍽️</Text>
            </View>
          )}
        </View>

        {/* Info area — bottom 40% */}
        <View style={styles.infoArea}>
          {/* Accent line */}
          <View style={styles.accentLine} />

          <Text style={styles.recipeTitle} numberOfLines={2}>
            {recipeTitle}
          </Text>

          {chefName && (
            <Text style={styles.chefName}>by {chefName}</Text>
          )}

          {rating && rating > 0 && (
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={18}
                  color={s <= rating ? Colors.alert : Colors.divider}
                  strokeWidth={1.5}
                  fill={s <= rating ? Colors.alert : "none"}
                />
              ))}
            </View>
          )}

          <View style={styles.branding}>
            <Text style={styles.brandText}>Made with</Text>
            <Text style={styles.brandName}>Prep Mi</Text>
          </View>
        </View>
      </ViewShot>
    );
  }
);

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    backgroundColor: Colors.card,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  photoArea: {
    height: "60%",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  photoPlaceholder: {
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderEmoji: {
    fontSize: 64,
  },
  infoArea: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  accentLine: {
    width: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    marginBottom: 12,
  },
  recipeTitle: {
    fontSize: 22,
    fontFamily: Fonts.heading,
    fontWeight: "700",
    color: Colors.text.primary,
    marginBottom: 4,
  },
  chefName: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: "row",
    gap: 3,
    marginBottom: 12,
  },
  branding: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: "auto",
  },
  brandText: {
    fontSize: 12,
    color: Colors.text.muted,
  },
  brandName: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.primary,
    letterSpacing: 1,
  },
});
