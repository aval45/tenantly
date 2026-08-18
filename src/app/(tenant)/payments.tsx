import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ChevronRight, ReceiptText } from "lucide-react-native";
import {
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  View,
} from "react-native";
import { billingService } from "@/features/billing/service";
import { shareReceiptPdf } from "@/features/billing/receipt-export";
import { useAuth } from "@/shared/auth/auth-provider";
import { queryKeys } from "@/shared/api/query-keys";
import { AppText } from "@/shared/components/app-text";
import { Screen } from "@/shared/components/screen";
import { formatMoney } from "@/shared/utils/money";
import { radii, spacing, useTenantlyColors } from "@/shared/theme/tokens";
import {
  EmptyLedger,
  LoadingSkeleton,
  StateView,
} from "@/shared/components/state-views";
import { formatDate } from "@/shared/utils/date";
import type { InvoiceRow, ReceiptRow } from "@/shared/api/database.types";

type PaymentListRow =
  { kind: "invoice"; item: InvoiceRow } | { kind: "receipt"; item: ReceiptRow };
export default function TenantPayments() {
  const router = useRouter();
  const colors = useTenantlyColors();
  const { session } = useAuth();
  const query = useQuery({
    queryKey: queryKeys.invoices(
      session?.userId ?? "",
      session?.activeOrganizationId ?? "",
    ),
    queryFn: async () => ({
      invoices: await billingService.listOwnInvoices(),
      receipts: await billingService.listOwnReceipts(),
    }),
  });
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
          title="Payments unavailable"
          body="Invoices and receipts could not be loaded."
          actionLabel="Retry"
          onAction={() => void query.refetch()}
        />
      </Screen>
    );
  const rows: { title: string; data: PaymentListRow[] }[] = [
    {
      title: "Invoices",
      data: (query.data?.invoices ?? []).map((item) => ({
        kind: "invoice" as const,
        item,
      })),
    },
    {
      title: "Receipts",
      data: (query.data?.receipts ?? []).map((item) => ({
        kind: "receipt" as const,
        item,
      })),
    },
  ];
  return (
    <Screen scrollable={false}>
      <SectionList<PaymentListRow>
        sections={rows}
        keyExtractor={(row) => `${row.kind}-${row.item.id}`}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => void query.refetch()}
          />
        }
        contentContainerStyle={s.content}
        ListHeaderComponent={
          <View style={s.header}>
            <AppText variant="heading">Payments</AppText>
            <AppText muted>Invoices, payment status, and receipts.</AppText>
          </View>
        }
        ListEmptyComponent={
          <EmptyLedger
            title="No payment activity"
            body="Your invoices and receipts will appear here."
          />
        }
        renderSectionHeader={({ section }) => (
          <AppText variant="section" style={s.section}>
            {section.title}
          </AppText>
        )}
        renderItem={({ item: row }) =>
          row.kind === "invoice" ? (
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: "/(tenant)/invoice/[id]" as never,
                  params: { id: row.item.id },
                })
              }
              style={[s.row, { borderColor: colors.border }]}
            >
              <ReceiptText size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <AppText variant="label">{row.item.invoice_number}</AppText>
                <AppText variant="caption" muted>
                  {formatDate(row.item.period_start, {
                    month: "short",
                    year: "numeric",
                  })}{" "}
                  · {row.item.status.replace("_", " ")}
                </AppText>
              </View>
              <AppText variant="label">
                {formatMoney(row.item.balance_paise ?? 0)}
              </AppText>
              <ChevronRight size={18} color={colors.textMuted} />
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => void shareReceiptPdf(row.item.id)}
              style={[s.receipt, { borderColor: colors.border }]}
            >
              <AppText variant="label">{row.item.receipt_number}</AppText>
              <AppText variant="caption" muted>
                Tap to share
              </AppText>
            </Pressable>
          )
        }
      />
    </Screen>
  );
}
const s = StyleSheet.create({
  header: { gap: 5, paddingVertical: spacing.lg },
  content: { paddingBottom: spacing.xl },
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
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.card,
    marginBottom: 8,
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
