import { Pressable, StyleSheet, View } from "react-native";
import { useAuth } from "@/shared/auth/auth-provider";
import { AppText } from "@/shared/components/app-text";
import { Screen } from "@/shared/components/screen";
import { radii, spacing, useTenantlyColors } from "@/shared/theme/tokens";
export default function StaffMore() {
  const { session, signOut } = useAuth();
  const colors = useTenantlyColors();
  return (
    <Screen>
      <View style={s.header}>
        <AppText variant="heading">More</AppText>
        <AppText muted>{session?.profile.fullName} · Maintenance staff</AppText>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => void signOut()}
        style={[s.signout, { borderColor: colors.danger }]}
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
  signout: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radii.control,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xl,
  },
});
