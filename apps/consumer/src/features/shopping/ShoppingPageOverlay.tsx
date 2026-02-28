import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Colors } from "../../constants/colors";
import { lightTap } from "../../lib/haptics";
import { ShopTab } from "./ShopTab";
import { RunTab } from "./RunTab";

type Tab = "shop" | "run";

interface ShoppingPageOverlayProps {
  onClose: () => void;
}

export function ShoppingPageOverlay({ onClose }: ShoppingPageOverlayProps) {
  const [activeTab, setActiveTab] = useState<Tab>("shop");

  return (
    <View style={styles.container}>
      {/* Tab bar */}
      <View style={styles.tabBar}>
        {(["shop", "run"] as Tab[]).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => {
              lightTap();
              setActiveTab(tab);
            }}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {tab === "shop" ? "SHOP" : "RUN"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Tab content */}
      {activeTab === "shop" ? (
        <ShopTab onStartRun={() => setActiveTab("run")} />
      ) : (
        <RunTab onComplete={onClose} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
    color: Colors.text.secondary,
  },
  tabTextActive: {
    color: "#FFF",
  },
});
