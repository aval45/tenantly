import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Crypto from "expo-crypto";
import * as DocumentPicker from "expo-document-picker";
import { useState } from "react";
import { Alert, Pressable, RefreshControl, StyleSheet, TextInput, View } from "react-native";
import { operationsService } from "@/features/operations/service";
import { propertyService } from "@/features/properties/service";
import { residentService } from "@/features/residents/service";
import { getSupabaseClient } from "@/shared/api/supabase";
import { queryKeys } from "@/shared/api/query-keys";
import { useAuth } from "@/shared/auth/auth-provider";
import { AppText } from "@/shared/components/app-text";
import { PrimaryButton } from "@/shared/components/primary-button";
import { Screen } from "@/shared/components/screen";
import { LoadingSkeleton, StateView } from "@/shared/components/state-views";
import { toUserMessage } from "@/shared/errors/to-user-message";
import { prepareDocument, removeUpload } from "@/shared/storage/uploads";
import { formatMoney } from "@/shared/utils/money";
import {
  formatDate,
  localDateISO,
  localMonthStartISO,
} from "@/shared/utils/date";
import { radii, spacing, useTenantlyColors } from "@/shared/theme/tokens";

const categories = [
  "maintenance",
  "utilities",
  "supplies",
  "staff",
  "taxes",
  "other",
] as const;
type ExpenseCategory = (typeof categories)[number];

