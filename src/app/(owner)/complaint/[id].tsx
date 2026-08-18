import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, RefreshControl, StyleSheet, TextInput, View } from "react-native";
import { complaintService } from "@/features/complaints/service";
import { getSupabaseClient } from "@/shared/api/supabase";
import { queryKeys } from "@/shared/api/query-keys";
import { useAuth } from "@/shared/auth/auth-provider";
import { AppText } from "@/shared/components/app-text";
import { PrimaryButton } from "@/shared/components/primary-button";
import { Screen } from "@/shared/components/screen";
import { LoadingSkeleton, StateView } from "@/shared/components/state-views";
import { toUserMessage } from "@/shared/errors/to-user-message";
import { formatDate } from "@/shared/utils/date";
import { radii, spacing, useTenantlyColors } from "@/shared/theme/tokens";
import type { ComplaintStatus } from "@/shared/api/database.types";

const next: Partial<Record<ComplaintStatus, ComplaintStatus>> = {
  open: "in_progress",
  assigned: "in_progress",
  reopened: "in_progress",
  in_progress: "resolved",
  resolved: "closed",
};
export default function OwnerComplaintDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const colors = useTenantlyColors();
  const cache = useQueryClient();
  const [staffId, setStaffId] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const userId = session?.userId ?? "";
  const orgId = session?.activeOrganizationId ?? "";
  const detail = useQuery({
    queryKey: [
      ...queryKeys.complaints(
        userId,
        orgId,
      ),
      id,
    ],
    queryFn: () => complaintService.details(id),
    enabled: !!id,
  });
  const staff = useQuery({
    queryKey: [
      "tenantly",
      "maintenance-members",
      userId,
      orgId,
    ],
    queryFn: async () => {
      const { data, error: queryError } = await getSupabaseClient()
        .from("organization_memberships")
        .select("id,profile_id")
        .eq("role", "maintenance_staff")
        .eq("status", "active");
      if (queryError) throw queryError;
      const ids = data.map((item) => item.profile_id);
      const profiles = ids.length
        ? await getSupabaseClient()
            .from("profiles")
            .select("id,full_name")
            .in("id", ids)
        : { data: [], error: null };
      if (profiles.error) throw profiles.error;
      const names = new Map(
        profiles.data.map((item) => [item.id, item.full_name]),
      );
      return data.map((item) => ({
        id: item.id,
        label: names.get(item.profile_id) ?? "Maintenance staff",
      }));
    },
  });
  async function assign() {
    if (!staffId) return;
    setSaving(true);
    setError(null);
    try {
      await complaintService.assign(id, staffId, note);
      setNote("");
      await Promise.all([
        detail.refetch(),
        cache.invalidateQueries({
          queryKey: queryKeys.complaints(userId, orgId),
        }),
        cache.invalidateQueries({
          queryKey: queryKeys.maintenanceTasks(userId, orgId),
        }),
        cache.invalidateQueries({
          queryKey: queryKeys.ownerDashboard(userId, orgId),
        }),
      ]);
    } catch (cause) {
      setError(toUserMessage(cause, "Task could not be assigned."));
    } finally {
      setSaving(false);
    }
  }
  async function advance() {
    const status = detail.data?.complaint.status;
    const target = status ? next[status] : undefined;
    if (!target) return;
    setSaving(true);
    setError(null);
    try {
      await complaintService.transition(id, target, note);
      setNote("");
      await Promise.all([
        detail.refetch(),
        cache.invalidateQueries({
          queryKey: queryKeys.complaints(userId, orgId),
        }),
        cache.invalidateQueries({
          queryKey: queryKeys.maintenanceTasks(userId, orgId),
        }),
        cache.invalidateQueries({
          queryKey: queryKeys.ownerDashboard(userId, orgId),
        }),
      ]);
    } catch (cause) {
      setError(toUserMessage(cause, "Status could not be updated."));
    } finally {
      setSaving(false);
    }
  }
  if (detail.isLoading)
    return (
      <Screen>
        <LoadingSkeleton />
      </Screen>
    );
  if (detail.isError || !detail.data)
    return (
      <Screen>
        <StateView
          kind="error"
          title="Complaint unavailable"
          body="The complaint timeline could not be loaded."
          actionLabel="Retry"
          onAction={() => void detail.refetch()}
        />
      </Screen>
    );
  const { complaint, events } = detail.data;
  const target = next[complaint.status];
  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={detail.isRefetching}
          onRefresh={() => void detail.refetch()}
          tintColor={colors.primary}
        />
      }
    >
      <View style={s.header}>
        <AppText variant="eyebrow" style={{ color: colors.accent }}>
          MAINTENANCE REQUEST
        </AppText>
        <AppText variant="heading">{complaint.title}</AppText>
        <AppText muted>
          {complaint.category} · {complaint.priority} ·{" "}
          {complaint.status.replace("_", " ")}
        </AppText>
      </View>
      <View style={[s.card, { borderColor: colors.border }]}>
        <AppText>{complaint.description}</AppText>
      </View>
      <AppText variant="section" style={s.section}>
        Assign maintenance staff
      </AppText>
      <View style={s.choices}>
        {staff.data?.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="radio"
            accessibilityState={{ selected: staffId === item.id }}
            onPress={() => setStaffId(item.id)}
            style={[
              s.choice,
              {
                borderColor:
                  staffId === item.id ? colors.accent : colors.border,
              },
            ]}
          >
            <AppText variant="caption">{item.label}</AppText>
          </Pressable>
        ))}
      </View>
      <TextInput
        accessibilityLabel="Complaint update note"
        placeholder="Assignment or resolution note"
        placeholderTextColor={colors.textMuted}
        value={note}
        onChangeText={setNote}
        style={[
          s.input,
          {
            color: colors.text,
            borderColor: colors.border,
            backgroundColor: colors.surfaceRaised,
          },
        ]}
      />
      <View style={s.actions}>
        <PrimaryButton
          label={saving ? "Saving…" : "Assign task"}
          isDisabled={saving || !staffId}
          onPress={() => void assign()}
        />
        {target ? (
          <PrimaryButton
            label={`Mark ${target.replace("_", " ")}`}
            isDisabled={saving}
            onPress={() => void advance()}
          />
        ) : null}
      </View>
      {error ? (
        <AppText accessibilityRole="alert" style={{ color: colors.danger }}>
          {error}
        </AppText>
      ) : null}
      <AppText variant="section" style={s.section}>
        History
      </AppText>
      {events.map((event) => (
        <View key={event.id} style={[s.event, { borderColor: colors.border }]}>
          <AppText variant="label">
            {event.event_type.replace("_", " ")}
          </AppText>
          <AppText variant="caption" muted>
            {event.previous_status?.replace("_", " ") ?? "New"} →{" "}
            {event.new_status?.replace("_", " ") ?? ""} ·{" "}
            {formatDate(event.created_at)}
          </AppText>
          {event.note ? <AppText muted>{event.note}</AppText> : null}
        </View>
      ))}
    </Screen>
  );
}
const s = StyleSheet.create({
  header: { gap: 5, paddingVertical: spacing.lg },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.card,
    padding: 14,
  },
  section: { marginTop: spacing.xl, marginBottom: 10 },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  choice: {
    minHeight: 42,
    borderWidth: 1,
    borderRadius: radii.control,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  input: {
    minHeight: 76,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.control,
    padding: 12,
    textAlignVertical: "top",
    marginBottom: 10,
  },
  actions: { gap: 10 },
  event: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.card,
    padding: 12,
    gap: 4,
    marginBottom: 8,
  },
});
