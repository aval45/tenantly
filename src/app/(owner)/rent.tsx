import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { CalendarPlus, ChevronRight, ReceiptText } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { billingService } from "@/features/billing/service";
import { useAuth } from "@/shared/auth/auth-provider";
import { AppText } from "@/shared/components/app-text";
import { PrimaryButton } from "@/shared/components/primary-button";
import { Screen } from "@/shared/components/screen";
import { StateView } from "@/shared/components/state-views";
import { StatusBadge } from "@/shared/components/status-badge";
import { formatMoney } from "@/shared/utils/money";
import { radii, spacing, useTenantlyColors } from "@/shared/theme/tokens";
export default function RentScreen() {
  const colors = useTenantlyColors();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const organizationId = session?.activeOrganizationId ?? "";
  const query = useQuery({
    queryKey: ["payments", "pending", organizationId],
    queryFn: () => billingService.listPendingPayments(organizationId),
    enabled: !!organizationId,
  });
  const month = new Date().toISOString().slice(0, 7) + "-01";
  const generate = useMutation({
    mutationFn: () => billingService.generateMonth(organizationId, month),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: ["invoices", organizationId],
      }),
  });
  return (
    <Screen>
      <View style={s.header}>
        <AppText variant="heading">Rent</AppText>
        <AppText muted>
          Generate monthly invoices and review resident payment proofs.
        </AppText>
      </View>
      <View style={[s.generation, { backgroundColor: colors.primarySoft }]}>
        <CalendarPlus size={22} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <AppText variant="label">This month’s rent</AppText>
          <AppText variant="caption" muted>
            Safe to run again; existing invoices are skipped.
          </AppText>
        </View>
      </View>
      <PrimaryButton
        label={generate.isPending ? "Generating…" : "Generate monthly invoices"}
        isDisabled={generate.isPending}
        onPress={() => generate.mutate()}
      />
      {generate.data ? (
        <AppText style={{ color: colors.success, marginTop: 8 }}>
          Invoice generation completed.
        </AppText>
      ) : null}
      <AppText variant="section" style={s.title}>
        Payment approvals
      </AppText>
      {query.isError ? (
        <StateView
          kind="error"
          title="Approvals unavailable"
          body="Check your connection."
          actionLabel="Try again"
          onAction={() => void query.refetch()}
        />
      ) : !query.data?.length ? (
        <AppText muted>No payment proofs are awaiting review.</AppText>
      ) : (
        <View style={[s.list, { borderColor: colors.border }]}>
          {query.data.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: "/(owner)/payment/[id]" as never,
                  params: { id: item.id },
                })
              }
              style={[s.row, { borderBottomColor: colors.border }]}
            >
              <View style={[s.icon, { backgroundColor: colors.warningSoft }]}>
                <ReceiptText size={19} color={colors.warning} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="label">
                  {formatMoney(item.amount_paise)}
                </AppText>
                <AppText variant="caption" muted>
                  {item.method.replace("_", " ")} · {item.paid_on}
                </AppText>
              </View>
              <StatusBadge status="review" />
              <ChevronRight size={18} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}
const s = StyleSheet.create({
  header: { gap: 4, paddingVertical: spacing.lg },
  generation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: radii.card,
    marginBottom: 12,
  },
  title: { marginTop: spacing.xl, marginBottom: 12 },
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
});
