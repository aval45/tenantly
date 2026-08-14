import { useQuery } from "@tanstack/react-query";
import { useNetworkState } from "expo-network";
import { useRouter } from "expo-router";
import { Bell, ChevronRight, IndianRupee, Wrench } from "lucide-react-native";
import {
  Pressable,
  RefreshControl,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

import { useOwnerDashboard } from "../api";
import type { ActivityItem, AttentionItem, OwnerDashboard } from "../types";
import { MetricTile } from "./metric-tile";
import { AppText } from "@/shared/components/app-text";
import { OfflineBanner } from "@/shared/components/offline-banner";
import { Screen } from "@/shared/components/screen";
import { LoadingSkeleton, StateView } from "@/shared/components/state-views";
import { StatusBadge } from "@/shared/components/status-badge";
import { useAuth } from "@/shared/auth/auth-provider";
import { getSupabaseClient } from "@/shared/api/supabase";
import { queryKeys } from "@/shared/api/query-keys";
import { copy } from "@/shared/i18n/en";
import { formatCompactMoney, formatMoney } from "@/shared/utils/money";
import { currentMonthLabel, formatDate } from "@/shared/utils/date";
import { motion } from "@/shared/theme/motion";
import { radii, spacing, useTenantlyColors } from "@/shared/theme/tokens";

function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: () => void;
}) {
  const colors = useTenantlyColors();
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleGroup}>
        <AppText variant="section">{title}</AppText>
      </View>
      {action ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.home.viewAllLabel(title)}
          onPress={action}
          style={({ pressed }) => [
            styles.textAction,
            { opacity: pressed ? motion.pressedOpacity : 1 },
          ]}
        >
          <AppText variant="caption" style={{ color: colors.primary }}>
            {copy.home.viewAll}
          </AppText>
          <ChevronRight size={15} color={colors.primary} aria-hidden />
        </Pressable>
      ) : null}
    </View>
  );
}

function CollectionSummary({
  data,
  onReview,
}: {
  data: OwnerDashboard;
  onReview(): void;
}) {
  const colors = useTenantlyColors();
  return (
    <View
      style={[
        styles.collection,
        {
          backgroundColor: colors.surfaceRaised,
          borderColor: colors.border,
          borderTopColor: colors.accent,
        },
      ]}
      accessibilityLabel={`${currentMonthLabel()} collection: ${formatMoney(data.collectedPaise)} of ${formatMoney(data.expectedPaise)} collected`}
    >
      <View style={styles.collectionTop}>
        <View>
          <AppText variant="eyebrow" style={{ color: colors.accent }}>
            MONTHLY RENT BOOK
          </AppText>
          <AppText variant="caption" muted>
            {currentMonthLabel()} collection
          </AppText>
        </View>
        <View
          style={[styles.settledTag, { backgroundColor: colors.primarySoft }]}
        >
          <AppText variant="caption" style={{ color: colors.primary }}>
            {data.collectionPercent}% settled
          </AppText>
        </View>
      </View>
      <View style={styles.receivedBlock}>
        <AppText variant="caption" muted>
          Received
        </AppText>
        <AppText
          variant="display"
          style={[styles.moneyDisplay, { color: colors.text }]}
        >
          {formatMoney(data.collectedPaise)}
        </AppText>
      </View>
      <View
        style={[
          styles.progressTrack,
          { backgroundColor: colors.surfaceSubtle },
        ]}
      >
        <View
          style={[
            styles.progressValue,
            {
              backgroundColor: colors.accent,
              width: `${data.collectionPercent}%`,
            },
          ]}
        />
      </View>
      <View style={styles.collectionFooter}>
        <View>
          <AppText variant="caption" muted>
            Expected
          </AppText>
          <AppText variant="label">
            {formatCompactMoney(data.expectedPaise)}
          </AppText>
        </View>
        <View
          style={[styles.collectionDivider, { backgroundColor: colors.border }]}
        />
        <View style={styles.collectionFooterCopy}>
          <AppText variant="caption" muted>
            Outstanding
          </AppText>
          <AppText variant="label">
            {formatCompactMoney(data.outstandingPaise)}
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onReview}
          style={({ pressed }) => [
            styles.collectionAction,
            {
              backgroundColor: colors.primary,
              opacity: pressed ? motion.pressedOpacity : 1,
            },
          ]}
        >
          <AppText variant="label" style={{ color: colors.background }}>
            Open ledger
          </AppText>
          <ChevronRight size={17} color={colors.background} aria-hidden />
        </Pressable>
      </View>
    </View>
  );
}

