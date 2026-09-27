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
import {
  getRoleGroup,
  getScreenDestination,
  isPrimaryRoute,
  shouldShowTaskbar,
} from "./screen-navigation";
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
  const role = activeMembership?.role;
  const roleGroup = getRoleGroup(role);
  const showTaskbar = shouldShowTaskbar(pathname);
  const destination = getScreenDestination(pathname, role);
  const showBack = !isPrimaryRoute(pathname);
  const goBack = () => {
    if (destination) {
      router.navigate(destination.href as never);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(roleGroup as never);
    }
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
