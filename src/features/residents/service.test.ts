import { createResidentCommandSchema } from "./service";
describe("resident validation", () => {
  test("normalizes a resident and validates contact details", () => {
    expect(
      createResidentCommandSchema.parse({
        organizationId: "11111111-1111-4111-8111-111111111111",
        fullName: " Asha Rao ",
        phone: "+919876543210",
      }).fullName,
    ).toBe("Asha Rao");
    expect(() =>
      createResidentCommandSchema.parse({
        organizationId: "bad",
        fullName: "A",
        phone: "123",
      }),
    ).toThrow();
  });
});
