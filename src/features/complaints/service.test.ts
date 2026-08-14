import { complaintSchema } from "./service";
describe("complaint validation", () => {
  test("accepts a complete tenant complaint and rejects an empty description", () => {
    const base = {
      organizationId: "11111111-1111-4111-8111-111111111111",
      residentId: "22222222-2222-4222-8222-222222222222",
      propertyId: "33333333-3333-4333-8333-333333333333",
      category: "plumbing",
      title: "Water leak",
      priority: "high" as const,
    };
    expect(
      complaintSchema.parse({
        ...base,
        description: "Water is leaking near the washroom.",
      }).priority,
    ).toBe("high");
    expect(() => complaintSchema.parse({ ...base, description: "" })).toThrow();
  });
});
