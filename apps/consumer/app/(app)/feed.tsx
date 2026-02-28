import { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  Linking,
  Pressable,
  Keyboard,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { UtensilsCrossed, Wrench } from "lucide-react-native";
import { Colors, Glass } from "../../src/constants/colors";
import { FeedCard } from "../../src/features/feed";
import type { FeedCardItem } from "../../src/features/feed";
import { SwipeableFeedCard } from "../../src/features/feed/SwipeableFeedCard";
import { CardDetailOverlay } from "../../src/features/feed/CardDetailOverlay";
import { CompanionBubble, CompanionQuickMenu } from "../../src/features/companion";
import { FloatingNudges } from "../../src/features/companion/FloatingNudges";
import { TextModeNav } from "../../src/features/companion/TextModeNav";
import { CanvasScreen, getSmartSuggestion } from "../../src/features/canvas/CanvasScreen";
import { OverlaySheet } from "../../src/features/overlays/OverlaySheet";
import { ShoppingListOverlay } from "../../src/features/overlays/ShoppingListOverlay";
import { KitchenOverlay } from "../../src/features/overlays/KitchenOverlay";
import { CellarOverlay } from "../../src/features/overlays/CellarOverlay";
import { BarOverlay } from "../../src/features/overlays/BarOverlay";
import { MyRecipesOverlay } from "../../src/features/overlays/MyRecipesOverlay";
import { MealPlanOverlay } from "../../src/features/overlays/MealPlanOverlay";
import { SettingsOverlay } from "../../src/features/overlays/SettingsOverlay";
import NoshDnaOverlay from "../../src/features/overlays/NoshDnaOverlay";
import { VendorDiscoveryOverlay } from "../../src/features/overlays/VendorDiscoveryOverlay";
import { MyDealsOverlay } from "../../src/features/vendors/MyDealsOverlay";
import { NoshRunOverlay } from "../../src/features/nosh-run";
import { SocialCookingOverlay } from "../../src/features/social-cooking";
import { CompanionChatOverlay } from "../../src/features/companion";
import { PageContainer } from "../../src/features/pages/PageContainer";
import { useFeedEngine } from "../../src/hooks/useFeedEngine";
import { useFeedStore } from "../../src/lib/stores/feedStore";
import { useFavouritesStore } from "../../src/lib/stores/favouritesStore";
import { usePersonalityStore } from "../../src/lib/stores/personalityStore";
import { useCompanionStore } from "../../src/lib/companion/companionStore";
import { useSettingsStore } from "../../src/lib/stores/settingsStore";
import { useVoiceInput } from "../../src/lib/companion/useVoiceInput";
import { useCameraInput } from "../../src/lib/companion/useCameraInput";
import { useWakeWord } from "../../src/lib/companion/useWakeWord";
import { useCompanionChat } from "../../src/hooks/useCompanionChat";
import { noshStopSpeaking } from "../../src/lib/companion/noshSpeak";
import { ProfileBuilderOverlay } from "../../src/features/workflows/profileBuilder/ProfileBuilderOverlay";
import { WalkthroughOverlay } from "../../src/features/workflows/walkthrough/WalkthroughOverlay";
import { PersonalityQuizOverlay } from "../../src/features/workflows/personalityQuiz/PersonalityQuizOverlay";
import { RecipeLifecycleOverlay } from "../../src/features/workflows/recipeLifecycle/RecipeLifecycleOverlay";
import { useDevAccess } from "../../src/lib/devAccess";
import { useTrackingStore } from "../../src/lib/stores/trackingStore";
import { ShoppingPageOverlay } from "../../src/features/shopping";
import { NudgeAdminPanel } from "../../src/features/admin/NudgeAdminPanel";

// ── Overlay keys (workflow-only now) ──────────────────────────────
type OverlayKey =
  | "profile_builder"
  | "walkthrough"
  | "personality_quiz"
  | "recipe_lifecycle"
  | null;

const WORKFLOW_OVERLAYS = ["profile_builder", "walkthrough", "personality_quiz", "recipe_lifecycle"];

const OVERLAY_TITLES: Record<string, string> = {
  shopping_list: "Shopping List",
  kitchen: "My Kitchen",
  cellar: "My Cellar",
  bar: "My Bar",
  my_recipes: "My Recipes",
  meal_plan: "My Plan",
  settings: "Settings",
  chat: "Prep Mi Companion",
  nosh_run: "Prep Run",
  social_cooking: "Social Prep",
  nosh_dna: "Your Prep DNA",
  vendors: "Vendors",
  my_deals: "My Deals",
  shopping_page: "Shopping",
  profile_builder: "Build Your Profile",
  walkthrough: "App Walkthrough",
  personality_quiz: "Build Your Prep",
  recipe_lifecycle: "Recipe Lifecycle",
  nudge_config: "Nudge Config",
};

// ── Main Screen ───────────────────────────────────────────────────
export default function FeedScreen() {
  const activeScreen = useCompanionStore((s) => s.activeScreen);
  const setActiveScreen = useCompanionStore((s) => s.setActiveScreen);
  const activePage = useCompanionStore((s) => s.activePage);
  const setActivePage = useCompanionStore((s) => s.setActivePage);
  const pushResponse = useCompanionStore((s) => s.pushResponse);
  const setInputVisible = useCompanionStore((s) => s.setInputVisible);
  const inputVisible = useCompanionStore((s) => s.inputVisible);
  const setCommunicationMode = useCompanionStore((s) => s.setCommunicationMode);
  const setTextNavVisible = useCompanionStore((s) => s.setTextNavVisible);
  const communicationMode = useCompanionStore((s) => s.communicationMode);

  const isSmartNav = useSettingsStore((s) => s.smartNav);

  const runNudgeCheck = usePersonalityStore((s) => s.runNudgeCheck);
  const fetchAchievements = usePersonalityStore((s) => s.fetchAchievements);
  const nudgeCheckDone = useRef(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [activeOverlay, setActiveOverlay] = useState<OverlayKey>(null);
  const [detailItem, setDetailItem] = useState<FeedCardItem | null>(null);

  const { start: startVoice, isListening, transcript } = useVoiceInput();
  const { launchCamera } = useCameraInput();
  const { sendMessage } = useCompanionChat();
  useWakeWord(); // "Hey NOSH" background listener (web only, feed screen)

  // Auto-submit voice transcript when listening stops
  const prevListening = useRef(false);
  useEffect(() => {
    if (prevListening.current && !isListening && transcript.trim()) {
      sendMessage(transcript.trim());
    }
    prevListening.current = isListening;
  }, [isListening, transcript, sendMessage]);

  // Run nudge check once on mount
  useEffect(() => {
    if (nudgeCheckDone.current) return;
    nudgeCheckDone.current = true;
    fetchAchievements();
    runNudgeCheck(0, 0);
  }, [runNudgeCheck, fetchAchievements]);

  // ── Smart Nav: time-aware initial screen ──
  const smartNavInit = useRef(false);
  useEffect(() => {
    if (!isSmartNav || smartNavInit.current) return;
    smartNavInit.current = true;
    const hour = new Date().getHours();
    if (hour >= 11 && hour < 20) {
      setActiveScreen("feed");
    }
  }, [isSmartNav, setActiveScreen]);

  // ── Smart Nav: idle timeout on canvas → feed after 60s ──
  useEffect(() => {
    if (!isSmartNav || activeScreen !== "canvas") return;
    const timer = setTimeout(() => setActiveScreen("feed"), 60_000);
    return () => clearTimeout(timer);
  }, [isSmartNav, activeScreen, setActiveScreen, inputVisible, communicationMode]);

  const callNosh = useCompanionStore((s) => s.callNosh);
  const setVoiceEnabled = useCompanionStore((s) => s.setVoiceEnabled);

  // ── Bubble handlers ──
  const handleBubbleTap = useCallback(() => {
    noshStopSpeaking();
    if (isSmartNav) {
      // Smart nav: always go home (canvas), no wake message
      setActiveScreen("canvas");
      setActivePage(null);
    } else if (activeScreen === "feed" || activeScreen === "page") {
      callNosh(); // Returns to canvas + clears activePage
    } else {
      const suggestion = getSmartSuggestion();
      pushResponse(suggestion);
    }
  }, [activeScreen, isSmartNav, callNosh, pushResponse, setActiveScreen, setActivePage]);

  const handleBubbleDoubleTap = useCallback(() => {
    setInputVisible(!inputVisible);
  }, [inputVisible, setInputVisible]);

  const handleBubbleLongPress = useCallback(() => {
    setMenuOpen(true);
  }, []);

  // ── Action handler (canvas responses + pages) ──
  const openPage = useCallback(
    (key: string) => {
      if (WORKFLOW_OVERLAYS.includes(key)) {
        setActiveOverlay(key as OverlayKey);
      } else {
        setActiveScreen("page");
        setActivePage(key);
      }
    },
    [setActiveScreen, setActivePage],
  );

  const handleAction = useCallback(
    (action: string, recipeId?: string) => {
      if (action.startsWith("cook:")) {
        const id = action.replace("cook:", "");
        router.push(`/(app)/cook-mode/${id}`);
      } else if (action === "dismiss_nudge") {
        usePersonalityStore.getState().declineNudge();
      } else {
        // Map "open_X" actions to page keys
        const pageKey = action.replace(/^open_/, "");
        if (pageKey in OVERLAY_TITLES) {
          openPage(pageKey);
        }
      }
    },
    [openPage],
  );

  // ── 3-second idle timer for text mode ──
  const textIdleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTextIdleTimer = useCallback(() => {
    if (textIdleTimer.current) {
      clearTimeout(textIdleTimer.current);
      textIdleTimer.current = null;
    }
  }, []);

  // Cancel timer when user starts typing
  const inputText = useCompanionStore((s) => s.inputText);
  useEffect(() => {
    if (communicationMode === "text" && inputText.length > 0) {
      clearTextIdleTimer();
      setTextNavVisible(false);
    }
  }, [inputText, communicationMode, clearTextIdleTimer, setTextNavVisible]);

  // ── Companion menu actions ──
  const handleCompanionAction = useCallback(
    (key: string) => {
      setMenuOpen(false);
      clearTextIdleTimer();
      switch (key) {
        case "voice":
          setCommunicationMode("mic");
          setVoiceEnabled(true);
          startVoice();
          setActiveScreen("canvas");
          setActivePage(null);
          break;
        case "camera":
          setCommunicationMode("camera");
          launchCamera();
          break;
        case "text":
          setCommunicationMode("text");
          setVoiceEnabled(false);
          noshStopSpeaking();
          setActiveScreen("canvas");
          setActivePage(null);
          setInputVisible(true);
          // Start 3-second idle timer
          textIdleTimer.current = setTimeout(() => {
            setTextNavVisible(true);
          }, 3000);
          break;
        default:
          openPage(key);
          break;
      }
    },
    [openPage, clearTextIdleTimer, setCommunicationMode, setTextNavVisible],
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="dark-content" />

      {/* ── THREE-SCREEN STATE MACHINE ── */}
      {activeScreen === "canvas" ? (
        <CanvasScreen
          onAction={handleAction}
          onSuggestionTap={handleBubbleTap}
        />
      ) : activeScreen === "page" && activePage ? (
        <PageContainer
          title={OVERLAY_TITLES[activePage] ?? ""}
          onBack={() => {
            setActiveScreen("canvas");
            setActivePage(null);
          }}
        >
          <PageContent
            pageKey={activePage}
            onClose={() => {
              setActiveScreen("canvas");
              setActivePage(null);
            }}
            onOpenPage={openPage}
          />
        </PageContainer>
      ) : (
        <FeedView
          onOpenOverlay={openPage}
          onCardTap={(item) => {
            if (item.type === "recipe" && item.data?.id) {
              const recipeId = item.data.id;
              const title = item.data.title ?? "This recipe";
              Alert.alert(title, "What would you like to do?", [
                {
                  text: "Cook Now",
                  onPress: () => router.push(`/(app)/cook-mode/${recipeId}`),
                },
                {
                  text: "View Recipe",
                  onPress: () => router.push(`/(app)/recipe/${recipeId}`),
                },
                { text: "Cancel", style: "cancel" },
              ]);
            } else {
              setDetailItem(item);
            }
          }}
        />
      )}

      {/* ── FLOATING NUDGES (mic mode, canvas only) ── */}
      {activeScreen === "canvas" && (
        <FloatingNudges onAction={(key) => openPage(key)} isSmartNav={isSmartNav} />
      )}

      {/* ── TEXT MODE NAV (text mode, 3s idle) ── */}
      {activeScreen === "canvas" && (
        <TextModeNav onSelect={openPage} />
      )}

      {/* ── COMPANION BUBBLE — always present ── */}
      <CompanionBubble
        onTap={handleBubbleTap}
        onDoubleTap={handleBubbleDoubleTap}
        onLongPress={handleBubbleLongPress}
      />

      {menuOpen && (
        <CompanionQuickMenu
          onSelect={handleCompanionAction}
          onClose={() => setMenuOpen(false)}
          isSmartNav={isSmartNav}
        />
      )}

      {/* ── WORKFLOW OVERLAY SHEETS (modal) ── */}
      <OverlaySheet
        visible={activeOverlay !== null}
        onClose={() => setActiveOverlay(null)}
        title={activeOverlay ? OVERLAY_TITLES[activeOverlay] ?? "" : ""}
      >
        <WorkflowContent
          overlayKey={activeOverlay}
          onClose={() => setActiveOverlay(null)}
        />
      </OverlaySheet>

      {/* ── CARD DETAIL OVERLAY ── */}
      <CardDetailOverlay
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onOpenOverlay={openPage}
      />
    </View>
  );
}

// ── Feed View (doom scroll) ───────────────────────────────────────
function FeedView({ onOpenOverlay, onCardTap }: { onOpenOverlay: (key: string) => void; onCardTap?: (item: FeedCardItem) => void }) {
  const { cards, isLoading, refreshFeed } = useFeedEngine();
  const dismissCard = useFeedStore((s) => s.dismissCard);
  const addFavourite = useFavouritesStore((s) => s.addFavourite);
  const setActiveScreen = useCompanionStore((s) => s.setActiveScreen);
  const callNosh = useCompanionStore((s) => s.callNosh);
  const insets = useSafeAreaInsets();
  const devMode = useDevAccess((s) => s.enabled);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refreshFeed();
    setTimeout(() => setRefreshing(false), 600);
  }, [refreshFeed]);

  const handleSwipeRight = useCallback(
    (item: FeedCardItem) => {
      // Track swipe
      useTrackingStore.getState().logFeedSwipe({
        card_id: item.id,
        card_type: item.type,
        swipe_direction: "right",
      });
      if (item.data?.recipeId || item.data?.id) {
        addFavourite(item.data.recipeId ?? item.data.id);
      }
      dismissCard(item.id);
      // Recipe cards → navigate to recipe detail
      if (item.type === "recipe" && item.data?.id) {
        router.push(`/(app)/recipe/${item.data.id}`);
      }
    },
    [addFavourite, dismissCard],
  );

  const handleSwipeLeft = useCallback(
    (item: FeedCardItem) => {
      useTrackingStore.getState().logFeedSwipe({
        card_id: item.id,
        card_type: item.type,
        swipe_direction: "left",
      });
      dismissCard(item.id);
    },
    [dismissCard],
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        keyboardDismissMode="on-drag"
        data={cards}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 16 }}>
            <SwipeableFeedCard
              item={item}
              onSwipeRight={handleSwipeRight}
              onSwipeLeft={handleSwipeLeft}
              onOpenOverlay={onOpenOverlay}
              onCardTap={onCardTap}
            />
          </View>
        )}
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: 12,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            progressViewOffset={40}
          />
        }
        ListHeaderComponent={
          <Pressable
            onPress={() => callNosh()}
            style={({ pressed }) => ({
              paddingHorizontal: 10,
              paddingTop: 8,
              marginBottom: 10,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text
              style={{
                fontSize: 28,
                fontWeight: "700",
                color: Colors.secondary,
                letterSpacing: 1,
              }}
            >
              Prep Mi
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: Colors.text.muted,
                marginTop: 2,
              }}
            >
              Tap to call
            </Text>
          </Pressable>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={{ alignItems: "center", paddingTop: 80 }}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text
                style={{
                  marginTop: 16,
                  fontSize: 14,
                  color: Colors.text.secondary,
                }}
              >
                Building your feed...
              </Text>
            </View>
          ) : (
            <View style={{ alignItems: "center", paddingTop: 80, paddingHorizontal: 32 }}>
              <UtensilsCrossed size={48} color={Colors.text.muted} strokeWidth={1.5} />
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: Colors.secondary,
                  textAlign: "center",
                  marginBottom: 8,
                  marginTop: 16,
                }}
              >
                Your feed is warming up
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: Colors.text.secondary,
                  textAlign: "center",
                  lineHeight: 20,
                }}
              >
                Recipes are being loaded. Pull down to refresh.
              </Text>
            </View>
          )
        }
      />
      {/* Footer strip */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: Colors.card,
          paddingHorizontal: 16,
          paddingVertical: 6,
          paddingBottom: Math.max(insets.bottom, 6),
          borderTopWidth: 1,
          borderTopColor: Colors.border,
        }}
      >
        <Text style={{ fontSize: 11, color: Colors.text.muted }}>Prep Mi v1.0.0</Text>
        <Pressable onPress={() => Linking.openURL("https://nosh-admin-eight.vercel.app")}>
          <Wrench size={14} color={Colors.text.muted} strokeWidth={1.5} />
        </Pressable>
      </View>
    </View>
  );
}

