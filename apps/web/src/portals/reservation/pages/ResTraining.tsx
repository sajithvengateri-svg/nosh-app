import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  CalendarCheck,
  Map,
  PartyPopper,
  Kanban,
  BarChart3,
  Globe,
  X,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Play,
  RotateCcw,
  ExternalLink,
  Lightbulb,
  GraduationCap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";

import {
  TRAINING_DECKS,
  type TrainingDeck,
  type TrainingCard,
} from "../data/trainingDeckData";

// ---------------------------------------------------------------------------
// Icon mapping — deck.icon is a string key that resolves to a Lucide component
// ---------------------------------------------------------------------------
const DECK_ICONS: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  LayoutDashboard,
  CalendarCheck,
  Map,
  PartyPopper,
  Kanban,
  BarChart3,
  Globe,
};

// ---------------------------------------------------------------------------
// Progress persistence types
// ---------------------------------------------------------------------------
interface DeckProgress {
  completedCards: string[];
  lastCardIndex: number;
}

const STORAGE_KEY = "res_training_progress";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getDeckStatus(
  deck: TrainingDeck,
  progress: Record<string, DeckProgress>,
): "not_started" | "in_progress" | "completed" {
  const dp = progress[deck.id];
  if (!dp || dp.completedCards.length === 0) return "not_started";
  if (dp.completedCards.length >= deck.cards.length) return "completed";
  return "in_progress";
}

function getDeckPercent(
  deck: TrainingDeck,
  progress: Record<string, DeckProgress>,
): number {
  const dp = progress[deck.id];
  if (!dp) return 0;
  return Math.round((dp.completedCards.length / deck.cards.length) * 100);
}

