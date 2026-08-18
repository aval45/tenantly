import { Redirect, useLocalSearchParams } from "expo-router";
import { Pressable, Share, StyleSheet, TextInput, View } from "react-native";
import { useState } from "react";
import { Check } from "lucide-react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { invitationService } from "@/features/invitations/service";
import { propertyService } from "@/features/properties/service";
import { queryKeys } from "@/shared/api/query-keys";
import { useAuth } from "@/shared/auth/auth-provider";
import { AppText } from "@/shared/components/app-text";
import { PrimaryButton } from "@/shared/components/primary-button";
import { Screen } from "@/shared/components/screen";
import { radii, spacing, useTenantlyColors } from "@/shared/theme/tokens";
export default function InviteScreen() {
  const { residentId } = useLocalSearchParams<{ residentId: string }>();
  const { session } = useAuth();
  const cache = useQueryClient();
  const colors = useTenantlyColors();
  const [email, setEmail] = useState("");
  const [link, setLink] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [propertyIds, setPropertyIds] = useState<string[]>([]);
  const [operatorRole, setOperatorRole] = useState<
    "manager" | "maintenance_staff"
  >("manager");
  const isManagerInvite = !residentId;
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
    try {
      const value = await invitationService.create({
        organizationId: session?.activeOrganizationId ?? "",
        residentId: isManagerInvite ? undefined : residentId,
        role: isManagerInvite ? operatorRole : "tenant",
        email,
        propertyIds: isManagerInvite ? propertyIds : [],
      });
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
      ]);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not create invitation.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <Screen>
      <View style={s.header}>
        <AppText variant="heading">
          Invite {isManagerInvite ? "team member" : "resident"}
        </AppText>
        <AppText muted>
          The secure link expires in seven days and can be used once.
        </AppText>
      </View>
      <TextInput
        accessibilityLabel="Resident email"
        keyboardType="email-address"
        autoCapitalize="none"
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
        <AppText style={{ color: colors.danger }}>{error}</AppText>
      ) : null}
      {link ? (
        <>
          <AppText selectable>{link}</AppText>
          <PrimaryButton
            label="Share invitation"
            onPress={() => void Share.share({ message: link })}
          />
        </>
      ) : (
        <PrimaryButton
          label={saving ? "Creating…" : "Create invitation"}
          isDisabled={
            saving ||
            !email.includes("@") ||
            (isManagerInvite && propertyIds.length === 0)
          }
          onPress={() => void create()}
        />
      )}
    </Screen>
  );
}
const s = StyleSheet.create({
  header: { gap: 5, paddingVertical: spacing.lg },
  input: {
    minHeight: 52,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.control,
    paddingHorizontal: 14,
    fontSize: 16,
    marginBottom: spacing.md,
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
});
