import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { RefreshControl, StyleSheet, TextInput, View } from "react-native";
import { complaintService } from "@/features/complaints/service";
import { getSupabaseClient } from "@/shared/api/supabase";
import { queryKeys } from "@/shared/api/query-keys";
import { useAuth } from "@/shared/auth/auth-provider";
import { AppText } from "@/shared/components/app-text";
import { PrimaryButton } from "@/shared/components/primary-button";
import { Screen } from "@/shared/components/screen";
import {
  EmptyLedger,
  LoadingSkeleton,
  StateView,
} from "@/shared/components/state-views";
import { toUserMessage } from "@/shared/errors/to-user-message";
import { radii, spacing, useTenantlyColors } from "@/shared/theme/tokens";
import type { ComplaintStatus } from "@/shared/api/database.types";

const next: Partial<Record<ComplaintStatus, ComplaintStatus>> = {
  assigned: "in_progress",
  in_progress: "resolved",
};
export default function StaffTasks() {
  const { session, activeMembership } = useAuth();
  const colors = useTenantlyColors();
  const cache = useQueryClient();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const userId = session?.userId ?? "";
  const orgId = session?.activeOrganizationId ?? "";
  const tasks = useQuery({
    queryKey: queryKeys.maintenanceTasks(
      userId,
      orgId,
    ),
    queryFn: async () => {
      const { data, error: queryError } = await getSupabaseClient()
        .from("complaints")
        .select("*")
        .eq("assigned_membership_id", activeMembership?.id ?? "")
        .order("created_at");
      if (queryError) throw queryError;
      return data;
    },
    enabled: !!activeMembership?.id,
  });
  async function advance(id: string, status: ComplaintStatus) {
    const target = next[status];
    if (!target) return;
    setBusy(id);
    setError(null);
    try {
      await complaintService.transition(id, target, notes[id]);
      await Promise.all([
        tasks.refetch(),
        cache.invalidateQueries({
          queryKey: queryKeys.maintenanceTasks(userId, orgId),
        }),
        cache.invalidateQueries({
          queryKey: queryKeys.complaints(userId, orgId),
        }),
        cache.invalidateQueries({
          queryKey: queryKeys.ownerDashboard(userId, orgId),
        }),
        cache.invalidateQueries({
          queryKey: queryKeys.tenantDashboard(userId, orgId),
        }),
      ]);
    } catch (cause) {
      setError(toUserMessage(cause, "Task status could not be updated."));
    } finally {
      setBusy(null);
    }
  }
  if (tasks.isLoading)
    return (
      <Screen>
        <LoadingSkeleton />
      </Screen>
    );
  if (tasks.isError)
    return (
      <Screen>
        <StateView
          kind="error"
          title="Tasks unavailable"
          body="Your assigned maintenance work could not be loaded."
          actionLabel="Retry"
          onAction={() => void tasks.refetch()}
        />
      </Screen>
    );
  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={tasks.isRefetching}
          onRefresh={() => void tasks.refetch()}
          tintColor={colors.primary}
        />
      }
    >
      <View style={s.header}>
        <AppText variant="heading">Maintenance tasks</AppText>
        <AppText muted>Update only the tasks assigned to you.</AppText>
      </View>
      {error ? (
        <AppText accessibilityRole="alert" style={{ color: colors.danger }}>
          {error}
        </AppText>
      ) : null}
      {!tasks.data?.length ? (
        <EmptyLedger
          title="No assigned tasks"
          body="New maintenance work will appear here."
        />
      ) : null}
      {tasks.data?.map((task) => {
        const target = next[task.status];
        return (
          <View key={task.id} style={[s.card, { borderColor: colors.border }]}>
            <AppText variant="label">{task.title}</AppText>
            <AppText muted>{task.description}</AppText>
            <AppText variant="caption" muted>
              {task.priority} priority · {task.status.replace("_", " ")}
            </AppText>
            {target ? (
              <>
                <TextInput
                  accessibilityLabel={`Update note for ${task.title}`}
                  placeholder="Work update (optional)"
                  placeholderTextColor={colors.textMuted}
                  value={notes[task.id] ?? ""}
                  onChangeText={(value) =>
                    setNotes((current) => ({ ...current, [task.id]: value }))
                  }
                  style={[
                    s.input,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: colors.surfaceRaised,
                    },
                  ]}
                />
                <PrimaryButton
                  label={
                    busy === task.id
                      ? "Updating…"
                      : `Mark ${target.replace("_", " ")}`
                  }
                  isDisabled={busy === task.id}
                  onPress={() => void advance(task.id, task.status)}
                />
              </>
            ) : (
              <AppText style={{ color: colors.success }}>Completed</AppText>
            )}
          </View>
        );
      })}
    </Screen>
  );
}
const s = StyleSheet.create({
  header: { gap: 5, paddingVertical: spacing.lg },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.card,
    padding: 14,
    gap: 7,
    marginBottom: 10,
  },
  input: {
    minHeight: 50,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.control,
    paddingHorizontal: 12,
    fontSize: 16,
  },
});
