import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Crypto from "expo-crypto";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
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
import { toUserMessage } from "@/shared/errors/to-user-message";
import { showAlert } from "@/shared/utils/alert";

export default function OccupancyManageScreen() {
  const { tenancyId, residentName } = useLocalSearchParams<{
    tenancyId: string;
    residentName: string;
  }>();
  const { session } = useAuth();
  const router = useRouter();
  const cache = useQueryClient();
  const colors = useTenantlyColors();
  const [propertyId, setPropertyId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [bedId, setBedId] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transferKey] = useState(() => Crypto.randomUUID());
  const [vacateKey] = useState(() => Crypto.randomUUID());
  const org = session?.activeOrganizationId ?? "";
  const userId = session?.userId ?? "";
  const properties = useQuery({
    queryKey: queryKeys.properties(userId, org),
    queryFn: () => propertyService.list(org),
    enabled: !!org,
  });
  const rooms = useQuery({
    queryKey: queryKeys.rooms(userId, org, propertyId),
    queryFn: () => roomService.listForProperty(propertyId),
    enabled: !!propertyId,
  });
  const beds = useQuery({
    queryKey: queryKeys.beds(userId, org, roomId),
    queryFn: async () => {
      const client = getSupabaseClient();
      const [bedRows, occupancy] = await Promise.all([
        client
          .from("beds")
          .select("*")
          .eq("room_id", roomId)
          .eq("status", "active"),
        client
          .from("occupancy_assignments")
          .select("bed_id")
          .eq("room_id", roomId)
          .is("ends_at", null),
      ]);
      if (bedRows.error) throw bedRows.error;
      if (occupancy.error) throw occupancy.error;
      const occupied = new Set(occupancy.data.map((item) => item.bed_id));
      return bedRows.data.filter((bed) => !occupied.has(bed.id));
    },
    enabled: !!roomId,
  });
  async function transfer() {
    setSaving(true);
    setError(null);
    if (!propertyId) {
      setError("Please select a target property.");
      setSaving(false);
      return;
    }
    if (!roomId) {
      setError("Please select a target room.");
      setSaving(false);
      return;
    }
    try {
      await residentService.transferOrVacate({
        tenancyId,
        roomId,
        bedId,
        reason: "Owner transfer",
        idempotencyKey: transferKey,
      });
      await Promise.all([
        cache.invalidateQueries({
          queryKey: queryKeys.residents(userId, org),
        }),
        cache.invalidateQueries({
          queryKey: queryKeys.properties(userId, org),
        }),
        cache.invalidateQueries({
          queryKey: queryKeys.rooms(userId, org, propertyId),
        }),
        cache.invalidateQueries({
          queryKey: queryKeys.ownerDashboard(userId, org),
        }),
        cache.invalidateQueries({
          queryKey: ["tenantly", "resident"],
        }),
      ]);
      if (router.canGoBack()) router.back();
      else router.replace("/(owner)/residents" as never);
    } catch (cause) {
      setError(toUserMessage(cause, "Resident could not be transferred."));
    } finally {
      setSaving(false);
    }
  }
  function confirmVacate() {
    showAlert(
      "End tenancy and vacate?",
      "This closes the active occupancy assignment while preserving its history.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Vacate",
          style: "destructive",
          onPress: async () => {
            setSaving(true);
            setError(null);
            try {
              await residentService.transferOrVacate({
                tenancyId,
                roomId: null,
                reason: "Owner recorded move-out",
                idempotencyKey: vacateKey,
              });
              await Promise.all([
                cache.invalidateQueries({
                  queryKey: queryKeys.residents(userId, org),
                }),
                cache.invalidateQueries({
                  queryKey: queryKeys.properties(userId, org),
                }),
                cache.invalidateQueries({
                  queryKey: queryKeys.ownerDashboard(userId, org),
                }),
                cache.invalidateQueries({
                  queryKey: ["tenantly", "resident"],
                }),
              ]);
              if (router.canGoBack()) router.back();
              else router.replace("/(owner)/residents" as never);
            } catch (cause) {
              setError(toUserMessage(cause, "Tenancy could not be ended."));
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    );
  }
  return (
    <Screen>
      <View style={s.header}>
        <AppText variant="heading">Manage occupancy</AppText>
        <AppText muted>{residentName}</AppText>
      </View>
      <AppText variant="label">Transfer to property</AppText>
      <View style={s.choices}>
        {properties.data?.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="radio"
            accessibilityState={{ selected: item.id === propertyId }}
            aria-checked={item.id === propertyId}
            onPress={() => {
              setPropertyId(item.id);
              setRoomId("");
              setBedId(undefined);
            }}
            style={[
              s.choice,
              {
                borderColor:
                  item.id === propertyId ? colors.accent : colors.border,
              },
            ]}
          >
            <AppText variant="caption">{item.name}</AppText>
          </Pressable>
        ))}
      </View>
      <AppText variant="label" style={s.label}>
        New room
      </AppText>
      <View style={s.choices}>
        {rooms.data
          ?.filter((item) => item.occupiedBeds < item.bedCount)
          .map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: item.id === roomId }}
              aria-checked={item.id === roomId}
              onPress={() => {
                setRoomId(item.id);
                setBedId(undefined);
              }}
              style={[
                s.choice,
                {
                  borderColor:
                    item.id === roomId ? colors.accent : colors.border,
                },
              ]}
            >
              <AppText variant="caption">{item.code}</AppText>
            </Pressable>
          ))}
      </View>
      {(beds.data?.length ?? 0) > 0 ? (
        <>
          <AppText variant="label" style={s.label}>
            Bed (optional)
          </AppText>
          <View style={s.choices}>
            {beds.data?.map((bed) => (
              <Pressable
                key={bed.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: bedId === bed.id }}
                onPress={() => setBedId(bed.id)}
                style={[
                  s.choice,
                  {
                    borderColor:
                      bedId === bed.id ? colors.accent : colors.border,
                  },
                ]}
              >
                <AppText variant="caption">{bed.code}</AppText>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}
      <View style={s.actions}>
        {error ? (
          <AppText accessibilityRole="alert" style={{ color: colors.danger }}>
            {error}
          </AppText>
        ) : null}
        <PrimaryButton
          label={saving ? "Transferring…" : "Transfer resident"}
          isDisabled={saving || !roomId}
          onPress={() => void transfer()}
        />
        <Pressable
          accessibilityRole="button"
          onPress={confirmVacate}
          disabled={saving}
          style={[s.vacate, { borderColor: colors.danger }]}
        >
          <AppText variant="label" style={{ color: colors.danger }}>
            Vacate and end tenancy
          </AppText>
        </Pressable>
      </View>
    </Screen>
  );
}
const s = StyleSheet.create({
  header: { gap: 5, paddingVertical: spacing.lg },
  label: { marginTop: spacing.lg },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  choice: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: radii.control,
  },
  actions: { gap: 12, marginTop: spacing.xl },
  vacate: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: radii.control,
  },
});
