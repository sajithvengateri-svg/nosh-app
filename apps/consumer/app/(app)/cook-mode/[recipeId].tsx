import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  Dimensions,
  Animated,
  PanResponder,
  StatusBar,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChefHat, X, LayoutGrid, Clock } from "lucide-react-native";
import { Colors } from "../../../src/constants/colors";
import { useRecipeStore } from "../../../src/lib/stores/recipeStore";
import { WorkflowCard } from "../../../src/features/cook-mode/WorkflowCard";
import type { WorkflowCardData } from "../../../src/features/cook-mode/WorkflowCard";
import { RecipeInfographic } from "../../../src/features/cook-mode/RecipeInfographic";
import { CookCompleteSheet } from "../../../src/features/cook-mode/CookCompleteSheet";
import { MotivationalBubble } from "../../../src/features/cook-mode/MotivationalBubble";
import { CardGridOverlay } from "../../../src/features/cook-mode/CardGridOverlay";
import { VideoGuideOverlay } from "../../../src/features/cook-mode/VideoGuideOverlay";
import { SocialShareScreen } from "../../../src/features/cook-mode/SocialShareScreen";
import { BypassBanner } from "../../../src/features/cook-mode/BypassBanner";
import { useCookQuips } from "../../../src/hooks/useCookQuips";
import { useSettingsStore } from "../../../src/lib/stores/settingsStore";
import { useMealPlanStore } from "../../../src/lib/stores/mealPlanStore";
import { useTimerStore } from "../../../src/lib/stores/timerStore";
import { useTrackingStore } from "../../../src/lib/stores/trackingStore";
import { successNotification, mediumTap, lightTap } from "../../../src/lib/haptics";
import type { Recipe } from "../../../src/lib/stores/recipeStore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ── Cook Mode Screen ──────────────────────────────────────────────
// RULE 2: Every recipe is workflow cards. Never render a traditional
// ingredients + method view. Always 3-6 swipeable step cards.
export default function CookModeScreen() {
  const { recipeId } = useLocalSearchParams<{ recipeId: string }>();
  const getRecipeWithDetails = useRecipeStore((s) => s.getRecipeWithDetails);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [currentCard, setCurrentCard] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showComplete, setShowComplete] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [feedbackPhotoUrl, setFeedbackPhotoUrl] = useState<string | undefined>();
  const [showInfographic, setShowInfographic] = useState(false);
  const [showEntryGrid, setShowEntryGrid] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [completedCards, setCompletedCards] = useState<Set<number>>(new Set());
  const [videoOverlay, setVideoOverlay] = useState<{
    url: string;
    title: string;
    cardId?: string;
  } | null>(null);
  const translateX = useRef(new Animated.Value(0)).current;

  // Timer store
  const activeTimerCount = useTimerStore((s) => s.getActiveCount());
  const clearAllTimers = useTimerStore((s) => s.clearAll);

  // Card view duration tracking
  const cardStartTime = useRef<number>(Date.now());

  // Bypass detection
  const mealPlanEntries = useMealPlanStore((s) => s.entries);
  const [isBypass, setIsBypass] = useState(false);
  const [showBypassBanner, setShowBypassBanner] = useState(false);

  useEffect(() => {
    if (!recipeId || !recipe) return;
    const today = new Date().toISOString().slice(0, 10);
    const isPlanned = mealPlanEntries.some(
      (e) => e.date === today && e.recipe_id === recipeId
    );
    if (!isPlanned) {
      setIsBypass(true);
      setShowBypassBanner(true);
    }
  }, [recipeId, recipe, mealPlanEntries]);

  // Motivational bubble state
  const bubblesEnabled = useSettingsStore((s) => s.motivationalBubbles);
  const cookQuips = useCookQuips();
  const [stepsCompleted, setStepsCompleted] = useState(0);
  const [bubbleQuip, setBubbleQuip] = useState<{ text: string; emoji: string } | null>(null);
  const usedQuips = useRef<Set<string>>(new Set());

  // Load recipe with workflow cards
  useEffect(() => {
    if (!recipeId) return;
    setIsLoading(true);
    getRecipeWithDetails(recipeId).then((r) => {
      setRecipe(r);
      setIsLoading(false);
    });
  }, [recipeId, getRecipeWithDetails]);

  // Track card view duration when card changes
  useEffect(() => {
    const prevStart = cardStartTime.current;
    cardStartTime.current = Date.now();

    if (recipeId && prevStart > 0) {
      const durationMs = Date.now() - prevStart;
      if (durationMs > 500) {
        useTrackingStore.getState().logCardViewEvent({
          recipeId,
          cardId: `card-${currentCard}`,
          durationMs,
        });
      }
    }
  }, [currentCard, recipeId]);

  // Build workflow card data from recipe
  const workflowCards: WorkflowCardData[] =
    recipe?.workflow_cards?.map((wc) => ({
      card_number: wc.card_number,
      total_cards: recipe.workflow_cards?.length ?? 0,
      title: wc.title,
      photo_url: wc.photo_url,
      instructions: wc.instructions,
      success_marker: wc.success_marker,
      timer_seconds: wc.timer_seconds,
      parallel_task: wc.parallel_task,
      card_type: wc.card_type,
      heat_level: wc.heat_level,
      technique_icon: wc.technique_icon,
      ingredients_used: wc.ingredients_used,
      pro_tip: wc.pro_tip,
      video_url: wc.video_url,
      card_id: wc.id,
    })) ?? [];

  // If no workflow cards in DB, create a simple set from ingredients/description
  const displayCards: WorkflowCardData[] =
    workflowCards.length > 0
      ? workflowCards
      : recipe
        ? [
            {
              card_number: 1,
              total_cards: 3,
              title: "GATHER",
              instructions: [
                `Get your ${recipe.vessel} ready.`,
                ...(recipe.ingredients?.map(
                  (i) =>
                    `${i.quantity ?? ""} ${i.unit ?? ""} ${i.name}`.trim()
                ) ?? ["Check the ingredient list"]),
              ],
              success_marker: "Everything prepped and within reach",
            },
            {
              card_number: 2,
              total_cards: 3,
              title: "COOK",
              instructions: [
                recipe.description ?? "Follow the recipe steps.",
              ],
              timer_seconds:
                (recipe.cook_time_minutes ?? recipe.total_time_minutes) * 60,
            },
            {
              card_number: 3,
              total_cards: 3,
              title: "PLATE",
              instructions: [
                "Plate up and enjoy!",
                ...(recipe.tips?.length ? [recipe.tips[0]] : []),
              ],
              success_marker: "Looking good! Time to eat.",
            },
          ]
        : [];

  // Motivational bubble logic
  const showMotivationalBubble = useCallback(() => {
    const available = cookQuips.filter((q) => !usedQuips.current.has(q.id));
    if (available.length === 0) return;
    const quip = available[Math.floor(Math.random() * available.length)];
    usedQuips.current.add(quip.id);
    setBubbleQuip({ text: quip.text, emoji: quip.emoji });
  }, [cookQuips]);

  // Navigate to next card
  const goNext = useCallback(() => {
    const newCount = stepsCompleted + 1;
    setStepsCompleted(newCount);

    // Mark current card as completed
    setCompletedCards((prev) => new Set(prev).add(currentCard));

    // Show bubble every 2 steps (if enabled)
    if (bubblesEnabled && newCount % 2 === 0) {
      showMotivationalBubble();
    }

    if (currentCard >= displayCards.length - 1) {
      successNotification();
      setShowComplete(true);
      return;
    }

    Animated.timing(translateX, {
      toValue: -SCREEN_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setCurrentCard((prev) => prev + 1);
      translateX.setValue(SCREEN_WIDTH);
      Animated.timing(translateX, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  }, [currentCard, displayCards.length, translateX, stepsCompleted, showMotivationalBubble]);

  // Jump to specific card from grid
  const jumpToCard = useCallback((index: number) => {
    setShowGrid(false);
    if (index === currentCard) return;
    const direction = index > currentCard ? -SCREEN_WIDTH : SCREEN_WIDTH;
    Animated.timing(translateX, {
      toValue: direction,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setCurrentCard(index);
      translateX.setValue(-direction);
      Animated.timing(translateX, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  }, [currentCard, translateX]);

  // Handle video guide
  const handleWatchVideo = useCallback((url: string, title: string, cardId?: string) => {
    setVideoOverlay({ url, title, cardId });
  }, []);

  // Navigate to previous card
  const goPrev = useCallback(() => {
    if (currentCard <= 0) return;

    Animated.timing(translateX, {
      toValue: SCREEN_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setCurrentCard((prev) => prev - 1);
      translateX.setValue(-SCREEN_WIDTH);
      Animated.timing(translateX, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  }, [currentCard, translateX]);

  // Swipe gesture
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 20 &&
        Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderMove: (_, gesture) => {
        translateX.setValue(gesture.dx);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx < -80) {
          goNext();
        } else if (gesture.dx > 80) {
          goPrev();
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            damping: 20,
            stiffness: 200,
          }).start();
        }
      },
    })
  ).current;

  // ── Loading state ──
  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <StatusBar barStyle="dark-content" />
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <View style={{ marginBottom: 16 }}>
            <ChefHat
              size={48}
              color={Colors.text.muted}
              strokeWidth={1.5}
            />
          </View>
          <Text style={{ fontSize: 16, color: Colors.text.muted }}>
            Loading recipe...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── No recipe found ──
  if (!recipe) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <StatusBar barStyle="dark-content" />
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              color: Colors.text.primary,
              marginBottom: 16,
            }}
          >
            Recipe not found
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={{
              backgroundColor: Colors.primary,
              paddingVertical: 12,
              paddingHorizontal: 32,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: "#FFF", fontSize: 16, fontWeight: "600" }}>
              Back to Feed
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const card = displayCards[currentCard];
  if (!card && !showComplete && !showInfographic) return null;

  // ── Social share screen ──
  if (showShare) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <StatusBar barStyle="dark-content" />
        <SocialShareScreen
          recipeId={recipe.id}
          recipeTitle={recipe.title}
          chefName={recipe.chef_name}
          photoUrl={feedbackPhotoUrl}
          heroImageUrl={recipe.hero_image_url}
          onDone={() => {
            clearAllTimers();
            router.back();
          }}
        />
      </SafeAreaView>
    );
  }

  // ── Cook complete screen ──
  if (showComplete) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <StatusBar barStyle="dark-content" />
        <CookCompleteSheet
          recipeId={recipe.id}
          recipeTitle={recipe.title}
          onComplete={(photoUrl) => {
            setFeedbackPhotoUrl(photoUrl);
            setShowComplete(false);
            setShowShare(true);
          }}
        />
      </SafeAreaView>
    );
  }

  // ── Entry card grid (first thing user sees) ──
  if (showEntryGrid) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <StatusBar barStyle="dark-content" />
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingVertical: 8,
          }}
        >
          <Pressable
            onPress={() => { mediumTap(); router.back(); }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <X size={16} color={Colors.text.muted} strokeWidth={1.5} />
              <Text style={{ color: Colors.text.muted, fontSize: 16 }}>Exit</Text>
            </View>
          </Pressable>
          <Text
            style={{
              flex: 1,
              textAlign: "center",
              fontWeight: "600",
              fontSize: 15,
              color: Colors.text.primary,
            }}
            numberOfLines={1}
          >
            {recipe.title}
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <CardGridOverlay
          cards={displayCards}
          currentCard={0}
          completedCards={completedCards}
          onSelectCard={(index) => {
            setShowEntryGrid(false);
            jumpToCard(index);
          }}
          onClose={() => {
            setShowEntryGrid(false);
          }}
          inline
        />
      </SafeAreaView>
    );
  }

  // ── Infographic overview (shown before cook cards) ──
  if (showInfographic) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <StatusBar barStyle="dark-content" />

        {/* Exit button */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingVertical: 8,
          }}
        >
          <Pressable
            onPress={() => {
              mediumTap();
              router.back();
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <X
                size={16}
                color={Colors.text.muted}
                strokeWidth={1.5}
              />
              <Text
                style={{ color: Colors.text.muted, fontSize: 16 }}
              >
                Exit
              </Text>
            </View>
          </Pressable>
        </View>

        <RecipeInfographic
          recipe={{
            title: recipe.title,
            total_time: recipe.total_time_minutes,
            servings: recipe.serves,
          }}
          cards={displayCards}
          onStart={() => setShowInfographic(false)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="dark-content" />

      {/* Header bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingVertical: 8,
        }}
      >
        <Pressable
          onPress={() => {
            mediumTap();
            router.back();
          }}
        >
          <View
            style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
          >
            <X size={16} color={Colors.text.muted} strokeWidth={1.5} />
            <Text style={{ color: Colors.text.muted, fontSize: 16 }}>
              Exit
            </Text>
          </View>
        </Pressable>

        <Text
          style={{
            color: Colors.text.primary,
            fontSize: 14,
            fontWeight: "600",
            flex: 1,
            textAlign: "center",
          }}
          numberOfLines={1}
        >
          {recipe.title}
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {activeTimerCount > 0 && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: "rgba(232, 169, 62, 0.12)",
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 12,
              }}
            >
              <Clock size={12} color={Colors.alert} strokeWidth={1.5} />
              <Text style={{ fontSize: 12, fontWeight: "700", color: Colors.alert }}>
                {activeTimerCount}
              </Text>
            </View>
          )}
          <Pressable
            onPress={() => {
              lightTap();
              setShowGrid(true);
            }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: Colors.background,
              borderWidth: 1,
              borderColor: Colors.border,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <LayoutGrid size={16} color={Colors.text.secondary} strokeWidth={1.5} />
          </Pressable>
        </View>
      </View>

      {/* Progress bar */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 8 }}>
        <View
          style={{
            height: 3,
            backgroundColor: Colors.border,
            borderRadius: 1.5,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              height: 3,
              borderRadius: 1.5,
              backgroundColor: Colors.primary,
              width: `${((currentCard + 1) / displayCards.length) * 100}%`,
            }}
          />
        </View>
        <Text
          style={{
            textAlign: "center",
            fontSize: 12,
            color: Colors.text.muted,
            marginTop: 6,
          }}
        >
          Step {currentCard + 1} of {displayCards.length}
        </Text>
      </View>

      {/* Swipeable workflow card */}
      <Animated.View
        {...panResponder.panHandlers}
        style={{
          flex: 1,
          transform: [{ translateX }],
        }}
      >
        <WorkflowCard
          card={card}
          onDone={goNext}
          onWatchVideo={handleWatchVideo}
        />
      </Animated.View>

      {/* Navigation hint */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          paddingHorizontal: 24,
          paddingBottom: 8,
        }}
      >
        <Text
          style={{
            color: Colors.text.muted,
            opacity: 0.4,
            fontSize: 12,
          }}
        >
          {currentCard > 0 ? "\u2190 Swipe back" : ""}
        </Text>
        <Text
          style={{
            color: Colors.text.muted,
            opacity: 0.4,
            fontSize: 12,
          }}
        >
          {currentCard < displayCards.length - 1 ? "Swipe next \u2192" : ""}
        </Text>
      </View>

      {/* Bypass banner */}
      {showBypassBanner && (
        <BypassBanner onDismiss={() => setShowBypassBanner(false)} />
      )}

      {/* Motivational glass bubble */}
      {bubbleQuip && (
        <MotivationalBubble
          text={bubbleQuip.text}
          emoji={bubbleQuip.emoji}
          onDismiss={() => setBubbleQuip(null)}
        />
      )}

      {/* Card grid overlay */}
      {showGrid && (
        <CardGridOverlay
          cards={displayCards}
          currentCard={currentCard}
          completedCards={completedCards}
          onSelectCard={jumpToCard}
          onClose={() => setShowGrid(false)}
        />
      )}

      {/* Video guide overlay */}
      {videoOverlay && (
        <VideoGuideOverlay
          videoUrl={videoOverlay.url}
          cardTitle={videoOverlay.title}
          cardId={videoOverlay.cardId}
          recipeId={recipeId}
          onClose={() => setVideoOverlay(null)}
        />
      )}
    </SafeAreaView>
  );
}
