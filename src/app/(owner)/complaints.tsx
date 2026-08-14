import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { useState } from "react";
import { complaintService } from "@/features/complaints/service";
import { useAuth } from "@/shared/auth/auth-provider";
import type { ComplaintStatus } from "@/shared/api/database.types";
import { AppText } from "@/shared/components/app-text";
import { Screen } from "@/shared/components/screen";
import {
  EmptyLedger,
  LoadingSkeleton,
  StateView,
} from "@/shared/components/state-views";
import { radii, spacing, useTenantlyColors } from "@/shared/theme/tokens";
import { queryKeys } from "@/shared/api/query-keys";
import { toUserMessage } from "@/shared/errors/to-user-message";
const next: Partial<Record<ComplaintStatus, ComplaintStatus>> = {
  open: "in_progress",
  assigned: "in_progress",
  reopened: "in_progress",
  in_progress: "resolved",
  resolved: "closed",
};
export default function ComplaintsScreen() {
  const { session } = useAuth();
  const colors = useTenantlyColors();
  const cache = useQueryClient();
  const org = session?.activeOrganizationId ?? "";
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const query = useQuery({
    queryKey: queryKeys.complaints(session?.userId ?? "", org),
    queryFn: () => complaintService.list(org),
    enabled: !!org,
  });
  async function advance(id: string, status: ComplaintStatus) {
    const value = next[status];
    if (!value) return;
    setBusyId(id);
    setActionError(null);
    try {
      await complaintService.transition(id, value);
      await cache.invalidateQueries({
        queryKey: queryKeys.complaints(session?.userId ?? "", org),
      });
    } catch (cause) {
      setActionError(
        toUserMessage(cause, "The request status could not be updated."),
      );
    } finally {
      setBusyId(null);
    }
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
          title="Requests unavailable"
          body="Resident requests could not be loaded."
          actionLabel="Retry"
          onAction={() => void query.refetch()}
        />
      </Screen>
    );
  return (
    <Screen scrollable={false}>
      <FlatList
        data={query.data ?? []}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => void query.refetch()}
          />
        }
        contentContainerStyle={s.content}
        ListHeaderComponent={
          <>
            <View style={s.header}>
              <AppText variant="heading">Complaints</AppText>
              <AppText muted>
                Triage and progress resident requests with an auditable history.
              </AppText>
            </View>
            {actionError ? (
              <AppText
                accessibilityRole="alert"
                style={{ color: colors.danger, marginBottom: spacing.md }}
              >
                {actionError}
              </AppText>
            ) : null}
          </>
        }
        ListEmptyComponent={
          <EmptyLedger
            title="No open requests"
            body="Resident maintenance and service requests will appear here."
          />
        }
        renderItem={({ item }) => (
          <View style={[s.row, { borderColor: colors.border }]}>
            <View style={{ flex: 1, gap: 3 }}>
              <AppText variant="label">{item.title}</AppText>
              <AppText variant="caption" muted>
                {item.category} · {item.priority} ·{" "}
                {item.status.replace("_", " ")}
              </AppText>
            </View>
            {next[item.status] ? (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: busyId === item.id }}
                disabled={busyId === item.id}
                onPress={() => void advance(item.id, item.status)}
                style={[s.action, { backgroundColor: colors.primarySoft }]}
              >
                <AppText variant="caption">
                  {busyId === item.id
                    ? "Updating…"
                    : `Mark ${next[item.status]?.replace("_", " ")}`}
                </AppText>
              </Pressable>
            ) : null}
          </View>
        )}
      />
    </Screen>
  );
}
const s = StyleSheet.create({
  header: { gap: 5, paddingVertical: spacing.lg },
  content: { paddingBottom: spacing.xl },
  list: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.card,
    overflow: "hidden",
  },
  row: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.card,
    marginBottom: 8,
  },
  action: {
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 10,
    borderRadius: radii.control,
  },
});
