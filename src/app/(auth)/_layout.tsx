import { Redirect, Stack, usePathname } from "expo-router";

import { useAuth } from "@/shared/auth/auth-provider";
import { motion, useNavigationAnimation } from "@/shared/theme/motion";

export default function AuthLayout() {
  const { status } = useAuth();
  const pathname = usePathname();
  const navigationAnimation = useNavigationAnimation();
  if (status === "authenticated" && pathname !== "/reset-password")
    return <Redirect href="/" />;
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
