import { WifiOff } from "lucide-react-native";
import { StyleSheet, View } from "react-native";

import { AppText } from "./app-text";
import { copy } from "@/shared/i18n/en";
import { radii, spacing, useTenantlyColors } from "@/shared/theme/tokens";

export function OfflineBanner() {
  const colors = useTenantlyColors();
  return (
    <View
      accessibilityRole="alert"
      style={[styles.banner, { backgroundColor: colors.warningSoft }]}
    >
      <WifiOff size={18} color={colors.warning} aria-hidden />
      <View style={styles.copy}>
        <AppText variant="label" style={{ color: colors.warning }}>
          {copy.states.offlineTitle}
        </AppText>
        <AppText variant="caption" style={{ color: colors.warning }}>
          {copy.states.offlineBody}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: 12,
    borderRadius: radii.card,
    marginTop: spacing.md,
  },
  copy: { flex: 1, gap: 2 },
});
