import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { ChefHat } from "lucide-react-native";
import { Colors } from "../../constants/colors";
import { lightTap } from "../../lib/haptics";

export interface ChefSpotlightCardData {
  id: string;
  chef_name: string;
  chef_avatar_url?: string;
  collection_title: string;
  recipe_count: number;
  cover_image_url?: string;
  tagline?: string;
}

export function ChefSpotlightCard({ data }: { data: ChefSpotlightCardData }) {
  return (
    <Pressable onPress={() => lightTap()}>
      <View
        style={{
          backgroundColor: Colors.card,
          borderRadius: 24,
          marginHorizontal: 0,
          marginBottom: 0,
          overflow: "hidden",
          borderWidth: 1.5,
          borderColor: Colors.border,
          shadowColor: "rgba(217, 72, 120, 0.10)",
          shadowOpacity: 1,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 12,
          elevation: 3,
        }}
      >
        {/* Cover image */}
        {data.cover_image_url ? (
          <Image
            source={{ uri: data.cover_image_url }}
            style={{ width: "100%", height: 140 }}
            contentFit="cover"
          />
        ) : (
          <View
            style={{
              height: 140,
              backgroundColor: Colors.background,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ChefHat size={40} color={Colors.text.muted} strokeWidth={1.5} />
          </View>
        )}

        <View style={{ padding: 16, flexDirection: "row", alignItems: "center", gap: 12 }}>
          {/* Chef avatar */}
          {data.chef_avatar_url ? (
            <Image
              source={{ uri: data.chef_avatar_url }}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                borderWidth: 2,
                borderColor: Colors.border,
              }}
              contentFit="cover"
            />
          ) : (
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: Colors.primary,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 18, color: "#FFF", fontWeight: "700" }}>
                {data.chef_name.charAt(0)}
              </Text>
            </View>
          )}

          <View style={{ flex: 1 }}>
            <View
              style={{
                alignSelf: "flex-start",
                backgroundColor: "rgba(217, 72, 120, 0.08)",
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "rgba(217, 72, 120, 0.15)",
                marginBottom: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  color: Colors.primary,
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                }}
              >
                Chef Spotlight
              </Text>
            </View>
            <Text
              style={{
                fontSize: 17,
                fontWeight: "700",
                color: Colors.text.primary,
              }}
            >
              {data.collection_title}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: Colors.text.secondary,
                marginTop: 2,
              }}
            >
              {data.chef_name} · {data.recipe_count} recipes
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
