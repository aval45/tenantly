import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { invitationService } from "@/features/invitations/service";
import { useAuth } from "@/shared/auth/auth-provider";
import { AppText } from "@/shared/components/app-text";
import { PrimaryButton } from "@/shared/components/primary-button";
import { spacing, useTenantlyColors } from "@/shared/theme/tokens";
export default function AcceptInvitation() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { status, refreshSession } = useAuth();
  const router = useRouter();
  const colors = useTenantlyColors();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  async function accept() {
    if (status !== "authenticated") {
      router.replace("/(auth)/login" as never);
      return;
    }
    setSaving(true);
    try {
      await invitationService.accept(token);
      await refreshSession();
      router.replace("/");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Invitation could not be accepted.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <View style={[s.page, { backgroundColor: colors.background }]}>
      <AppText variant="heading">Join this workspace</AppText>
      <AppText muted>
        Accepting links your account to the invited organization and resident
        record.
      </AppText>
      {error ? (
        <AppText style={{ color: colors.danger }}>{error}</AppText>
      ) : null}
      <PrimaryButton
        label={saving ? "Accepting…" : "Accept invitation"}
        isDisabled={saving || !token}
        onPress={() => void accept()}
      />
    </View>
  );
}
const s = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
    gap: spacing.md,
  },
});
