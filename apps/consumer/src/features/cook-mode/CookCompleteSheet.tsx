import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import Slider from "@react-native-community/slider";
import * as ImagePicker from "expo-image-picker";
import {
  CircleCheck,
  Star,
  Camera,
  X,
  Utensils,
} from "lucide-react-native";
import { Colors, Glass } from "../../constants/colors";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthProvider";
import { calculateCooldownDate } from "../../lib/engines/recyclingEngine";
import { useTrackingStore } from "../../lib/stores/trackingStore";
import { useNoshPlus } from "../../hooks/useNoshPlus";
import { calculateLeftovers } from "../../lib/engines/leftoverEngine";
import { lightTap, mediumTap, successNotification } from "../../lib/haptics";

interface CookCompleteSheetProps {
  recipeId: string;
  recipeTitle: string;
  recipeServes?: number;
  onComplete: (photoUrl?: string) => void;
}

const RATING_LABELS = ["", "Meh", "OK", "Good", "Great", "Amazing"];

const COOK_AGAIN_OPTIONS = [
  { key: "yes", label: "Yes!" },
  { key: "probably", label: "Probably" },
  { key: "no", label: "No" },
] as const;

const DIFFICULTY_OPTIONS = [
  { key: "easier", label: "Easier" },
  { key: "as_expected", label: "As Expected" },
  { key: "harder", label: "Harder" },
] as const;

const FEEDBACK_TAGS = [
  "crowd pleaser",
  "weeknight winner",
  "special occasion",
  "budget friendly",
  "leftovers gold",
  "kid approved",
];

