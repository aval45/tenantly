import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import {
  propertyService,
  createPropertyCommandSchema,
} from "@/features/properties/service";
import { useAuth } from "@/shared/auth/auth-provider";
import { AppText } from "@/shared/components/app-text";
import { PrimaryButton } from "@/shared/components/primary-button";
import { Screen } from "@/shared/components/screen";
import { radii, spacing, useTenantlyColors } from "@/shared/theme/tokens";
const fields = [
  ["name", "Property name"],
  ["addressLine1", "Address"],
  ["city", "City"],
  ["state", "State"],
  ["postalCode", "PIN code"],
] as const;
export default function PropertySetupScreen() {
  const colors = useTenantlyColors();
  const router = useRouter();
  const { session } = useAuth();
  const [values, setValues] = useState<Record<string, string>>({
    propertyType: "pg",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  if (!session?.capabilities.createProperties)
    return <Redirect href="/unauthorized" />;
  async function save() {
    setSaving(true);
    setError(null);
    try {
      const parsed = createPropertyCommandSchema.safeParse(values);
      if (!parsed.success) {
        setError(
          "Complete every field and enter a valid six-digit Indian PIN code.",
        );
        return;
      }
      await propertyService.create(
        session?.activeOrganizationId ?? "",
        parsed.data,
      );
      router.replace("/properties");
    } catch (cause) {
      const message =
        cause &&
        typeof cause === "object" &&
        "message" in cause &&
        typeof cause.message === "string"
          ? cause.message
          : null;
      setError(message ?? "Could not add property.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <Screen>
      <View style={s.header}>
        <AppText variant="eyebrow" style={{ color: colors.accent }}>
          PORTFOLIO SETUP
        </AppText>
        <AppText variant="heading">Add a property</AppText>
        <AppText muted>
          Enter the registered address used for resident and billing records.
        </AppText>
      </View>
      <View style={s.form}>
        {fields.map(([name, label]) => (
          <View key={name} style={s.field}>
            <AppText variant="label">{label}</AppText>
            <TextInput
              accessibilityLabel={label}
              keyboardType={name === "postalCode" ? "number-pad" : "default"}
              autoCapitalize={name === "postalCode" ? "none" : "words"}
              value={values[name] ?? ""}
              onChangeText={(value) =>
                setValues((current) => ({ ...current, [name]: value }))
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
          <AppText style={{ color: colors.danger }}>{error}</AppText>
        ) : null}
        <PrimaryButton
          label={saving ? "Adding property…" : "Add property"}
          isDisabled={saving}
          onPress={() => void save()}
        />
      </View>
    </Screen>
  );
}
const s = StyleSheet.create({
  header: { gap: 7, paddingVertical: spacing.lg },
  form: { gap: spacing.md },
  field: { gap: 7 },
  input: {
    minHeight: 52,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.control,
    paddingHorizontal: 14,
    fontSize: 16,
  },
});