export default function OperationsScreen() {
  const { session } = useAuth();
  const colors = useTenantlyColors();
  const cache = useQueryClient();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("maintenance");
  const [propertyId, setPropertyId] = useState("");
  const [vendor, setVendor] = useState("");
  const [expenseReceipt, setExpenseReceipt] = useState<{
    uri: string;
    mimeType?: string;
    name: string;
  } | null>(null);
  const [residentId, setResidentId] = useState("");
  const [agreementExpiry, setAgreementExpiry] = useState("");
  const [savingExpense, setSavingExpense] = useState(false);
  const [savingAgreement, setSavingAgreement] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const organizationId = session?.activeOrganizationId ?? "";
  const userId = session?.userId ?? "";
  const periodStart = localMonthStartISO();

  const context = useQuery({
    queryKey: ["operations-context", userId, organizationId],
    queryFn: async () => {
      const [properties, residents] = await Promise.all([
        propertyService.list(organizationId),
        residentService.list(organizationId),
      ]);
      return { properties, residents };
    },
    enabled: !!organizationId,
  });

  const expenses = useQuery({
    queryKey: queryKeys.expenses(userId, organizationId, periodStart),
    queryFn: () =>
      operationsService.listExpenses(organizationId, periodStart),
    enabled: !!organizationId,
  });

  const profit = useQuery({
    queryKey: queryKeys.profit(userId, organizationId, periodStart),
    queryFn: () =>
      operationsService.getProfit(organizationId, periodStart),
    enabled: !!organizationId,
  });

  const agreements = useQuery({
    queryKey: queryKeys.documents(userId, organizationId),
    queryFn: async () => {
      const { data, error: queryError } = await getSupabaseClient()
        .from("documents")
        .select("*")
        .eq("document_type", "agreement")
        .order("expires_on");
      if (queryError) throw queryError;
      return data;
    },
    enabled: !!organizationId,
  });

  async function saveExpense() {
    if (!propertyId) {
      setError("Please select a property for this expense.");
      return;
    }
    const trimmedDescription = description.trim();
    if (!trimmedDescription || trimmedDescription.length < 3) {
      setError("Please enter an expense description (at least 3 characters).");
      return;
    }
    const amountNum = parseFloat(amount.trim());
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid expense amount greater than 0.");
      return;
    }

    setSavingExpense(true);
    setNotice(null);
    setError(null);
    let uploadedPath: string | undefined;
    try {
      if (expenseReceipt) {
        const prepared = await prepareDocument(
          expenseReceipt.uri,
          expenseReceipt.mimeType,
        );
        uploadedPath = `${organizationId}/${userId}/${Crypto.randomUUID()}.${prepared.extension}`;
        const { error: uploadError } = await getSupabaseClient()
          .storage.from("expense-receipts")
          .upload(uploadedPath, prepared.bytes, {
            contentType: prepared.contentType,
            upsert: false,
          });
        if (uploadError) throw uploadError;
      }
      await operationsService.recordExpense({
        organizationId,
        propertyId,
        category,
        description: trimmedDescription,
        amountPaise: Math.round(amountNum * 100),
        incurredOn: localDateISO(),
        vendorName: vendor.trim() || undefined,
        receiptPath: uploadedPath,
      });
      setDescription("");
      setAmount("");
      setVendor("");
      setExpenseReceipt(null);
      setNotice("Expense recorded. Profit summary has been updated.");
      await Promise.all([
        expenses.refetch(),
        profit.refetch(),
        cache.invalidateQueries({
          queryKey: queryKeys.ownerDashboard(userId, organizationId),
        }),
      ]);
    } catch (cause) {
      if (uploadedPath) await removeUpload("expense-receipts", uploadedPath);
      setError(toUserMessage(cause, "Expense could not be recorded."));
    } finally {
      setSavingExpense(false);
    }
  }

  async function chooseExpenseReceipt() {
    const picked = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/jpeg", "image/png"],
      copyToCacheDirectory: true,
    });
    const asset = picked.assets?.[0];
    if (!asset) return;
    setExpenseReceipt({
      uri: asset.uri,
      mimeType: asset.mimeType ?? undefined,
      name: asset.name,
    });
  }

  function confirmVoid(expenseId: string) {
    Alert.alert(
      "Void expense?",
      "The expense will remain in your audit trail.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Void",
          style: "destructive",
          onPress: () =>
            void operationsService
              .voidExpense(expenseId, "Recorded in error")
              .then(async () => {
                setNotice("Expense voided.");
                await Promise.all([
                  expenses.refetch(),
                  profit.refetch(),
                  cache.invalidateQueries({
                    queryKey: queryKeys.ownerDashboard(userId, organizationId),
                  }),
                ]);
              })
              .catch((cause) =>
                setError(toUserMessage(cause, "Expense could not be voided.")),
              ),
        },
      ],
    );
  }

  async function renewAgreement() {
    if (!residentId) {
      setError("Please select a resident to renew the agreement for.");
      return;
    }
    const expiry = agreementExpiry.trim();
    if (!expiry || !/^\d{4}-\d{2}-\d{2}$/.test(expiry)) {
      setError("Please enter a valid expiry date in YYYY-MM-DD format (e.g. 2027-08-31).");
      return;
    }
    const picked = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/jpeg", "image/png"],
      copyToCacheDirectory: true,
    });
    if (picked.canceled) return;
    setSavingAgreement(true);
    setNotice(null);
    setError(null);
    let uploadedPath: string | undefined;
    try {
      const asset = picked.assets[0];
      if (!asset) return;
      const prepared = await prepareDocument(asset.uri, asset.mimeType);
      uploadedPath = `${organizationId}/${userId}/${Crypto.randomUUID()}.${prepared.extension}`;
      const { error: uploadError } = await getSupabaseClient()
        .storage.from("resident-documents")
        .upload(uploadedPath, prepared.bytes, {
          contentType: prepared.contentType,
          upsert: false,
        });
      if (uploadError) throw uploadError;
      const prior = (agreements.data ?? [])
        .filter((document) => document.resident_id === residentId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
      await operationsService.renewAgreement({
        organizationId,
        residentId,
        storagePath: uploadedPath,
        expiresOn: expiry,
        supersedesDocumentId: prior?.id,
      });
      setAgreementExpiry("");
      setNotice("Renewed agreement shared privately with the resident.");
      await Promise.all([
        agreements.refetch(),
        cache.invalidateQueries({
          queryKey: queryKeys.tenantMore(userId, organizationId),
        }),
        cache.invalidateQueries({
          queryKey: queryKeys.documents(userId, organizationId),
        }),
      ]);
    } catch (cause) {
      if (uploadedPath) await removeUpload("resident-documents", uploadedPath);
      setError(toUserMessage(cause, "Agreement could not be renewed."));
    } finally {
      setSavingAgreement(false);
    }
  }

  if (context.isLoading || expenses.isLoading || profit.isLoading) {
    return (
      <Screen>
        <LoadingSkeleton />
      </Screen>
    );
  }
  if (context.isError || expenses.isError || profit.isError) {
    return (
      <Screen>
        <StateView
          kind="error"
          title="Operations unavailable"
          body="Financial operations could not be loaded."
          actionLabel="Retry"
          onAction={() =>
            void Promise.all([
              context.refetch(),
              expenses.refetch(),
              profit.refetch(),
            ])
          }
        />
      </Screen>
    );
  }
  const isRefetching =
    context.isRefetching ||
    expenses.isRefetching ||
    profit.isRefetching ||
    agreements.isRefetching;
  const summary = profit.data;
  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() =>
            void Promise.all([
              context.refetch(),
              expenses.refetch(),
              profit.refetch(),
              agreements.refetch(),
            ])
          }
          tintColor={colors.primary}
        />
      }
    >
      <View style={s.header}>
        <AppText variant="heading">Operations</AppText>
        <AppText muted>
          Agreements, expenses, and this month’s real cash profit.
        </AppText>
      </View>
      <View style={[s.summary, { backgroundColor: colors.primarySoft }]}>
        <View>
          <AppText variant="caption" muted>
            COLLECTED
          </AppText>
          <AppText variant="section">
            {formatMoney(summary?.collectedPaise ?? 0)}
          </AppText>
        </View>
        <View>
          <AppText variant="caption" muted>
            EXPENSES
          </AppText>
          <AppText variant="section">
            {formatMoney(summary?.expensesPaise ?? 0)}
          </AppText>
        </View>
        <View>
          <AppText variant="caption" muted>
            NET PROFIT
          </AppText>
          <AppText variant="section" style={{ color: colors.success }}>
            {formatMoney(summary?.netProfitPaise ?? 0)}
          </AppText>
        </View>
      </View>
      <AppText variant="section" style={s.section}>
        Record expense
      </AppText>
      <View style={s.choices}>
        {context.data?.properties.map((property) => (
          <Choice
            key={property.id}
            label={property.name}
            selected={propertyId === property.id}
            onPress={() => setPropertyId(property.id)}
          />
        ))}
      </View>
      <View style={s.choices}>
        {categories.map((item) => (
          <Choice
            key={item}
            label={item}
            selected={category === item}
            onPress={() => setCategory(item)}
          />
        ))}
      </View>
      <TextInput
        accessibilityLabel="Expense description"
        placeholder="What was purchased or paid?"
        placeholderTextColor={colors.textMuted}
        value={description}
        onChangeText={setDescription}
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
        accessibilityLabel="Expense amount in rupees"
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
        accessibilityLabel="Expense vendor"
        placeholder="Vendor (optional)"
        placeholderTextColor={colors.textMuted}
        value={vendor}
        onChangeText={setVendor}
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
        label={
          expenseReceipt
            ? `Receipt attached: ${expenseReceipt.name}`
            : "Attach receipt (optional)"
        }
        tone="secondary"
        isDisabled={savingExpense}
        onPress={() => void chooseExpenseReceipt()}
      />
      <PrimaryButton
        label={savingExpense ? "Recording…" : "Record expense"}
        isDisabled={
          savingExpense ||
          !propertyId ||
          description.trim().length < 3 ||
          Number(amount) <= 0
        }
        onPress={() => void saveExpense()}
      />
      <AppText variant="section" style={s.section}>
        Agreements
      </AppText>
      <View style={s.choices}>
        {context.data?.residents.map((resident) => (
          <Choice
            key={resident.id}
            label={resident.full_name}
            selected={residentId === resident.id}
            onPress={() => setResidentId(resident.id)}
          />
        ))}
      </View>
      {residentId ? (
        <AppText variant="caption" muted>
          Current agreement: {agreementLabel(agreements.data ?? [], residentId)}
        </AppText>
      ) : null}
      <TextInput
        accessibilityLabel="Agreement expiry date"
        placeholder="Expiry date (YYYY-MM-DD)"
        placeholderTextColor={colors.textMuted}
        value={agreementExpiry}
        onChangeText={setAgreementExpiry}
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
        label={savingAgreement ? "Uploading…" : "Upload renewed agreement"}
        isDisabled={
          savingAgreement ||
          !residentId ||
          !/^\d{4}-\d{2}-\d{2}$/.test(agreementExpiry)
        }
        onPress={() => void renewAgreement()}
      />
      {(agreements.data ?? []).length ? (
        <View style={s.agreementList}>
          {(agreements.data ?? []).map((agreement) => {
            const isCurrent =
              agreement.id ===
              (agreements.data ?? [])
                .filter((item) => item.resident_id === agreement.resident_id)
                .sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
                ?.id;
            return (
              <View
                key={agreement.id}
                style={[s.row, { borderColor: colors.border }]}
              >
                <View style={{ flex: 1 }}>
                  <AppText variant="label">
                    {context.data?.residents.find(
                      (resident) => resident.id === agreement.resident_id,
                    )?.full_name ?? "Resident"}
                  </AppText>
                  <AppText variant="caption" muted>
                    {isCurrent ? "Current" : "Historical"} · expires{" "}
                    {formatDate(agreement.expires_on ?? "")}
                  </AppText>
                </View>
                <AppText
                  variant="caption"
                  style={{
                    color:
                      agreement.expires_on &&
                      agreement.expires_on < localDateISO()
                        ? colors.danger
                        : colors.success,
                  }}
                >
                  {agreement.expires_on && agreement.expires_on < localDateISO()
                    ? "Expired"
                    : "Active"}
                </AppText>
              </View>
            );
          })}
        </View>
      ) : null}
      {notice ? (
        <AppText style={{ color: colors.success }}>{notice}</AppText>
      ) : null}
      {error ? (
        <AppText accessibilityRole="alert" style={{ color: colors.danger }}>
          {error}
        </AppText>
      ) : null}
      <AppText variant="section" style={s.section}>
        This month’s expenses
      </AppText>
      {(expenses.data ?? []).map((expense) => (
        <View key={expense.id} style={[s.row, { borderColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <AppText variant="label">{expense.description}</AppText>
            <AppText variant="caption" muted>
              {expense.category} · {expense.incurred_on} · {expense.status}
            </AppText>
          </View>
          <View style={{ alignItems: "flex-end", gap: 5 }}>
            <AppText variant="label">
              {formatMoney(expense.amount_paise)}
            </AppText>
            {expense.status === "recorded" ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => confirmVoid(expense.id)}
              >
                <AppText variant="caption" style={{ color: colors.danger }}>
                  Void
                </AppText>
              </Pressable>
            ) : null}
          </View>
        </View>
      ))}
    </Screen>
  );
}

