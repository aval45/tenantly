export type OrganizationRole =
  "owner" | "manager" | "tenant" | "maintenance_staff";

export type Membership = {
  id: string;
  organizationId: string;
  organizationName: string;
  role: OrganizationRole;
  status: "active";
};

export type AppSession = {
  userId: string;
  profile: {
    fullName: string;
    email: string;
  };
  memberships: Membership[];
  activeOrganizationId: string | null;
};
