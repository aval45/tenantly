import { formatDate, localDateISO, localMonthStartISO } from "./date";

describe("local date helpers", () => {
  it("does not convert local calendar dates through UTC", () => {
    const date = new Date(2026, 7, 14, 23, 30);
    expect(localDateISO(date)).toBe("2026-08-14");
    expect(localMonthStartISO(date)).toBe("2026-08-01");
  });

  it("formats both date-only values and timestamps", () => {
    expect(formatDate("2026-08-14")).toContain("2026");
    expect(formatDate("2026-08-14T10:30:00.000Z")).toContain("2026");
  });
});
