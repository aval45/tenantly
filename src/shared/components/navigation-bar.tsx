import { usePathname, useRouter } from "expo-router";
import {
  Building2,
  Ellipsis,
  House,
  IndianRupee,
  Wrench,
  type LucideIcon,
} from "lucide-react-native";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText } from "./app-text";
import { useAuth } from "@/shared/auth/auth-provider";
import { motion } from "@/shared/theme/motion";
import { useTenantlyColors } from "@/shared/theme/tokens";

type Item = { label: string; href: string; Icon: LucideIcon };

export function NavigationBar() {
  const colors = useTenantlyColors();
  const pathname = usePathname();
  const router = useRouter();
  const { activeMembership } = useAuth();
  const operator = ["owner", "manager"].includes(activeMembership?.role ?? "");
  const items: Item[] = operator
    ? [
        { label: "Home", href: "/(owner)", Icon: House },
        {
          label: "Properties",
          href: "/(owner)/properties",
          Icon: Building2,
        },
        { label: "Rent", href: "/(owner)/rent", Icon: IndianRupee },
        { label: "More", href: "/(owner)/more", Icon: Ellipsis },
      ]
    : [
        { label: "Home", href: "/(tenant)", Icon: House },
        {
          label: "Payments",
          href: "/(tenant)/payments",
          Icon: IndianRupee,
        },
        { label: "Requests", href: "/(tenant)/requests", Icon: Wrench },
        { label: "More", href: "/(tenant)/more", Icon: Ellipsis },
      ];

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={[
        styles.safe,
        {
          backgroundColor: colors.hero,
          borderTopColor: colors.accent,
        },
      ]}
    >
      <View style={styles.items}>
        {items.map(({ label, href, Icon }) => {
          const active =
            (label === "More" &&
              ["/profile", "/organizations"].includes(pathname)) ||
            (label === "Home" && pathname === "/notifications");
          return (
            <Pressable
              key={label}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => router.replace(href as never)}
              style={({ pressed }) => [
                styles.item,
                { opacity: pressed ? motion.pressedOpacity : 1 },
              ]}
            >
              <View
                style={[
                  styles.iconFrame,
                  active && { backgroundColor: colors.accent },
                ]}
              >
                <Icon
                  size={20}
                  color={active ? colors.heroText : colors.heroMuted}
                  strokeWidth={active ? 2.4 : 1.9}
                />
              </View>
              <AppText
                variant="caption"
                style={{
                  color: active ? colors.heroText : colors.heroMuted,
                  fontSize: 11,
                }}
              >
                {label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    borderTopWidth: 3,
    minHeight: Platform.OS === "android" ? 76 : 86,
  },
  items: {
    width: "100%",
    maxWidth: 880,
    alignSelf: "center",
    flexDirection: "row",
    paddingTop: 7,
  },
  item: {
    flex: 1,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
  },
  iconFrame: {
    width: 38,
    height: 28,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
