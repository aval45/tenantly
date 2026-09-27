import { invitationSchema } from "./service";

describe("invitationSchema", () => {
  const orgId = "11111111-1111-4111-8111-111111111111";
  const residentId = "22222222-2222-4222-8222-222222222222";
  const propertyId = "33333333-3333-4333-8333-333333333333";

  test("validates tenant invitation successfully", () => {
    const result = invitationSchema.parse({
      organizationId: orgId,
      residentId,
      role: "tenant",
      email: "  resident@example.com  ",
    });

    expect(result.email).toBe("resident@example.com");
    expect(result.role).toBe("tenant");
    expect(result.propertyIds).toEqual([]);
  });

  test("validates operator invitation successfully", () => {
    const result = invitationSchema.parse({
      organizationId: orgId,
      role: "manager",
      email: "manager@example.com",
      propertyIds: [propertyId],
    });

    expect(result.role).toBe("manager");
    expect(result.propertyIds).toEqual([propertyId]);
  });

  test("rejects invalid email formats", () => {
    expect(() =>
      invitationSchema.parse({
        organizationId: orgId,
        residentId,
        role: "tenant",
        email: "not-an-email",
      }),
    ).toThrow();
  });

  test("rejects tenant invitation without residentId", () => {
    expect(() =>
      invitationSchema.parse({
        organizationId: orgId,
        role: "tenant",
        email: "resident@example.com",
      }),
    ).toThrow(/Tenant invitations require a resident/);
  });

  test("rejects operator invitation without properties", () => {
    expect(() =>
      invitationSchema.parse({
        organizationId: orgId,
        role: "manager",
        email: "manager@example.com",
        propertyIds: [],
      }),
    ).toThrow(/operator invitations require assigned properties/);
  });
});
