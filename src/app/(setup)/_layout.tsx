import { Redirect, Stack } from "expo-router";

import { useAuth } from "@/shared/auth/auth-provider";
import { motion, useNavigationAnimation } from "@/shared/theme/motion";

export default function SetupLayout() {
  const { status, activeMembership } = useAuth();
  const navigationAnimation = useNavigationAnimation();
  if (status === "unauthenticated") return <Redirect href="/(auth)/login" />;
  if (status === "error") return <Redirect href="/" />;
  if (activeMembership) return <Redirect href="/" />;
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: navigationAnimation,
        animationDuration: motion.duration,
      }}
    />
  );
}
