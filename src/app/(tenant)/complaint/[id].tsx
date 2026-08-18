import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { RefreshControl, StyleSheet, TextInput, View } from "react-native";
import { complaintService } from "@/features/complaints/service";
import { queryKeys } from "@/shared/api/query-keys";
import { useAuth } from "@/shared/auth/auth-provider";
import { AppText } from "@/shared/components/app-text";
import { PrimaryButton } from "@/shared/components/primary-button";
import { Screen } from "@/shared/components/screen";
import { LoadingSkeleton, StateView } from "@/shared/components/state-views";
import { toUserMessage } from "@/shared/errors/to-user-message";
import { formatDate } from "@/shared/utils/date";
import { radii, spacing, useTenantlyColors } from "@/shared/theme/tokens";

export default function TenantComplaintDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const colors = useTenantlyColors();
  const cache = useQueryClient();
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
  async function reopen() {
    setSaving(true);
    setError(null);
    try {
      await complaintService.transition(id, "reopened", note);
      setNote("");
      await Promise.all([
        detail.refetch(),
        cache.invalidateQueries({
          queryKey: queryKeys.complaints(userId, orgId),
        }),
        cache.invalidateQueries({
          queryKey: queryKeys.tenantDashboard(userId, orgId),
        }),
        cache.invalidateQueries({
          queryKey: queryKeys.ownerDashboard(userId, orgId),
        }),
        cache.invalidateQueries({
          queryKey: queryKeys.maintenanceTasks(userId, orgId),
        }),
      ]);
    } catch (cause) {
      setError(toUserMessage(cause, "Request could not be reopened."));
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
          title="Request unavailable"
          body="The request history could not be loaded."
          actionLabel="Retry"
          onAction={() => void detail.refetch()}
        />
      </Screen>
    );
  const { complaint, events } = detail.data;
  const canReopen = ["resolved", "closed"].includes(complaint.status);
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
        <AppText variant="heading">{complaint.title}</AppText>
        <AppText muted>
          {complaint.status.replace("_", " ")} · {complaint.priority} priority
        </AppText>
      </View>
      <View style={[s.card, { borderColor: colors.border }]}>
        <AppText>{complaint.description}</AppText>
      </View>
      {canReopen ? (
        <>
          <AppText variant="section" style={s.section}>
            Need more help?
          </AppText>
          <TextInput
            accessibilityLabel="Reopen reason"
            placeholder="Tell us what is still unresolved"
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
          <PrimaryButton
            label={saving ? "Reopening…" : "Reopen request"}
            isDisabled={saving}
            onPress={() => void reopen()}
          />
        </>
      ) : null}
      {error ? (
        <AppText accessibilityRole="alert" style={{ color: colors.danger }}>
          {error}
        </AppText>
      ) : null}
      <AppText variant="section" style={s.section}>
        Status history
      </AppText>
      {events.map((event) => (
        <View key={event.id} style={[s.event, { borderColor: colors.border }]}>
          <AppText variant="label">
            {event.event_type.replace("_", " ")}
          </AppText>
          <AppText variant="caption" muted>
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
  input: {
    minHeight: 78,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.control,
    padding: 12,
    textAlignVertical: "top",
    marginBottom: 10,
  },
  event: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.card,
    padding: 12,
    gap: 4,
    marginBottom: 8,
  },
});
