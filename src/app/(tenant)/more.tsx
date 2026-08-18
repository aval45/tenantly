import { useQuery } from "@tanstack/react-query";
import { Linking, Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { getTenantContext } from "@/features/tenant/api";
import { getSupabaseClient } from "@/shared/api/supabase";
import { useAuth } from "@/shared/auth/auth-provider";
import { AppText } from "@/shared/components/app-text";
import { Screen } from "@/shared/components/screen";
import { formatMoney } from "@/shared/utils/money";
import { motion } from "@/shared/theme/motion";
import { radii, spacing, useTenantlyColors } from "@/shared/theme/tokens";
import { useAppContextStore } from "@/stores/app-context";
import { queryKeys } from "@/shared/api/query-keys";
import { formatDate } from "@/shared/utils/date";
import { LoadingSkeleton, StateView } from "@/shared/components/state-views";
export default function TenantMore() {
  const { session, signOut } = useAuth();
  const colors = useTenantlyColors();
  const theme = useAppContextStore((s) => s.theme);
  const setTheme = useAppContextStore((s) => s.setTheme);
  const query = useQuery({
    queryKey: queryKeys.tenantMore(
      session?.userId ?? "",
      session?.activeOrganizationId ?? "",
    ),
    queryFn: async () => {
      const context = await getTenantContext();
      const { data: documents, error } = await getSupabaseClient()
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return { context, documents };
    },
  });
  async function openDocument(path: string) {
    const { data, error } = await getSupabaseClient()
      .storage.from("resident-documents")
      .createSignedUrl(path, 60);
    if (error) throw error;
    await Linking.openURL(data.signedUrl);
  }
  const tenancy = query.data?.context.tenancy;
  const currentAgreementIds = new Set<string>();
  const agreementResidents = new Set<string>();
  for (const agreement of (query.data?.documents ?? [])
    .filter((item) => item.document_type === "agreement")
    .sort((a, b) => b.created_at.localeCompare(a.created_at))) {
    if (
      agreement.resident_id &&
      !agreementResidents.has(agreement.resident_id)
    ) {
      agreementResidents.add(agreement.resident_id);
      currentAgreementIds.add(agreement.id);
    }
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
          title="Account details unavailable"
          body="Your tenancy and documents could not be loaded."
          actionLabel="Retry"
          onAction={() => void query.refetch()}
        />
      </Screen>
    );
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
        <AppText variant="heading">More</AppText>
        <AppText muted>
          {session?.profile.fullName} · {session?.profile.email}
        </AppText>
      </View>
      <AppText variant="section" style={s.section}>
        Tenancy
      </AppText>
      <View style={[s.card, { borderColor: colors.border }]}>
        {tenancy ? (
          <>
            <AppText variant="label">
              Active since {formatDate(tenancy.start_date)}
            </AppText>
            <AppText muted>
              Monthly rent {formatMoney(tenancy.rent_paise)} · due day{" "}
              {tenancy.due_day}
            </AppText>
            <AppText variant="caption" muted>
              Deposit {formatMoney(tenancy.deposit_paise)}
            </AppText>
          </>
        ) : (
          <AppText muted>No active tenancy.</AppText>
        )}
      </View>
      <AppText variant="section" style={s.section}>
        Documents
      </AppText>
      {query.data?.documents.length ? (
        query.data.documents.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="link"
            onPress={() => void openDocument(item.storage_path)}
            style={({ pressed }) => [
              s.card,
              {
                borderColor: colors.border,
                opacity: pressed ? motion.pressedOpacity : 1,
              },
            ]}
          >
            <AppText variant="label">
              {item.document_type.replace("_", " ")}
            </AppText>
            <AppText variant="caption" muted>
              {item.document_type === "agreement"
                ? `${currentAgreementIds.has(item.id) ? "Current agreement" : "Previous version"} · ${item.expires_on ? `expires ${formatDate(item.expires_on)}` : "no expiry date"}`
                : item.verification_status}
            </AppText>
          </Pressable>
        ))
      ) : (
        <AppText muted>No documents shared yet.</AppText>
      )}
      <AppText variant="section" style={s.section}>
        Appearance
      </AppText>
      <View style={s.row}>
        {(["system", "light", "dark"] as const).map((item) => (
          <Pressable
            key={item}
            accessibilityRole="radio"
            accessibilityState={{ selected: theme === item }}
            aria-checked={theme === item}
            onPress={() => setTheme(item)}
            style={({ pressed }) => [
              s.choice,
              {
                borderColor: theme === item ? colors.accent : colors.border,
                backgroundColor:
                  theme === item ? colors.accentSoft : colors.surface,
                opacity: pressed ? motion.pressedOpacity : 1,
              },
            ]}
          >
            <AppText variant="label">{item}</AppText>
          </Pressable>
        ))}
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => void signOut()}
        style={({ pressed }) => [
          s.signOut,
          {
            borderColor: colors.danger,
            opacity: pressed ? motion.pressedOpacity : 1,
          },
        ]}
      >
        <AppText variant="label" style={{ color: colors.danger }}>
          Sign out
        </AppText>
      </Pressable>
    </Screen>
  );
}
const s = StyleSheet.create({
  header: { gap: 5, paddingVertical: spacing.lg },
  section: { marginTop: spacing.lg, marginBottom: 10 },
  card: {
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.card,
    gap: 5,
    marginBottom: 8,
  },
  row: { flexDirection: "row", gap: 8 },
  choice: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: radii.control,
  },
  signOut: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: radii.control,
    marginTop: spacing.xl,
  },
});
