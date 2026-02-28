import { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  Linking,
} from "react-native";
import ViewShot from "react-native-view-shot";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import * as Clipboard from "expo-clipboard";
import {
  Download,
  SkipForward,
  Instagram,
  MessageCircle,
  Copy,
  Share2,
} from "lucide-react-native";
import { Colors } from "../../constants/colors";
import { lightTap, mediumTap, successNotification } from "../../lib/haptics";
import { useTrackingStore } from "../../lib/stores/trackingStore";
import { NoshSocialCard } from "./NoshSocialCard";

interface SocialShareScreenProps {
  recipeId?: string;
  recipeTitle: string;
  chefName?: string;
  rating?: number;
  photoUrl?: string;
  heroImageUrl?: string;
  onDone: () => void;
}

export function SocialShareScreen({
  recipeId,
  recipeTitle,
  chefName,
  rating,
  photoUrl,
  heroImageUrl,
  onDone,
}: SocialShareScreenProps) {
  const viewShotRef = useRef<ViewShot>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [format, setFormat] = useState<"square" | "story">("story");

  const caption = `Just cooked ${recipeTitle}${chefName ? ` by ${chefName}` : ""} with NOSH!`;

  const captureCard = useCallback(async (): Promise<string | null> => {
    try {
      const uri = await viewShotRef.current?.capture?.();
      return uri ?? null;
    } catch {
      return null;
    }
  }, []);

  const handleSaveToGallery = useCallback(async () => {
    setIsSaving(true);
    mediumTap();
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Allow gallery access to save your Prep Mi card.");
        setIsSaving(false);
        return;
      }
      const uri = await captureCard();
      if (uri) {
        await MediaLibrary.saveToLibraryAsync(uri);
        successNotification();
        Alert.alert("Saved!", "Your Prep Mi card has been saved to your gallery.");
      }
    } catch (err) {
      console.warn("Save failed:", err);
    }
    setIsSaving(false);
  }, [captureCard]);

  const trackShare = useCallback((platform: string, completed: boolean) => {
    if (recipeId) {
      useTrackingStore.getState().logShareEvent({
        recipeId,
        platform,
        format,
        completed,
      });
    }
  }, [recipeId, format]);

  const handleShareInstagram = useCallback(async () => {
    mediumTap();
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === "granted") {
        const uri = await captureCard();
        if (uri) {
          await MediaLibrary.saveToLibraryAsync(uri);
          await Linking.openURL("instagram://story-camera");
          trackShare("instagram", true);
        }
      }
    } catch {
      const uri = await captureCard();
      if (uri && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(uri, { mimeType: "image/png" });
        trackShare("instagram", true);
      }
    }
  }, [captureCard, trackShare]);

  const handleShareWhatsApp = useCallback(async () => {
    mediumTap();
    try {
      const uri = await captureCard();
      if (uri && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: "Share via WhatsApp",
        });
        trackShare("whatsapp", true);
      }
    } catch (err) {
      console.warn("WhatsApp share failed:", err);
    }
  }, [captureCard, trackShare]);

  const handleCopyCaption = useCallback(async () => {
    lightTap();
    await Clipboard.setStringAsync(caption);
    successNotification();
    trackShare("copy_caption", true);
    Alert.alert("Copied!", "Caption copied to clipboard.");
  }, [caption, trackShare]);

  const handleShareGeneric = useCallback(async () => {
    mediumTap();
    try {
      const uri = await captureCard();
      if (uri && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: "Share your Prep Mi card",
        });
        trackShare("generic", true);
      }
    } catch (err) {
      console.warn("Share failed:", err);
    }
  }, [captureCard, trackShare]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.heading}>Share your cook!</Text>
      <Text style={styles.subheading}>
        Save or share your Prep Mi card
      </Text>

      {/* Format toggle */}
      <View style={styles.formatToggle}>
        <Pressable
          onPress={() => { lightTap(); setFormat("square"); }}
          style={[styles.formatOption, format === "square" && styles.formatOptionActive]}
        >
          <Text style={[styles.formatText, format === "square" && styles.formatTextActive]}>
            Square
          </Text>
        </Pressable>
        <Pressable
          onPress={() => { lightTap(); setFormat("story"); }}
          style={[styles.formatOption, format === "story" && styles.formatOptionActive]}
        >
          <Text style={[styles.formatText, format === "story" && styles.formatTextActive]}>
            Story
          </Text>
        </Pressable>
      </View>

      {/* Social card preview */}
      <View style={styles.cardWrapper}>
        <NoshSocialCard
          ref={viewShotRef}
          recipeTitle={recipeTitle}
          chefName={chefName}
          rating={rating}
          photoUrl={photoUrl}
          heroImageUrl={heroImageUrl}
          format={format}
        />
      </View>

      {/* Caption area */}
      <View style={styles.captionArea}>
        <Text style={styles.captionText} numberOfLines={2}>{caption}</Text>
        <Pressable onPress={handleCopyCaption} style={styles.captionCopyButton}>
          <Copy size={14} color={Colors.primary} strokeWidth={1.5} />
          <Text style={styles.captionCopyText}>Copy</Text>
        </Pressable>
      </View>

      {/* Share buttons */}
      <View style={styles.shareButtons}>
        <Pressable onPress={handleShareInstagram} style={styles.shareButton}>
          <View style={[styles.shareIconCircle, { backgroundColor: "rgba(228, 64, 95, 0.1)" }]}>
            <Instagram size={20} color="#E4405F" strokeWidth={1.5} />
          </View>
          <Text style={styles.shareLabel}>Instagram</Text>
        </Pressable>

        <Pressable onPress={handleShareWhatsApp} style={styles.shareButton}>
          <View style={[styles.shareIconCircle, { backgroundColor: "rgba(37, 211, 102, 0.1)" }]}>
            <MessageCircle size={20} color="#25D366" strokeWidth={1.5} />
          </View>
          <Text style={styles.shareLabel}>WhatsApp</Text>
        </Pressable>

        <Pressable
          onPress={handleSaveToGallery}
          style={styles.shareButton}
          disabled={isSaving}
        >
          <View style={[styles.shareIconCircle, isSaving && { opacity: 0.5 }]}>
            <Download size={20} color={Colors.primary} strokeWidth={1.5} />
          </View>
          <Text style={styles.shareLabel}>Save</Text>
        </Pressable>

        <Pressable onPress={handleShareGeneric} style={styles.shareButton}>
          <View style={styles.shareIconCircle}>
            <Share2 size={20} color={Colors.text.secondary} strokeWidth={1.5} />
          </View>
          <Text style={styles.shareLabel}>More</Text>
        </Pressable>
      </View>

      {/* Skip */}
      <Pressable
        onPress={() => {
          lightTap();
          onDone();
        }}
        style={styles.skipButton}
      >
        <SkipForward size={16} color={Colors.text.muted} strokeWidth={1.5} />
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  heading: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.text.primary,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 16,
  },

  // Format toggle
  formatToggle: {
    flexDirection: "row",
    backgroundColor: Colors.background,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 3,
    marginBottom: 20,
  },
  formatOption: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 17,
  },
  formatOptionActive: {
    backgroundColor: Colors.card,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  formatText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.muted,
  },
  formatTextActive: {
    color: Colors.text.primary,
  },

  cardWrapper: {
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
    elevation: 6,
    marginBottom: 20,
  },

  // Caption
  captionArea: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 24,
    alignSelf: "stretch",
  },
  captionText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  captionCopyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  captionCopyText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
  },

  // Share buttons
  shareButtons: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 24,
  },
  shareButton: {
    alignItems: "center",
    gap: 6,
  },
  shareIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  shareLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: "500",
  },

  skipButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 14,
    color: Colors.text.muted,
  },
});
