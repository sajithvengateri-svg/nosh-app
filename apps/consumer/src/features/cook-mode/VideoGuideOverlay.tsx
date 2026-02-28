import { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Dimensions,
  ActivityIndicator,
} from "react-native";
// expo-av requires a native module — guard the import so the app
// doesn't crash in environments where ExponentAV is missing (Expo Go).
let Video: any = null;
let ResizeMode: any = {};
type AVPlaybackStatus = any;

try {
  const av = require("expo-av");
  Video = av.Video;
  ResizeMode = av.ResizeMode;
} catch {
  // expo-av native module unavailable — VideoGuideOverlay will show fallback
}
import { X, Play, Pause } from "lucide-react-native";
import { Colors } from "../../constants/colors";
import { lightTap } from "../../lib/haptics";
import { supabase } from "../../lib/supabase";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface VideoGuideOverlayProps {
  videoUrl: string;
  cardTitle: string;
  cardId?: string;
  recipeId?: string;
  onClose: () => void;
}

export function VideoGuideOverlay({
  videoUrl,
  cardTitle,
  cardId,
  recipeId,
  onClose,
}: VideoGuideOverlayProps) {
  const videoRef = useRef<Video>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleClose = useCallback(() => {
    // Track video view
    if (cardId && recipeId && durationMs > 0) {
      const watchedSeconds = Math.floor(positionMs / 1000);
      const totalSeconds = Math.floor(durationMs / 1000);
      supabase
        .from("ds_video_views")
        .insert({
          workflow_card_id: cardId,
          recipe_id: recipeId,
          watched_seconds: watchedSeconds,
          total_seconds: totalSeconds,
          completed: positionMs >= durationMs * 0.9,
        })
        .then(({ error }) => {
          if (error) console.warn("VideoView track:", error.message);
        });
    }

    lightTap();
    Animated.timing(opacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onClose());
  }, [cardId, recipeId, positionMs, durationMs, onClose]);

  const handlePlaybackStatus = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setIsLoading(false);
    setIsPlaying(status.isPlaying);
    setPositionMs(status.positionMillis);
    setDurationMs(status.durationMillis ?? 0);
  }, []);

  const togglePlayPause = useCallback(async () => {
    lightTap();
    if (isPlaying) {
      await videoRef.current?.pauseAsync();
    } else {
      await videoRef.current?.playAsync();
    }
  }, [isPlaying]);

  const progressPct = durationMs > 0 ? (positionMs / durationMs) * 100 : 0;

  return (
    <Animated.View style={[styles.overlay, { opacity }]}>
      {/* Close button */}
      <Pressable onPress={handleClose} style={styles.closeButton}>
        <X size={22} color="#FFF" strokeWidth={2} />
      </Pressable>

      {/* Card title */}
      <Text style={styles.title} numberOfLines={1}>
        {cardTitle}
      </Text>

      {/* Video */}
      <View style={styles.videoContainer}>
        {Video ? (
          <Video
            ref={videoRef}
            source={{ uri: videoUrl }}
            style={styles.video}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
            onPlaybackStatusUpdate={handlePlaybackStatus}
          />
        ) : (
          <Text style={{ color: "#FFF", fontSize: 14, textAlign: "center", padding: 20 }}>
            Video playback not available in this build
          </Text>
        )}

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFF" />
          </View>
        )}

        {/* Play/Pause overlay tap */}
        <Pressable style={styles.videoTap} onPress={togglePlayPause}>
          {!isPlaying && !isLoading && (
            <View style={styles.playCircle}>
              <Play size={32} color="#FFF" strokeWidth={1.5} fill="#FFF" />
            </View>
          )}
        </Pressable>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <Pressable onPress={togglePlayPause} style={styles.controlButton}>
          {isPlaying ? (
            <Pause size={20} color="#FFF" strokeWidth={1.5} />
          ) : (
            <Play size={20} color="#FFF" strokeWidth={1.5} fill="#FFF" />
          )}
        </Pressable>
        <Text style={styles.timeText}>
          {formatTime(positionMs)} / {formatTime(durationMs)}
        </Text>
      </View>
    </Animated.View>
  );
}

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.92)",
    zIndex: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 56,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  title: {
    position: "absolute",
    top: 64,
    left: 20,
    right: 70,
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  videoContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.5,
    justifyContent: "center",
    alignItems: "center",
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.5,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  videoTap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  playCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 4,
  },
  progressBarBg: {
    width: SCREEN_WIDTH - 40,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginTop: 16,
    overflow: "hidden",
  },
  progressBarFill: {
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.primary,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  timeText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
  },
});
