import { useRouter } from "expo-router";
import {
  Bell,
  Building2,
  ChevronRight,
  ClipboardList,
  FileText,
  LogOut,
  Megaphone,
  UserRound,
  Users,
} from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { useAuth } from "@/shared/auth/auth-provider";
import { AppText } from "@/shared/components/app-text";
import { Screen } from "@/shared/components/screen";
import { motion } from "@/shared/theme/motion";
import { radii, spacing, useTenantlyColors } from "@/shared/theme/tokens";
import { type AppTheme, useAppContextStore } from "@/stores/app-context";
const appearance: { value: AppTheme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];
const links = [
  { label: "Profile", path: "/profile", Icon: UserRound },
  { label: "Organizations", path: "/organizations", Icon: Building2 },
  { label: "Residents & tenancies", path: "/(owner)/residents", Icon: Users },
  { label: "Complaints", path: "/(owner)/complaints", Icon: ClipboardList },
  { label: "Notices", path: "/(owner)/notices", Icon: Megaphone },
  { label: "Notifications", path: "/notifications", Icon: Bell },
  { label: "Documents & reports", path: "/(owner)/reports", Icon: FileText },
] as const;
export default function MoreScreen() {
  const colors = useTenantlyColors();
  const router = useRouter();
  const { session, signOut } = useAuth();
  const theme = useAppContextStore((s) => s.theme);
  const setTheme = useAppContextStore((s) => s.setTheme);
  return (
    <Screen>
      <View style={s.header}>
        <AppText variant="heading">More</AppText>
        <AppText muted>People, operations, and workspace preferences.</AppText>
      </View>
      <View
        style={[
          s.account,
          { borderColor: colors.border, backgroundColor: colors.surface },
        ]}
      >
        <View style={[s.avatar, { backgroundColor: colors.surfaceSubtle }]}>
          <UserRound size={21} color={colors.primary} />
        </View>
        <View>
          <AppText variant="label">{session?.profile.fullName}</AppText>
          <AppText variant="caption" muted>
            {session?.profile.email}
          </AppText>
        </View>
      </View>
      <View style={[s.list, { borderColor: colors.border }]}>
        {links.map(({ label, path, Icon }) => (
          <Pressable
            key={label}
            accessibilityRole="button"
            onPress={() => router.push(path as never)}
            style={({ pressed }) => [
              s.row,
              {
                borderBottomColor: colors.border,
                backgroundColor: pressed ? colors.surfaceSubtle : "transparent",
              },
            ]}
          >
            <Icon size={19} color={colors.primary} />
            <AppText variant="label" style={{ flex: 1 }}>
              {label}
            </AppText>
            <ChevronRight size={18} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>
      <AppText variant="section" style={s.title}>
        Appearance
      </AppText>
      <View style={[s.segment, { backgroundColor: colors.surfaceSubtle }]}>
        {appearance.map((item) => (
          <Pressable
            key={item.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: item.value === theme }}
            onPress={() => setTheme(item.value)}
            style={({ pressed }) => [
              s.segmentItem,
              item.value === theme && { backgroundColor: colors.surface },
              { opacity: pressed ? motion.pressedOpacity : 1 },
            ]}
          >
            <AppText variant="label">{item.label}</AppText>
          </Pressable>
        ))}
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => void signOut()}
        style={({ pressed }) => [
          s.signOut,
          {
            borderColor: colors.border,
            opacity: pressed ? motion.pressedOpacity : 1,
          },
        ]}
      >
        <LogOut size={19} color={colors.danger} />
        <AppText variant="label" style={{ color: colors.danger }}>
          Sign out
        </AppText>
      </Pressable>
    </Screen>
  );
}
const s = StyleSheet.create({
  header: { gap: 4, paddingVertical: spacing.lg },
  account: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    marginTop: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.card,
    overflow: "hidden",
  },
  row: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { marginTop: spacing.lg, marginBottom: 10 },
  segment: { flexDirection: "row", padding: 4, borderRadius: radii.card },
  segmentItem: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.control,
  },
  signOut: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.control,
    marginTop: spacing.xl,
  },
});
