const messages: Record<string, string> = {
  forbidden: "You do not have permission to perform this action.",
  invitation_email_mismatch:
    "Sign in with the email address that received this invitation.",
  verified_email_required:
    "Verify your email address before accepting this invitation.",
  invitation_invalid_or_expired:
    "This invitation is invalid, expired, or already used.",
  active_invitation_exists:
    "An active invitation already exists for this email.",
  resident_unavailable:
    "This resident is already linked or no longer available.",
  invalid_payment_amount:
    "Enter an amount no greater than the outstanding balance.",
  payment_proof_required: "Add a payment proof image for this payment method.",
  allocation_total_mismatch:
    "The full payment must be allocated before approval.",
  room_at_capacity: "This room is already at capacity.",
  bed_required_or_unavailable: "Choose an available bed.",
  last_owner_required:
    "Every organization must keep at least one active owner.",
};

export function toUserMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
) {
  if (!(error instanceof Error)) return fallback;
  const match = Object.entries(messages).find(([code]) =>
    error.message.includes(code),
  );
  return match?.[1] ?? fallback;
}
