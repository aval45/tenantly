export function localDateISO(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function localMonthStartISO(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

export function formatDate(
  value: string | Date,
  options?: Intl.DateTimeFormatOptions,
) {
  const date =
    value instanceof Date
      ? value
      : new Date(value.includes("T") ? value : `${value}T00:00:00`);
  return new Intl.DateTimeFormat(
    "en-IN",
    options ?? {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  ).format(date);
}

export function currentMonthLabel(date = new Date()) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(date);
}
