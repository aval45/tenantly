import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, BedDouble, Plus } from "lucide-react-native";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { propertyService } from "@/features/properties/service";
import { roomService } from "@/features/properties/rooms";
import { useAuth } from "@/shared/auth/auth-provider";
import { AppText } from "@/shared/components/app-text";
import { Screen } from "@/shared/components/screen";
import { LoadingSkeleton } from "@/shared/components/state-views";
import { formatMoney } from "@/shared/utils/money";
import { radii, spacing, useTenantlyColors } from "@/shared/theme/tokens";
export default function PropertyDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useTenantlyColors();
  const { session } = useAuth();
  const query = useQuery({
    queryKey: ["property", id],
    queryFn: async () =>
      Promise.all([
        propertyService.get(session?.activeOrganizationId ?? "", id),
        roomService.listForProperty(id),
      ]),
    enabled: !!id,
  });
  if (query.isLoading)
    return (
      <Screen>
        <LoadingSkeleton />
      </Screen>
    );
  const property = query.data?.[0];
  const rooms = query.data?.[1] ?? [];
  function confirmArchiveProperty() {
    if (!property) return;
    Alert.alert(
      "Archive property?",
      "Occupied properties cannot be archived. Historical records will be preserved.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Archive",
          style: "destructive",
          onPress: () =>
            void propertyService.archive(property.id).then(() => router.back()),
        },
      ],
    );
  }
  function confirmArchiveRoom(roomId: string) {
    Alert.alert("Archive room?", "Occupied rooms cannot be archived.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Archive",
        style: "destructive",
        onPress: () =>
          void roomService.archive(roomId).then(() => query.refetch()),
      },
    ]);
  }
  return (
    <Screen>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.replace("/(owner)/properties" as never)}
        style={s.back}
      >
        <ArrowLeft size={20} color={colors.primary} />
        <AppText variant="label" style={{ color: colors.primary }}>
          Properties
        </AppText>
      </Pressable>
      {property ? (
        <>
          <View style={s.heading}>
            <AppText variant="eyebrow" style={{ color: colors.accent }}>
              PROPERTY
            </AppText>
            <AppText variant="heading">{property.name}</AppText>
            <AppText muted>
              {property.addressLine1}, {property.city}
            </AppText>
          </View>
          <View style={[s.summary, { backgroundColor: colors.primarySoft }]}>
            <BedDouble size={20} color={colors.primary} />
            <AppText variant="label">
              {rooms.length} rooms · {rooms.reduce((n, r) => n + r.bedCount, 0)}{" "}
              beds
            </AppText>
          </View>
          <View style={[s.list, { borderColor: colors.border }]}>
            {rooms.map((room) => (
              <View
                key={room.id}
                style={[s.room, { borderBottomColor: colors.border }]}
              >
                <View style={{ flex: 1 }}>
                  <AppText variant="label">Room {room.code}</AppText>
                  <AppText variant="caption" muted>
                    {room.occupiedBeds}/{room.bedCount} occupied
                  </AppText>
                </View>
                <View style={s.roomEnd}>
                  <AppText variant="label">
                    {formatMoney(room.monthlyRentPaise)}
                  </AppText>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => confirmArchiveRoom(room.id)}
                  >
                    <AppText variant="caption" style={{ color: colors.danger }}>
                      Archive
                    </AppText>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: "/(owner)/room-setup" as never,
                params: { propertyId: id },
              })
            }
            style={[s.action, { backgroundColor: colors.primary }]}
          >
            <Plus size={18} color={colors.background} />
            <AppText variant="label" style={{ color: colors.background }}>
              Add room
            </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={confirmArchiveProperty}
            style={[s.archive, { borderColor: colors.danger }]}
          >
            <AppText variant="label" style={{ color: colors.danger }}>
              Archive property
            </AppText>
          </Pressable>
        </>
      ) : (
        <AppText muted>Property unavailable.</AppText>
      )}
    </Screen>
  );
}
const s = StyleSheet.create({
  back: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.sm,
  },
  heading: { gap: 5, paddingVertical: spacing.lg },
  summary: {
    borderRadius: radii.card,
    padding: spacing.md,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  list: {
    marginTop: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.card,
    overflow: "hidden",
  },
  room: {
    minHeight: 64,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  roomEnd: { alignItems: "flex-end", gap: 5 },
  action: {
    marginTop: spacing.lg,
    minHeight: 48,
    borderRadius: radii.control,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  archive: {
    marginTop: 12,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: radii.control,
  },
});