function QuietRow({ title, detail }: { title: string; detail: string }) {
  const colors = useTenantlyColors();
  return (
    <View style={[styles.quietRow, { borderColor: colors.border }]}>
      <View style={[styles.quietMark, { backgroundColor: colors.success }]} />
      <View style={styles.rowCopy}>
        <AppText variant="label">{title}</AppText>
        <AppText variant="caption" muted>
          {detail}
        </AppText>
      </View>
    </View>
  );
}

function AttentionRow({
  item,
  onPress,
}: {
  item: AttentionItem;
  onPress(): void;
}) {
  const colors = useTenantlyColors();
  const Icon = item.kind === "payment" ? IndianRupee : Wrench;
  const tone = item.kind === "payment" ? colors.warning : colors.danger;
  const soft = item.kind === "payment" ? colors.warningSoft : colors.dangerSoft;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title}. ${item.detail}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.entityRow,
        {
          borderBottomColor: colors.border,
          opacity: pressed ? motion.pressedOpacity : 1,
        },
      ]}
    >
      <View style={[styles.entityIcon, { backgroundColor: soft }]}>
        <Icon size={18} color={tone} aria-hidden />
      </View>
      <View style={styles.rowCopy}>
        <AppText variant="label">{item.title}</AppText>
        <AppText variant="caption" muted>
          {item.detail}
        </AppText>
      </View>
      <AppText variant="label" style={{ color: tone }}>
        {item.countLabel}
      </AppText>
      <ChevronRight size={18} color={colors.textMuted} aria-hidden />
    </Pressable>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const colors = useTenantlyColors();
  const initials = item.personName
    .split(" ")
    .map((part) => part[0])
    .join("");
  return (
    <View
      style={[styles.entityRow, { borderBottomColor: colors.border }]}
      accessibilityLabel={`${item.personName}, ${item.description}, ${item.amountPaise ? formatMoney(item.amountPaise) : ""}, ${item.status}`}
    >
      <View
        style={[styles.avatarSmall, { backgroundColor: colors.primarySoft }]}
      >
        <AppText variant="caption" style={{ color: colors.primary }}>
          {initials}
        </AppText>
      </View>
      <View style={styles.rowCopy}>
        <AppText variant="label">{item.personName}</AppText>
        <AppText variant="caption" muted>
          {item.description} · {item.occurredAtLabel}
        </AppText>
      </View>
      <View style={styles.activityEnd}>
        {item.amountPaise ? (
          <AppText variant="label">{formatMoney(item.amountPaise)}</AppText>
        ) : null}
        <StatusBadge status={item.status} />
      </View>
    </View>
  );
}

