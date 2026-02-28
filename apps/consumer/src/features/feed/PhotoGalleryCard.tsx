import { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Camera, ImagePlus } from "lucide-react-native";
import { Colors, Spacing, BorderRadius } from "../../constants/colors";
import { mediumTap, successNotification, lightTap } from "../../lib/haptics";
import { usePhotoStore } from "../../lib/stores/photoStore";
import type { CapturedPhoto } from "../../lib/stores/photoStore";

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const day = d.getDate();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${day} ${months[d.getMonth()]} ${h}:${m}`;
}

export function PhotoGalleryCard() {
  const photos = usePhotoStore((s) => s.photos);
  const addPhoto = usePhotoStore((s) => s.addPhoto);

  const handleTakePhoto = useCallback(async () => {
    mediumTap();
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Camera access denied");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets[0]) {
      successNotification();
      addPhoto(result.assets[0].uri, "Scanned item");
    }
  }, [addPhoto]);

  const handlePickFromGallery = useCallback(async () => {
    mediumTap();
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Photo library access denied");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      successNotification();
      addPhoto(result.assets[0].uri, "From library");
    }
  }, [addPhoto]);

  const handlePhotoTap = useCallback((photo: CapturedPhoto) => {
    lightTap();
    if (photo.caption) {
      Alert.alert(photo.caption, formatTimestamp(photo.timestamp));
    }
  }, []);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Camera size={18} color={Colors.text.primary} strokeWidth={1.75} />
          <Text style={styles.headerTitle}>Your Prep Mi Gallery</Text>
        </View>
        {photos.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{photos.length}</Text>
          </View>
        )}
      </View>

      {photos.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stripContainer}
          style={styles.strip}
        >
          {photos.map((photo) => (
            <Pressable
              key={photo.id}
              onPress={() => handlePhotoTap(photo)}
              style={styles.thumbnailWrapper}
            >
              <Image
                source={{ uri: photo.uri }}
                style={styles.thumbnail}
                contentFit="cover"
              />
              <View style={styles.timestampOverlay}>
                <Text style={styles.timestampText} numberOfLines={1}>
                  {formatTimestamp(photo.timestamp)}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Camera size={32} color={Colors.text.muted} strokeWidth={1.25} />
          <Text style={styles.emptyText}>Snap your first dish</Text>
        </View>
      )}

      <View style={styles.actions}>
        <Pressable
          onPress={handleTakePhoto}
          style={({ pressed }) => [
            styles.actionPill,
            pressed && { backgroundColor: Colors.divider },
          ]}
        >
          <Camera size={16} color={Colors.text.primary} strokeWidth={1.75} />
          <Text style={styles.actionLabel}>Take Photo</Text>
        </Pressable>
        <Pressable
          onPress={handlePickFromGallery}
          style={({ pressed }) => [
            styles.actionPill,
            pressed && { backgroundColor: Colors.divider },
          ]}
        >
          <ImagePlus size={16} color={Colors.text.primary} strokeWidth={1.75} />
          <Text style={styles.actionLabel}>Gallery</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 24,
    padding: Spacing.md,
    marginBottom: 0,
    shadowColor: "rgba(217, 72, 120, 0.08)",
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    shadowOpacity: 1,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  countBadge: {
    backgroundColor: "rgba(217, 72, 120, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(217, 72, 120, 0.15)",
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  countText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primary,
  },
  strip: {
    marginBottom: Spacing.sm,
  },
  stripContainer: {
    gap: 10,
    paddingVertical: 4,
  },
  thumbnailWrapper: {
    width: 100,
    height: 100,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  thumbnail: {
    width: 100,
    height: 100,
  },
  timestampOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  timestampText: {
    fontSize: 9,
    color: "#FFFFFF",
    fontWeight: "600",
    textAlign: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.text.muted,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: Spacing.xs,
  },
  actionPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text.primary,
  },
});
