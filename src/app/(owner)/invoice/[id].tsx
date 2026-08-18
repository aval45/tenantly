import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Crypto from "expo-crypto";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { RefreshControl, StyleSheet, TextInput, View } from "react-native";
import { billingService } from "@/features/billing/service";
import { getSupabaseClient } from "@/shared/api/supabase";
import { queryKeys } from "@/shared/api/query-keys";
import { useAuth } from "@/shared/auth/auth-provider";
import { AppText } from "@/shared/components/app-text";
import { PrimaryButton } from "@/shared/components/primary-button";
import { Screen } from "@/shared/components/screen";
import { LoadingSkeleton, StateView } from "@/shared/components/state-views";
import { toUserMessage } from "@/shared/errors/to-user-message";
import { formatMoney } from "@/shared/utils/money";
import { localDateISO } from "@/shared/utils/date";
import { radii, spacing, useTenantlyColors } from "@/shared/theme/tokens";

export default function OwnerInvoiceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const colors = useTenantlyColors();
  const cache = useQueryClient();
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const userId = session?.userId ?? "";
  const orgId = session?.activeOrganizationId ?? "";
  const query = useQuery({
    queryKey: queryKeys.invoice(
      userId,
      orgId,
      id,
    ),
    queryFn: async () => {
      const client = getSupabaseClient();
      const [invoice, items, allocations] = await Promise.all([
        client.from("invoices").select("*").eq("id", id).single(),
        client.from("invoice_items").select("*").eq("invoice_id", id),
        client.from("payment_allocations").select("*").eq("invoice_id", id),
      ]);
      if (invoice.error) throw invoice.error;
      if (items.error) throw items.error;
      if (allocations.error) throw allocations.error;
      const paymentIds = allocations.data.map((item) => item.payment_id);
      const payments = paymentIds.length
        ? await client
            .from("payments")
            .select("*")
            .in("id", paymentIds)
            .order("paid_on", { ascending: false })
        : { data: [], error: null };
      if (payments.error) throw payments.error;
      return {
        invoice: invoice.data,
        items: items.data,
        allocations: allocations.data,
        payments: payments.data,
      };
    },
    enabled: !!id,
  });
  async function recordCash() {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const result = await billingService.recordManualPayment({
        invoiceId: id,
        amountPaise: Math.round(Number(amount) * 100),
        paidOn: localDateISO(),
        method: "cash",
        reference,
        idempotencyKey: `cash-${id}-${Crypto.randomUUID()}`,
      });
      setAmount("");
      setReference("");
      setNotice(
        `Cash payment recorded. Receipt ${result.receiptNumber} is ready.`,
      );
      await Promise.all([
        query.refetch(),
        cache.invalidateQueries({
          queryKey: queryKeys.invoices(userId, orgId),
        }),
        cache.invalidateQueries({
          queryKey: queryKeys.payments(userId, orgId),
        }),
        cache.invalidateQueries({
          queryKey: queryKeys.ownerDashboard(userId, orgId),
        }),
        cache.invalidateQueries({
          queryKey: queryKeys.tenantDashboard(userId, orgId),
        }),
      ]);
    } catch (cause) {
      setError(toUserMessage(cause, "Cash payment could not be recorded."));
    } finally {
      setSaving(false);
    }
  }
  if (query.isLoading)
    return (
      <Screen>
        <LoadingSkeleton />
      </Screen>
    );
  if (query.isError || !query.data)
    return (
      <Screen>
        <StateView
          kind="error"
          title="Invoice unavailable"
          body="The invoice ledger could not be loaded."
          actionLabel="Retry"
          onAction={() => void query.refetch()}
        />
      </Screen>
    );
  const { invoice, items, payments, allocations } = query.data;
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
        <AppText variant="eyebrow" style={{ color: colors.accent }}>
          INVOICE LEDGER
        </AppText>
        <AppText variant="heading">{invoice.invoice_number}</AppText>
        <AppText muted>
          {invoice.status.replace("_", " ")} · Due {invoice.due_date}
        </AppText>
      </View>
      <View style={[s.card, { borderColor: colors.border }]}>
        {items.map((item) => (
          <View key={item.id} style={s.line}>
            <AppText>{item.description}</AppText>
            <AppText variant="label">
              {formatMoney(item.total_amount_paise)}
            </AppText>
          </View>
        ))}
        <View style={[s.total, { borderTopColor: colors.border }]}>
          <AppText variant="section">Balance</AppText>
          <AppText variant="section">
            {formatMoney(invoice.balance_paise ?? 0)}
          </AppText>
        </View>
      </View>
      <AppText variant="section" style={s.section}>
        Record cash or manual payment
      </AppText>
      <TextInput
        accessibilityLabel="Cash payment amount"
        keyboardType="number-pad"
        placeholder="Amount (₹)"
        placeholderTextColor={colors.textMuted}
        value={amount}
        onChangeText={setAmount}
        style={[
          s.input,
          {
            color: colors.text,
            borderColor: colors.border,
            backgroundColor: colors.surfaceRaised,
          },
        ]}
      />
      <TextInput
        accessibilityLabel="Cash payment reference"
        placeholder="Reference or note (optional)"
        placeholderTextColor={colors.textMuted}
        value={reference}
        onChangeText={setReference}
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
        label={saving ? "Recording…" : "Record cash payment"}
        isDisabled={
          saving ||
          Number(amount) <= 0 ||
          Math.round(Number(amount) * 100) > (invoice.balance_paise ?? 0)
        }
        onPress={() => void recordCash()}
      />
      {notice ? (
        <AppText style={{ color: colors.success }}>{notice}</AppText>
      ) : null}
      {error ? (
        <AppText accessibilityRole="alert" style={{ color: colors.danger }}>
          {error}
        </AppText>
      ) : null}
      <AppText variant="section" style={s.section}>
        Payment history
      </AppText>
      {!payments.length ? (
        <AppText muted>No payments recorded yet.</AppText>
      ) : (
        payments.map((payment) => (
          <View
            key={payment.id}
            style={[s.payment, { borderColor: colors.border }]}
          >
            <View>
              <AppText variant="label">
                {formatMoney(payment.amount_paise)}
              </AppText>
              <AppText variant="caption" muted>
                {payment.method.replace("_", " ")} · {payment.paid_on}
              </AppText>
            </View>
            <AppText variant="caption">
              {allocations.find((item) => item.payment_id === payment.id)
                ?.amount_paise
                ? "Allocated"
                : "Unallocated"}
            </AppText>
          </View>
        ))
      )}
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
  line: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  total: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  section: { marginTop: spacing.xl, marginBottom: 10 },
  input: {
    minHeight: 50,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.control,
    paddingHorizontal: 14,
    marginBottom: 10,
    fontSize: 16,
  },
  payment: {
    minHeight: 58,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.card,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
