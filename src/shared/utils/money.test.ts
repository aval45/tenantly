import { formatCompactMoney, formatMoney } from "./money";

describe("money formatting", () => {
  it("formats integer paise as INR", () => {
    expect(formatMoney(1_250_000)).toBe("₹12,500");
  });

  it("uses Indian compact units without changing the stored value", () => {
    expect(formatCompactMoney(28_450_000)).toBe("₹2.85L");
    expect(formatCompactMoney(2_230_000)).toBe("₹22.3K");
  });

  it("rejects unsafe money values", () => {
    expect(() => formatMoney(12.5)).toThrow("integer paise");
  });
});
