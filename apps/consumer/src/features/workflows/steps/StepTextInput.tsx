/**
 * StepTextInput — Single text input with glass border
 *
 * Auto-focuses on mount, provides a clear button, large readable font.
 */

import React, { useEffect, useRef } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { X } from "lucide-react-native";
import { Colors, Glass, BorderRadius, Spacing } from "../../../constants/colors";
import type { WorkflowStep } from "../types";

interface Props {
  step: WorkflowStep;
  value: any;
  onChange: (value: any) => void;
}

export function StepTextInput({ step, value, onChange }: Props) {
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Small delay to allow slide animation to settle
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 350);
    return () => clearTimeout(timer);
  }, [step.id]);

  const hasValue = typeof value === "string" && value.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={typeof value === "string" ? value : ""}
          onChangeText={onChange}
          placeholder="Type your answer..."
          placeholderTextColor={Colors.text.muted}
          autoCapitalize="sentences"
          autoCorrect
          returnKeyType="done"
          selectionColor={Colors.primary}
        />
        {hasValue && (
          <Pressable
            onPress={() => onChange("")}
            style={styles.clearButton}
            hitSlop={8}
          >
            <X size={18} color={Colors.text.muted} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Spacing.md,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Glass.surface,
    borderWidth: 1,
    borderColor: Glass.borderLight,
    borderRadius: BorderRadius.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    shadowColor: Glass.shadowLight.color,
    shadowOffset: Glass.shadowLight.offset,
    shadowRadius: Glass.shadowLight.radius,
    shadowOpacity: 1,
    elevation: 3,
  },
  input: {
    flex: 1,
    fontSize: 20,
    fontWeight: "500",
    color: Colors.secondary,
    paddingVertical: Spacing.md,
    lineHeight: 28,
  },
  clearButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Glass.surfaceHover,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.sm,
  },
});
