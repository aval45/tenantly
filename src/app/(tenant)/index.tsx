import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Bell, ChevronRight, Megaphone, Wrench } from "lucide-react-native";
import { Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { billingService, summarizeInvoices } from "@/features/billing/service";
import { getTenantContext } from "@/features/tenant/api";
import { getSupabaseClient } from "@/shared/api/supabase";
import { useAuth } from "@/shared/auth/auth-provider";
import { AppText } from "@/shared/components/app-text";
import { Screen } from "@/shared/components/screen";
import { formatMoney } from "@/shared/utils/money";
import { radii, spacing, useTenantlyColors } from "@/shared/theme/tokens";
import { queryKeys } from "@/shared/api/query-keys";
import { formatDate } from "@/shared/utils/date";
import {
  EmptyLedger,
  LoadingSkeleton,
  StateView,
} from "@/shared/components/state-views";
export default function TenantHome() {
  const { session } = useAuth();
  const router = useRouter();
  const colors = useTenantlyColors();
  const query = useQuery({
    queryKey: queryKeys.tenantDashboard(
      session?.userId ?? "",
      session?.activeOrganizationId ?? "",
    ),
    queryFn: async () => {
      const [context, invoices, complaints, notices] = await Promise.all([
        getTenantContext(),
        billingService.listOwnInvoices(),
        getSupabaseClient()
          .from("complaints")
          .select("*")
          .order("created_at", { ascending: false }),
        getSupabaseClient()
          .from("notices")
          .select("*")
          .eq("is_pinned", true)
          .order("is_pinned", { ascending: false })
          .limit(3),
      ]);
      if (complaints.error) throw complaints.error;
      if (notices.error) throw notices.error;
      return {
        context,
        invoices,
        complaints: complaints.data,
        notices: notices.data,
      };
    },
  });
  const invoiceSummary = summarizeInvoices(query.data?.invoices ?? []);
  const current = invoiceSummary.nextInvoice;
  const outstandingPaise = invoiceSummary.outstandingPaise;
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
          title="Home unavailable"
          body="Your rent and property information could not be loaded."
          actionLabel="Retry"
          onAction={() => void query.refetch()}
        />
      </Screen>
    );
  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={query.isRefetching}
          onRefresh={() => void query.refetch()}
          tintColor={colors.primary}
        />
      }
    >
      <View style={s.top}>
        <View>
          <AppText variant="eyebrow" muted>
            RESIDENT HOME
          </AppText>
          <AppText variant="heading">
            Hello, {session?.profile.fullName.split(" ")[0]}
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          onPress={() => router.push("/notifications" as never)}
        >
          <Bell size={22} color={colors.primary} />
        </Pressable>
      </View>
      <View
        style={[
          s.due,
          {
            backgroundColor: colors.hero,
            borderLeftColor: colors.accent,
          },
        ]}
      >
        <View style={s.dueLabel}>
          <AppText variant="eyebrow" style={{ color: colors.accent }}>
            RENT LEDGER
          </AppText>
          <AppText variant="caption" style={{ color: colors.heroMuted }}>
            TOTAL AMOUNT DUE
          </AppText>
        </View>
        <AppText
          variant="display"
          style={[s.moneyDisplay, { color: colors.heroText }]}
        >
          {formatMoney(outstandingPaise)}
        </AppText>
        <AppText style={{ color: colors.heroMuted }}>
          {current
            ? `Next due ${formatDate(current.due_date)}`
            : "You are all caught up"}
        </AppText>
        {current ? (
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: "/(tenant)/invoice/[id]" as never,
                params: { id: current.id },
              })
            }
            style={[s.cta, { backgroundColor: colors.heroText }]}
          >
            <AppText variant="label" style={{ color: colors.hero }}>
              View invoice
            </AppText>
            <ChevronRight size={17} color={colors.hero} />
          </Pressable>
        ) : null}
      </View>
      <AppText variant="section" style={s.section}>
        At a glance
      </AppText>
      <View style={s.tiles}>
        <View style={[s.tile, { borderColor: colors.border }]}>
          <Wrench size={19} color={colors.primary} />
          <AppText variant="metric">
            {query.data?.complaints.filter(
              (item) =>
                !["closed", "resolved", "rejected"].includes(item.status),
            ).length ?? 0}
          </AppText>
          <AppText variant="caption" muted>
            Active requests
          </AppText>
        </View>
        <View style={[s.tile, { borderColor: colors.border }]}>
          <Megaphone size={19} color={colors.primary} />
          <AppText variant="metric">{query.data?.notices.length ?? 0}</AppText>
          <AppText variant="caption" muted>
            Recent notices
          </AppText>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push("/(tenant)/notices" as never)}
        style={s.noticeHeader}
      >
        <AppText variant="section">Pinned notices</AppText>
        <AppText variant="caption" style={{ color: colors.accent }}>
          View all
        </AppText>
      </Pressable>
      {!query.data?.notices.length ? (
        <EmptyLedger
          title="No pinned notices"
          body="Important property updates will appear here."
        />
      ) : null}
      {query.data?.notices.map((item) => (
        <View key={item.id} style={[s.notice, { borderColor: colors.border }]}>
          <AppText variant="label">{item.title}</AppText>
          <AppText muted>{item.body}</AppText>
        </View>
      ))}
    </Screen>
  );
}
const s = StyleSheet.create({
  top: {
    paddingVertical: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  due: {
    padding: spacing.lg,
    borderRadius: radii.dialog,
    borderLeftWidth: 6,
    gap: 8,
  },
  dueLabel: { gap: 2, marginBottom: 4 },
  moneyDisplay: {
    fontFamily: "Inter_700Bold",
    fontVariant: ["tabular-nums"],
    letterSpacing: -1.2,
  },
  cta: {
    minHeight: 44,
    marginTop: 8,
    borderRadius: radii.control,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  section: { marginTop: spacing.lg, marginBottom: 10 },
  noticeHeader: {
    marginTop: spacing.lg,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tiles: { flexDirection: "row", gap: 10 },
  tile: {
    flex: 1,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.card,
    gap: 4,
  },
  notice: {
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.card,
    gap: 4,
    marginBottom: 8,
  },
});
