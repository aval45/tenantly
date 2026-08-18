import { Link, type Href } from "expo-router";
import type { ReactNode } from "react";

import { useTenantlyColors } from "@/shared/theme/tokens";

export function AuthLink({
  href,
  children,
}: {
  href: Href;
  children: ReactNode;
}) {
  const colors = useTenantlyColors();

  return (
    <Link
      href={href}
      style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}
    >
      {children}
    </Link>
  );
}
