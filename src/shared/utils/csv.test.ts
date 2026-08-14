import { buildCsv, escapeCsv } from "./csv";

describe("CSV helpers", () => {
  it("escapes commas, quotes, and line endings", () => {
    expect(escapeCsv('A, "quoted"\nvalue')).toBe('"A, ""quoted""\nvalue"');
  });

  it("uses RFC-style CRLF rows and a final line ending", () => {
    expect(
      buildCsv([
        ["name", "amount"],
        ["A", 10],
      ]),
    ).toBe("name,amount\r\nA,10\r\n");
  });
});
