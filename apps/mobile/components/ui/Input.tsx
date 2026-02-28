import { useState } from "react";
import {
  View,
  TextInput,
  Text,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { useTheme } from "../../contexts/ThemeProvider";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  containerStyle,
  style,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const { colors } = useTheme();

  return (
    <View style={{ marginBottom: 12, ...containerStyle }}>
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
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        placeholderTextColor={colors.textMuted}
        style={[
          {
            borderWidth: 1,
            borderColor: error ? colors.destructive : focused ? colors.accent : colors.border,
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
