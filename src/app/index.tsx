import { Redirect } from "expo-router";
import { View } from "react-native";

import { useAuth } from "@/shared/auth/auth-provider";
import { StateView } from "@/shared/components/state-views";

export default function LaunchRoute() {
  const { status, activeMembership, restoreError, retryRestore } = useAuth();
  if (status === "unconfigured")
    return <Redirect href={"/configuration-required" as never} />;
  if (status === "restoring") return null;
  if (status === "error")
    return (
      <View style={{ flex: 1 }}>
        <StateView
          kind="error"
          title="Session unavailable"
          body={restoreError ?? "Check your connection and try again."}
          actionLabel="Retry"
          onAction={() => void retryRestore()}
        />
      </View>
    );
  if (status === "unauthenticated") return <Redirect href="/(auth)/login" />;
  if (!activeMembership)
    return <Redirect href={"/(setup)/organization" as never} />;
  if (
    activeMembership?.role === "owner" ||
    activeMembership?.role === "manager"
  )
    return <Redirect href="/(owner)" />;
  if (activeMembership?.role === "tenant")
    return <Redirect href={"/(tenant)" as never} />;
  return <Redirect href="/unauthorized" />;
}
