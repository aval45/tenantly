import { capabilitiesFor, noCapabilities } from "./types";

describe("capability mapping", () => {
  it("gives managers operational but not administrative capabilities", () => {
    expect(capabilitiesFor("manager")).toMatchObject({
      operateProperties: true,
      approvePayments: true,
      manageOrganization: false,
      manageMembers: false,
      createProperties: false,
      publishOrganizationNotices: false,
    });
  });

  it("keeps tenants unprivileged", () => {
    expect(capabilitiesFor("tenant")).toEqual(noCapabilities);
  });
});
