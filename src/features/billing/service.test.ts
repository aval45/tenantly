import { paymentSubmissionSchema } from "./service";
describe("payment submission validation", () => {
  test("keeps money in integer paise and requires an idempotency key", () => {
    expect(
      paymentSubmissionSchema.parse({
        invoiceId: "11111111-1111-4111-8111-111111111111",
        amountPaise: 1532000,
        method: "upi",
        paidOn: "2026-08-04",
        reference: "UPI-42",
        idempotencyKey: "payment-request-42",
      }).amountPaise,
    ).toBe(1532000);
    expect(() =>
      paymentSubmissionSchema.parse({
        invoiceId: "11111111-1111-4111-8111-111111111111",
        amountPaise: 12.5,
        method: "upi",
        paidOn: "2026-08-04",
        idempotencyKey: "short",
      }),
    ).toThrow();
  });
});
