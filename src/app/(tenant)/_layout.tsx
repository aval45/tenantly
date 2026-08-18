import { Redirect, Tabs } from "expo-router";
import { Ellipsis, House, IndianRupee, Wrench } from "lucide-react-native";
import { Platform, StyleSheet, useWindowDimensions, View } from "react-native";
import { useAuth } from "@/shared/auth/auth-provider";
import { useTenantlyColors } from "@/shared/theme/tokens";
import { useNavigationAnimation } from "@/shared/theme/motion";
function TabIcon({ Icon, active }: { Icon: typeof House; active: boolean }) {
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
export default function TenantLayout() {
  const colors = useTenantlyColors();
  const navigationAnimation = useNavigationAnimation();
  const { width } = useWindowDimensions();
  const { status, activeMembership } = useAuth();
  if (status === "unauthenticated") return <Redirect href="/(auth)/login" />;
  if (status === "error") return <Redirect href="/" />;
  if (status === "authenticated" && activeMembership?.role !== "tenant")
    return <Redirect href="/unauthorized" />;
  const options = {
    headerShown: false,
    animation: navigationAnimation,
    tabBarHideOnKeyboard: true,
    tabBarActiveTintColor: colors.heroText,
    tabBarInactiveTintColor: colors.heroMuted,
    tabBarStyle: {
      backgroundColor: colors.hero,
      borderTopColor: colors.accent,
      borderTopWidth: 3,
      paddingHorizontal: Math.max(0, (width - 880) / 2),
      height: Platform.OS === "android" ? 76 : 86,
      paddingBottom: Platform.OS === "android" ? 9 : 24,
    },
    tabBarLabelStyle: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  };
  return (
    <Tabs screenOptions={options}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={House} active={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: "Payments",
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={IndianRupee} active={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: "Requests",
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={Wrench} active={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={Ellipsis} active={focused} />
          ),
        }}
      />
      <Tabs.Screen name="invoice/[id]" options={{ href: null }} />
      <Tabs.Screen name="payment-proof" options={{ href: null }} />
      <Tabs.Screen name="notices" options={{ href: null }} />
      <Tabs.Screen name="complaint/[id]" options={{ href: null }} />
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
