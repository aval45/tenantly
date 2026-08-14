export type OrganizationRole =
  "owner" | "manager" | "tenant" | "maintenance_staff";

export type Membership = {
  id: string;
  organizationId: string;
  organizationName: string;
  role: OrganizationRole;
  status: "active";
  assignedPropertyIds: string[];
};

export type AppCapabilities = {
  manageOrganization: boolean;
  manageMembers: boolean;
  createProperties: boolean;
  operateProperties: boolean;
  approvePayments: boolean;
  publishOrganizationNotices: boolean;
};

export const noCapabilities: AppCapabilities = {
  manageOrganization: false,
  manageMembers: false,
  createProperties: false,
  operateProperties: false,
  approvePayments: false,
  publishOrganizationNotices: false,
};

export function capabilitiesFor(
  role: OrganizationRole | undefined,
): AppCapabilities {
  if (role === "owner")
    return {
      manageOrganization: true,
      manageMembers: true,
      createProperties: true,
      operateProperties: true,
      approvePayments: true,
      publishOrganizationNotices: true,
    };
  if (role === "manager")
    return {
      ...noCapabilities,
      operateProperties: true,
      approvePayments: true,
    };
  return noCapabilities;
}

export type AppSession = {
  userId: string;
  profile: {
    fullName: string;
    email: string;
    phone: string | null;
  };
  memberships: Membership[];
  activeOrganizationId: string | null;
  capabilities: AppCapabilities;
};
