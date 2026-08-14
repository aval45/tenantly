import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { getSupabaseClient } from "@/shared/api/supabase";
import { AppText } from "@/shared/components/app-text";
import { PrimaryButton } from "@/shared/components/primary-button";
import { Screen } from "@/shared/components/screen";
import { formatMoney } from "@/shared/utils/money";
import { radii, spacing, useTenantlyColors } from "@/shared/theme/tokens";
export default function InvoiceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useTenantlyColors();
  const query = useQuery({
    queryKey: ["invoice", id],
    queryFn: async () => {
      const client = getSupabaseClient();
      const [invoice, items] = await Promise.all([
        client.from("invoices").select("*").eq("id", id).single(),
        client.from("invoice_items").select("*").eq("invoice_id", id),
      ]);
      if (invoice.error) throw invoice.error;
      if (items.error) throw items.error;
      return { invoice: invoice.data, items: items.data };
    },
    enabled: !!id,
  });
  const invoice = query.data?.invoice;
  return (
    <Screen>
      <View style={s.header}>
        <AppText variant="eyebrow" style={{ color: colors.accent }}>
          INVOICE
        </AppText>
        <AppText variant="heading">
          {invoice?.invoice_number ?? "Loading…"}
        </AppText>
        <AppText muted>
          {invoice?.period_start} to {invoice?.period_end}
        </AppText>
      </View>
      <View style={[s.card, { borderColor: colors.border }]}>
        {query.data?.items.map((item) => (
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
            {formatMoney(invoice?.balance_paise ?? 0)}
          </AppText>
        </View>
      </View>
      {invoice && invoice.balance_paise > 0 ? (
        <PrimaryButton
          label="Submit payment proof"
          onPress={() =>
            router.push({
              pathname: "/(tenant)/payment-proof" as never,
              params: {
                invoiceId: invoice.id,
                amountPaise: String(invoice.balance_paise),
              },
            })
          }
        />
      ) : null}
    </Screen>
  );
}
const s = StyleSheet.create({
  header: { gap: 5, paddingVertical: spacing.lg },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.card,
    padding: 14,
    marginBottom: spacing.lg,
  },
  line: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  total: {
    marginTop: 8,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
