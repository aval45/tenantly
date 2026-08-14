import { KeyRound } from "lucide-react-native";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/shared/components/app-text";
import { spacing, useTenantlyColors } from "@/shared/theme/tokens";

export default function ConfigurationRequiredScreen() {
  const colors = useTenantlyColors();
  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <KeyRound size={32} color={colors.accent} aria-hidden />
      <AppText variant="heading" style={styles.center}>
        Connect Supabase to continue
      </AppText>
      <AppText muted style={styles.center}>
        Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY to
        .env, then restart Expo. Tenantly intentionally has no mock-data mode.
      </AppText>
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
  center: { textAlign: "center", maxWidth: 480 },
});
