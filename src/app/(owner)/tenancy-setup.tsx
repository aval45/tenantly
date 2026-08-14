import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { propertyService } from "@/features/properties/service";
import { roomService } from "@/features/properties/rooms";
import { residentService } from "@/features/residents/service";
import { getSupabaseClient } from "@/shared/api/supabase";
import { useAuth } from "@/shared/auth/auth-provider";
import { AppText } from "@/shared/components/app-text";
import { PrimaryButton } from "@/shared/components/primary-button";
import { Screen } from "@/shared/components/screen";
import { radii, spacing, useTenantlyColors } from "@/shared/theme/tokens";
import { queryKeys } from "@/shared/api/query-keys";
import { localDateISO } from "@/shared/utils/date";
import { toUserMessage } from "@/shared/errors/to-user-message";
import * as Crypto from "expo-crypto";

function Choices({
  title,
  items,
  value,
  onChange,
}: {
  title: string;
  items: { id: string; label: string }[];
  value: string | undefined;
  onChange(value: string): void;
}) {
  const colors = useTenantlyColors();
  return (
    <View style={s.field}>
      <AppText variant="label">{title}</AppText>
      <View style={s.choices}>
        {items.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="radio"
            accessibilityState={{ selected: item.id === value }}
            aria-checked={item.id === value}
            onPress={() => onChange(item.id)}
            style={[
              s.choice,
              {
                borderColor: item.id === value ? colors.accent : colors.border,
                backgroundColor:
                  item.id === value ? colors.accentSoft : colors.surface,
              },
            ]}
          >
            <AppText variant="caption">{item.label}</AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function TenancySetup() {
  const { residentId } = useLocalSearchParams<{ residentId: string }>();
  const { session } = useAuth();
  const router = useRouter();
  const colors = useTenantlyColors();
  const org = session?.activeOrganizationId ?? "";
  const [propertyId, setPropertyId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [bedId, setBedId] = useState<string | undefined>();
  const [rent, setRent] = useState("");
  const [deposit, setDeposit] = useState("0");
  const [dueDay, setDueDay] = useState("5");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [idempotencyKey] = useState(
    () => `tenancy-${residentId}-${Crypto.randomUUID()}`,
  );
  const properties = useQuery({
    queryKey: queryKeys.properties(session?.userId ?? "", org),
    queryFn: () => propertyService.list(org),
    enabled: !!org,
  });
  const rooms = useQuery({
    queryKey: queryKeys.rooms(session?.userId ?? "", org, propertyId),
    queryFn: () => roomService.listForProperty(propertyId),
    enabled: !!propertyId,
  });
  const beds = useQuery({
    queryKey: queryKeys.beds(session?.userId ?? "", org, roomId),
    queryFn: async () => {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from("beds")
        .select("*")
        .eq("room_id", roomId)
        .eq("status", "active");
      if (error) throw error;
      const { data: occupied, error: occupiedError } = await client
        .from("occupancy_assignments")
        .select("bed_id")
        .eq("room_id", roomId)
        .is("ends_at", null);
      if (occupiedError) throw occupiedError;
      const occupiedIds = new Set(occupied.map((item) => item.bed_id));
      return data.filter((item) => !occupiedIds.has(item.id));
    },
    enabled: !!roomId,
  });
  async function save() {
    setSaving(true);
    setError(null);
    try {
      await residentService.createTenancy({
        organizationId: org,
        residentId,
        propertyId,
        roomId,
        bedId,
        startDate: localDateISO(),
        dueDay: Number(dueDay),
        rentPaise: Math.round(Number(rent) * 100),
        depositPaise: Math.round(Number(deposit) * 100),
        idempotencyKey,
      });
      router.back();
    } catch (cause) {
      setError(toUserMessage(cause, "Could not create tenancy."));
    } finally {
      setSaving(false);
    }
  }
  return (
    <Screen>
      <View style={s.header}>
        <AppText variant="heading">Create tenancy</AppText>
        <AppText muted>
          Assign a room or bed and snapshot the agreed terms.
        </AppText>
      </View>
      <Choices
        title="Property"
        items={(properties.data ?? []).map((item) => ({
          id: item.id,
          label: item.name,
        }))}
        value={propertyId}
        onChange={(value) => {
          setPropertyId(value);
          setRoomId("");
          setBedId(undefined);
        }}
      />
      <Choices
        title="Room"
        items={(rooms.data ?? [])
          .filter((item) => item.occupiedBeds < item.bedCount)
          .map((item) => ({
            id: item.id,
            label: item.code,
          }))}
        value={roomId}
        onChange={(value) => {
          setRoomId(value);
          setBedId(undefined);
          const room = rooms.data?.find((item) => item.id === value);
          if (room) {
            setRent(String(room.monthlyRentPaise / 100));
            setDeposit(String(room.depositPaise / 100));
          }
        }}
      />
      {(beds.data?.length ?? 0) > 0 ? (
        <Choices
          title="Bed"
          items={(beds.data ?? []).map((item) => ({
            id: item.id,
            label: item.code,
          }))}
          value={bedId}
          onChange={setBedId}
        />
      ) : null}
      {[
        ["Monthly rent (₹)", rent, setRent],
        ["Deposit (₹)", deposit, setDeposit],
        ["Due day (1–28)", dueDay, setDueDay],
      ].map(([label, value, setter]) => (
        <View key={label as string} style={s.field}>
          <AppText variant="label">{label as string}</AppText>
          <TextInput
            accessibilityLabel={label as string}
            keyboardType="number-pad"
            value={value as string}
            onChangeText={setter as (value: string) => void}
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
        label={saving ? "Creating…" : "Create tenancy"}
        isDisabled={
          saving || !roomId || ((beds.data?.length ?? 0) > 0 && !bedId)
        }
        onPress={() => void save()}
      />
    </Screen>
  );
}
const s = StyleSheet.create({
  header: { gap: 5, paddingVertical: spacing.lg },
  field: { gap: 8, marginBottom: spacing.md },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: radii.control,
  },
  input: {
    minHeight: 52,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.control,
    paddingHorizontal: 14,
    fontSize: 16,
  },
});
