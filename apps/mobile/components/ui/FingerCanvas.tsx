import { useState, useRef, useCallback } from "react";
import {
  View, Text, Pressable, PanResponder, Dimensions, ActivityIndicator,
  GestureResponderEvent, Platform, StatusBar,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { Undo2, Eraser, Check, X } from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeProvider";

// Pure JS base64 encoder (Buffer not available in Hermes)
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function utf8ToBase64(str: string): string {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c < 0x80) bytes.push(c);
    else if (c < 0x800) { bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f)); }
    else { bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f)); }
  }
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i], b1 = bytes[i + 1] ?? 0, b2 = bytes[i + 2] ?? 0;
    out += B64[b0 >> 2] + B64[((b0 & 3) << 4) | (b1 >> 4)];
    out += i + 1 < bytes.length ? B64[((b1 & 15) << 2) | (b2 >> 6)] : "=";
    out += i + 2 < bytes.length ? B64[b2 & 63] : "=";
  }
  return out;
}

const STATUS_BAR_HEIGHT = Platform.OS === "ios" ? 59 : (StatusBar.currentHeight ?? 44);

interface FingerCanvasProps {
  onDone: (base64: string) => void;
  onClose: () => void;
  loading?: boolean;
}

function pointsToSvgPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  let d = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L${points[i].x.toFixed(1)},${points[i].y.toFixed(1)}`;
  }
  return d;
}

export function FingerCanvas({ onDone, onClose, loading }: FingerCanvasProps) {
  const { colors } = useTheme();
  const [strokes, setStrokes] = useState<{ x: number; y: number }[][]>([]);
  const currentStrokeRef = useRef<{ x: number; y: number }[]>([]);
  const [renderKey, setRenderKey] = useState(0);
  const { width: screenW, height: screenH } = Dimensions.get("window");
  const canvasH = screenH - 120;

  const getPos = (e: GestureResponderEvent) => ({
    x: e.nativeEvent.locationX,
    y: e.nativeEvent.locationY,
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        currentStrokeRef.current = [getPos(e)];
        setRenderKey((k) => k + 1);
      },
      onPanResponderMove: (e) => {
        currentStrokeRef.current.push(getPos(e));
        setRenderKey((k) => k + 1);
      },
      onPanResponderRelease: () => {
        if (currentStrokeRef.current.length > 1) {
          setStrokes((prev) => [...prev, [...currentStrokeRef.current]]);
        }
        currentStrokeRef.current = [];
        setRenderKey((k) => k + 1);
      },
    })
  ).current;

  const handleUndo = useCallback(() => {
    setStrokes((prev) => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    setStrokes([]);
  }, []);

  const handleDone = useCallback(() => {
    // Generate SVG XML and encode as base64 PNG-like data
    const paths = strokes
      .map((s) => pointsToSvgPath(s))
      .filter(Boolean)
      .map((d) => `<path d="${d}" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`)
      .join("");

    const svgXml = `<svg xmlns="http://www.w3.org/2000/svg" width="${screenW}" height="${canvasH}" viewBox="0 0 ${screenW} ${canvasH}"><rect width="100%" height="100%" fill="white"/>${paths}</svg>`;

    const base64 = utf8ToBase64(svgXml);
    onDone(base64);
  }, [strokes, screenW, canvasH, onDone]);

  const allStrokes = [...strokes, ...(currentStrokeRef.current.length > 1 ? [currentStrokeRef.current] : [])];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: STATUS_BAR_HEIGHT }}>
      {/* Toolbar */}
      <View style={{
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.card,
      }}>
        <Pressable onPress={onClose} disabled={loading}
          style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <X size={18} color={colors.textSecondary} strokeWidth={2} />
          <Text style={{ fontSize: 14, color: colors.textSecondary }}>Cancel</Text>
        </Pressable>

        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textMuted }}>Draw Note</Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Pressable onPress={handleUndo} disabled={strokes.length === 0 || loading} hitSlop={8}>
            <Undo2 size={20} color={strokes.length === 0 ? colors.border : colors.textSecondary} strokeWidth={1.5} />
          </Pressable>
          <Pressable onPress={handleClear} disabled={strokes.length === 0 || loading} hitSlop={8}>
            <Eraser size={20} color={strokes.length === 0 ? colors.border : colors.textSecondary} strokeWidth={1.5} />
          </Pressable>
          <Pressable onPress={handleDone} disabled={strokes.length === 0 || loading}
            style={{
              flexDirection: "row", alignItems: "center", gap: 4,
              backgroundColor: strokes.length === 0 ? colors.surface : colors.accent,
              paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
            }}>
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Check size={16} color={strokes.length === 0 ? colors.textMuted : "#FFFFFF"} strokeWidth={2} />
            )}
            <Text style={{ fontSize: 14, fontWeight: "700", color: strokes.length === 0 ? colors.textMuted : "#FFFFFF" }}>
              {loading ? "Reading..." : "Done"}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Canvas area */}
      <View style={{ flex: 1, backgroundColor: "#FFFFFF" }} {...panResponder.panHandlers}>
        <Svg width={screenW} height={canvasH}>
          {allStrokes.map((stroke, i) => {
            const d = pointsToSvgPath(stroke);
            return d ? (
              <Path key={i} d={d} stroke="#1a1a1a" strokeWidth={3}
                strokeLinecap="round" strokeLinejoin="round" fill="none" />
            ) : null;
          })}
        </Svg>

        {/* Placeholder */}
        {strokes.length === 0 && currentStrokeRef.current.length === 0 && (
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center" }} pointerEvents="none">
            <Text style={{ fontSize: 18, color: "#d1d5db" }}>Write your prep notes here...</Text>
          </View>
        )}
      </View>
    </View>
  );
}
