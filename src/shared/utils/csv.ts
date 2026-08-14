export function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function buildCsv(rows: unknown[][]) {
  return rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n") + "\r\n";
}
