import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { Platform } from "react-native";
import { getSupabaseClient } from "@/shared/api/supabase";
import { useAuth } from "@/shared/auth/auth-provider";

export function PushRegistration() {
  const { session } = useAuth();
  useEffect(() => {
    if (!session) return;
    const projectId = Constants.easConfig?.projectId;
    if (!projectId) return;
    void (async () => {
      if (Platform.OS === "android")
        await Notifications.setNotificationChannelAsync("default", {
          name: "Tenantly",
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      const current = await Notifications.getPermissionsAsync();
      const permission = current.granted
        ? current
        : await Notifications.requestPermissionsAsync();
      if (!permission.granted) return;
      const token = (await Notifications.getExpoPushTokenAsync({ projectId }))
        .data;
      const { error } = await getSupabaseClient()
        .from("push_devices")
        .upsert(
          {
            profile_id: session.userId,
            expo_push_token: token,
            platform: Platform.OS === "ios" ? "ios" : "android",
            app_version: Constants.expoConfig?.version ?? "1.0.0",
            last_seen_at: new Date().toISOString(),
            enabled: true,
          },
          { onConflict: "expo_push_token" },
        );
      if (error) throw error;
    })().catch(() => undefined);
  }, [session]);
  return null;
}