function agreementLabel(
  agreements: {
    resident_id: string | null;
    expires_on: string | null;
    created_at: string;
  }[],
  residentId: string,
) {
  const current = agreements
    .filter((agreement) => agreement.resident_id === residentId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  if (!current?.expires_on) return "No agreement on file";
  return `Expires ${formatDate(current.expires_on)}`;
}

function Choice({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress(): void;
}) {
  const colors = useTenantlyColors();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        s.choice,
        {
          borderColor: selected ? colors.accent : colors.border,
          backgroundColor: selected ? colors.accentSoft : colors.surface,
        },
      ]}
    >
      <AppText variant="caption">{label}</AppText>
    </Pressable>
  );
}

const s = StyleSheet.create({
  header: { gap: 5, paddingVertical: spacing.lg },
  summary: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    borderRadius: radii.card,
    padding: 14,
  },
  section: { marginTop: spacing.xl, marginBottom: 10 },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  choice: {
    minHeight: 40,
    borderWidth: 1,
    borderRadius: radii.control,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  input: {
    minHeight: 50,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.control,
    paddingHorizontal: 14,
    marginBottom: 10,
    fontSize: 16,
  },
  row: {
    minHeight: 64,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.card,
    padding: 12,
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  agreementList: { gap: 0, marginTop: 10 },
});