export function OwnerHomeScreen() {
  const colors = useTenantlyColors();
  const router = useRouter();
  const network = useNetworkState();
  const { width } = useWindowDimensions();
  const { session } = useAuth();
  const organizationId = session?.activeOrganizationId ?? "unknown";
  const query = useOwnerDashboard(
    organizationId,
    undefined,
    session?.profile.fullName,
    session?.userId,
  );
  const unreadNotifications = useQuery({
    queryKey: [
      ...queryKeys.notifications(session?.userId ?? ""),
      "unread-count",
    ],
    queryFn: async () => {
      const { count, error } = await getSupabaseClient()
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .is("read_at", null);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!session,
  });
  const isOffline = network.isInternetReachable === false;
  const unreadCount = unreadNotifications.data ?? 0;

  if (query.isLoading)
    return (
      <Screen testID="owner-home-loading">
        <LoadingSkeleton />
      </Screen>
    );
  if (query.isError) {
    return (
      <Screen testID="owner-home-error">
        <StateView
          kind="error"
          title={copy.states.errorTitle}
          body={copy.states.errorBody}
          actionLabel={copy.states.retry}
          onAction={() => void query.refetch()}
        />
      </Screen>
    );
  }
  if (!query.data) {
    return (
      <Screen testID="owner-home-empty">
        <StateView
          kind="empty"
          title={copy.states.emptyTitle}
          body={copy.states.emptyBody}
          actionLabel={copy.states.emptyAction}
          onAction={() => router.push("/properties")}
        />
      </Screen>
    );
  }

  const data = query.data;
  const firstAttention = data.attention[0];
  const goToRent = () => router.push("/rent");
  const goToAttention = (item: (typeof data.attention)[number]) =>
    item.kind === "complaint"
      ? router.push("/(owner)/complaints" as never)
      : goToRent();
  return (
    <Screen
      testID="owner-home-populated"
      refreshControl={
        <RefreshControl
          refreshing={query.isRefetching}
          onRefresh={() => void query.refetch()}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <View style={styles.orgLine}>
            <AppText variant="label">{data.organizationName}</AppText>
            <AppText variant="caption" muted>
              · {data.propertyCount} properties
            </AppText>
          </View>
          <AppText variant="heading">Rent register</AppText>
          <AppText muted>
            {formatDate(new Date(), {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}{" "}
            · managed by {data.ownerFirstName}
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.home.notifications(unreadCount)}
          onPress={() => router.push("/notifications" as never)}
          hitSlop={8}
          style={({ pressed }) => [
            styles.notification,
            {
              borderColor: colors.border,
              backgroundColor: colors.surfaceRaised,
              opacity: pressed ? motion.pressedOpacity : 1,
            },
          ]}
        >
          <Bell size={20} color={colors.primary} aria-hidden />
          {unreadCount > 0 ? (
            <View
              style={[
                styles.notificationDot,
                {
                  backgroundColor: colors.accent,
                  borderColor: colors.background,
                },
              ]}
            />
          ) : null}
        </Pressable>
      </View>
      {isOffline ? <OfflineBanner /> : null}
      <CollectionSummary data={data} onReview={goToRent} />
      <SectionHeader title="Portfolio register" />
      <View style={[styles.metricGrid, { borderColor: colors.border }]}>
        {data.metrics.map((metric) => (
          <MetricTile key={metric.id} metric={metric} wide={width >= 760} />
        ))}
      </View>
      <SectionHeader
        title={copy.home.needsAttention}
        action={
          firstAttention ? () => goToAttention(firstAttention) : undefined
        }
      />
      {data.attention.length ? (
        <View
          style={[
            styles.section,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {data.attention.map((item) => (
            <AttentionRow
              key={item.id}
              item={item}
              onPress={() => goToAttention(item)}
            />
          ))}
        </View>
      ) : (
        <QuietRow
          title="Desk is clear"
          detail="No payments or requests need action."
        />
      )}
      <SectionHeader
        title={copy.home.recentActivity}
        action={data.activity.length ? goToRent : undefined}
      />
      {data.activity.length ? (
        <View
          style={[styles.activitySection, { borderTopColor: colors.border }]}
        >
          {data.activity.map((item) => (
            <ActivityRow key={item.id} item={item} />
          ))}
        </View>
      ) : (
        <QuietRow
          title="No entries yet"
          detail="Payments and resident updates will be recorded here."
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerCopy: { flex: 1, gap: 4 },
  orgLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 5,
  },
  notification: {
    width: 48,
    height: 48,
    borderRadius: radii.control,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 2,
  },
  collection: {
    borderRadius: radii.dialog,
    padding: spacing.lg,
    marginTop: spacing.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderTopWidth: 4,
  },
  collectionTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settledTag: {
    minHeight: 30,
    justifyContent: "center",
    borderRadius: 2,
    paddingHorizontal: 10,
  },
  receivedBlock: { gap: 2, marginTop: 20 },
  moneyDisplay: {
    fontFamily: "Inter_700Bold",
    fontVariant: ["tabular-nums"],
    letterSpacing: -1.2,
  },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    marginTop: 15,
    overflow: "hidden",
  },
  progressValue: { height: "100%", borderRadius: 3 },
  collectionFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 18,
  },
  collectionFooterCopy: { flex: 1 },
  collectionDivider: {
    width: StyleSheet.hairlineWidth,
    height: 31,
  },
  collectionAction: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    borderRadius: radii.control,
    paddingHorizontal: 13,
  },
  sectionHeader: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  sectionTitleGroup: { flexDirection: "row", alignItems: "center" },
  textAction: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingLeft: spacing.md,
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.card,
    overflow: "hidden",
  },
  section: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.card,
    overflow: "hidden",
  },
  activitySection: { borderTopWidth: StyleSheet.hairlineWidth },
  quietRow: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 12,
  },
  quietMark: { width: 6, height: 6, borderRadius: 3 },
  entityRow: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingHorizontal: 15,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  entityIcon: {
    width: 40,
    height: 40,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  rowCopy: { flex: 1, gap: 2 },
  activityEnd: { alignItems: "flex-end", gap: 5 },
});
