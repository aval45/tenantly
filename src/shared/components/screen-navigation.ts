import type { MembershipRole } from "@/shared/api/database.types";

export const PRIMARY_ROUTES = new Set([
  "/",
  "/properties",
  "/rent",
  "/more",
  "/payments",
  "/requests",
  "/tasks",
  "/(owner)",
  "/(owner)/properties",
  "/(owner)/rent",
  "/(owner)/more",
  "/(tenant)",
  "/(tenant)/payments",
  "/(tenant)/requests",
  "/(tenant)/more",
  "/(staff)",
  "/(staff)/tasks",
  "/(staff)/more",
]);

export const GLOBAL_TASKBAR_ROUTES = [
  "/profile",
  "/organizations",
  "/notifications",
];

export function normalizeRoutePath(pathname: string): string {
  return pathname.replace(/^\/\((owner|tenant|staff|auth|setup)\)/, "") || "/";
}

export function getRoleGroup(role?: MembershipRole | null): string {
  if (role === "tenant") return "/(tenant)";
  if (role === "maintenance_staff") return "/(staff)";
  return "/(owner)";
}

export function isPrimaryRoute(pathname: string): boolean {
  const normalized = normalizeRoutePath(pathname);
  return (
    PRIMARY_ROUTES.has(pathname) ||
    PRIMARY_ROUTES.has(normalized) ||
    normalized === "/"
  );
}

export function shouldShowTaskbar(pathname: string): boolean {
  const normalized = normalizeRoutePath(pathname);
  return (
    GLOBAL_TASKBAR_ROUTES.includes(pathname) ||
    GLOBAL_TASKBAR_ROUTES.includes(normalized)
  );
}

export function getScreenDestination(
  pathname: string,
  role?: MembershipRole | null,
): { href: string; label: string } | undefined {
  const normalizedPath = normalizeRoutePath(pathname);
  const roleGroup = getRoleGroup(role);

  if (normalizedPath === "/profile" || normalizedPath === "/organizations") {
    return { href: `${roleGroup}/more`, label: "More" };
  }
  if (normalizedPath === "/notifications") {
    return { href: roleGroup, label: "Home" };
  }
  if (normalizedPath === "/residents") {
    return { href: "/(owner)/more", label: "More" };
  }
  if (normalizedPath === "/complaints") {
    return { href: "/(owner)/more", label: "More" };
  }
  if (normalizedPath === "/notices") {
    return { href: `${roleGroup}/more`, label: "More" };
  }
  if (
    normalizedPath === "/reports" ||
    normalizedPath === "/operations" ||
    normalizedPath === "/invite"
  ) {
    return { href: "/(owner)/more", label: "More" };
  }
  if (
    normalizedPath === "/resident-setup" ||
    normalizedPath === "/tenancy-setup" ||
    normalizedPath === "/occupancy-manage" ||
    normalizedPath.startsWith("/resident/")
  ) {
    return { href: "/(owner)/residents", label: "Residents" };
  }
  if (
    normalizedPath === "/property-setup" ||
    normalizedPath === "/room-setup" ||
    normalizedPath.startsWith("/property/")
  ) {
    return { href: "/(owner)/properties", label: "Properties" };
  }
  if (normalizedPath === "/payment-proof") {
    return { href: "/(tenant)/payments", label: "Payments" };
  }
  if (normalizedPath.startsWith("/payment/")) {
    return { href: "/(owner)/rent", label: "Rent" };
  }
  if (normalizedPath.startsWith("/invoice/")) {
    return role === "tenant"
      ? { href: "/(tenant)/payments", label: "Payments" }
      : { href: "/(owner)/rent", label: "Rent" };
  }
  if (normalizedPath.startsWith("/complaint/")) {
    return role === "tenant"
      ? { href: "/(tenant)/requests", label: "Requests" }
      : { href: "/(owner)/complaints", label: "Complaints" };
  }
  return undefined;
}
