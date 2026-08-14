import { createRoomCommandSchema } from "./rooms";
describe("room validation", () => {
  test("coerces a bounded bed count and validates paise amounts", () => {
    expect(
      createRoomCommandSchema.parse({
        organizationId: "11111111-1111-4111-8111-111111111111",
        propertyId: "22222222-2222-4222-8222-222222222222",
        code: " A-101 ",
        bedCount: "2",
        monthlyRentPaise: 1200000,
        depositPaise: 2400000,
      }),
    ).toMatchObject({ code: "A-101", bedCount: 2 });
  });
});