function filterDecks(decks: TrainingDeck[], role: string): TrainingDeck[] {
  if (role === "all") return decks;
  return decks.filter((d) => d.role === role || d.role === "all");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const ResTraining = () => {
  const navigate = useNavigate();

  // --- State ---------------------------------------------------------------
  const [roleFilter, setRoleFilter] = useState("all");
  const [activeDeck, setActiveDeck] = useState<TrainingDeck | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [done, setDone] = useState(false);

  const [progress, setProgress] = useState<Record<string, DeckProgress>>(
    () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : {};
      } catch {
        return {};
      }
    },
  );

  // Persist progress --------------------------------------------------------
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  // Cancel speech on unmount ------------------------------------------------
  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // --- Speech --------------------------------------------------------------
  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    u.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
    setSpeaking(true);
  }, []);

  const stopSpeech = useCallback(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  }, []);

  // --- Deck actions --------------------------------------------------------
  const openDeck = (deck: TrainingDeck) => {
    const dp = progress[deck.id];
    const status = getDeckStatus(deck, progress);

    setActiveDeck(deck);
    setDone(false);

    if (status === "in_progress" && dp) {
      setCurrentIndex(dp.lastCardIndex);
    } else {
      setCurrentIndex(0);
    }
  };

  const closeDeck = () => {
    stopSpeech();
    setActiveDeck(null);
    setCurrentIndex(0);
    setDone(false);
  };

  const markCardComplete = (deck: TrainingDeck, cardId: string, idx: number) => {
    setProgress((prev) => {
      const existing = prev[deck.id] ?? { completedCards: [], lastCardIndex: 0 };
      const completed = existing.completedCards.includes(cardId)
        ? existing.completedCards
        : [...existing.completedCards, cardId];
      return {
        ...prev,
        [deck.id]: {
          completedCards: completed,
          lastCardIndex: idx,
        },
      };
    });
  };

  const handleNext = () => {
    if (!activeDeck) return;
    stopSpeech();

    const card = activeDeck.cards[currentIndex];
    markCardComplete(activeDeck, card.id, currentIndex);

    if (currentIndex < activeDeck.cards.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setDone(true);
    }
  };

  const handlePrev = () => {
    stopSpeech();
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleReplay = () => {
    if (!activeDeck) return;
    setProgress((prev) => {
      const copy = { ...prev };
      delete copy[activeDeck.id];
      return copy;
    });
    setCurrentIndex(0);
    setDone(false);
  };

  // --- Filtered decks ------------------------------------------------------
  const filteredDecks = filterDecks(TRAINING_DECKS, roleFilter);

  // --- Render: Deck Selector -----------------------------------------------
  const renderDeckCard = (deck: TrainingDeck) => {
    const IconComponent = DECK_ICONS[deck.icon] ?? GraduationCap;
    const status = getDeckStatus(deck, progress);
    const percent = getDeckPercent(deck, progress);
    const estimatedMinutes = Math.max(1, Math.ceil(deck.cards.length * 1.5));

    let buttonLabel: string;
    let ButtonIcon: React.ComponentType<React.SVGProps<SVGSVGElement>>;

    switch (status) {
      case "completed":
        buttonLabel = "Replay";
        ButtonIcon = RotateCcw;
        break;
      case "in_progress":
        buttonLabel = "Resume";
        ButtonIcon = Play;
        break;
      default:
        buttonLabel = "Start";
        ButtonIcon = Play;
    }

    return (
      <Card
        key={deck.id}
        className="flex flex-col justify-between hover:shadow-md transition-shadow"
      >
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <IconComponent className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base leading-tight">
                {deck.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {deck.description}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-3">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <GraduationCap className="h-3.5 w-3.5" />
              {deck.cards.length} cards
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              ~{estimatedMinutes} min
            </span>
            {status === "completed" && (
              <Badge variant="secondary" className="ml-auto text-xs">
                Completed
              </Badge>
            )}
          </div>

          <Progress value={percent} className="h-1.5" />

          <Button
            size="sm"
            className="w-full"
            variant={status === "completed" ? "outline" : "default"}
            onClick={() => openDeck(deck)}
          >
            <ButtonIcon className="h-4 w-4 mr-1.5" />
            {buttonLabel}
          </Button>
        </CardContent>
      </Card>
    );
  };

  // --- Render: Training Player ---------------------------------------------
  const renderPlayer = () => {
    if (!activeDeck) return null;

    const totalCards = activeDeck.cards.length;
    const playerPercent = done
      ? 100
      : Math.round((currentIndex / totalCards) * 100);

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex flex-col"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-sm font-semibold truncate">{activeDeck.title}</h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => (speaking ? stopSpeech() : undefined)}
              aria-label={speaking ? "Stop speech" : "Voice toggle"}
            >
              {speaking ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={closeDeck}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="px-4 pt-3 space-y-1">
          <Progress value={playerPercent} className="h-1.5" />
          <p className="text-xs text-muted-foreground text-center">
            {done
              ? `${totalCards} of ${totalCards} completed`
              : `Card ${currentIndex + 1} of ${totalCards}`}
          </p>
        </div>

        {/* Card content area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 flex items-start justify-center">
          <div className="w-full max-w-md">
            <AnimatePresence mode="wait">
              {done ? (
                <motion.div
                  key="completion"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.2 }}
                  className="text-center space-y-6 py-8"
                >
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <GraduationCap className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Deck Complete!</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      You finished all {totalCards} cards in{" "}
                      <span className="font-medium">{activeDeck.title}</span>.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Was this training helpful?
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <Button variant="outline" size="sm" onClick={closeDeck}>
                        <ThumbsUp className="h-4 w-4 mr-1.5" />
                        Yes
                      </Button>
                      <Button variant="outline" size="sm" onClick={closeDeck}>
                        <ThumbsDown className="h-4 w-4 mr-1.5" />
                        Not really
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <Button variant="secondary" onClick={handleReplay}>
                      <RotateCcw className="h-4 w-4 mr-1.5" />
                      Replay Deck
                    </Button>
                    <Button variant="ghost" onClick={closeDeck}>
                      Back to Training Center
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  {(() => {
                    const card: TrainingCard = activeDeck.cards[currentIndex];
                    return (
                      <>
                        {/* Card number circle */}
                        <div className="flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                            {currentIndex + 1}
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-semibold text-center">
                          {card.title}
                        </h3>

                        {/* Content */}
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {card.content}
                        </p>

                        {/* Tips */}
                        {card.tips && card.tips.length > 0 && (
                          <div className="space-y-2">
                            {card.tips.map((tip, i) => (
                              <div
                                key={i}
                                className="flex items-start gap-2 rounded-md bg-primary/5 p-3"
                              >
                                <Lightbulb className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                                <span className="text-sm">{tip}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Try it button */}
                        {card.navLink && (
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              closeDeck();
                              navigate(card.navLink!);
                            }}
                          >
                            <ExternalLink className="h-4 w-4 mr-1.5" />
                            Try it
                          </Button>
                        )}

                        {/* Voice button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-muted-foreground"
                          onClick={() => {
                            if (speaking) {
                              stopSpeech();
                            } else {
                              const tipText =
                                card.tips && card.tips.length > 0
                                  ? " Tips: " + card.tips.join(". ")
                                  : "";
                              speak(card.title + ". " + card.content + tipText);
                            }
                          }}
                        >
                          {speaking ? (
                            <>
                              <VolumeX className="h-4 w-4 mr-1.5" />
                              Stop reading
                            </>
                          ) : (
                            <>
                              <Volume2 className="h-4 w-4 mr-1.5" />
                              Read aloud
                            </>
                          )}
                        </Button>
                      </>
                    );
                  })()}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom navigation */}
        {!done && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrev}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Button size="sm" onClick={handleNext}>
              {currentIndex < totalCards - 1 ? (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              ) : (
                "Finish"
              )}
            </Button>
          </div>
        )}
      </motion.div>
    );
  };

  // --- Main render ---------------------------------------------------------
  return (
    <>
      <div className="p-4 lg:p-6 space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            Training Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Interactive training decks for your team
          </p>
        </div>

        {/* Role filter tabs */}
        <Tabs
          value={roleFilter}
          onValueChange={setRoleFilter}
          className="w-full"
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="venue_manager">Managers</TabsTrigger>
            <TabsTrigger value="floor_manager">Floor Staff</TabsTrigger>
            <TabsTrigger value="waiter">Waiters</TabsTrigger>
          </TabsList>

          {/* We render a single TabsContent for each value, but the grid is
              the same — just filtered. Using TabsContent keeps the Tabs
              component semantically correct. */}
          {["all", "venue_manager", "floor_manager", "waiter"].map((role) => (
            <TabsContent key={role} value={role} className="mt-4">
              {filterDecks(TRAINING_DECKS, role).length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No training decks available for this role yet.
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {filterDecks(TRAINING_DECKS, role).map(renderDeckCard)}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Training Player overlay */}
      <AnimatePresence>{activeDeck && renderPlayer()}</AnimatePresence>
    </>
  );
};

export default ResTraining;
