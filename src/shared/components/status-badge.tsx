import { CheckCircle2, Clock3 } from "lucide-react-native";
import { StyleSheet, View } from "react-native";

import { AppText } from "./app-text";
import { useTenantlyColors } from "@/shared/theme/tokens";

import { copy } from "@/shared/i18n/en";
export function StatusBadge({ status }: { status: "paid" | "review" }) {
  const colors = useTenantlyColors();
  const paid = status === "paid";
  const color = paid ? colors.success : colors.warning;
  const Icon = paid ? CheckCircle2 : Clock3;
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: paid ? colors.successSoft : colors.warningSoft,
          borderLeftColor: color,
        },
      ]}
    >
      <Icon size={12} color={color} aria-hidden />
      <AppText variant="caption" style={{ color }}>
        {paid ? copy.status.paid : copy.status.review}
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
