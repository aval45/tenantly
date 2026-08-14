import { Redirect } from "expo-router";

import { useAuth } from "@/shared/auth/auth-provider";

export default function LaunchRoute() {
  const { status, activeMembership } = useAuth();
  if (status === "unconfigured")
    return <Redirect href={"/configuration-required" as never} />;
  if (status === "restoring") return null;
  if (status === "unauthenticated") return <Redirect href="/(auth)/login" />;
  if (!activeMembership)
    return <Redirect href={"/(setup)/organization" as never} />;
  if (activeMembership?.role === "owner") return <Redirect href="/(owner)" />;
  if (activeMembership?.role === "tenant")
    return <Redirect href={"/(tenant)" as never} />;
  return <Redirect href="/unauthorized" />;
}
