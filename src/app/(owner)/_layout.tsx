import { Redirect, Tabs } from "expo-router";
import {
  Building2,
  Ellipsis,
  House,
  IndianRupee,
  type LucideIcon,
} from "lucide-react-native";
import { Platform, StyleSheet, useWindowDimensions, View } from "react-native";

import { useAuth } from "@/shared/auth/auth-provider";
import { copy } from "@/shared/i18n/en";
import { useTenantlyColors } from "@/shared/theme/tokens";
import { useNavigationAnimation } from "@/shared/theme/motion";

function TabIcon({ Icon, active }: { Icon: LucideIcon; active: boolean }) {
  const colors = useTenantlyColors();
  return (
    <View
      style={[styles.iconFrame, active && { backgroundColor: colors.accent }]}
    >
      <Icon
        size={20}
        strokeWidth={active ? 2.4 : 1.9}
        color={active ? colors.heroText : colors.heroMuted}
      />
    </View>
  );
}

export default function OwnerTabsLayout() {
  const colors = useTenantlyColors();
  const navigationAnimation = useNavigationAnimation();
  const { width } = useWindowDimensions();
  const { status, activeMembership } = useAuth();
  if (status === "unauthenticated") return <Redirect href="/(auth)/login" />;
  if (status === "error") return <Redirect href="/" />;
  if (
    status === "authenticated" &&
    !["owner", "manager"].includes(activeMembership?.role ?? "")
  )
    return <Redirect href="/unauthorized" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: navigationAnimation,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.heroText,
        tabBarInactiveTintColor: colors.heroMuted,
        tabBarLabelStyle: {
          fontFamily: "Inter_600SemiBold",
          fontSize: 11,
          marginTop: 1,
        },
        tabBarStyle: {
          backgroundColor: colors.hero,
          borderTopColor: colors.accent,
          borderTopWidth: 3,
          height: Platform.OS === "android" ? 76 : 86,
          paddingTop: 7,
          paddingBottom: Platform.OS === "android" ? 9 : 24,
          paddingHorizontal: Math.max(0, (width - 880) / 2),
        },
        tabBarItemStyle: { minHeight: Platform.OS === "android" ? 52 : 48 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: copy.tabs.home,
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={House} active={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="properties"
        options={{
          title: copy.tabs.properties,
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={Building2} active={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="rent"
        options={{
          title: copy.tabs.rent,
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={IndianRupee} active={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: copy.tabs.more,
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={Ellipsis} active={focused} />
          ),
        }}
      />
      <Tabs.Screen name="property-setup" options={{ href: null }} />
      <Tabs.Screen name="property/[id]" options={{ href: null }} />
      <Tabs.Screen name="room-setup" options={{ href: null }} />
      <Tabs.Screen name="payment/[id]" options={{ href: null }} />
      <Tabs.Screen name="residents" options={{ href: null }} />
      <Tabs.Screen name="resident-setup" options={{ href: null }} />
      <Tabs.Screen name="tenancy-setup" options={{ href: null }} />
      <Tabs.Screen name="occupancy-manage" options={{ href: null }} />
      <Tabs.Screen name="complaints" options={{ href: null }} />
      <Tabs.Screen name="notices" options={{ href: null }} />
      <Tabs.Screen name="reports" options={{ href: null }} />
      <Tabs.Screen name="invite" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconFrame: {
    width: 38,
    height: 28,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
