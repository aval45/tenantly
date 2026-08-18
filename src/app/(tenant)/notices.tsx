import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { getSupabaseClient } from "@/shared/api/supabase";
import { queryKeys } from "@/shared/api/query-keys";
import { useAuth } from "@/shared/auth/auth-provider";
import { AppText } from "@/shared/components/app-text";
import { Screen } from "@/shared/components/screen";
import {
  EmptyLedger,
  LoadingSkeleton,
  StateView,
} from "@/shared/components/state-views";
import { formatDate } from "@/shared/utils/date";
import { radii, spacing, useTenantlyColors } from "@/shared/theme/tokens";

export default function TenantNotices() {
  const { session } = useAuth();
  const colors = useTenantlyColors();
  const cache = useQueryClient();
  const userId = session?.userId ?? "";
  const orgId = session?.activeOrganizationId ?? "";
  const query = useQuery({
    queryKey: queryKeys.notices(
      userId,
      orgId,
    ),
    queryFn: async () => {
      const client = getSupabaseClient();
      const [notices, reads] = await Promise.all([
        client
          .from("notices")
          .select("*")
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false }),
        client.from("notice_reads").select("notice_id"),
      ]);
      if (notices.error) throw notices.error;
      if (reads.error) throw reads.error;
      return {
        notices: notices.data,
        readIds: new Set(reads.data.map((item) => item.notice_id)),
      };
    },
  });
  async function open(noticeId: string) {
    const { error } = await getSupabaseClient()
      .from("notice_reads")
      .upsert({
        notice_id: noticeId,
        profile_id: userId,
        read_at: new Date().toISOString(),
      });
    if (error) return;
    await Promise.all([
      cache.invalidateQueries({
        queryKey: queryKeys.notices(userId, orgId),
      }),
      cache.invalidateQueries({
        queryKey: queryKeys.tenantDashboard(userId, orgId),
      }),
    ]);
  }
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
          title="Notices unavailable"
          body="Property updates could not be loaded."
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
      <View style={s.header}>
        <AppText variant="heading">Notices</AppText>
        <AppText muted>Updates sent to your tenancy and property.</AppText>
      </View>
      {!query.data?.notices.length ? (
        <EmptyLedger
          title="No notices"
          body="Important updates will appear here."
        />
      ) : null}
      {query.data?.notices.map((notice) => {
        const isRead = query.data.readIds.has(notice.id);
        return (
          <Pressable
            key={notice.id}
            accessibilityRole="button"
            onPress={() => void open(notice.id)}
            style={[
              s.item,
              {
                borderColor: colors.border,
                backgroundColor: isRead ? colors.surface : colors.primarySoft,
              },
            ]}
          >
            <View style={s.title}>
              <AppText variant="label">{notice.title}</AppText>
              {notice.is_pinned ? (
                <AppText variant="caption" style={{ color: colors.accent }}>
                  Pinned
                </AppText>
              ) : null}
            </View>
            <AppText muted>{notice.body}</AppText>
            <AppText variant="caption" muted>
              {formatDate(notice.created_at)} ·{" "}
              {isRead ? "Read" : "Tap to mark read"}
            </AppText>
          </Pressable>
        );
      })}
    </Screen>
  );
}
const s = StyleSheet.create({
  header: { gap: 5, paddingVertical: spacing.lg },
  item: {
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.card,
    gap: 5,
    marginBottom: 8,
  },
  title: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
});
