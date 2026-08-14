const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatMoney(paise: number) {
  if (!Number.isSafeInteger(paise)) {
    throw new Error("Money must be represented as safe integer paise.");
  }
  return inrFormatter.format(paise / 100);
}

export function formatCompactMoney(paise: number) {
  if (!Number.isSafeInteger(paise)) {
    throw new Error("Money must be represented as safe integer paise.");
  }
  const rupees = paise / 100;
  if (Math.abs(rupees) >= 100_000) {
    return `₹${(rupees / 100_000).toFixed(2)}L`;
  }
  if (Math.abs(rupees) >= 1_000) {
    return `₹${(rupees / 1_000).toFixed(1)}K`;
  }
  return formatMoney(paise);
}
