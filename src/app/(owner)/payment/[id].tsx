import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, TextInput, View } from "react-native";
import { billingService } from "@/features/billing/service";
import { getSupabaseClient } from "@/shared/api/supabase";
import { AppText } from "@/shared/components/app-text";
import { PrimaryButton } from "@/shared/components/primary-button";
import { Screen } from "@/shared/components/screen";
import { formatMoney } from "@/shared/utils/money";
import { radii, spacing, useTenantlyColors } from "@/shared/theme/tokens";
export default function PaymentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const clientCache = useQueryClient();
  const colors = useTenantlyColors();
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const query = useQuery({
    queryKey: ["payment", id],
    queryFn: async () => {
      const { data, error } = await getSupabaseClient()
        .from("payments")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      const invoices = await billingService.listAllocatableInvoices(
        data.payer_resident_id,
      );
      return { payment: data, invoices };
    },
    enabled: !!id,
  });
  const payment = query.data?.payment;
  async function decide(approve: boolean) {
    if (!payment) return;
    setSaving(true);
    try {
      let remaining = payment.amount_paise;
      const allocations = (query.data?.invoices ?? []).flatMap((invoice) => {
        if (remaining <= 0) return [];
        const amount = Math.min(remaining, invoice.balance_paise);
        remaining -= amount;
        return [{ invoiceId: invoice.id, amountPaise: amount }];
      });
      if (approve && (!allocations.length || remaining > 0)) {
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
      await clientCache.invalidateQueries({ queryKey: ["payments"] });
      router.back();
    } catch (cause) {
      Alert.alert(
        "Decision failed",
        cause instanceof Error ? cause.message : "Try again.",
      );
    } finally {
      setSaving(false);
    }
  }
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
          {payment?.method.replace("_", " ")} ·{" "}
          {payment?.transaction_reference || "No reference"}
        </AppText>
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
          onPress={() => void decide(true)}
        />
        <PrimaryButton
          label="Reject payment"
          isDisabled={saving || reason.trim().length < 3}
          onPress={() => void decide(false)}
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
});
