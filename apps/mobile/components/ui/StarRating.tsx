import { View, Text } from "react-native";
import { useTheme } from "../../contexts/ThemeProvider";

interface StarRatingProps {
  rating: number; // 0-5
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const STAR_SIZES: Record<"sm" | "md" | "lg", number> = {
  sm: 16,
  md: 24,
  lg: 32,
};

const LABEL_FONT_SIZES: Record<"sm" | "md" | "lg", number> = {
  sm: 11,
  md: 13,
  lg: 15,
};

const GOLD = "#FFD700";
const GREY = "#D1D5DB";

function getRatingLabel(rating: number): string {
  const rounded = Math.round(rating);
  switch (rounded) {
    case 5:
      return "Excellent";
    case 4:
      return "Very Good";
    case 3:
      return "Good";
    case 2:
      return "Poor";
    case 1:
      return "Poor";
    case 0:
    default:
      return "Non-Compliant";
  }
}

export function StarRating({ rating, size = "md", showLabel = false }: StarRatingProps) {
  const { colors } = useTheme();
  const starSize = STAR_SIZES[size];
  const labelFontSize = LABEL_FONT_SIZES[size];
  const clampedRating = Math.max(0, Math.min(5, Math.round(rating)));

  const stars: React.ReactNode[] = [];

  for (let i = 1; i <= 5; i++) {
    const isFilled = i <= clampedRating;
    stars.push(
      <Text
        key={i}
        style={{
          fontSize: starSize,
          color: isFilled ? GOLD : GREY,
          marginRight: i < 5 ? 2 : 0,
        }}
      >
        {isFilled ? "\u2605" : "\u2606"}
      </Text>,
    );
  }

  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {stars}
      {showLabel && (
        <Text
          style={{
            fontSize: labelFontSize,
            fontWeight: "600",
            color: colors.textSecondary,
            marginLeft: 8,
          }}
        >
          {getRatingLabel(clampedRating)}
        </Text>
      )}
    </View>
  );
}
