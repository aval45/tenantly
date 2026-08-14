import type { PropsWithChildren, ReactNode } from "react";
import { usePathname, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText } from "./app-text";
import { NavigationBar } from "./navigation-bar";
import { useAuth } from "@/shared/auth/auth-provider";
import { motion } from "@/shared/theme/motion";
import { spacing, useTenantlyColors } from "@/shared/theme/tokens";

export function Screen({
  children,
  refreshControl,
  scrollable = true,
  testID,
}: PropsWithChildren<{
  refreshControl?: ReactNode;
  scrollable?: boolean;
  testID?: string;
}>) {
  const colors = useTenantlyColors();
  const pathname = usePathname();
  const router = useRouter();
  const { activeMembership } = useAuth();
  const { width } = useWindowDimensions();
  const horizontalPadding = width >= 700 ? spacing.lg : spacing.content;
  const primaryRoutes = new Set([
    "/",
    "/properties",
    "/rent",
    "/more",
    "/payments",
    "/requests",
  ]);
  const globalTaskbarRoutes = ["/profile", "/organizations", "/notifications"];
  const showTaskbar = globalTaskbarRoutes.includes(pathname);
  const roleGroup =
    activeMembership?.role === "tenant" ? "/(tenant)" : "/(owner)";
  const destinations: Record<string, { href: string; label: string }> = {
    "/profile": { href: roleGroup + "/more", label: "More" },
    "/organizations": { href: roleGroup + "/more", label: "More" },
    "/notifications": { href: roleGroup, label: "Home" },
    "/residents": { href: "/(owner)/more", label: "More" },
    "/complaints": { href: "/(owner)/more", label: "More" },
    "/notices": { href: "/(owner)/more", label: "More" },
    "/reports": { href: "/(owner)/more", label: "More" },
    "/invite": { href: "/(owner)/more", label: "More" },
    "/resident-setup": { href: "/(owner)/residents", label: "Residents" },
    "/tenancy-setup": { href: "/(owner)/residents", label: "Residents" },
    "/occupancy-manage": {
      href: "/(owner)/residents",
      label: "Residents",
    },
    "/property-setup": { href: "/(owner)/properties", label: "Properties" },
    "/room-setup": { href: "/(owner)/properties", label: "Properties" },
    "/payment-proof": { href: "/(tenant)/payments", label: "Payments" },
  };
  const dynamicDestination = pathname.startsWith("/payment/")
    ? { href: "/(owner)/rent", label: "Rent" }
    : pathname.startsWith("/invoice/")
      ? { href: "/(tenant)/payments", label: "Payments" }
      : undefined;
  const destination = dynamicDestination ?? destinations[pathname];
  const showBack =
    !primaryRoutes.has(pathname) && !pathname.startsWith("/property/");
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace((destination?.href ?? roleGroup) as never);
  };
  const content = (
    <View style={[styles.content, !scrollable && styles.staticContent]}>
      {showBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={goBack}
          style={({ pressed }) => [
            styles.back,
            {
              backgroundColor: colors.surfaceSubtle,
              opacity: pressed ? motion.pressedOpacity : 1,
            },
          ]}
        >
          <ArrowLeft size={18} color={colors.primary} />
          <AppText variant="caption">{destination?.label ?? "Back"}</AppText>
        </Pressable>
      ) : null}
      {children}
    </View>
  );
  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.safe, { backgroundColor: colors.background }]}
      testID={testID}
    >
      <View style={styles.brandRule}>
        <View
          style={[styles.brandRuleInk, { backgroundColor: colors.primary }]}
        />
        <View
          style={[styles.brandRuleAccent, { backgroundColor: colors.accent }]}
        />
      </View>
      {scrollable ? (
        <ScrollView
          automaticallyAdjustKeyboardInsets
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: horizontalPadding },
          ]}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl as never}
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        <View
          style={[
            styles.nonScrollingContent,
            { paddingHorizontal: horizontalPadding },
          ]}
        >
          {content}
        </View>
      )}
      {showTaskbar ? <NavigationBar /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  brandRule: {
    height: 4,
    width: "100%",
    flexDirection: "row",
    pointerEvents: "none",
  },
  brandRuleInk: { flex: 1 },
  brandRuleAccent: { width: 68 },
  scrollContent: { flexGrow: 1, paddingBottom: 48 },
  content: { width: "100%", maxWidth: 880, alignSelf: "center" },
  staticContent: { flex: 1 },
  nonScrollingContent: { flex: 1, paddingBottom: 16 },
  back: {
    alignSelf: "flex-start",
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 3,
    marginTop: 8,
    paddingHorizontal: 10,
  },
});
