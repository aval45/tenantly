import { createPropertyCommandSchema } from "./service";
describe("property validation", () => {
  test("normalizes a complete Indian property address", () => {
    expect(
      createPropertyCommandSchema.parse({
        name: " Maple House ",
        addressLine1: " 12 MG Road ",
        city: " Bengaluru ",
        state: " Karnataka ",
        postalCode: "560001",
        propertyType: "pg",
      }),
    ).toEqual({
      name: "Maple House",
      addressLine1: "12 MG Road",
      city: "Bengaluru",
      state: "Karnataka",
      postalCode: "560001",
      propertyType: "pg",
    });
  });
});
