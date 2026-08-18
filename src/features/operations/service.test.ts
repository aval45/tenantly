import { expenseSchema } from "./service";

const validExpense = {
  organizationId: "11111111-1111-4111-8111-111111111111",
  propertyId: "22222222-2222-4222-8222-222222222222",
  category: "maintenance" as const,
  description: "Water pump repair",
  amountPaise: 450000,
  incurredOn: "2026-08-18",
};

describe("expenseSchema", () => {
  it("accepts a valid audited expense command", () => {
    expect(expenseSchema.parse(validExpense)).toMatchObject(validExpense);
  });

  it("rejects non-positive money and weak descriptions", () => {
    expect(() =>
      expenseSchema.parse({ ...validExpense, amountPaise: 0 }),
    ).toThrow();
    expect(() =>
      expenseSchema.parse({ ...validExpense, description: "No" }),
    ).toThrow();
  });
});
