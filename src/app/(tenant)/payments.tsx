import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ChevronRight, ReceiptText } from "lucide-react-native";
import { Pressable, Share, StyleSheet, View } from "react-native";
import { billingService } from "@/features/billing/service";
import { AppText } from "@/shared/components/app-text";
import { Screen } from "@/shared/components/screen";
import { formatMoney } from "@/shared/utils/money";
import { radii, spacing, useTenantlyColors } from "@/shared/theme/tokens";
export default function TenantPayments() {
  const router = useRouter();
  const colors = useTenantlyColors();
  const query = useQuery({
    queryKey: ["tenant-invoices"],
    queryFn: async () => ({
      invoices: await billingService.listOwnInvoices(),
      receipts: await billingService.listOwnReceipts(),
    }),
  });
  return (
    <Screen>
      <View style={s.header}>
        <AppText variant="heading">Payments</AppText>
        <AppText muted>Invoices, payment status, and receipts.</AppText>
      </View>
      <View style={[s.list, { borderColor: colors.border }]}>
        {query.data?.invoices.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: "/(tenant)/invoice/[id]" as never,
                params: { id: item.id },
              })
            }
            style={[s.row, { borderBottomColor: colors.border }]}
          >
            <ReceiptText size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <AppText variant="label">{item.invoice_number}</AppText>
              <AppText variant="caption" muted>
                {item.period_start.slice(0, 7)} ·{" "}
                {item.status.replace("_", " ")}
              </AppText>
            </View>
            <AppText variant="label">{formatMoney(item.balance_paise)}</AppText>
            <ChevronRight size={18} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>
      <AppText variant="section" style={s.section}>
        Receipts
      </AppText>
      {query.data?.receipts.map((receipt) => (
        <Pressable
          key={receipt.id}
          accessibilityRole="button"
          onPress={() =>
            void Share.share({
              title: receipt.receipt_number,
              message: `Tenantly receipt ${receipt.receipt_number} · generated ${new Date(receipt.generated_at).toLocaleDateString("en-IN")}`,
            })
          }
          style={[s.receipt, { borderColor: colors.border }]}
        >
          <AppText variant="label">{receipt.receipt_number}</AppText>
          <AppText variant="caption" muted>
            Tap to share
          </AppText>
        </Pressable>
      ))}
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
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  section: { marginTop: spacing.lg, marginBottom: 10 },
  receipt: {
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.card,
    gap: 3,
    marginBottom: 8,
  },
});
