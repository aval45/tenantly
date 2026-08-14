import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { BedDouble, Building2, ChevronRight, Plus } from "lucide-react-native";
import { Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { propertyService } from "@/features/properties/service";
import { useAuth } from "@/shared/auth/auth-provider";
import { AppText } from "@/shared/components/app-text";
import { Screen } from "@/shared/components/screen";
import { LoadingSkeleton, StateView } from "@/shared/components/state-views";
import { motion } from "@/shared/theme/motion";
import { radii, spacing, useTenantlyColors } from "@/shared/theme/tokens";

export default function PropertiesScreen() {
  const colors = useTenantlyColors();
  const router = useRouter();
  const { session } = useAuth();
  const organizationId = session?.activeOrganizationId ?? "";
  const query = useQuery({
    queryKey: ["properties", organizationId],
    queryFn: () => propertyService.list(organizationId),
    enabled: !!organizationId,
  });
  if (query.isLoading)
    return (
      <Screen>
        <LoadingSkeleton />
      </Screen>
    );
  if (query.isError)
    return (
      <Screen>
        <StateView
          kind="error"
          title="Properties unavailable"
          body="Check your connection and try again."
          actionLabel="Try again"
          onAction={() => void query.refetch()}
        />
      </Screen>
    );
  const properties = query.data ?? [];
  const occupied = properties.reduce((sum, item) => sum + item.occupied, 0);
  const capacity = properties.reduce((sum, item) => sum + item.capacity, 0);
  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={query.isRefetching}
          onRefresh={() => void query.refetch()}
        />
      }
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <AppText variant="heading">Properties</AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add property"
            onPress={() => router.push("/(owner)/property-setup" as never)}
            style={[styles.addButton, { backgroundColor: colors.primary }]}
          >
            <Plus size={17} color={colors.background} />
            <AppText variant="caption" style={{ color: colors.background }}>
              Add
            </AppText>
          </Pressable>
        </View>
        <AppText muted>Occupancy across your portfolio.</AppText>
      </View>
      <View
        style={[
          styles.summary,
          {
            backgroundColor: colors.primary,
            borderLeftColor: colors.accent,
          },
        ]}
      >
        <Building2 size={22} color={colors.background} />
        <View>
          <AppText variant="metric" style={{ color: colors.background }}>
            {properties.length} properties
          </AppText>
          <AppText style={{ color: colors.background }}>
            {occupied} of {capacity} beds occupied
          </AppText>
        </View>
      </View>
      {!properties.length ? (
        <StateView
          kind="empty"
          title="Add your first property"
          body="Rooms, residents, and rent start with a property."
          actionLabel="Add property"
          onAction={() => router.push("/(owner)/property-setup" as never)}
        />
      ) : (
        <View
          style={[
            styles.list,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {properties.map((property) => {
            const percent = property.capacity
              ? Math.round((property.occupied / property.capacity) * 100)
              : 0;
            return (
              <Pressable
                key={property.id}
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: "/(owner)/property/[id]" as never,
                    params: { id: property.id },
                  })
                }
                style={({ pressed }) => [
                  styles.row,
                  {
                    borderBottomColor: colors.border,
                    opacity: pressed ? motion.pressedOpacity : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.icon,
                    { backgroundColor: colors.surfaceSubtle },
                  ]}
                >
                  <BedDouble size={19} color={colors.primary} />
                </View>
                <View style={styles.copy}>
                  <AppText variant="label">{property.name}</AppText>
                  <AppText variant="caption" muted>
                    {property.city} · {property.occupied}/{property.capacity}{" "}
                    occupied
                  </AppText>
                </View>
                <AppText
                  variant="label"
                  style={{
                    color: percent >= 80 ? colors.success : colors.warning,
                  }}
                >
                  {percent}%
                </AppText>
                <ChevronRight size={18} color={colors.textMuted} />
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  header: { gap: 4, paddingTop: spacing.md, paddingBottom: spacing.lg },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addButton: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: radii.control,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  summary: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
    padding: spacing.lg,
    borderRadius: radii.dialog,
    borderLeftWidth: 6,
  },
  list: {
    marginTop: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.card,
    overflow: "hidden",
  },
  row: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: { flex: 1, gap: 2 },
});
