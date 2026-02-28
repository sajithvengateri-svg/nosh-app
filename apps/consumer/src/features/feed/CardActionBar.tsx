import { useRef, useState, useCallback } from "react";
import { View, Pressable, Animated, StyleSheet } from "react-native";
import { Heart, Send, Bookmark } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Glass } from "../../constants/colors";
import { lightTap, successNotification } from "../../lib/haptics";
import { useFavouritesStore } from "../../lib/stores/favouritesStore";
import { SharePillMenu } from "./SharePillMenu";

interface CardActionBarProps {
  recipeId: string;
  recipeTitle: string;
  cuisine?: string;
  totalTime?: number;
  chefName?: string;
}

export function CardActionBar({
  recipeId,
  recipeTitle,
  cuisine,
  totalTime,
  chefName,
}: CardActionBarProps) {
  const insets = useSafeAreaInsets();
  const isFavourited = useFavouritesStore((s) => s.isFavourited(recipeId));
  const addFavourite = useFavouritesStore((s) => s.addFavourite);
  const removeFavourite = useFavouritesStore((s) => s.removeFavourite);

  const [shareOpen, setShareOpen] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const handleHeart = useCallback(() => {
    if (isFavourited) {
      lightTap();
      removeFavourite(recipeId);
    } else {
      successNotification();
      addFavourite(recipeId);
    }
  }, [isFavourited, recipeId, addFavourite, removeFavourite]);

  const handleSend = useCallback(() => {
    lightTap();
    setShareOpen((prev) => !prev);
  }, []);

  const handleBookmark = useCallback(() => {
    if (bookmarked) {
      lightTap();
    } else {
      successNotification();
    }
    setBookmarked((prev) => !prev);
    // For v1, bookmark is visual-only — separate collections system later
  }, [bookmarked]);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 12 }]}>
      {/* Share pills (above action bar) */}
      <SharePillMenu
        visible={shareOpen}
        recipeId={recipeId}
        recipeTitle={recipeTitle}
        cuisine={cuisine}
        totalTime={totalTime}
        chefName={chefName}
        onClose={() => setShareOpen(false)}
      />

      {/* Action buttons */}
      <View style={styles.bar}>
        <ActionButton
          icon={Heart}
          active={isFavourited}
          activeColor="#E53935"
          onPress={handleHeart}
          filled={isFavourited}
        />
        <ActionButton
          icon={Send}
          active={shareOpen}
          activeColor={Colors.primary}
          onPress={handleSend}
        />
        <ActionButton
          icon={Bookmark}
          active={bookmarked}
          activeColor="#F9A825"
          onPress={handleBookmark}
          filled={bookmarked}
        />
      </View>
    </View>
  );
}

function ActionButton({
  icon: Icon,
  active,
  activeColor,
  onPress,
  filled,
}: {
  icon: React.ComponentType<any>;
  active: boolean;
  activeColor: string;
  onPress: () => void;
  filled?: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    lightTap();
    Animated.spring(scaleAnim, {
      toValue: 1.12,
      speed: 50,
      bounciness: 8,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      speed: 40,
      bounciness: 6,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View
          style={[
            styles.buttonGlass,
            styles.buttonInner,
            active && { borderColor: activeColor },
          ]}
        >
          <Icon
            size={24}
            color={active ? activeColor : "#FFF"}
            strokeWidth={1.75}
            fill={filled ? activeColor : "none"}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  bar: {
    flexDirection: "row",
    gap: 24,
    alignItems: "center",
  },
  buttonGlass: {
    borderRadius: 26,
    overflow: "hidden",
    shadowColor: Glass.shadow.color,
    shadowOpacity: 1,
    shadowOffset: Glass.shadow.offset,
    shadowRadius: Glass.shadow.radius,
  },
  buttonInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Glass.surfaceDark,
    borderWidth: 1,
    borderColor: Glass.borderLight,
    justifyContent: "center",
    alignItems: "center",
  },
});
