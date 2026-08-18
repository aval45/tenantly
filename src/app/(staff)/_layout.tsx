import { Redirect, Tabs } from "expo-router";
import {
  ClipboardList,
  Ellipsis,
  House,
  type LucideIcon,
} from "lucide-react-native";
import { Platform, StyleSheet, useWindowDimensions, View } from "react-native";
import { useAuth } from "@/shared/auth/auth-provider";
import { useTenantlyColors } from "@/shared/theme/tokens";

function TabIcon({ Icon, active }: { Icon: LucideIcon; active: boolean }) {
  const colors = useTenantlyColors();
  return (
    <View style={[s.icon, active && { backgroundColor: colors.accent }]}>
      <Icon size={20} color={active ? colors.heroText : colors.heroMuted} />
    </View>
  );
}
export default function StaffLayout() {
  const { status, activeMembership } = useAuth();
  const colors = useTenantlyColors();
  const { width } = useWindowDimensions();
  if (status === "unauthenticated") return <Redirect href="/(auth)/login" />;
  if (
    status === "error" ||
    (status === "authenticated" &&
      activeMembership?.role !== "maintenance_staff")
  )
    return <Redirect href="/unauthorized" />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.heroText,
        tabBarInactiveTintColor: colors.heroMuted,
        tabBarLabelStyle: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
        tabBarStyle: {
          backgroundColor: colors.hero,
          borderTopColor: colors.accent,
          borderTopWidth: 3,
          height: Platform.OS === "android" ? 76 : 86,
          paddingTop: 7,
          paddingBottom: Platform.OS === "android" ? 9 : 24,
          paddingHorizontal: Math.max(0, (width - 880) / 2),
        },
      }}
    >
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
        name="tasks"
        options={{
          title: "Tasks",
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={ClipboardList} active={focused} />
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
    </Tabs>
  );
}
const s = StyleSheet.create({
  icon: {
    width: 38,
    height: 28,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
