import { useQueryClient } from "@tanstack/react-query";
import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { residentService } from "@/features/residents/service";
import { useAuth } from "@/shared/auth/auth-provider";
import { AppText } from "@/shared/components/app-text";
import { PrimaryButton } from "@/shared/components/primary-button";
import { Screen } from "@/shared/components/screen";
import { radii, spacing, useTenantlyColors } from "@/shared/theme/tokens";
import { queryKeys } from "@/shared/api/query-keys";
import { toUserMessage } from "@/shared/errors/to-user-message";
export default function ResidentSetup() {
  const { session } = useAuth();
  const router = useRouter();
  const cache = useQueryClient();
  const colors = useTenantlyColors();
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const org = session?.activeOrganizationId ?? "";
  if (!session?.capabilities.manageOrganization)
    return <Redirect href="/unauthorized" />;
  async function save() {
    setSaving(true);
    setError(null);
    const fullName = (values.fullName ?? "").trim();
    const email = (values.email ?? "").trim().toLowerCase();
    const phone = (values.phone ?? "").trim();

    if (!fullName || fullName.length < 2) {
      setError("Please enter the resident's full legal name (at least 2 characters).");
      setSaving(false);
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address (e.g. name@example.com).");
      setSaving(false);
      return;
    }
    if (phone && !/^\+?[0-9]{10,15}$/.test(phone)) {
      setError("Please enter a valid phone number with country code (e.g. +919876543210).");
      setSaving(false);
      return;
    }

    try {
      const residentId = await residentService.create({
        organizationId: org,
        fullName,
        email: email || undefined,
        phone: phone || undefined,
      });
      await Promise.all([
        cache.invalidateQueries({
          queryKey: queryKeys.residents(session?.userId ?? "", org),
        }),
        cache.invalidateQueries({
          queryKey: queryKeys.ownerDashboard(session?.userId ?? "", org),
        }),
      ]);
      router.replace({
        pathname: "/(owner)/invite" as never,
        params: { residentId },
      });
    } catch (cause) {
      setError(toUserMessage(cause, "Could not add resident."));
    } finally {
      setSaving(false);
    }
  }
  return (
    <Screen>
      <View style={s.header}>
        <AppText variant="heading">Add resident</AppText>
        <AppText muted>
          You can link this record to an invited app account later.
        </AppText>
      </View>
      {(
        [
          ["fullName", "Full legal name"],
          ["email", "Email (optional)"],
          ["phone", "Phone with country code (optional)"],
        ] as const
      ).map(([name, label]) => (
        <View key={name} style={s.field}>
          <AppText variant="label">{label}</AppText>
          <TextInput
            accessibilityLabel={label}
            value={values[name] ?? ""}
            onChangeText={(value) =>
              setValues((current) => ({ ...current, [name]: value }))
            }
            autoCapitalize={name === "email" ? "none" : "words"}
            keyboardType={
              name === "email"
                ? "email-address"
                : name === "phone"
                  ? "phone-pad"
                  : "default"
            }
            style={[
              s.input,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colors.surfaceRaised,
              },
            ]}
          />
        </View>
      ))}
      {error ? (
        <AppText accessibilityRole="alert" style={{ color: colors.danger }}>{error}</AppText>
      ) : null}
      <PrimaryButton
        label={saving ? "Saving…" : "Add resident"}
        isDisabled={saving}
        onPress={() => void save()}
      />
    </Screen>
  );
}
const s = StyleSheet.create({
  header: { gap: 5, paddingVertical: spacing.lg },
  field: { gap: 7, marginBottom: spacing.md },
  input: {
    minHeight: 52,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.control,
    paddingHorizontal: 14,
    fontSize: 16,
  },
});
