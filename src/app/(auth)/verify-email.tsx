import { Link, useLocalSearchParams } from "expo-router";
import { MailCheck } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useAuth } from "@/shared/auth/auth-provider";
import { AppText } from "@/shared/components/app-text";
import { PrimaryButton } from "@/shared/components/primary-button";
import { spacing, useTenantlyColors } from "@/shared/theme/tokens";
export default function VerifyEmailScreen() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  const { resendSignUpConfirmation } = useAuth();
  const colors = useTenantlyColors();
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function resend() {
    if (!email) return;
    setSending(true);
    setNotice(null);
    setError(null);
    try {
      await resendSignUpConfirmation(email);
      setNotice("A new verification email was sent.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not resend the verification email.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <MailCheck size={34} color={colors.accent} />
      <AppText variant="heading">Verify your email</AppText>
      <AppText muted style={styles.center}>
        Open the verification link sent by Supabase, then return and sign in.
      </AppText>
      {email ? <AppText variant="label">{email}</AppText> : null}
      {notice ? (
        <AppText style={{ color: colors.success }}>{notice}</AppText>
      ) : null}
      {error ? (
        <AppText accessibilityRole="alert" style={{ color: colors.danger }}>
          {error}
        </AppText>
      ) : null}
      {email ? (
        <PrimaryButton
          label={sending ? "Sending…" : "Resend verification email"}
          isDisabled={sending}
          onPress={() => void resend()}
        />
      ) : null}
      <Link href="/(auth)/login">Return to sign in</Link>
    </View>
  );
}
const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    gap: spacing.md,
  },
  center: { textAlign: "center" },
});
