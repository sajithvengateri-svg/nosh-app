import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { Beef, Sparkles, Salad, Dice3 } from "lucide-react-native";
import { Colors } from "../../../constants/colors";
import { selectionTap, lightTap } from "../../../lib/haptics";
import { useSocialCookingStore } from "../../../lib/stores/socialCookingStore";

const CATEGORIES = [
  {
    key: "protein",
    label: "What protein?",
    icon: Beef,
    suggestions: ["Chicken", "Lamb", "Beef", "Pork", "Fish", "Veggie"],
  },
  {
    key: "vibe",
    label: "What vibe?",
    icon: Sparkles,
    suggestions: ["Comfort", "Light & Fresh", "Fancy", "BBQ", "Spicy"],
  },
  {
    key: "side",
    label: "Must-have side?",
    icon: Salad,
    suggestions: ["Roast Veg", "Salad", "Mash", "Rice", "Bread", "Fries"],
  },
  {
    key: "wild_card",
    label: "Wild card?",
    icon: Dice3,
    suggestions: ["Cheese board", "Garlic bread", "Gravy", "Pavlova", "Cocktails"],
  },
];

export function VotingBoard() {
  const activeEvent = useSocialCookingStore((s) => s.activeEvent);
  const votes = useSocialCookingStore((s) => s.votes);
  const castVote = useSocialCookingStore((s) => s.castVote);
  const lockVoting = useSocialCookingStore((s) => s.lockVoting);
  const bossDecides = useSocialCookingStore((s) => s.bossDecides);
  const setView = useSocialCookingStore((s) => s.setView);

  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});

  if (!activeEvent) return null;

  const isBossMode = !!activeEvent.boss_user_id;

  // Count votes per category+value
  const voteCounts: Record<string, Record<string, number>> = {};
  for (const vote of votes) {
    if (!voteCounts[vote.vote_category]) voteCounts[vote.vote_category] = {};
    const cat = voteCounts[vote.vote_category];
    cat[vote.vote_value] = (cat[vote.vote_value] ?? 0) + 1;
  }

  const handleVote = (category: string, value: string) => {
    selectionTap();
    castVote(category, value);
  };

  const handleCustomVote = (category: string) => {
    const value = customInputs[category]?.trim();
    if (!value) return;
    selectionTap();
    castVote(category, value);
    setCustomInputs((prev) => ({ ...prev, [category]: "" }));
  };

  const handleLock = () => {
    lightTap();
    lockVoting();
  };

  const handleBossDecides = () => {
    lightTap();
    // Boss picks the top vote per category (or first suggestion if no votes)
    const menu: Record<string, string> = {};
    for (const cat of CATEGORIES) {
      const catVotes = voteCounts[cat.key];
      if (catVotes) {
        const sorted = Object.entries(catVotes).sort((a, b) => b[1] - a[1]);
        menu[cat.key] = sorted[0]?.[0] ?? cat.suggestions[0];
      } else {
        menu[cat.key] = cat.suggestions[0];
      }
    }
    bossDecides({ picks: menu, bossDecidedAt: new Date().toISOString() });
  };

  const hasVotes = votes.length > 0;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 24 }}>
      <Text style={{ fontSize: 14, color: Colors.text.secondary, textAlign: "center" }}>
        Everyone votes — tap your picks below
      </Text>

      {CATEGORIES.map((cat) => (
        <View key={cat.key}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <cat.icon size={16} color={Colors.secondary} strokeWidth={1.5} />
            <Text style={{ fontSize: 16, fontWeight: "600", color: Colors.secondary }}>
              {cat.label}
            </Text>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {cat.suggestions.map((sug) => {
              const count = voteCounts[cat.key]?.[sug] ?? 0;
              return (
                <Pressable
                  key={sug}
                  onPress={() => handleVote(cat.key, sug)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: count > 0 ? Colors.primary + "15" : Colors.background,
                    borderWidth: 1,
                    borderColor: count > 0 ? Colors.primary : Colors.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      color: count > 0 ? Colors.primary : Colors.text.secondary,
                      fontWeight: count > 0 ? "600" : "400",
                    }}
                  >
                    {sug}
                  </Text>
                  {count > 0 && (
                    <View
                      style={{
                        backgroundColor: Colors.primary,
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "700" }}>
                        {count}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
          {/* Custom write-in */}
          <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
            <TextInput
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: Colors.border,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 8,
                fontSize: 14,
                color: Colors.text.primary,
              }}
              placeholder="Or type your own..."
              placeholderTextColor={Colors.text.muted}
              value={customInputs[cat.key] ?? ""}
              onChangeText={(v) => setCustomInputs((prev) => ({ ...prev, [cat.key]: v }))}
              onSubmitEditing={() => handleCustomVote(cat.key)}
            />
            {customInputs[cat.key]?.trim() && (
              <Pressable
                onPress={() => handleCustomVote(cat.key)}
                style={{
                  backgroundColor: Colors.secondary,
                  paddingHorizontal: 14,
                  borderRadius: 10,
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#FFF", fontWeight: "600" }}>Vote</Text>
              </Pressable>
            )}
          </View>
        </View>
      ))}

      {/* Lock / Boss Decides CTAs */}
      <View style={{ gap: 10, paddingTop: 8 }}>
        {isBossMode ? (
          <Pressable
            onPress={handleBossDecides}
            style={{
              backgroundColor: Colors.primary,
              paddingVertical: 14,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: "#FFF", fontSize: 16, fontWeight: "700", textAlign: "center" }}>
              Boss Decides
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={handleLock}
            disabled={!hasVotes}
            style={{
              backgroundColor: hasVotes ? Colors.primary : Colors.border,
              paddingVertical: 14,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: "#FFF", fontSize: 16, fontWeight: "700", textAlign: "center" }}>
              Lock Votes — Dinner Decided!
            </Text>
          </Pressable>
        )}
        <Pressable
          onPress={() => setView("dashboard")}
          style={{ paddingVertical: 10 }}
        >
          <Text style={{ color: Colors.text.secondary, textAlign: "center", fontSize: 14 }}>
            Skip to dashboard
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
