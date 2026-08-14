import { useRouter } from "expo-router";
import { ShieldAlert } from "lucide-react-native";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/shared/components/app-text";
import { PrimaryButton } from "@/shared/components/primary-button";
import { copy } from "@/shared/i18n/en";
import { radii, spacing, useTenantlyColors } from "@/shared/theme/tokens";

export default function UnauthorizedScreen() {
  const colors = useTenantlyColors();
  const router = useRouter();
  return (
    <View
      style={[styles.page, { backgroundColor: colors.background }]}
      accessibilityRole="alert"
    >
      <View style={[styles.icon, { backgroundColor: colors.dangerSoft }]}>
        <ShieldAlert size={26} color={colors.danger} aria-hidden />
      </View>
      <AppText variant="heading" style={styles.center}>
        {copy.unauthorized.title}
      </AppText>
      <AppText muted style={styles.center}>
        {copy.unauthorized.body}
      </AppText>
      <PrimaryButton
        label={copy.unauthorized.action}
        onPress={() => router.replace("/")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.lg,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: radii.dialog,
    alignItems: "center",
    justifyContent: "center",
  },
  center: { textAlign: "center", maxWidth: 420 },
});
