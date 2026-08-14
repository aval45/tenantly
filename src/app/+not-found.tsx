import { useRouter } from "expo-router";
import { MapPinOff } from "lucide-react-native";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/shared/components/app-text";
import { PrimaryButton } from "@/shared/components/primary-button";
import { copy } from "@/shared/i18n/en";
import { radii, spacing, useTenantlyColors } from "@/shared/theme/tokens";

export default function NotFoundScreen() {
  const colors = useTenantlyColors();
  const router = useRouter();
  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <View style={[styles.icon, { backgroundColor: colors.surfaceSubtle }]}>
        <MapPinOff size={26} color={colors.primary} aria-hidden />
      </View>
      <AppText variant="heading">{copy.notFound.title}</AppText>
      <AppText muted style={styles.center}>
        {copy.notFound.body}
      </AppText>
      <PrimaryButton
        label={copy.notFound.action}
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
