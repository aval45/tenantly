import { toUserMessage } from "./to-user-message";

describe("toUserMessage", () => {
  it("maps database codes without exposing backend text", () => {
    expect(toUserMessage(new Error("P0001: payment_proof_required"))).toBe(
      "Add a payment proof image for this payment method.",
    );
  });

  it("uses a safe fallback for unknown failures", () => {
    expect(
      toUserMessage(new Error("database host internals"), "Try again later."),
    ).toBe("Try again later.");
  });
});
