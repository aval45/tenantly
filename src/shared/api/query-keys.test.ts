import { queryKeys } from "./query-keys";

describe("queryKeys", () => {
  it("isolates organization entities by user and organization", () => {
    expect(queryKeys.invoices("user-a", "org-a")).not.toEqual(
      queryKeys.invoices("user-b", "org-a"),
    );
    expect(queryKeys.invoices("user-a", "org-a")).not.toEqual(
      queryKeys.invoices("user-a", "org-b"),
    );
  });

  it("includes entity identity for details", () => {
    expect(queryKeys.payment("user-a", "org-a", "payment-a")).toEqual([
      "tenantly",
      "payment",
      "user-a",
      "org-a",
      "payment-a",
    ]);
  });
});
