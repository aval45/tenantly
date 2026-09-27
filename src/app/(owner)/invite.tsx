import { Redirect, useLocalSearchParams } from "expo-router";
import { Pressable, Share, StyleSheet, TextInput, View } from "react-native";
import { useState } from "react";
import { Check, UserRound } from "lucide-react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { invitationService } from "@/features/invitations/service";
import { propertyService } from "@/features/properties/service";
import { getSupabaseClient } from "@/shared/api/supabase";
import { queryKeys } from "@/shared/api/query-keys";
import { useAuth } from "@/shared/auth/auth-provider";
import { AppText } from "@/shared/components/app-text";
import { PrimaryButton } from "@/shared/components/primary-button";
import { Screen } from "@/shared/components/screen";
import { radii, spacing, useTenantlyColors } from "@/shared/theme/tokens";
import { toUserMessage } from "@/shared/errors/to-user-message";

export default function InviteScreen() {
  const { residentId, email: initialEmailParam } = useLocalSearchParams<{
    residentId?: string;
    email?: string;
  }>();
  const { session } = useAuth();
  const cache = useQueryClient();
  const colors = useTenantlyColors();
  const [editedEmail, setEmail] = useState<string | null>(null);
  const [link, setLink] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [propertyIds, setPropertyIds] = useState<string[]>([]);
  const [operatorRole, setOperatorRole] = useState<
    "manager" | "maintenance_staff"
  >("manager");
  const isManagerInvite = !residentId;

  const residentQuery = useQuery({
    queryKey: [
      "tenantly",
      "resident",
      session?.userId,
      session?.activeOrganizationId,
      residentId,
    ],
    queryFn: async () => {
      const { data, error: residentError } = await getSupabaseClient()
        .from("residents")
        .select("*")
        .eq("id", residentId!)
        .single();
      if (residentError) throw residentError;
      return data;
    },
    enabled: !isManagerInvite && !!residentId,
  });

  const email =
    editedEmail ??
    initialEmailParam ??
    residentQuery.data?.email_normalized ??
    "";

  const properties = useQuery({
    queryKey: queryKeys.properties(
      session?.userId ?? "",
      session?.activeOrganizationId ?? "",
    ),
    queryFn: () => propertyService.list(session?.activeOrganizationId ?? ""),
    enabled: isManagerInvite && !!session?.activeOrganizationId,
  });

  if (!session?.capabilities.manageMembers)
    return <Redirect href="/unauthorized" />;

  async function create() {
    setSaving(true);
    setError(null);
    const normalizedEmail = email.trim().toLowerCase();

    if (
      !normalizedEmail ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      setError("Please enter a valid email address (e.g. name@example.com).");
      setSaving(false);
      return;
    }
    if (
      isManagerInvite &&
      operatorRole === "manager" &&
      propertyIds.length === 0
    ) {
      setError(
        "Please select at least one property for the manager to oversee.",
      );
      setSaving(false);
      return;
    }

    try {
      const value = await invitationService.create({
        organizationId: session?.activeOrganizationId ?? "",
        residentId: isManagerInvite ? undefined : residentId,
        role: isManagerInvite ? operatorRole : "tenant",
        email: normalizedEmail,
        propertyIds: isManagerInvite ? propertyIds : [],
      });

      if (
        !isManagerInvite &&
        residentId &&
        residentQuery.data &&
        !residentQuery.data.email_normalized
      ) {
        try {
          await getSupabaseClient()
            .from("residents")
            .update({ email_normalized: normalizedEmail })
            .eq("id", residentId);
        } catch {
          // non-blocking
        }
      }

      setLink(`tenantly://accept-invitation?token=${value.token}`);
      await Promise.all([
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
            residentId,
          ],
        }),
      ]);
    } catch (cause) {
      setError(toUserMessage(cause, "Could not create invitation."));
    } finally {
      setSaving(false);
    }
  }

  const residentName = residentQuery.data?.full_name;

  return (
    <Screen>
      <View style={s.header}>
        <AppText variant="heading">
          {isManagerInvite
            ? "Invite team member"
            : residentName
              ? `Invite ${residentName}`
              : "Invite resident"}
        </AppText>
        <AppText muted>
          The secure link expires in seven days and can be used once.
        </AppText>
      </View>

      {!isManagerInvite && residentQuery.data ? (
        <View
          style={[
            s.residentCard,
            {
              borderColor: colors.border,
              backgroundColor: colors.surfaceRaised,
            },
          ]}
        >
          <View style={[s.avatar, { backgroundColor: colors.primarySoft }]}>
            <UserRound size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="label">{residentQuery.data.full_name}</AppText>
            <AppText variant="caption" muted>
              {residentQuery.data.phone_e164 || "No phone registered"}
            </AppText>
          </View>
        </View>
      ) : null}

      <View style={s.fieldGroup}>
        <AppText variant="label">
          {isManagerInvite ? "Team member email" : "Resident email"}
        </AppText>
        <TextInput
          accessibilityLabel="Resident email"
          placeholder="name@example.com"
          placeholderTextColor={colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
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

      {isManagerInvite ? (
        <View style={s.properties}>
          <View style={s.roleRow}>
            {(["manager", "maintenance_staff"] as const).map((role) => (
              <Pressable
                key={role}
                accessibilityRole="radio"
                accessibilityState={{ selected: operatorRole === role }}
                onPress={() => setOperatorRole(role)}
                style={[
                  s.role,
                  {
                    borderColor:
                      operatorRole === role ? colors.accent : colors.border,
                  },
                ]}
              >
                <AppText variant="caption">
                  {role === "manager" ? "Manager" : "Maintenance"}
                </AppText>
              </Pressable>
            ))}
          </View>
          <AppText variant="label">Assigned properties</AppText>
          {properties.data?.map((property) => {
            const selected = propertyIds.includes(property.id);
            return (
              <Pressable
                key={property.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                aria-checked={selected}
                onPress={() =>
                  setPropertyIds((current) =>
                    selected
                      ? current.filter((id) => id !== property.id)
                      : [...current, property.id],
                  )
                }
                style={({ pressed }) => [
                  s.property,
                  {
                    borderColor: selected ? colors.accent : colors.border,
                    opacity: pressed ? 0.72 : 1,
                  },
                ]}
              >
                <AppText variant="label" style={{ flex: 1 }}>
                  {property.name}
                </AppText>
                {selected ? <Check size={18} color={colors.accent} /> : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {error ? (
        <AppText accessibilityRole="alert" style={{ color: colors.danger }}>
          {error}
        </AppText>
      ) : null}

      {link ? (
        <View style={s.resultBox}>
          <AppText variant="label">Invitation link ready:</AppText>
          <AppText
            selectable
            style={[
              s.linkText,
              {
                color: colors.primary,
                backgroundColor: colors.surfaceRaised,
                borderColor: colors.border,
              },
            ]}
          >
            {link}
          </AppText>
          <PrimaryButton
            label="Share invitation"
            onPress={() => void Share.share({ message: link })}
          />
        </View>
      ) : (
        <PrimaryButton
          label={saving ? "Creating…" : "Create invitation"}
          isDisabled={
            saving ||
            !email.trim().includes("@") ||
            (isManagerInvite &&
              operatorRole === "manager" &&
              propertyIds.length === 0)
          }
          onPress={() => void create()}
        />
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  header: { gap: 5, paddingVertical: spacing.lg },
  fieldGroup: { gap: 6, marginBottom: spacing.md },
  residentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.card,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    minHeight: 52,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.control,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  properties: { gap: 8, marginBottom: spacing.md },
  roleRow: { flexDirection: "row", gap: 8 },
  role: {
    minHeight: 40,
    borderWidth: 1,
    borderRadius: radii.control,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  property: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: radii.control,
  },
  resultBox: { gap: 10, marginTop: spacing.sm },
  linkText: {
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.control,
    fontSize: 13,
  },
});
