import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { RefreshControl, StyleSheet, TextInput, View } from "react-native";
import { residentService } from "@/features/residents/service";
import { getSupabaseClient } from "@/shared/api/supabase";
import { queryKeys } from "@/shared/api/query-keys";
import { useAuth } from "@/shared/auth/auth-provider";
import { AppText } from "@/shared/components/app-text";
import { PrimaryButton } from "@/shared/components/primary-button";
import { Screen } from "@/shared/components/screen";
import { LoadingSkeleton, StateView } from "@/shared/components/state-views";
import { toUserMessage } from "@/shared/errors/to-user-message";
import { radii, spacing, useTenantlyColors } from "@/shared/theme/tokens";

export default function ResidentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const router = useRouter();
  const colors = useTenantlyColors();
  const cache = useQueryClient();
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const query = useQuery({
    queryKey: [
      "tenantly",
      "resident",
      session?.userId,
      session?.activeOrganizationId,
      id,
    ],
    queryFn: async () => {
      const client = getSupabaseClient();
      const [resident, tenancy] = await Promise.all([
        client.from("residents").select("*").eq("id", id).single(),
        client
          .from("tenancies")
          .select("*")
          .eq("resident_id", id)
          .in("status", ["active", "notice_period"])
          .maybeSingle(),
      ]);
      if (resident.error) throw resident.error;
      if (tenancy.error) throw tenancy.error;
      return { resident: resident.data, tenancy: tenancy.data };
    },
    enabled: !!id,
  });
  const resident = query.data?.resident;
  const form = {
    fullName: (edits.fullName ?? resident?.full_name ?? "").trim(),
    email: (edits.email ?? resident?.email_normalized ?? "").trim().toLowerCase(),
    phone: (edits.phone ?? resident?.phone_e164 ?? "").trim(),
    emergencyName: (edits.emergencyName ?? resident?.emergency_name ?? "").trim(),
    emergencyPhone: (edits.emergencyPhone ?? resident?.emergency_phone_e164 ?? "").trim(),
  };
  async function save() {
    if (!resident) return;
    setSaving(true);
    setError(null);
    setNotice(null);

    if (!form.fullName || form.fullName.length < 2) {
      setError("Please enter the resident's full legal name (at least 2 characters).");
      setSaving(false);
      return;
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Please enter a valid email address (e.g. name@example.com).");
      setSaving(false);
      return;
    }
    if (form.phone && !/^\+?[0-9]{10,15}$/.test(form.phone)) {
      setError("Please enter a valid phone number with country code (e.g. +919876543210).");
      setSaving(false);
      return;
    }
    if (form.emergencyPhone && !/^\+?[0-9]{10,15}$/.test(form.emergencyPhone)) {
      setError("Please enter a valid emergency contact phone number with country code.");
      setSaving(false);
      return;
    }

    try {
      await residentService.update(resident.id, {
        organizationId: resident.organization_id,
        fullName: form.fullName,
        email: form.email || undefined,
        phone: form.phone || undefined,
        emergencyName: form.emergencyName || undefined,
        emergencyPhone: form.emergencyPhone || undefined,
      });
      setNotice("Resident details saved.");
      await Promise.all([
        query.refetch(),
        cache.invalidateQueries({
          queryKey: queryKeys.residents(
            session?.userId ?? "",
            session?.activeOrganizationId ?? "",
          ),
        }),
        cache.invalidateQueries({
          queryKey: queryKeys.ownerDashboard(
            session?.userId ?? "",
            session?.activeOrganizationId ?? "",
          ),
        }),
        cache.invalidateQueries({
          queryKey: [
            "tenantly",
            "resident",
            session?.userId,
            session?.activeOrganizationId,
            id,
          ],
        }),
      ]);
    } catch (cause) {
      setError(toUserMessage(cause, "Resident could not be updated."));
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
  if (query.isError || !resident)
    return (
      <Screen>
        <StateView
          kind="error"
          title="Resident unavailable"
          body="The resident record could not be loaded."
          actionLabel="Retry"
          onAction={() => void query.refetch()}
        />
      </Screen>
    );
  const tenancy = query.data?.tenancy;
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
        <AppText variant="heading">Resident profile</AppText>
        <AppText muted>
          Identity, emergency contacts, and tenancy actions.
        </AppText>
      </View>
      {(
        [
          ["fullName", "Full legal name"],
          ["email", "Email"],
          ["phone", "Phone with country code"],
          ["emergencyName", "Emergency contact name"],
          ["emergencyPhone", "Emergency contact phone"],
        ] as const
      ).map(([field, label]) => (
        <View key={field} style={s.field}>
          <AppText variant="label">{label}</AppText>
          <TextInput
            accessibilityLabel={label}
            value={form[field]}
            onChangeText={(value) =>
              setEdits((current) => ({ ...current, [field]: value }))
            }
            keyboardType={
              field.includes("Phone") || field === "phone"
                ? "phone-pad"
                : field === "email"
                  ? "email-address"
                  : "default"
            }
            autoCapitalize={field === "email" ? "none" : "words"}
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
      ))}
      <PrimaryButton
        label={saving ? "Saving…" : "Save resident"}
        isDisabled={saving}
        onPress={() => void save()}
      />
      {notice ? (
        <AppText style={{ color: colors.success }}>{notice}</AppText>
      ) : null}
      {error ? (
        <AppText accessibilityRole="alert" style={{ color: colors.danger }}>
          {error}
        </AppText>
      ) : null}
      <View style={s.actions}>
        {tenancy ? (
          <PrimaryButton
            label="Manage occupancy"
            onPress={() =>
              router.push({
                pathname: "/(owner)/occupancy-manage" as never,
                params: {
                  tenancyId: tenancy.id,
                  residentName: resident.full_name,
                },
              })
            }
          />
        ) : (
          <PrimaryButton
            label="Create tenancy"
            onPress={() =>
              router.push({
                pathname: "/(owner)/tenancy-setup" as never,
                params: { residentId: resident.id },
              })
            }
          />
        )}
        <PrimaryButton
          label="Invite resident"
          tone="secondary"
          onPress={() =>
            router.push({
              pathname: "/(owner)/invite" as never,
              params: { residentId: resident.id },
            })
          }
        />
      </View>
    </Screen>
  );
}
const s = StyleSheet.create({
  header: { gap: 5, paddingVertical: spacing.lg },
  field: { gap: 7, marginBottom: spacing.md },
  input: {
    minHeight: 50,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.control,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  actions: { gap: 10, marginTop: spacing.xl },
});
