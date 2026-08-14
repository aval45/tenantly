import type { PropsWithChildren } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  type TextProps,
  type TextStyle,
} from "react-native";

import { useTenantlyColors } from "@/shared/theme/tokens";

type TextVariant =
  | "display"
  | "heading"
  | "section"
  | "body"
  | "label"
  | "caption"
  | "eyebrow"
  | "metric";

const variants = StyleSheet.create<Record<TextVariant, TextStyle>>({
  display: {
    fontFamily: Platform.select({
      ios: "Georgia-Bold",
      android: "serif",
      web: "Georgia, serif",
    }),
    fontWeight: "700",
    fontSize: 38,
    lineHeight: 43,
    letterSpacing: -1.1,
  },
  heading: {
    fontFamily: Platform.select({
      ios: "Georgia-Bold",
      android: "serif",
      web: "Georgia, serif",
    }),
    fontWeight: "700",
    fontSize: 29,
    lineHeight: 35,
    letterSpacing: -0.55,
  },
  section: {
    fontFamily: Platform.select({
      ios: "Georgia-Bold",
      android: "serif",
      web: "Georgia, serif",
    }),
    fontWeight: "700",
    fontSize: 19,
    lineHeight: 25,
    letterSpacing: -0.2,
  },
  body: { fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 22 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: "Inter_500Medium", fontSize: 12, lineHeight: 17 },
  eyebrow: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  metric: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    lineHeight: 31,
    letterSpacing: -0.7,
    fontVariant: ["tabular-nums"],
  },
});

type AppTextProps = PropsWithChildren<
  TextProps & { variant?: TextVariant; muted?: boolean }
>;

export function AppText({
  variant = "body",
  muted = false,
  style,
  children,
  ...props
}: AppTextProps) {
  const colors = useTenantlyColors();
  return (
    <Text
      allowFontScaling
      style={[
        variants[variant],
        { color: muted ? colors.textMuted : colors.text },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}
