import { StyleSheet, View } from "react-native";

import type { DashboardMetric } from "../types";
import { AppText } from "@/shared/components/app-text";
import { useTenantlyColors } from "@/shared/theme/tokens";

export function MetricTile({
  metric,
  wide,
}: {
  metric: DashboardMetric;
  wide: boolean;
}) {
  const colors = useTenantlyColors();
  const tone =
    metric.tone === "danger"
      ? colors.danger
      : metric.tone === "warning"
        ? colors.warning
        : metric.tone === "success"
          ? colors.success
          : colors.primary;
  return (
    <View
      accessibilityLabel={`${metric.label}: ${metric.value}. ${metric.detail}`}
      style={[
        styles.tile,
        { backgroundColor: colors.surface, borderColor: colors.border },
        wide ? styles.wide : styles.half,
      ]}
    >
      <View style={styles.labelGroup}>
        <View style={[styles.toneMarker, { backgroundColor: tone }]} />
        <View style={styles.copy}>
          <AppText variant="label">{metric.label}</AppText>
          <AppText variant="caption" style={{ color: tone }}>
            {metric.detail}
          </AppText>
        </View>
      </View>
      <AppText variant="metric" style={styles.value}>
        {metric.value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    minHeight: 82,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 16,
  },
  half: { flexBasis: "100%", flexGrow: 1 },
  wide: { flexBasis: "50%", flexGrow: 1 },
  labelGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  toneMarker: { width: 3, height: 32 },
  copy: { flex: 1, gap: 2 },
  value: { textAlign: "right" },
});