// ── Page Content (inline pages) ──────────────────────────────────
function PageContent({ pageKey, onClose, onOpenPage }: { pageKey: string; onClose: () => void; onOpenPage: (key: string) => void }) {
  switch (pageKey) {
    case "shopping_list":
      return <ShoppingListOverlay />;
    case "kitchen":
      return <KitchenOverlay />;
    case "cellar":
      return <CellarOverlay />;
    case "bar":
      return <BarOverlay />;
    case "my_recipes":
      return <MyRecipesOverlay />;
    case "meal_plan":
      return <MealPlanOverlay />;
    case "settings":
      return <SettingsOverlay onOpenOverlay={onOpenPage} onClose={onClose} />;
    case "chat":
      return <CompanionChatOverlay />;
    case "nosh_run":
      return <NoshRunOverlay onClose={onClose} />;
    case "social_cooking":
      return <SocialCookingOverlay onClose={onClose} />;
    case "nosh_dna":
      return <NoshDnaOverlay />;
    case "vendors":
      return <VendorDiscoveryOverlay />;
    case "my_deals":
      return <MyDealsOverlay />;
    case "shopping_page":
      return <ShoppingPageOverlay onClose={onClose} />;
    case "nudge_config":
      return <NudgeAdminPanel onBack={onClose} />;
    default:
      return null;
  }
}

// ── Workflow Content (overlay sheets — modal) ────────────────────
function WorkflowContent({ overlayKey, onClose }: { overlayKey: OverlayKey; onClose: () => void }) {
  switch (overlayKey) {
    case "profile_builder":
      return <ProfileBuilderOverlay onClose={onClose} />;
    case "walkthrough":
      return <WalkthroughOverlay onClose={onClose} />;
    case "personality_quiz":
      return <PersonalityQuizOverlay onClose={onClose} />;
    case "recipe_lifecycle":
      return <RecipeLifecycleOverlay onClose={onClose} />;
    default:
      return null;
  }
}
