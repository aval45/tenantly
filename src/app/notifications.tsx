import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Redirect } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { getSupabaseClient } from "@/shared/api/supabase";
import { useAuth } from "@/shared/auth/auth-provider";
import { AppText } from "@/shared/components/app-text";
import { Screen } from "@/shared/components/screen";
import { EmptyLedger } from "@/shared/components/state-views";
import { radii, spacing, useTenantlyColors } from "@/shared/theme/tokens";
export default function NotificationsRoute() {
  const { status } = useAuth();
  if (status === "unconfigured")
    return <Redirect href={"/configuration-required" as never} />;
  if (status === "restoring") return null;
  if (status === "unauthenticated") return <Redirect href="/(auth)/login" />;
  return <NotificationsScreen />;
}

function NotificationsScreen() {
  const { session } = useAuth();
  const colors = useTenantlyColors();
  const cache = useQueryClient();
  const query = useQuery({
    queryKey: ["notifications", session?.userId],
    queryFn: async () => {
      const { data, error } = await getSupabaseClient()
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!session,
  });
  async function markRead(id: string) {
    const { error } = await getSupabaseClient()
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    await cache.invalidateQueries({
      queryKey: ["notifications", session?.userId],
    });
  }
  return (
    <Screen>
      <View style={s.header}>
        <AppText variant="heading">Notifications</AppText>
        <AppText muted>
          Payment decisions, notices, and complaint updates.
        </AppText>
      </View>
      {!query.isLoading && !query.data?.length ? (
        <EmptyLedger
          title="No new notifications"
          body="Payment decisions, notice updates, and request changes will appear here."
        />
      ) : null}
      {query.data?.map((item) => (
        <Pressable
          key={item.id}
          accessibilityRole="button"
          onPress={() => void markRead(item.id)}
          style={[
            s.item,
            {
              borderColor: colors.border,
              backgroundColor: item.read_at
                ? colors.surface
                : colors.primarySoft,
            },
          ]}
        >
          <AppText variant="label">{item.title}</AppText>
          <AppText muted>{item.body}</AppText>
          <AppText variant="caption" muted>
            {item.read_at ? "Read" : "Tap to mark read"}
          </AppText>
        </Pressable>
      ))}
    </Screen>
  );
}
const s = StyleSheet.create({
  header: { gap: 5, paddingVertical: spacing.lg },
  item: {
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.card,
    gap: 4,
    marginBottom: 8,
  },
});