export function CookCompleteSheet({
  recipeId,
  recipeTitle,
  recipeServes,
  onComplete,
}: CookCompleteSheetProps) {
  const { user, profile } = useAuth();
  const { canTrackLeftovers } = useNoshPlus();
  const householdSize = profile?.household_size ?? 2;
  const maxLeftovers = recipeServes ? calculateLeftovers(recipeServes, householdSize) : 0;
  const [rating, setRating] = useState(0);
  const [cookAgain, setCookAgain] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [leftoverPortions, setLeftoverPortions] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleTag = (tag: string) => {
    lightTap();
    setSelectedTags((prev) => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });
  };

  const pickPhoto = async () => {
    lightTap();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    lightTap();
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoUri) return null;
    try {
      const ext = photoUri.split(".").pop() ?? "jpg";
      const fileName = `${recipeId}-${Date.now()}.${ext}`;
      const response = await fetch(photoUri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();

      const { error } = await supabase.storage
        .from("cook-log-photos")
        .upload(fileName, arrayBuffer, {
          contentType: `image/${ext}`,
          upsert: false,
        });

      if (error) {
        console.warn("Photo upload error:", error.message);
        return null;
      }

      const { data: urlData } = supabase.storage
        .from("cook-log-photos")
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (err) {
      console.warn("Photo upload failed:", err);
      return null;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    let photoUrl: string | null = null;

    try {
      photoUrl = await uploadPhoto();

      const wouldCookAgain =
        cookAgain === "yes" ? true : cookAgain === "no" ? false : null;

      await supabase.from("ds_cook_log").insert({
        recipe_id: recipeId,
        rating: rating > 0 ? rating : null,
        notes: notes.trim() || null,
        cooked_at: new Date().toISOString(),
        would_cook_again: wouldCookAgain,
        difficulty_assessment: difficulty,
        feedback_tags: Array.from(selectedTags),
        photo_url: photoUrl,
      });

      // Upsert recipe cooldown so it doesn't resurface immediately
      const cooldownDate = calculateCooldownDate({
        reason: "cooked",
        rating: rating > 0 ? rating : undefined,
      });

      if (user) {
        await supabase.from("ds_recipe_cooldowns").upsert(
          {
            user_id: user.id,
            recipe_id: recipeId,
            reason: "cooked",
            rating: rating > 0 ? rating : null,
            cooldown_until: cooldownDate.toISOString(),
          },
          { onConflict: "user_id,recipe_id" }
        );
      }

      // Save leftover portions if tracked
      if (canTrackLeftovers && leftoverPortions > 0) {
        const useBy = new Date();
        useBy.setDate(useBy.getDate() + 3); // Default 3-day shelf life
        await supabase.from("ds_leftover_portions").insert({
          recipe_id: recipeId,
          recipe_title: recipeTitle,
          portions_remaining: leftoverPortions,
          use_by: useBy.toISOString(),
          status: "available",
        });
      }

      successNotification();

      // Track feedback event
      useTrackingStore.getState().logFeedbackEvent({
        recipeId,
        rating: rating > 0 ? rating : 0,
        wouldCookAgain,
      });
    } catch (err) {
      console.error("CookLog error:", err);
    }
    setIsSubmitting(false);
    onComplete(photoUrl ?? undefined);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ marginBottom: 0 }}>
        <CircleCheck size={48} color={Colors.success} strokeWidth={1.5} />
      </View>
      <Text style={styles.title}>Nice one!</Text>
      <Text style={styles.subtitle}>{recipeTitle}</Text>

      {/* Star rating */}
      <Text style={styles.label}>How was it?</Text>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            onPress={() => {
              lightTap();
              setRating(star);
            }}
          >
            <Star
              size={36}
              color={star <= rating ? Colors.alert : Colors.divider}
              strokeWidth={1.5}
              fill={star <= rating ? Colors.alert : "none"}
            />
          </Pressable>
        ))}
      </View>
      {rating > 0 && (
        <Text style={styles.ratingLabel}>{RATING_LABELS[rating]}</Text>
      )}

      {/* Would cook again */}
      <Text style={styles.label}>Would you cook this again?</Text>
      <View style={styles.pillRow}>
        {COOK_AGAIN_OPTIONS.map((opt) => (
          <Pressable
            key={opt.key}
            onPress={() => {
              lightTap();
              setCookAgain(cookAgain === opt.key ? null : opt.key);
            }}
            style={[
              styles.pill,
              cookAgain === opt.key && styles.pillActive,
            ]}
          >
            <Text
              style={[
                styles.pillText,
                cookAgain === opt.key && styles.pillTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Difficulty */}
      <Text style={styles.label}>How was the difficulty?</Text>
      <View style={styles.pillRow}>
        {DIFFICULTY_OPTIONS.map((opt) => (
          <Pressable
            key={opt.key}
            onPress={() => {
              lightTap();
              setDifficulty(difficulty === opt.key ? null : opt.key);
            }}
            style={[
              styles.pill,
              difficulty === opt.key && styles.pillActive,
            ]}
          >
            <Text
              style={[
                styles.pillText,
                difficulty === opt.key && styles.pillTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Quick tags */}
      <Text style={styles.label}>Quick tags</Text>
      <View style={styles.tagsWrap}>
        {FEEDBACK_TAGS.map((tag) => (
          <Pressable
            key={tag}
            onPress={() => toggleTag(tag)}
            style={[
              styles.tag,
              selectedTags.has(tag) && styles.tagActive,
            ]}
          >
            <Text
              style={[
                styles.tagText,
                selectedTags.has(tag) && styles.tagTextActive,
              ]}
            >
              {tag}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Leftover tracker (Nosh+ only) */}
      {canTrackLeftovers && maxLeftovers > 0 && (
        <>
          <View style={styles.leftoverHeader}>
            <Utensils size={16} color={Colors.primary} strokeWidth={1.8} />
            <Text style={styles.label}>Leftover portions</Text>
          </View>
          <View style={styles.leftoverSlider}>
            <Text style={styles.leftoverValue}>{leftoverPortions}</Text>
            <Slider
              style={{ flex: 1, height: 40 }}
              minimumValue={0}
              maximumValue={maxLeftovers}
              step={0.5}
              value={leftoverPortions}
              onValueChange={(val: number) => setLeftoverPortions(val)}
              minimumTrackTintColor={Colors.primary}
              maximumTrackTintColor={Colors.divider}
              thumbTintColor={Colors.primary}
            />
            <Text style={styles.leftoverMax}>{maxLeftovers}</Text>
          </View>
        </>
      )}

      {/* Photo capture */}
      <Text style={styles.label}>Snap your dish</Text>
      {photoUri ? (
        <View style={styles.photoPreview}>
          <Image
            source={{ uri: photoUri }}
            style={styles.photoImage}
            contentFit="cover"
            transition={200}
          />
          <Pressable
            onPress={() => setPhotoUri(null)}
            style={styles.photoRemove}
          >
            <X size={14} color="#FFF" strokeWidth={2} />
          </Pressable>
        </View>
      ) : (
        <View style={styles.photoButtons}>
          <Pressable onPress={takePhoto} style={styles.photoButton}>
            <Camera size={18} color={Colors.primary} strokeWidth={1.5} />
            <Text style={styles.photoButtonText}>Take Photo</Text>
          </Pressable>
          <Pressable onPress={pickPhoto} style={styles.photoButton}>
            <Text style={styles.photoButtonText}>Gallery</Text>
          </Pressable>
        </View>
      )}

      {/* Notes */}
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Any notes? (optional)"
        placeholderTextColor={Colors.text.muted}
        style={styles.notesInput}
        multiline
        numberOfLines={3}
      />

      {/* Actions */}
      <Pressable
        onPress={handleSubmit}
        style={[styles.submitButton, isSubmitting && { opacity: 0.6 }]}
        disabled={isSubmitting}
      >
        <Text style={styles.submitText}>
          {rating > 0 ? "Save & Done" : "Skip & Done"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: "center",
    paddingBottom: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.secondary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.text.secondary,
    marginBottom: 24,
    textAlign: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  starsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 4,
  },
  ratingLabel: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "600",
    marginBottom: 16,
  },

  // Pill options
  pillRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
    alignSelf: "flex-start",
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pillText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.secondary,
  },
  pillTextActive: {
    color: "#FFF",
  },

  // Tags
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
    alignSelf: "flex-start",
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagActive: {
    backgroundColor: "rgba(217, 72, 120, 0.1)",
    borderColor: Colors.primary,
  },
  tagText: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  tagTextActive: {
    color: Colors.primary,
    fontWeight: "600",
  },

  // Photo
  photoButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
    alignSelf: "flex-start",
  },
  photoButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.secondary,
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 16,
    marginBottom: 20,
    alignSelf: "flex-start",
  },
  photoImage: {
    width: 120,
    height: 120,
    borderRadius: 16,
  },
  photoRemove: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.text.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  // Notes
  notesInput: {
    width: "100%",
    backgroundColor: Glass.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Glass.borderLight,
    padding: 14,
    fontSize: 15,
    color: Colors.text.primary,
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 20,
  },

  // Leftover tracker
  leftoverHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    marginBottom: 0,
  },
  leftoverSlider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
    marginBottom: 20,
  },
  leftoverValue: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary,
    width: 28,
    textAlign: "center",
  },
  leftoverMax: {
    fontSize: 12,
    color: Colors.text.muted,
    width: 28,
    textAlign: "center",
  },

  // Submit
  submitButton: {
    width: "100%",
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 24,
  },
  submitText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
});
