import { Redirect, useRouter } from "expo-router";
import { Check, ChevronRight } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { useAuth } from "@/shared/auth/auth-provider";
import { AppText } from "@/shared/components/app-text";
import { Screen } from "@/shared/components/screen";
import { radii, spacing, useTenantlyColors } from "@/shared/theme/tokens";
export default function OrganizationsRoute() {
  const { status } = useAuth();
  if (status === "unconfigured")
    return <Redirect href={"/configuration-required" as never} />;
  if (status === "restoring") return null;
  if (status === "unauthenticated") return <Redirect href="/(auth)/login" />;
  return <OrganizationsScreen />;
}

function OrganizationsScreen() {
  const { session, selectOrganization } = useAuth();
  const router = useRouter();
  const colors = useTenantlyColors();
  async function select(id: string) {
    await selectOrganization(id);
    router.replace("/");
  }
  return (
    <Screen>
      <View style={s.header}>
        <AppText variant="heading">Organizations</AppText>
        <AppText muted>Choose the active workspace and role.</AppText>
      </View>
      {session?.memberships.map((item) => {
        const selected = item.organizationId === session.activeOrganizationId;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => void select(item.organizationId)}
            style={[
              s.row,
              {
                borderColor: colors.border,
                backgroundColor: selected ? colors.primarySoft : colors.surface,
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <AppText variant="label">{item.organizationName}</AppText>
              <AppText variant="caption" muted>
                {item.role}
              </AppText>
            </View>
            {selected ? (
              <Check size={18} color={colors.primary} />
            ) : (
              <ChevronRight size={18} color={colors.textMuted} />
            )}
          </Pressable>
        );
      })}
    </Screen>
  );
}
const s = StyleSheet.create({
  header: { gap: 5, paddingVertical: spacing.lg },
  row: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.card,
    marginBottom: 8,
  },
});
