import { useRef, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  Share,
  StyleSheet,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import {
  Camera,
  MessageCircle,
  Mail,
  Link,
  Check,
  X,
} from "lucide-react-native";
import { Colors, Glass } from "../../constants/colors";
import { lightTap, mediumTap, successNotification } from "../../lib/haptics";

interface SharePillMenuProps {
  visible: boolean;
  recipeId: string;
  recipeTitle: string;
  cuisine?: string;
  totalTime?: number;
  chefName?: string;
  onClose: () => void;
}

interface ShareTarget {
  key: string;
  label: string;
  icon: React.ComponentType<any>;
  needsConfirmation: boolean;
}

const SHARE_TARGETS: ShareTarget[] = [
  { key: "instagram", label: "Instagram", icon: Camera, needsConfirmation: true },
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle, needsConfirmation: true },
  { key: "message", label: "Message", icon: Mail, needsConfirmation: true },
  { key: "copy", label: "Copy Link", icon: Link, needsConfirmation: false },
];

function buildShareMessage(
  title: string,
  cuisine?: string,
  time?: number,
  chef?: string,
): string {
  let msg = `Check out this recipe on NOSH!\n\n`;
  msg += `${title}\n`;
  if (time) msg += `${time} min`;
  if (cuisine) msg += ` · ${cuisine}`;
  if (time || cuisine) msg += "\n";
  if (chef) msg += `by ${chef}\n`;
  return msg;
}

export function SharePillMenu({
  visible,
  recipeId,
  recipeTitle,
  cuisine,
  totalTime,
  chefName,
  onClose,
}: SharePillMenuProps) {
  const pillAnims = useRef(
    SHARE_TARGETS.map(() => new Animated.Value(0)),
  ).current;
  const [confirming, setConfirming] = useState<string | null>(null);
  const confirmAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Stagger pills in
      SHARE_TARGETS.forEach((_, i) => {
        Animated.spring(pillAnims[i], {
          toValue: 1,
          delay: i * 60,
          speed: 40,
          bounciness: 8,
          useNativeDriver: true,
        }).start();
      });
    } else {
      pillAnims.forEach((a) => a.setValue(0));
      setConfirming(null);
      confirmAnim.setValue(0);
    }
  }, [visible]);

  const shareUrl = `https://prepmi.app/recipe/${recipeId}`;
  const shareMessage = buildShareMessage(recipeTitle, cuisine, totalTime, chefName);

  const executeShare = useCallback(
    async (key: string) => {
      try {
        if (key === "copy") {
          await Clipboard.setStringAsync(shareUrl);
          successNotification();
          onClose();
          return;
        }

        if (key === "whatsapp") {
          await Share.share({
            message: `${shareMessage}\n${shareUrl}`,
          });
        } else if (key === "instagram") {
          await Share.share({
            message: `${shareMessage}\n${shareUrl}`,
          });
        } else {
          await Share.share({
            message: shareMessage,
            url: shareUrl,
            title: recipeTitle,
          });
        }
        onClose();
      } catch {
        // User cancelled share sheet
      }
    },
    [shareMessage, shareUrl, recipeTitle, onClose],
  );

  const handlePillPress = useCallback(
    (target: ShareTarget) => {
      lightTap();
      if (target.needsConfirmation) {
        setConfirming(target.key);
        mediumTap();
        Animated.spring(confirmAnim, {
          toValue: 1,
          speed: 40,
          bounciness: 6,
          useNativeDriver: true,
        }).start();
      } else {
        executeShare(target.key);
      }
    },
    [executeShare, confirmAnim],
  );

  const handleConfirmSend = useCallback(() => {
    if (confirming) {
      successNotification();
      executeShare(confirming);
    }
  }, [confirming, executeShare]);

  const handleConfirmCancel = useCallback(() => {
    lightTap();
    setConfirming(null);
    confirmAnim.setValue(0);
  }, [confirmAnim]);

  if (!visible) return null;

  const confirmLabel = SHARE_TARGETS.find((t) => t.key === confirming)?.label;

  return (
    <View style={styles.container}>
      {/* Confirmation overlay */}
      {confirming && (
        <Animated.View
          style={[
            styles.confirmPill,
            {
              opacity: confirmAnim,
              transform: [
                {
                  translateY: confirmAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={[styles.confirmGlass, styles.confirmInner]}>
              <Text style={styles.confirmText}>
                Share to {confirmLabel}?
              </Text>
              <View style={styles.confirmButtons}>
                <Pressable
                  onPress={handleConfirmSend}
                  style={[styles.confirmBtn, styles.confirmSendBtn]}
                >
                  <Check size={16} color="#FFF" strokeWidth={2} />
                  <Text style={styles.confirmSendText}>Send</Text>
                </Pressable>
                <Pressable
                  onPress={handleConfirmCancel}
                  style={[styles.confirmBtn, styles.confirmCancelBtn]}
                >
                  <X size={16} color={Colors.text.secondary} strokeWidth={2} />
                </Pressable>
              </View>
          </View>
        </Animated.View>
      )}

      {/* Share pills */}
      {!confirming &&
        SHARE_TARGETS.map((target, i) => {
          const Icon = target.icon;
          return (
            <SharePill
              key={target.key}
              icon={Icon}
              label={target.label}
              anim={pillAnims[i]}
              index={i}
              onPress={() => handlePillPress(target)}
            />
          );
        })}
    </View>
  );
}

function SharePill({
  icon: Icon,
  label,
  anim,
  index,
  onPress,
}: {
  icon: React.ComponentType<any>;
  label: string;
  anim: Animated.Value;
  index: number;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [
          {
            translateY: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [30, 0],
            }),
          },
          { scale: scaleAnim },
        ],
      }}
    >
      <Pressable
        onPressIn={() => {
          lightTap();
          Animated.spring(scaleAnim, {
            toValue: 1.08,
            speed: 50,
            bounciness: 8,
            useNativeDriver: true,
          }).start();
        }}
        onPressOut={() => {
          Animated.spring(scaleAnim, {
            toValue: 1,
            speed: 40,
            bounciness: 6,
            useNativeDriver: true,
          }).start();
        }}
        onPress={onPress}
      >
        <View style={[styles.pillGlass, styles.pillInner]}>
          <Icon size={18} color={Colors.text.primary} strokeWidth={1.75} />
          <Text style={styles.pillLabel}>{label}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  pillGlass: {
    borderRadius: 20,
    overflow: "hidden",
  },
  pillInner: {
    backgroundColor: Glass.surface,
    borderWidth: 1,
    borderColor: Glass.borderLight,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 160,
  },
  pillLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  confirmPill: {
    width: "100%",
    alignItems: "center",
  },
  confirmGlass: {
    borderRadius: 20,
    overflow: "hidden",
  },
  confirmInner: {
    backgroundColor: Glass.surface,
    borderWidth: 1,
    borderColor: Glass.borderLight,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  confirmText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text.primary,
    flex: 1,
  },
  confirmButtons: {
    flexDirection: "row",
    gap: 8,
  },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  confirmSendBtn: {
    backgroundColor: Colors.primary,
  },
  confirmSendText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFF",
  },
  confirmCancelBtn: {
    backgroundColor: Colors.divider,
  },
});
