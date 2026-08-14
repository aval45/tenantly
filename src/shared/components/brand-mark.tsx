import { StyleSheet, View } from "react-native";

import { useTenantlyColors } from "@/shared/theme/tokens";

/**
 * A small doorway / ledger-tab monogram. Built from native views so it stays
 * sharp at every density and never depends on a generic icon library mark.
 */
export function BrandMark({ compact = false }: { compact?: boolean }) {
  const colors = useTenantlyColors();
  const size = compact ? 38 : 52;
  return (
    <View
      accessibilityLabel="Tenantly"
      style={[
        styles.frame,
        {
          width: size,
          height: size,
          borderColor: colors.primary,
          backgroundColor: colors.surfaceRaised,
        },
      ]}
    >
      <View
        style={[
          styles.door,
          compact ? styles.doorCompact : null,
          { borderColor: colors.primary },
        ]}
      >
        <View style={[styles.key, { backgroundColor: colors.accent }]} />
      </View>
      <View style={[styles.threshold, { backgroundColor: colors.accent }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  door: {
    width: 25,
    height: 35,
    borderWidth: 2,
    borderBottomWidth: 0,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingRight: 4,
  },
  doorCompact: { width: 19, height: 27 },
  key: { width: 4, height: 4, borderRadius: 2 },
  threshold: { width: "76%", height: 3 },
});
