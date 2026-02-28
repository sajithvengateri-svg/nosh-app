import { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { AlertTriangle } from "lucide-react-native";
import { Colors } from "../../constants/colors";

interface BypassBannerProps {
  onDismiss: () => void;
}

export function BypassBanner({ onDismiss }: BypassBannerProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => onDismiss());
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <View style={styles.banner}>
        <AlertTriangle size={16} color={Colors.alert} strokeWidth={1.5} />
        <Text style={styles.text}>
          This wasn't planned for today — no worries!
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 100,
    left: 20,
    right: 20,
    zIndex: 50,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.background,
    borderLeftWidth: 3,
    borderLeftColor: Colors.alert,
    borderRadius: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  text: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: "500",
  },
});
