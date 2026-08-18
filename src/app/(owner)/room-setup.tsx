import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { StyleSheet, TextInput, View } from "react-native";
import { roomService } from "@/features/properties/rooms";
import { useAuth } from "@/shared/auth/auth-provider";
import { AppText } from "@/shared/components/app-text";
import { PrimaryButton } from "@/shared/components/primary-button";
import { Screen } from "@/shared/components/screen";
import { radii, spacing, useTenantlyColors } from "@/shared/theme/tokens";
import { queryKeys } from "@/shared/api/query-keys";
export default function RoomSetup() {
  const { propertyId, roomId } = useLocalSearchParams<{
    propertyId: string;
    roomId?: string;
  }>();
  const { session } = useAuth();
  const router = useRouter();
  const cache = useQueryClient();
  const colors = useTenantlyColors();
  const userId = session?.userId ?? "";
  const orgId = session?.activeOrganizationId ?? "";
  const [code, setCode] = useState("");
  const [beds, setBeds] = useState("");
  const [rent, setRent] = useState("");
  const [deposit, setDeposit] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const existing = useQuery({
    queryKey: ["tenantly", "room-edit", propertyId, roomId],
    queryFn: () => roomService.listForProperty(propertyId),
    enabled: !!roomId,
  });
  const existingRoom = existing.data?.find((item) => item.id === roomId);
  const formCode = code || existingRoom?.code || "";
  const formBeds = beds || (existingRoom ? String(existingRoom.bedCount) : "1");
  const formRent =
    rent || (existingRoom ? String(existingRoom.monthlyRentPaise / 100) : "0");
  const formDeposit =
    deposit || (existingRoom ? String(existingRoom.depositPaise / 100) : "0");
  async function save() {
    setSaving(true);
    setError(null);
    try {
      if (roomId) {
        await roomService.update(roomId, {
          code: formCode,
          monthlyRentPaise: Math.round(Number(formRent) * 100),
          depositPaise: Math.round(Number(formDeposit) * 100),
        });
      } else {
        await roomService.create({
          organizationId: orgId,
          propertyId,
          code: formCode,
          bedCount: Number(formBeds),
          monthlyRentPaise: Math.round(Number(formRent) * 100),
          depositPaise: Math.round(Number(formDeposit) * 100),
        });
      }
      await Promise.all([
        cache.invalidateQueries({
          queryKey: queryKeys.rooms(userId, orgId, propertyId),
        }),
        cache.invalidateQueries({
          queryKey: queryKeys.property(userId, orgId, propertyId),
        }),
        cache.invalidateQueries({
          queryKey: queryKeys.properties(userId, orgId),
        }),
        cache.invalidateQueries({
          queryKey: queryKeys.ownerDashboard(userId, orgId),
        }),
      ]);
      if (router.canGoBack()) router.back();
      else
        router.replace({
          pathname: "/(owner)/property/[id]" as never,
          params: { id: propertyId },
        });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not add room.");
    } finally {
      setSaving(false);
    }
  }
  const inputs = [
    ["Room number or code", formCode, setCode, "default"],
    ["Beds", formBeds, setBeds, "number-pad"],
    ["Monthly rent (₹)", formRent, setRent, "decimal-pad"],
    ["Deposit (₹)", formDeposit, setDeposit, "decimal-pad"],
  ] as const;
  return (
    <Screen>
      <View style={s.header}>
        <AppText variant="eyebrow" style={{ color: colors.accent }}>
          ROOM SETUP
        </AppText>
        <AppText variant="heading">
          {roomId ? "Edit room" : "Add a room"}
        </AppText>
        <AppText muted>
          Shared rooms automatically receive numbered bed records.
        </AppText>
      </View>
      <View style={s.form}>
        {inputs
          .filter(([label]) => !roomId || label !== "Beds")
          .map(([label, value, setter, keyboard]) => (
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
          label={saving ? "Saving…" : roomId ? "Save room" : "Add room"}
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
