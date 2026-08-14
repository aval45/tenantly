import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { getSupabaseClient } from "@/shared/api/supabase";
import { useAuth } from "@/shared/auth/auth-provider";
import { AppText } from "@/shared/components/app-text";
import { spacing, useTenantlyColors } from "@/shared/theme/tokens";

export default function AuthCallbackScreen() {
  const { code, next } = useLocalSearchParams<{
    code?: string;
    next?: string;
  }>();
  const { refreshSession } = useAuth();
  const router = useRouter();
  const colors = useTenantlyColors();
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!code) {
      return;
    }
    void getSupabaseClient()
      .auth.exchangeCodeForSession(code)
      .then(async ({ error: exchangeError }) => {
        if (exchangeError) throw exchangeError;
        await refreshSession();
        router.replace(
          (next === "reset-password" ? "/(auth)/reset-password" : "/") as never,
        );
      })
      .catch((cause: unknown) =>
        setError(
          cause instanceof Error ? cause.message : "Authentication failed.",
        ),
      );
  }, [code, next, refreshSession, router]);
  const visibleError =
    error ??
    (!code ? "The authentication link is incomplete or expired." : null);
  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <AppText variant="heading">
        {visibleError ? "Link could not be opened" : "Securing your session…"}
      </AppText>
      <AppText muted style={styles.center}>
        {visibleError ??
          "Tenantly is verifying the one-time authentication code."}
      </AppText>
    </View>
  );
}
const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.lg,
  },
  center: { textAlign: "center" },
});
