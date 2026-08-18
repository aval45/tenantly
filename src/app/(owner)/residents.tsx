import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ChevronRight, Plus, UserRound } from "lucide-react-native";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { residentService } from "@/features/residents/service";
import { useAuth } from "@/shared/auth/auth-provider";
import { AppText } from "@/shared/components/app-text";
import { Screen } from "@/shared/components/screen";
import { radii, spacing, useTenantlyColors } from "@/shared/theme/tokens";
import { queryKeys } from "@/shared/api/query-keys";
import { LoadingSkeleton, StateView } from "@/shared/components/state-views";
export default function ResidentsScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const colors = useTenantlyColors();
  const org = session?.activeOrganizationId ?? "";
  const query = useQuery({
    queryKey: queryKeys.residents(session?.userId ?? "", org),
    queryFn: async () => ({
      residents: await residentService.list(org),
      tenancies: await residentService.listActiveTenancies(org),
    }),
    enabled: !!org,
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
          title="Residents unavailable"
          body="Resident records could not be loaded."
          actionLabel="Retry"
          onAction={() => void query.refetch()}
        />
      </Screen>
    );
  const tenancies = query.data?.tenancies ?? [];
  return (
    <Screen scrollable={false}>
      <FlatList
        data={query.data?.residents ?? []}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => void query.refetch()}
          />
        }
        contentContainerStyle={s.content}
        ListHeaderComponent={
          <View style={s.header}>
            <View style={s.title}>
              <AppText variant="heading">Residents</AppText>
              {session?.capabilities.manageOrganization ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    router.push("/(owner)/resident-setup" as never)
                  }
                  style={[s.add, { backgroundColor: colors.primary }]}
                >
                  <Plus size={17} color={colors.background} />
                  <AppText variant="label" style={{ color: colors.background }}>
                    Add
                  </AppText>
                </Pressable>
              ) : null}
            </View>
            <AppText muted>
              Resident identity records exist independently of app accounts.
            </AppText>
          </View>
        }
        ListEmptyComponent={
          <StateView
            kind="empty"
            title="No residents"
            body="Residents assigned to your properties will appear here."
          />
        }
        renderItem={({ item }) => {
          const tenancy = tenancies.find(
            (value) => value.resident_id === item.id,
          );
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: "/(owner)/resident/[id]" as never,
                  params: { id: item.id },
                })
              }
              style={[s.row, { borderColor: colors.border }]}
            >
              <View style={[s.avatar, { backgroundColor: colors.primarySoft }]}>
                <UserRound size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="label">{item.full_name}</AppText>
                <AppText variant="caption" muted>
                  {tenancy
                    ? "Active tenancy · manage occupancy"
                    : item.phone_e164 ||
                      item.email_normalized ||
                      "No active tenancy"}
                </AppText>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}
const s = StyleSheet.create({
  header: { gap: 5, paddingVertical: spacing.lg },
  content: { paddingBottom: spacing.xl },
  title: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  add: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: radii.control,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  list: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.card,
    overflow: "hidden",
  },
  row: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.card,
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
