import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { roomService } from "@/features/properties/rooms";
import { useAuth } from "@/shared/auth/auth-provider";
import { AppText } from "@/shared/components/app-text";
import { PrimaryButton } from "@/shared/components/primary-button";
import { Screen } from "@/shared/components/screen";
import { radii, spacing, useTenantlyColors } from "@/shared/theme/tokens";
export default function RoomSetup() {
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();
  const { session } = useAuth();
  const router = useRouter();
  const colors = useTenantlyColors();
  const [code, setCode] = useState("");
  const [beds, setBeds] = useState("1");
  const [rent, setRent] = useState("0");
  const [deposit, setDeposit] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  async function save() {
    setSaving(true);
    setError(null);
    try {
      await roomService.create({
        organizationId: session?.activeOrganizationId ?? "",
        propertyId,
        code,
        bedCount: Number(beds),
        monthlyRentPaise: Math.round(Number(rent) * 100),
        depositPaise: Math.round(Number(deposit) * 100),
      });
      router.back();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not add room.");
    } finally {
      setSaving(false);
    }
  }
  const inputs = [
    ["Room number or code", code, setCode, "default"],
    ["Beds", beds, setBeds, "number-pad"],
    ["Monthly rent (₹)", rent, setRent, "decimal-pad"],
    ["Deposit (₹)", deposit, setDeposit, "decimal-pad"],
  ] as const;
  return (
    <Screen>
      <View style={s.header}>
        <AppText variant="eyebrow" style={{ color: colors.accent }}>
          ROOM SETUP
        </AppText>
        <AppText variant="heading">Add a room</AppText>
        <AppText muted>
          Shared rooms automatically receive numbered bed records.
        </AppText>
      </View>
      <View style={s.form}>
        {inputs.map(([label, value, setter, keyboard]) => (
          <View key={label} style={s.field}>
            <AppText variant="label">{label}</AppText>
            <TextInput
              accessibilityLabel={label}
              keyboardType={keyboard}
              value={value}
              onChangeText={setter}
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
          label={saving ? "Adding room…" : "Add room"}
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
