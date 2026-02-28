import { View, Text, Pressable, Image } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../contexts/ThemeProvider";
import { ArrowLeft } from "lucide-react-native";
import { lightTap } from "../../lib/haptics";

interface ScreenHeaderProps {
  title: string;
  showBack?: boolean;
  showHome?: boolean;
  rightAction?: React.ReactNode;
}

const logo = require("../../assets/icon.png");

export function ScreenHeader({ title, showBack = true, showHome = true, rightAction }: ScreenHeaderProps) {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 10 }}>
      {showBack && (
        <Pressable
          onPress={() => { lightTap(); router.back(); }}
          style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}
        >
          <ArrowLeft size={18} color={colors.text} strokeWidth={1.5} />
        </Pressable>
      )}

      <Text style={{ flex: 1, fontSize: 20, fontWeight: "800", color: colors.text }} numberOfLines={1}>
        {title}
      </Text>

      {rightAction}

      {showHome && (
        <Pressable
          onPress={() => { lightTap(); router.replace("/(app)/(tabs)/dashboard"); }}
          onLongPress={() => { lightTap(); router.replace("/(auth)/landing"); }}
          delayLongPress={800}
          style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", overflow: "hidden" }}
        >
          <Image source={logo} style={{ width: 26, height: 26, borderRadius: 6 }} />
        </Pressable>
      )}
    </View>
  );
}
