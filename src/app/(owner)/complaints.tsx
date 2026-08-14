import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pressable, StyleSheet, View } from "react-native";
import { complaintService } from "@/features/complaints/service";
import { useAuth } from "@/shared/auth/auth-provider";
import type { ComplaintStatus } from "@/shared/api/database.types";
import { AppText } from "@/shared/components/app-text";
import { Screen } from "@/shared/components/screen";
import { EmptyLedger } from "@/shared/components/state-views";
import { radii, spacing, useTenantlyColors } from "@/shared/theme/tokens";
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
  const query = useQuery({
    queryKey: ["complaints", org],
    queryFn: () => complaintService.list(org),
    enabled: !!org,
  });
  async function advance(id: string, status: ComplaintStatus) {
    const value = next[status];
    if (!value) return;
    await complaintService.transition(id, value);
    await cache.invalidateQueries({ queryKey: ["complaints", org] });
  }
  return (
    <Screen>
      <View style={s.header}>
        <AppText variant="heading">Complaints</AppText>
        <AppText muted>
          Triage and progress resident requests with an auditable history.
        </AppText>
      </View>
      {!query.isLoading && !query.data?.length ? (
        <EmptyLedger
          title="No open requests"
          body="Resident maintenance and service requests will appear here."
        />
      ) : (
        <View style={[s.list, { borderColor: colors.border }]}>
          {query.data?.map((item) => (
            <View
              key={item.id}
              style={[s.row, { borderBottomColor: colors.border }]}
            >
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
                  onPress={() => void advance(item.id, item.status)}
                  style={[s.action, { backgroundColor: colors.primarySoft }]}
                >
                  <AppText variant="caption">
                    Mark {next[item.status]?.replace("_", " ")}
                  </AppText>
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}
const s = StyleSheet.create({
  header: { gap: 5, paddingVertical: spacing.lg },
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
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  action: {
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 10,
    borderRadius: radii.control,
  },
});
