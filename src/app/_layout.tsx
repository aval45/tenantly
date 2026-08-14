import "../global.css";

import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_500Medium } from "@expo-google-fonts/inter/500Medium";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Inter_700Bold } from "@expo-google-fonts/inter/700Bold";
import * as Sentry from "@sentry/react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, type ErrorBoundaryProps } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { HeroUINativeProvider } from "heroui-native/provider";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Uniwind } from "uniwind";

import { queryClient } from "@/shared/api/query-client";
import { AuthProvider } from "@/shared/auth/auth-provider";
import { AppText } from "@/shared/components/app-text";
import { PrimaryButton } from "@/shared/components/primary-button";
import { useResolvedTheme, useTenantlyColors } from "@/shared/theme/tokens";
import { copy } from "@/shared/i18n/en";
import { useAppContextStore } from "@/stores/app-context";
import { PushRegistration } from "@/features/notifications/push-registration";
import { motion, useNavigationAnimation } from "@/shared/theme/motion";

SplashScreen.preventAutoHideAsync();

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
Sentry.init({
  dsn: sentryDsn,
  enabled: Boolean(sentryDsn),
  sendDefaultPii: false,
});

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const colors = useTenantlyColors();
  return (
    <View
      style={[styles.errorBoundary, { backgroundColor: colors.background }]}
      accessibilityRole="alert"
    >
      <AppText variant="heading">{copy.appError.title}</AppText>
      <AppText muted>{error.message}</AppText>
      <PrimaryButton label={copy.appError.retry} onPress={retry} />
    </View>
  );
}

export default function RootLayout() {
  const theme = useAppContextStore((state) => state.theme);
  const resolvedTheme = useResolvedTheme();
  const navigationAnimation = useNavigationAnimation();
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontError, fontsLoaded]);

  useEffect(() => {
    Uniwind.setTheme(theme);
  }, [theme]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={styles.flex}>
      <HeroUINativeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <PushRegistration />
            <StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} />
            <Stack
              screenOptions={{
                headerShown: false,
                animation: navigationAnimation,
                animationDuration: motion.duration,
              }}
            />
          </AuthProvider>
        </QueryClientProvider>
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  errorBoundary: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },
});
