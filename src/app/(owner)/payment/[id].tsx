import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, TextInput, View } from "react-native";
import { Image } from "expo-image";
import {
  billingService,
  buildPaymentAllocations,
} from "@/features/billing/service";
import { getSupabaseClient } from "@/shared/api/supabase";
import { queryKeys } from "@/shared/api/query-keys";
import { useAuth } from "@/shared/auth/auth-provider";
import { AppText } from "@/shared/components/app-text";
import { PrimaryButton } from "@/shared/components/primary-button";
import { Screen } from "@/shared/components/screen";
import { formatMoney } from "@/shared/utils/money";
import { radii, spacing, useTenantlyColors } from "@/shared/theme/tokens";
import { formatDate } from "@/shared/utils/date";
import { LoadingSkeleton, StateView } from "@/shared/components/state-views";
import { toUserMessage } from "@/shared/errors/to-user-message";
export default function PaymentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const clientCache = useQueryClient();
  const colors = useTenantlyColors();
  const { session } = useAuth();
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const query = useQuery({
    queryKey: queryKeys.payment(
      session?.userId ?? "",
      session?.activeOrganizationId ?? "",
      id,
    ),
    queryFn: async () => {
      const { data, error } = await getSupabaseClient()
        .from("payments")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      const [invoices, residentResult, invoiceResult, proofResult] =
        await Promise.all([
          billingService.listAllocatableInvoices(data.payer_resident_id),
          getSupabaseClient()
            .from("residents")
            .select("full_name")
            .eq("id", data.payer_resident_id)
            .single(),
          data.submitted_invoice_id
            ? getSupabaseClient()
                .from("invoices")
                .select("invoice_number,due_date")
                .eq("id", data.submitted_invoice_id)
                .single()
            : Promise.resolve({ data: null, error: null }),
          data.proof_storage_path
            ? billingService.getSignedProofUrl(data.proof_storage_path)
            : Promise.resolve(null),
        ]);
      if (residentResult.error) throw residentResult.error;
      if (invoiceResult.error) throw invoiceResult.error;
      return {
        payment: data,
        invoices,
        resident: residentResult.data,
        invoice: invoiceResult.data,
        proofUrl: proofResult,
      };
    },
    enabled: !!id,
  });
  const payment = query.data?.payment;
  const allocationPreview = buildPaymentAllocations(
    payment?.amount_paise ?? 0,
    query.data?.invoices ?? [],
  );
  async function performDecision(approve: boolean) {
    if (!payment) return;
    setSaving(true);
    try {
      const { allocations, remainingPaise } = buildPaymentAllocations(
        payment.amount_paise,
        query.data?.invoices ?? [],
      );
      if (approve && (!allocations.length || remainingPaise > 0)) {
        Alert.alert(
          "Cannot approve",
          "No open invoice balance can accept the full payment.",
        );
        return;
      }
      await billingService.decidePayment(
        payment.id,
        approve,
        reason || null,
        allocations,
      );
      await clientCache.invalidateQueries({
        queryKey: queryKeys.payments(
          session?.userId ?? "",
          session?.activeOrganizationId ?? "",
        ),
      });
      await Promise.all([
        clientCache.invalidateQueries({
          queryKey: queryKeys.invoices(
            session?.userId ?? "",
            session?.activeOrganizationId ?? "",
          ),
        }),
        clientCache.invalidateQueries({
          queryKey: queryKeys.ownerDashboard(
            session?.userId ?? "",
            session?.activeOrganizationId ?? "",
          ),
        }),
      ]);
      router.back();
    } catch (cause) {
      Alert.alert("Decision failed", toUserMessage(cause, "Try again."));
    } finally {
      setSaving(false);
    }
  }
  function confirmDecision(approve: boolean) {
    Alert.alert(
      approve ? "Approve payment?" : "Reject payment?",
      approve
        ? "The payment will be allocated and an immutable receipt created."
        : "The tenant will be notified with your rejection reason.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: approve ? "Approve" : "Reject",
          style: approve ? "default" : "destructive",
          onPress: () => void performDecision(approve),
        },
      ],
    );
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
          title="Payment unavailable"
          body="Payment details and proof could not be loaded."
          actionLabel="Retry"
          onAction={() => void query.refetch()}
        />
      </Screen>
    );
  return (
    <Screen>
      <View style={s.header}>
        <AppText variant="eyebrow" style={{ color: colors.accent }}>
          PAYMENT REVIEW
        </AppText>
        <AppText variant="heading">
          {payment ? formatMoney(payment.amount_paise) : "Loading…"}
        </AppText>
        <AppText muted>
          {query.data?.resident.full_name} · {payment?.method.replace("_", " ")}{" "}
          · {payment ? formatDate(payment.paid_on) : ""}
        </AppText>
        <AppText variant="caption" muted>
          {query.data?.invoice?.invoice_number ?? "Invoice unavailable"} ·{" "}
          {payment?.transaction_reference || "No reference"}
        </AppText>
      </View>
      {query.data?.proofUrl ? (
        <Image
          source={{ uri: query.data.proofUrl }}
          accessibilityLabel="Uploaded payment proof"
          contentFit="contain"
          style={[s.proof, { backgroundColor: colors.surfaceSubtle }]}
        />
      ) : (
        <AppText style={{ color: colors.warning }}>
          No proof image was supplied.
        </AppText>
      )}
      <View style={[s.allocations, { borderColor: colors.border }]}>
        <AppText variant="label">Proposed allocation</AppText>
        {allocationPreview.allocations.map((allocation) => {
          const invoice = query.data?.invoices.find(
            (item) => item.id === allocation.invoiceId,
          );
          return (
            <View key={allocation.invoiceId} style={s.allocationRow}>
              <AppText variant="caption" muted>
                {invoice?.invoice_number ?? allocation.invoiceId}
              </AppText>
              <AppText variant="caption">
                {formatMoney(allocation.amountPaise)}
              </AppText>
            </View>
          );
        })}
      </View>
      <View style={s.field}>
        <AppText variant="label">Decision note / rejection reason</AppText>
        <TextInput
          accessibilityLabel="Decision note"
          multiline
          value={reason}
          onChangeText={setReason}
          style={[
            s.input,
            {
              color: colors.text,
              borderColor: colors.border,
              backgroundColor: colors.surfaceRaised,
            },
          ]}
        />
      </View>
      <View style={s.actions}>
        <PrimaryButton
          label={saving ? "Saving…" : "Approve and allocate"}
          isDisabled={saving || !payment}
          onPress={() => confirmDecision(true)}
        />
        <PrimaryButton
          label="Reject payment"
          tone="danger"
          isDisabled={saving || reason.trim().length < 3}
          onPress={() => confirmDecision(false)}
        />
      </View>
    </Screen>
  );
}
const s = StyleSheet.create({
  header: { gap: 6, paddingVertical: spacing.lg },
  field: { gap: 7 },
  input: {
    minHeight: 100,
    textAlignVertical: "top",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.control,
    padding: 14,
  },
  actions: { gap: 12, marginTop: spacing.lg },
  proof: {
    width: "100%",
    height: 260,
    borderRadius: radii.card,
    marginBottom: spacing.md,
  },
  allocations: {
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.card,
    gap: 8,
    marginBottom: spacing.md,
  },
  allocationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
});
