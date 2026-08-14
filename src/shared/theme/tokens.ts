import { useAppContextStore } from "@/stores/app-context";
import { useColorScheme } from "react-native";

export const lightColors = {
  background: "#F3EFE4",
  surface: "#FAF7EE",
  surfaceSubtle: "#E8E1D2",
  surfaceRaised: "#FFFDF7",
  text: "#142F35",
  textMuted: "#566568",
  hero: "#12363C",
  heroText: "#FFF8E8",
  heroMuted: "#BCD0CC",
  primary: "#12363C",
  primarySoft: "#D5E3DF",
  secondary: "#31545A",
  accent: "#B93F2D",
  accentPressed: "#963323",
  accentSoft: "#F5D7CC",
  border: "#CFC6B5",
  success: "#277157",
  successSoft: "#D6E8DF",
  warning: "#936516",
  warningSoft: "#F1E1B8",
  danger: "#B34236",
  dangerSoft: "#F3D5D0",
} as const;

export const darkColors = {
  background: "#0D2024",
  surface: "#142C31",
  surfaceSubtle: "#213B40",
  surfaceRaised: "#19343A",
  text: "#F5EFDF",
  textMuted: "#A7B7B6",
  hero: "#071A1E",
  heroText: "#FFF6E4",
  heroMuted: "#A9C4C1",
  primary: "#BFD9D2",
  primarySoft: "#29484A",
  secondary: "#D2E0DB",
  accent: "#F17959",
  accentPressed: "#FF9375",
  accentSoft: "#51352F",
  border: "#365157",
  success: "#78C9A9",
  successSoft: "#21463B",
  warning: "#E3BD67",
  warningSoft: "#4A3C22",
  danger: "#F08F80",
  dangerSoft: "#512F2C",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  content: 20,
  lg: 24,
  xl: 32,
  xxl: 48,
  hero: 64,
} as const;
// Tenantly uses crisp, ledger-like geometry. Reserve pills for status only.
export const radii = { control: 4, card: 3, dialog: 6, pill: 999 } as const;
export const touchTarget = { ios: 44, android: 48 } as const;

export function useTenantlyColors() {
  const theme = useAppContextStore((state) => state.theme);
  const systemTheme = useColorScheme();
  const resolved = theme === "system" ? (systemTheme ?? "light") : theme;
  return resolved === "dark" ? darkColors : lightColors;
}

export function useResolvedTheme() {
  const theme = useAppContextStore((state) => state.theme);
  const systemTheme = useColorScheme();
  return theme === "system" ? (systemTheme ?? "light") : theme;
}
