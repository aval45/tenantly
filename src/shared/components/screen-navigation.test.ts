import {
  normalizeRoutePath,
  getRoleGroup,
  isPrimaryRoute,
  shouldShowTaskbar,
  getScreenDestination,
} from "./screen-navigation";

describe("screen-navigation", () => {
  describe("normalizeRoutePath", () => {
    it("strips route group prefixes", () => {
      expect(normalizeRoutePath("/(owner)/properties")).toBe("/properties");
      expect(normalizeRoutePath("/(tenant)/payments")).toBe("/payments");
      expect(normalizeRoutePath("/(staff)/tasks")).toBe("/tasks");
      expect(normalizeRoutePath("/(auth)/login")).toBe("/login");
      expect(normalizeRoutePath("/(owner)")).toBe("/");
    });

    it("returns unmodified path if no group prefix", () => {
      expect(normalizeRoutePath("/properties")).toBe("/properties");
      expect(normalizeRoutePath("/profile")).toBe("/profile");
    });
  });

  describe("getRoleGroup", () => {
    it("returns correct group per role", () => {
      expect(getRoleGroup("owner")).toBe("/(owner)");
      expect(getRoleGroup("manager")).toBe("/(owner)");
      expect(getRoleGroup("tenant")).toBe("/(tenant)");
      expect(getRoleGroup("maintenance_staff")).toBe("/(staff)");
      expect(getRoleGroup(null)).toBe("/(owner)");
    });
  });

  describe("isPrimaryRoute", () => {
    it("identifies primary tab routes with and without group prefixes", () => {
      expect(isPrimaryRoute("/")).toBe(true);
      expect(isPrimaryRoute("/properties")).toBe(true);
      expect(isPrimaryRoute("/(owner)/properties")).toBe(true);
      expect(isPrimaryRoute("/rent")).toBe(true);
      expect(isPrimaryRoute("/(owner)/rent")).toBe(true);
      expect(isPrimaryRoute("/more")).toBe(true);
      expect(isPrimaryRoute("/(owner)/more")).toBe(true);
      expect(isPrimaryRoute("/(tenant)/payments")).toBe(true);
      expect(isPrimaryRoute("/(tenant)/requests")).toBe(true);
      expect(isPrimaryRoute("/(staff)/tasks")).toBe(true);
    });

    it("returns false for secondary/detail/setup screens", () => {
      expect(isPrimaryRoute("/property-setup")).toBe(false);
      expect(isPrimaryRoute("/(owner)/property-setup")).toBe(false);
      expect(isPrimaryRoute("/(owner)/property/prop-1")).toBe(false);
      expect(isPrimaryRoute("/(owner)/resident/res-1")).toBe(false);
      expect(isPrimaryRoute("/(owner)/complaint/c-1")).toBe(false);
      expect(isPrimaryRoute("/(tenant)/complaint/c-1")).toBe(false);
      expect(isPrimaryRoute("/(owner)/invoice/inv-1")).toBe(false);
      expect(isPrimaryRoute("/profile")).toBe(false);
    });
  });

  describe("shouldShowTaskbar", () => {
    it("returns true for global routes", () => {
      expect(shouldShowTaskbar("/profile")).toBe(true);
      expect(shouldShowTaskbar("/organizations")).toBe(true);
      expect(shouldShowTaskbar("/notifications")).toBe(true);
      expect(shouldShowTaskbar("/(owner)/notifications")).toBe(true);
    });

    it("returns false for regular routes", () => {
      expect(shouldShowTaskbar("/properties")).toBe(false);
      expect(shouldShowTaskbar("/rent")).toBe(false);
    });
  });

  describe("getScreenDestination", () => {
    it("returns correct destinations for owner sub-pages", () => {
      expect(getScreenDestination("/property-setup", "owner")).toEqual({
        href: "/(owner)/properties",
        label: "Properties",
      });
      expect(getScreenDestination("/(owner)/property/123", "owner")).toEqual({
        href: "/(owner)/properties",
        label: "Properties",
      });
      expect(getScreenDestination("/resident-setup", "owner")).toEqual({
        href: "/(owner)/residents",
        label: "Residents",
      });
      expect(getScreenDestination("/(owner)/resident/123", "owner")).toEqual({
        href: "/(owner)/residents",
        label: "Residents",
      });
      expect(getScreenDestination("/(owner)/payment/123", "owner")).toEqual({
        href: "/(owner)/rent",
        label: "Rent",
      });
      expect(getScreenDestination("/reports", "owner")).toEqual({
        href: "/(owner)/more",
        label: "More",
      });
      expect(getScreenDestination("/operations", "owner")).toEqual({
        href: "/(owner)/more",
        label: "More",
      });
    });

    it("returns role-specific destination for invoices and complaints", () => {
      expect(getScreenDestination("/(tenant)/invoice/123", "tenant")).toEqual({
        href: "/(tenant)/payments",
        label: "Payments",
      });
      expect(getScreenDestination("/(owner)/invoice/123", "owner")).toEqual({
        href: "/(owner)/rent",
        label: "Rent",
      });
      expect(getScreenDestination("/(tenant)/complaint/123", "tenant")).toEqual({
        href: "/(tenant)/requests",
        label: "Requests",
      });
      expect(getScreenDestination("/(owner)/complaint/123", "owner")).toEqual({
        href: "/(owner)/complaints",
        label: "Complaints",
      });
    });
  });
});
