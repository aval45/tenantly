import { CheckCircle2, Clock3, RotateCcw, XCircle } from "lucide-react-native";
import { StyleSheet, View } from "react-native";

import { AppText } from "./app-text";
import { useTenantlyColors } from "@/shared/theme/tokens";

import { copy } from "@/shared/i18n/en";
export function StatusBadge({
  status,
}: {
  status: "paid" | "review" | "rejected" | "refunded";
}) {
  const colors = useTenantlyColors();
  const paid = status === "paid";
  const color = paid
    ? colors.success
    : status === "rejected"
      ? colors.danger
      : colors.warning;
  const Icon = paid
    ? CheckCircle2
    : status === "rejected"
      ? XCircle
      : status === "refunded"
        ? RotateCcw
        : Clock3;
  const backgroundColor = paid
    ? colors.successSoft
    : status === "rejected"
      ? colors.dangerSoft
      : colors.warningSoft;
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor,
          borderLeftColor: color,
        },
      ]}
    >
      <Icon size={12} color={color} aria-hidden />
      <AppText variant="caption" style={{ color }}>
        {paid
          ? copy.status.paid
          : status === "rejected"
            ? "Rejected"
            : status === "refunded"
              ? "Refunded"
              : copy.status.review}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 2,
    borderLeftWidth: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
});
