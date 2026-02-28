import { View, Text, Pressable, StyleSheet } from "react-native";
import { BookOpen, ChevronRight } from "lucide-react-native";
import { Colors } from "../../constants/colors";
import { Fonts } from "../../constants/typography";
import { useWorkflowStore } from "../../lib/stores/workflowStore";
import { lightTap } from "../../lib/haptics";

interface LifecycleGuideCardProps {
  onOpenOverlay?: (key: string) => void;
}

export function LifecycleGuideCard({ onOpenOverlay }: LifecycleGuideCardProps) {
  const isCompleted = useWorkflowStore((s) => s.isCompleted("recipe_lifecycle"));

  if (isCompleted) return null;

  return (
    <View style={styles.card}>
      <View style={styles.iconCircle}>
        <BookOpen size={28} color={Colors.primary} strokeWidth={1.5} />
      </View>

      <Text style={styles.title}>Learn how Prep Mi works</Text>
      <Text style={styles.subtitle}>
        A quick 8-step guide through the recipe lifecycle — from feed to plate.
      </Text>

      <Pressable
        onPress={() => {
          lightTap();
          onOpenOverlay?.("recipe_lifecycle");
        }}
        style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }]}
      >
        <Text style={styles.buttonText}>Start Guide</Text>
        <ChevronRight size={16} color="#FFF" strokeWidth={2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 24,
    alignItems: "center",
    marginHorizontal: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(91, 163, 122, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: Fonts.heading,
    fontWeight: "700",
    color: Colors.text.primary,
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
