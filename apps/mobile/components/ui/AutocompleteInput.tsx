import { useState, useMemo, useRef } from "react";
import {
  View,
  TextInput,
  Text,
  Pressable,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { useTheme } from "../../contexts/ThemeProvider";

type Suggestion = string | { label: string; subtitle?: string };

interface AutocompleteInputProps extends Omit<TextInputProps, "value" | "onChangeText"> {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  value: string;
  onChangeText: (text: string) => void;
  suggestions: Suggestion[];
  /** Max suggestions to show (default 5) */
  maxSuggestions?: number;
}

function getLabel(s: Suggestion): string {
  return typeof s === "string" ? s : s.label;
}
function getSubtitle(s: Suggestion): string | undefined {
  return typeof s === "string" ? undefined : s.subtitle;
}

export function AutocompleteInput({
  label,
  error,
  containerStyle,
  value,
  onChangeText,
  suggestions,
  maxSuggestions = 5,
  style,
  ...props
}: AutocompleteInputProps) {
  const [focused, setFocused] = useState(false);
  const { colors } = useTheme();
  const inputRef = useRef<TextInput>(null);

  const filtered = useMemo(() => {
    if (!value || value.length < 1) return [];
    const lower = value.toLowerCase();
    return suggestions
      .filter((s) => {
        const l = getLabel(s).toLowerCase();
        return l.includes(lower) && l !== lower;
      })
      .slice(0, maxSuggestions);
  }, [value, suggestions, maxSuggestions]);

  const showSuggestions = focused && filtered.length > 0;

  return (
    <View style={{ marginBottom: 12, zIndex: 10, ...containerStyle }}>
      {label && (
        <Text
          style={{
            fontSize: 14,
            fontWeight: "500",
            color: colors.textSecondary,
            marginBottom: 6,
          }}
        >
          {label}
        </Text>
      )}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          // Delay blur so tap on suggestion registers first
          setTimeout(() => setFocused(false), 150);
          props.onBlur?.(e);
        }}
        placeholderTextColor={colors.textMuted}
        style={[
          {
            borderWidth: 1,
            borderColor: error
              ? colors.destructive
              : focused
              ? colors.accent
              : colors.border,
            borderRadius: 12,
            padding: 14,
            fontSize: 16,
            backgroundColor: colors.surface,
            color: colors.text,
          },
          style,
        ]}
        {...props}
      />
      {showSuggestions && (
        <View
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            backgroundColor: colors.surface,
            marginTop: 4,
            overflow: "hidden",
          }}
        >
          {filtered.map((s, i) => {
            const lbl = getLabel(s);
            const sub = getSubtitle(s);
            return (
              <Pressable
                key={lbl}
                onPress={() => {
                  onChangeText(lbl);
                  inputRef.current?.blur();
                }}
                style={({ pressed }) => ({
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  backgroundColor: pressed ? colors.accentBg : "transparent",
                  borderTopWidth: i > 0 ? 0.5 : 0,
                  borderTopColor: colors.border,
                })}
              >
                <Text
                  style={{ fontSize: 15, color: colors.text }}
                  numberOfLines={1}
                >
                  {lbl}
                </Text>
                {sub && (
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.textMuted,
                      marginTop: 2,
                    }}
                    numberOfLines={1}
                  >
                    {sub}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      )}
      {error && (
        <Text
          style={{
            fontSize: 12,
            color: colors.destructive,
            marginTop: 4,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
