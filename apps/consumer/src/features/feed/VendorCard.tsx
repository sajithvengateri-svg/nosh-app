import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { Store, ShoppingCart } from "lucide-react-native";
import { Colors } from "../../constants/colors";
import { lightTap } from "../../lib/haptics";

export interface VendorCardData {
  id: string;
  vendor_name: string;
  product_name: string;
  product_image_url?: string;
  price: number;
  unit?: string;
  delivery_note?: string;
  context_note?: string;
}

export function VendorCard({ data }: { data: VendorCardData }) {
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
          shadowColor: "rgba(217, 72, 120, 0.08)",
          shadowOpacity: 1,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 12,
          elevation: 2,
        }}
      >
        <View style={{ flexDirection: "row" }}>
          {data.product_image_url ? (
            <Image
              source={{ uri: data.product_image_url }}
              style={{ width: 110, height: 110 }}
              contentFit="cover"
            />
          ) : (
            <View
              style={{
                width: 110,
                height: 110,
                backgroundColor: Colors.background,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Store size={36} color={Colors.text.muted} strokeWidth={1.5} />
            </View>
          )}

          <View style={{ flex: 1, padding: 14 }}>
            {data.context_note && (
              <View
                style={{
                  alignSelf: "flex-start",
                  backgroundColor: "rgba(217, 72, 120, 0.08)",
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "rgba(217, 72, 120, 0.15)",
                  marginBottom: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    color: Colors.primary,
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {data.context_note}
                </Text>
              </View>
            )}

            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: Colors.text.primary,
                marginBottom: 2,
              }}
            >
              {data.product_name}
            </Text>

            <Text
              style={{
                fontSize: 13,
                color: Colors.text.secondary,
                marginBottom: 6,
              }}
            >
              {data.vendor_name}
            </Text>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: Colors.text.primary,
                }}
              >
                ${data.price.toFixed(2)}
                {data.unit ? `/${data.unit}` : ""}
              </Text>
              {data.delivery_note && (
                <Text style={{ fontSize: 11, color: Colors.text.muted }}>
                  {data.delivery_note}
                </Text>
              )}
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
          <Pressable
            onPress={() => lightTap()}
            style={({ pressed }) => ({
              backgroundColor: pressed ? Colors.divider : Colors.background,
              borderWidth: 1,
              borderColor: Colors.border,
              paddingVertical: 12,
              borderRadius: 16,
              alignItems: "center" as const,
            })}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <ShoppingCart size={14} color={Colors.text.primary} strokeWidth={1.5} />
              <Text
                style={{
                  color: Colors.text.primary,
                  fontSize: 15,
                  fontWeight: "600",
                }}
              >
                Add to Order
              </Text>
            </View>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}
