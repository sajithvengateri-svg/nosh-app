import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  Animated,
  PanResponder,
  Dimensions,
  ScrollView,
  StatusBar,
  Platform,
} from "react-native";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Timer,
  Image as ImageIcon,
} from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeProvider";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ViewerStep {
  text: string;
  timer_minutes?: number | null;
  image_url?: string | null;
}

interface StepByStepViewerProps {
  visible: boolean;
  onClose: () => void;
  steps: ViewerStep[];
  title?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = 80;
const AUTOPLAY_INTERVAL_MS = 8000;
const DOT_LIMIT = 12;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StepByStepViewer({
  visible,
  onClose,
  steps,
  title = "Method",
}: StepByStepViewerProps) {
  const { colors, isDark } = useTheme();

  // ---- state ----
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // ---- refs ----
  const translateX = useRef(new Animated.Value(0)).current;
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressAnim = useRef(new Animated.Value(1)).current;
  const progressAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  const totalSteps = steps.length;
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;
  const canNavigate = totalSteps > 1;

  // ---- navigation helpers ----
  const goToStep = useCallback(
    (index: number) => {
      if (index < 0 || index >= totalSteps) return;
      setCurrentStep(index);
    },
    [totalSteps]
  );

  const goNext = useCallback(() => {
    if (!isLast) goToStep(currentStep + 1);
  }, [currentStep, isLast, goToStep]);

  const goPrev = useCallback(() => {
    if (!isFirst) goToStep(currentStep - 1);
  }, [currentStep, isFirst, goToStep]);

  // ---- autoplay ----
  const stopAutoplay = useCallback(() => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }
    if (progressAnimRef.current) {
      progressAnimRef.current.stop();
      progressAnimRef.current = null;
    }
    progressAnim.setValue(1);
    setIsPlaying(false);
  }, [progressAnim]);

  const startProgressAnimation = useCallback(() => {
    progressAnim.setValue(1);
    if (progressAnimRef.current) {
      progressAnimRef.current.stop();
    }
    const anim = Animated.timing(progressAnim, {
      toValue: 0,
      duration: AUTOPLAY_INTERVAL_MS,
      useNativeDriver: false,
    });
    progressAnimRef.current = anim;
    anim.start();
  }, [progressAnim]);

  const startAutoplay = useCallback(() => {
    if (isLast) return;
    stopAutoplay();
    setIsPlaying(true);
    startProgressAnimation();
    autoplayRef.current = setInterval(() => {
      setCurrentStep((prev) => {
        const next = prev + 1;
        if (next >= totalSteps - 1) {
          // Will land on last step — stop after advancing
          setTimeout(() => stopAutoplay(), 0);
          return totalSteps - 1;
        }
        return next;
      });
    }, AUTOPLAY_INTERVAL_MS);
  }, [isLast, totalSteps, stopAutoplay, startProgressAnimation]);

  // Restart progress bar animation each time step changes while playing
  useEffect(() => {
    if (isPlaying && !isLast) {
      startProgressAnimation();
    }
  }, [currentStep, isPlaying, isLast, startProgressAnimation]);

  // Pause on last step
  useEffect(() => {
    if (isPlaying && isLast) {
      stopAutoplay();
    }
  }, [isPlaying, isLast, stopAutoplay]);

  const toggleAutoplay = useCallback(() => {
    if (isPlaying) {
      stopAutoplay();
    } else {
      startAutoplay();
    }
  }, [isPlaying, stopAutoplay, startAutoplay]);

  // Cleanup on unmount / hide
  useEffect(() => {
    if (!visible) {
      stopAutoplay();
      setCurrentStep(0);
      translateX.setValue(0);
    }
    return () => {
      stopAutoplay();
    };
  }, [visible, stopAutoplay, translateX]);

  // ---- pan responder (swipe) ----
  const panResponder = useMemo(() => {
    let gestureStartX = 0;
    let isHorizontalGesture: boolean | null = null;

    return PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_evt, gestureState) => {
        const { dx, dy } = gestureState;
        // Only claim the gesture if the horizontal movement is dominant
        if (isHorizontalGesture === null) {
          if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.5) {
            isHorizontalGesture = true;
          } else if (Math.abs(dy) > 10) {
            isHorizontalGesture = false;
          }
        }
        return isHorizontalGesture === true;
      },
      onPanResponderGrant: (_evt, gestureState) => {
        gestureStartX = 0;
        isHorizontalGesture = null;
      },
      onPanResponderMove: (_evt, gestureState) => {
        if (!canNavigate) return;
        // Clamp at edges for resistance feel
        let dx = gestureState.dx;
        if ((isFirst && dx > 0) || (isLast && dx < 0)) {
          dx = dx * 0.3; // rubber band
        }
        translateX.setValue(dx);
      },
      onPanResponderRelease: (_evt, gestureState) => {
        isHorizontalGesture = null;
        if (!canNavigate) {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
          return;
        }

        const { dx } = gestureState;

        if (dx < -SWIPE_THRESHOLD && !isLast) {
          // Swipe left -> next
          Animated.timing(translateX, {
            toValue: -SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            goNext();
            translateX.setValue(0);
          });
        } else if (dx > SWIPE_THRESHOLD && !isFirst) {
          // Swipe right -> prev
          Animated.timing(translateX, {
            toValue: SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            goPrev();
            translateX.setValue(0);
          });
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 120,
            friction: 8,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        isHorizontalGesture = null;
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    });
  }, [canNavigate, isFirst, isLast, translateX, goNext, goPrev]);

  // ---- early return ----
  if (totalSteps === 0) return null;

  const step = steps[currentStep];

  // ---- derived colors ----
  const bgColor = isDark ? "#0B0F19" : colors.background;
  const textColor = isDark ? "#F1F5F9" : colors.text;
  const secondaryText = isDark ? "#94A3B8" : colors.textSecondary;
  const surfaceColor = isDark ? "#1E293B" : colors.surface;
  const borderColor = isDark ? "#334155" : colors.border;
  const accentColor = colors.accent;

  // ---- progress bar width (autoplay) ----
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  // ---- render helpers ----

  const renderHeader = () => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: Platform.OS === "ios" ? 60 : 40,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: borderColor,
      }}
    >
      {/* Title */}
      <Text
        style={{
          fontSize: 18,
          fontWeight: "700",
          color: textColor,
          flex: 1,
        }}
        numberOfLines={1}
      >
        {title}
      </Text>

      {/* Step counter */}
      <Text
        style={{
          fontSize: 15,
          fontWeight: "600",
          color: secondaryText,
          textAlign: "center",
          flex: 1,
        }}
      >
        Step {currentStep + 1} of {totalSteps}
      </Text>

      {/* Close */}
      <View style={{ flex: 1, alignItems: "flex-end" }}>
        <TouchableOpacity
          onPress={() => {
            stopAutoplay();
            onClose();
          }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: surfaceColor,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={20} color={textColor} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStepContent = () => (
    <Animated.View
      {...panResponder.panHandlers}
      style={{
        flex: 1,
        transform: [{ translateX }],
      }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: 32,
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Step number badge */}
        <View style={{ alignItems: "center", marginBottom: 28 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: accentColor,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontSize: 28,
                fontWeight: "800",
                color: "#FFFFFF",
              }}
            >
              {currentStep + 1}
            </Text>
          </View>
        </View>

        {/* Step instruction text */}
        <Text
          style={{
            fontSize: 24,
            lineHeight: 34,
            fontWeight: "500",
            color: textColor,
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          {step.text}
        </Text>

        {/* Image (if present) */}
        {step.image_url ? (
          <View
            style={{
              marginBottom: 24,
              borderRadius: 16,
              overflow: "hidden",
              backgroundColor: surfaceColor,
            }}
          >
            <Image
              source={{ uri: step.image_url }}
              style={{
                width: "100%",
                height: 200,
                borderRadius: 16,
              }}
              resizeMode="cover"
            />
          </View>
        ) : null}

        {/* Timer badge (if present) */}
        {step.timer_minutes != null && step.timer_minutes > 0 ? (
          <View style={{ alignItems: "center", marginBottom: 16 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: surfaceColor,
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 24,
                borderWidth: 1,
                borderColor: borderColor,
                gap: 8,
              }}
            >
              <Timer size={20} color={accentColor} />
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: textColor,
                }}
              >
                {step.timer_minutes} min
              </Text>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </Animated.View>
  );

  const renderProgressDots = () => {
    if (totalSteps <= 1) return null;

    // Use a progress bar when there are too many steps
    if (totalSteps > DOT_LIMIT) {
      return (
        <View
          style={{
            marginHorizontal: 40,
            marginBottom: 12,
            height: 4,
            borderRadius: 2,
            backgroundColor: borderColor,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${((currentStep + 1) / totalSteps) * 100}%`,
              height: "100%",
              borderRadius: 2,
              backgroundColor: accentColor,
            }}
          />
        </View>
      );
    }

    return (
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 12,
          gap: 8,
        }}
      >
        {steps.map((_, index) => {
          const isActive = index === currentStep;
          return (
            <View
              key={index}
              style={{
                width: isActive ? 12 : 8,
                height: isActive ? 12 : 8,
                borderRadius: isActive ? 6 : 4,
                backgroundColor: isActive ? accentColor : borderColor,
              }}
            />
          );
        })}
      </View>
    );
  };

  const renderBottomControls = () => (
    <View
      style={{
        paddingHorizontal: 24,
        paddingBottom: Platform.OS === "ios" ? 40 : 24,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: borderColor,
      }}
    >
      {/* Autoplay progress bar */}
      {isPlaying && (
        <View
          style={{
            height: 3,
            borderRadius: 1.5,
            backgroundColor: borderColor,
            marginBottom: 16,
            overflow: "hidden",
          }}
        >
          <Animated.View
            style={{
              height: "100%",
              borderRadius: 1.5,
              backgroundColor: accentColor,
              width: progressWidth,
            }}
          />
        </View>
      )}

      {/* Progress dots / bar */}
      {renderProgressDots()}

      {/* Control buttons */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 32,
        }}
      >
        {/* Previous */}
        <TouchableOpacity
          onPress={goPrev}
          disabled={isFirst}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: isFirst ? borderColor : surfaceColor,
            alignItems: "center",
            justifyContent: "center",
            opacity: isFirst ? 0.4 : 1,
          }}
        >
          <ChevronLeft
            size={24}
            color={isFirst ? secondaryText : textColor}
          />
        </TouchableOpacity>

        {/* Play / Pause */}
        <TouchableOpacity
          onPress={toggleAutoplay}
          disabled={totalSteps <= 1}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: accentColor,
            alignItems: "center",
            justifyContent: "center",
            opacity: totalSteps <= 1 ? 0.4 : 1,
          }}
        >
          {isPlaying ? (
            <Pause size={26} color="#FFFFFF" />
          ) : (
            <Play size={26} color="#FFFFFF" style={{ marginLeft: 3 }} />
          )}
        </TouchableOpacity>

        {/* Next */}
        <TouchableOpacity
          onPress={goNext}
          disabled={isLast}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: isLast ? borderColor : surfaceColor,
            alignItems: "center",
            justifyContent: "center",
            opacity: isLast ? 0.4 : 1,
          }}
        >
          <ChevronRight
            size={24}
            color={isLast ? secondaryText : textColor}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => {
        stopAutoplay();
        onClose();
      }}
    >
      <StatusBar barStyle="light-content" />
      <View
        style={{
          flex: 1,
          backgroundColor: bgColor,
        }}
      >
        {renderHeader()}
        {renderStepContent()}
        {renderBottomControls()}
      </View>
    </Modal>
  );
}
