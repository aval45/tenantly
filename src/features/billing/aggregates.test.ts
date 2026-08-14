import { buildPaymentAllocations, summarizeInvoices } from "./service";

describe("billing aggregates", () => {
  it("sums every outstanding invoice and picks the earliest actionable due date", () => {
    const summary = summarizeInvoices([
      { id: "later", due_date: "2026-09-05", balance_paise: 6000 },
      { id: "paid", due_date: "2026-07-05", balance_paise: 0 },
      { id: "earlier", due_date: "2026-08-05", balance_paise: 4000 },
    ]);
    expect(summary.outstandingPaise).toBe(10000);
    expect(summary.nextInvoice?.id).toBe("earlier");
  });

  it("allocates the payment once across balances", () => {
    expect(
      buildPaymentAllocations(7000, [
        { id: "one", balance_paise: 4000 },
        { id: "two", balance_paise: 5000 },
      ]),
    ).toEqual({
      allocations: [
        { invoiceId: "one", amountPaise: 4000 },
        { invoiceId: "two", amountPaise: 3000 },
      ],
      remainingPaise: 0,
    });
  });
});
