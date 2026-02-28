import { useRef } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  PanResponder,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { Colors } from "../../constants/colors";
import { lightTap } from "../../lib/haptics";

interface PageContainerProps {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
}

export function PageContainer({ title, onBack, children }: PageContainerProps) {
  const insets = useSafeAreaInsets();
  const slideX = useRef(new Animated.Value(0)).current;

  const handleBack = () => {
    lightTap();
    onBack();
  };

  // Swipe right to go back
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        g.dx > 20 && Math.abs(g.dy) < Math.abs(g.dx),
      onPanResponderMove: (_, g) => {
        if (g.dx > 0) slideX.setValue(g.dx);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx > 100 || g.vx > 0.5) {
          Animated.timing(slideX, {
            toValue: 400,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            slideX.setValue(0);
            onBack();
          });
        } else {
          Animated.spring(slideX, {
            toValue: 0,
            speed: 20,
            bounciness: 6,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  return (
    <Animated.View
      style={[
        styles.root,
        { paddingTop: insets.top, transform: [{ translateX: slideX }] },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <ChevronLeft size={22} color={Colors.text.primary} strokeWidth={1.5} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.backButton} />
      </View>

      {/* Content */}
      <View style={styles.content}>{children}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: Colors.secondary,
    textAlign: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
});
