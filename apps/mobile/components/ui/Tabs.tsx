import { useState } from "react";
import { View, Text, Pressable, ScrollView, type ViewStyle } from "react-native";

interface Tab {
  key: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab?: string;
  onTabChange?: (key: string) => void;
  accentColor?: string;
  style?: ViewStyle;
}

export function TabBar({
  tabs,
  activeTab,
  onTabChange,
  accentColor = "#6366F1",
  style,
}: TabsProps) {
  const [selected, setSelected] = useState(activeTab || tabs[0]?.key);

  const current = activeTab ?? selected;

  const handlePress = (key: string) => {
    setSelected(key);
    onTabChange?.(key);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0, ...style }}
      contentContainerStyle={{ gap: 4, paddingHorizontal: 4 }}
    >
      {tabs.map((tab) => {
        const isActive = current === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => handlePress(tab.key)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 10,
              backgroundColor: isActive ? accentColor : "transparent",
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: isActive ? "#FFFFFF" : "#6B7280",
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
