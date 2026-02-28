import { View, Text, Pressable, StyleSheet } from "react-native";
import {
  Flame,
  CalendarDays,
  Waves,
  Zap,
  Ruler,
  Target,
  Dna,
  Dice3,
  Users,
} from "lucide-react-native";
import { Colors, Glass } from "../../constants/colors";
import { useCompanionStore, SmartBubble } from "../../lib/companion/companionStore";
import { lightTap } from "../../lib/haptics";

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  flame: Flame,
  calendar_days: CalendarDays,
  waves: Waves,
  zap: Zap,
  ruler: Ruler,
  target: Target,
  dna: Dna,
  dice: Dice3,
  users: Users,
};

interface SmartBubblesProps {
  onSelect: (action: string) => void;
}

export function SmartBubbles({ onSelect }: SmartBubblesProps) {
  const { smartBubbles } = useCompanionStore();

  if (smartBubbles.length === 0) return null;

  const handlePress = (bubble: SmartBubble) => {
    lightTap();
    onSelect(bubble.action);
  };

  return (
    <View style={styles.container}>
      {smartBubbles.map((bubble) => (
        <Pressable
          key={bubble.id}
          onPress={() => handlePress(bubble)}
          style={styles.bubble}
        >
          {bubble.iconName && ICON_MAP[bubble.iconName] && (
            (() => {
              const BubbleIcon = ICON_MAP[bubble.iconName!];
              return <BubbleIcon size={14} color={Colors.text.primary} strokeWidth={1.5} />;
            })()
          )}
          <Text style={styles.label}>{bubble.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 96,
    right: 20,
    alignItems: "flex-end",
    gap: 6,
  },
  bubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Glass.surface,
    borderWidth: 1,
    borderColor: Glass.borderLight,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    shadowColor: Glass.shadow.color,
    shadowOpacity: 1,
    shadowOffset: Glass.shadow.offset,
    shadowRadius: Glass.shadow.radius,
    elevation: 3,
  },
  emoji: {
    fontSize: 14,
  },
  label: {
    fontSize: 14,
    color: Colors.text.primary,
    fontWeight: "500",
  },
});
