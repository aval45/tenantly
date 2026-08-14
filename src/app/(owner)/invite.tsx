import { useLocalSearchParams } from "expo-router";
import { Share, StyleSheet, TextInput, View } from "react-native";
import { useState } from "react";
import { invitationService } from "@/features/invitations/service";
import { useAuth } from "@/shared/auth/auth-provider";
import { AppText } from "@/shared/components/app-text";
import { PrimaryButton } from "@/shared/components/primary-button";
import { Screen } from "@/shared/components/screen";
import { radii, spacing, useTenantlyColors } from "@/shared/theme/tokens";
export default function InviteScreen() {
  const { residentId } = useLocalSearchParams<{ residentId: string }>();
  const { session } = useAuth();
  const colors = useTenantlyColors();
  const [email, setEmail] = useState("");
  const [link, setLink] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  async function create() {
    setSaving(true);
    try {
      const value = await invitationService.create({
        organizationId: session?.activeOrganizationId ?? "",
        residentId,
        role: "tenant",
        email,
      });
      setLink(`tenantly://accept-invitation?token=${value.token}`);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not create invitation.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <Screen>
      <View style={s.header}>
        <AppText variant="heading">Invite resident</AppText>
        <AppText muted>
          The secure link expires in seven days and can be used once.
        </AppText>
      </View>
      <TextInput
        accessibilityLabel="Resident email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        style={[
          s.input,
          {
            color: colors.text,
            borderColor: colors.border,
            backgroundColor: colors.surfaceRaised,
          },
        ]}
      />
      {error ? (
        <AppText style={{ color: colors.danger }}>{error}</AppText>
      ) : null}
      {link ? (
        <>
          <AppText selectable>{link}</AppText>
          <PrimaryButton
            label="Share invitation"
            onPress={() => void Share.share({ message: link })}
          />
        </>
      ) : (
        <PrimaryButton
          label={saving ? "Creating…" : "Create invitation"}
          isDisabled={saving || !email.includes("@")}
          onPress={() => void create()}
        />
      )}
    </Screen>
  );
}
const s = StyleSheet.create({
  header: { gap: 5, paddingVertical: spacing.lg },
  input: {
    minHeight: 52,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.control,
    paddingHorizontal: 14,
    fontSize: 16,
    marginBottom: spacing.md,
  },
});
