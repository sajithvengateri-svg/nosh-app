import { ReactNode } from "react";
import { View, ViewStyle, StyleSheet } from "react-native";
import { Glass } from "../constants/colors";

interface GlassViewProps {
  style?: ViewStyle;
  innerStyle?: ViewStyle;
  children: ReactNode;
}

export function GlassView({
  style,
  innerStyle,
  children,
}: GlassViewProps) {
  return (
    <View style={[styles.outer, styles.inner, style, innerStyle]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: 20,
    overflow: "hidden",
  },
  inner: {
    backgroundColor: Glass.surface,
    borderWidth: 1,
    borderColor: Glass.borderLight,
  },
});
