import { AlertCircle, Building2 } from "lucide-react-native";
import { StyleSheet, View } from "react-native";

import { AppText } from "./app-text";
import { BrandMark } from "./brand-mark";
import { PrimaryButton } from "./primary-button";
import { radii, spacing, useTenantlyColors } from "@/shared/theme/tokens";

import { copy } from "@/shared/i18n/en";
type StateViewProps = {
  kind: "empty" | "error";
  title: string;
  body: string;
  actionLabel: string;
  onAction(): void;
};

export function StateView({
  kind,
  title,
  body,
  actionLabel,
  onAction,
}: StateViewProps) {
  const colors = useTenantlyColors();
  const Icon = kind === "empty" ? Building2 : AlertCircle;
  return (
    <View style={styles.container} accessibilityRole="summary">
      <View
        style={[
          styles.icon,
          {
            backgroundColor:
              kind === "error" ? colors.dangerSoft : colors.surfaceSubtle,
          },
        ]}
      >
        <Icon
          size={24}
          color={kind === "error" ? colors.danger : colors.primary}
          aria-hidden
        />
      </View>
      <AppText variant="heading" style={styles.center}>
        {title}
      </AppText>
      <AppText muted style={styles.center}>
        {body}
      </AppText>
      <PrimaryButton
        label={actionLabel}
        onPress={onAction}
        style={styles.action}
      />
    </View>
  );
}

export function LoadingSkeleton() {
  const colors = useTenantlyColors();
  return (
    <View
      accessibilityLabel={copy.states.loadingDashboard}
      accessibilityRole="progressbar"
      style={styles.loading}
    >
      <View
        style={[styles.lineShort, { backgroundColor: colors.surfaceSubtle }]}
      />
      <View
        style={[styles.lineWide, { backgroundColor: colors.surfaceSubtle }]}
      />
      <View style={[styles.hero, { backgroundColor: colors.surfaceSubtle }]} />
      <View style={styles.grid}>
        {[0, 1, 2, 3].map((key) => (
          <View
            key={key}
            style={[styles.tile, { backgroundColor: colors.surfaceSubtle }]}
          />
        ))}
      </View>
    </View>
  );
}

export function EmptyLedger({ title, body }: { title: string; body: string }) {
  const colors = useTenantlyColors();
  return (
    <View
      accessibilityRole="summary"
      style={[styles.emptyLedger, { borderColor: colors.border }]}
    >
      <BrandMark compact />
      <View style={styles.emptyCopy}>
        <AppText variant="label">{title}</AppText>
        <AppText variant="caption" muted>
          {body}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: spacing.md,
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: radii.dialog,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  center: { textAlign: "center", maxWidth: 420 },
  action: { marginTop: spacing.sm, alignSelf: "center", minWidth: 180 },
  loading: { paddingTop: spacing.lg, gap: spacing.md },
  lineShort: { height: 15, width: 130, borderRadius: 6 },
  lineWide: { height: 32, width: 260, borderRadius: 8 },
  hero: {
    height: 180,
    width: "100%",
    borderRadius: radii.dialog,
    marginTop: spacing.sm,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  tile: { height: 104, minWidth: "47%", flexGrow: 1, borderRadius: radii.card },
  emptyLedger: {
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 16,
  },
  emptyCopy: { flex: 1, gap: 3 },
});
