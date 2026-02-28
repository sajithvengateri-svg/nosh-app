/**
 * StepSlider — Custom glass-styled slider with large value display
 *
 * Shows current value prominently, min/max labels, and unit suffix.
 * Uses a View-based track with a draggable circular thumb via PanResponder.
 */

import React, { useRef, useMemo } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Colors, Glass, BorderRadius, Spacing } from "../../../constants/colors";
import { lightTap } from "../../../lib/haptics";
import type { WorkflowStep } from "../types";

const TRACK_HEIGHT = 6;
const THUMB_SIZE = 32;
const HORIZONTAL_PADDING = Spacing.lg;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TRACK_WIDTH = SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - Spacing.lg * 2;

interface Props {
  step: WorkflowStep;
  value: any;
  onChange: (value: any) => void;
}

export function StepSlider({ step, value, onChange }: Props) {
  const min = step.min ?? 0;
  const max = step.max ?? 100;
  const stepSize = step.step ?? 1;
  const unit = step.unit ?? "";

  const currentValue = typeof value === "number" ? value : min;

  // Snap value to nearest step
  const snap = (raw: number): number => {
    const clamped = Math.max(min, Math.min(max, raw));
    return Math.round((clamped - min) / stepSize) * stepSize + min;
  };

  // Fraction for positioning
  const fraction = max > min ? (currentValue - min) / (max - min) : 0;
  const thumbX = useRef(new Animated.Value(fraction * TRACK_WIDTH)).current;

  // Track ref for measuring
  const trackRef = useRef<View>(null);
  const trackLayoutX = useRef(0);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (_, gestureState) => {
          lightTap();
        },
        onPanResponderMove: (evt, gestureState) => {
          const touchX = evt.nativeEvent.locationX !== undefined
            ? gestureState.moveX - trackLayoutX.current
            : gestureState.moveX;
          const clampedX = Math.max(0, Math.min(TRACK_WIDTH, touchX));
          const rawValue = min + (clampedX / TRACK_WIDTH) * (max - min);
          const snapped = snap(rawValue);
          onChange(snapped);
          const newFraction = (snapped - min) / (max - min);
          thumbX.setValue(newFraction * TRACK_WIDTH);
        },
        onPanResponderRelease: () => {
          lightTap();
        },
      }),
    [min, max, stepSize, onChange],
  );

  // Update thumb position when value changes externally
  const displayFraction = max > min ? (currentValue - min) / (max - min) : 0;
  const fillWidth = displayFraction * TRACK_WIDTH;

  return (
    <View style={styles.container}>
      {/* Large value display */}
      <View style={styles.valueContainer}>
        <Text style={styles.valueText}>
          {currentValue}
          {unit ? (
            <Text style={styles.unitText}> {unit}</Text>
          ) : null}
        </Text>
      </View>

      {/* Slider track */}
      <View
        style={styles.trackArea}
        ref={trackRef}
        onLayout={(e) => {
          trackLayoutX.current = e.nativeEvent.layout.x;
        }}
        {...panResponder.panHandlers}
      >
        {/* Background track */}
        <View style={styles.track}>
          {/* Fill */}
          <View style={[styles.trackFill, { width: fillWidth }]} />
        </View>

        {/* Thumb */}
        <View
          style={[
            styles.thumb,
            {
              left: fillWidth - THUMB_SIZE / 2,
            },
          ]}
        />
      </View>

      {/* Min / Max labels */}
      <View style={styles.labelsRow}>
        <Text style={styles.labelText}>
          {min}{unit ? ` ${unit}` : ""}
        </Text>
        <Text style={styles.labelText}>
          {max}{unit ? ` ${unit}` : ""}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Spacing.xl,
    alignItems: "center",
  },

  valueContainer: {
    marginBottom: Spacing.xxl,
    alignItems: "center",
  },
  valueText: {
    fontSize: 56,
    fontWeight: "800",
    color: Colors.primary,
    letterSpacing: -1,
  },
  unitText: {
    fontSize: 22,
    fontWeight: "500",
    color: Colors.text.secondary,
  },

  trackArea: {
    width: TRACK_WIDTH,
    height: THUMB_SIZE + 20,
    justifyContent: "center",
  },
  track: {
    width: "100%",
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: Glass.surface,
    borderWidth: 1,
    borderColor: Glass.borderLight,
    overflow: "hidden",
  },
  trackFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: TRACK_HEIGHT / 2,
  },

  thumb: {
    position: "absolute",
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowColor: Glass.shadow.color,
    shadowOffset: Glass.shadow.offset,
    shadowRadius: 8,
    shadowOpacity: 1,
    elevation: 5,
  },

  labelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: TRACK_WIDTH,
    marginTop: Spacing.sm,
  },
  labelText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.text.muted,
  },
});
