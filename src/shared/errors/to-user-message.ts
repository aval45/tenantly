import { ZodError } from "zod";

const messages: Record<string, string> = {
  // Authorization & Permissions
  forbidden: "You do not have permission to perform this action.",
  authentication_required: "You must be signed in to perform this action.",
  last_owner_required: "Every organization must keep at least one active owner.",
  membership_role_conflict: "This user already has a role in this organization.",
  invalid_role: "The selected organization role is invalid.",

  // Invitations
  invitation_email_mismatch:
    "Sign in with the email address that received this invitation.",
  verified_email_required:
    "Verify your email address before accepting this invitation.",
  invitation_invalid_or_expired:
    "This invitation is invalid, expired, or already used.",
  active_invitation_exists:
    "An active invitation already exists for this email address.",
  valid_email_required: "Please enter a valid email address.",
  invalid_tenant_invitation: "Tenant invitations must be linked to a valid resident.",
  manager_properties_required: "Managers must be assigned to at least one property.",
  invalid_manager_property: "One or more assigned properties do not exist.",

  // Residents & Tenancies
  resident_unavailable: "This resident is already linked or no longer available.",
  room_at_capacity: "This room is already at its maximum bed capacity.",
  bed_required_or_unavailable: "Choose an available bed.",
  tenancy_required: "An active tenancy is required for this request.",
  cannot_archive_occupied_room: "Cannot archive an occupied room. Transfer or vacate residents first.",
  cannot_archive_occupied_property: "Cannot archive a property with active tenancies.",

  // Billing & Payments
  invalid_payment_amount: "Enter an amount greater than zero and no greater than the outstanding balance.",
  payment_proof_required: "Add a payment proof image for this payment method.",
  invalid_payment_proof: "The uploaded payment proof could not be verified.",
  payment_already_decided: "This payment has already been approved or rejected.",
  rejection_reason_required: "Please provide a reason for rejecting this payment (at least 3 characters).",
  invalid_allocation: "Payment allocation cannot exceed the outstanding invoice balance.",
  invalid_allocation_total: "The total payment allocation must match the recorded payment amount.",
  allocation_total_mismatch: "The full payment must be allocated before approval.",
  invoice_not_found: "The requested invoice could not be found.",
  receipts_are_immutable: "Receipts cannot be altered or deleted.",
  receipt_pdf_is_immutable: "Receipt PDF cannot be altered.",

  // Maintenance & Requests
  tenant_can_only_reopen: "Tenants can only reopen resolved or closed requests.",
  invalid_transition: "This status transition is not allowed from the current state.",
  invalid_attachment: "Attachment details are incomplete or invalid.",

  // Notices & Operations
  invalid_notice_target: "Please select valid target properties, rooms, or residents.",
  invalid_organization_name: "Please enter a valid organization name (2–120 characters).",
  invalid_organization_slug: "Please enter a valid URL slug (lowercase letters, numbers, hyphens).",
  invalid_idempotency_key: "Duplicate request detected. Please try again.",

  // Storage & Uploads
  selected_file_unreadable: "Could not read the selected file. Please choose another file.",
  image_too_large: "The image file exceeds the 10 MB limit.",
  unsupported_document_type: "Unsupported document format. Please upload a PDF, PNG, or JPEG file.",
  document_too_large: "The document file exceeds the 15 MB limit.",
  sharing_unavailable: "File sharing is not supported on this device.",

  // Postgres Database Constraints
  "23505": "A record with these details already exists.",
  "23503": "The referenced record does not exist or is currently in use.",
  "23514": "One or more submitted values are invalid.",
  PGRST116: "The requested record could not be found.",

  // Supabase Auth & Network Errors
  "Invalid login credentials": "Incorrect email or password.",
  "invalid_credentials": "Incorrect email or password.",
  "User already registered": "An account with this email address already exists.",
  "over_email_send_rate_limit": "Too many emails sent. Please wait a few minutes before trying again.",
  "Email rate limit exceeded": "Too many emails sent. Please wait a few minutes before trying again.",
  "Network request failed": "Network connection error. Please check your internet connection.",
  "Failed to fetch": "Network connection error. Please check your internet connection.",
  "fetch failed": "Network connection error. Please check your internet connection.",
};

function formatZodIssue(issue: { path?: readonly unknown[] | unknown[]; message?: string }): string {
  if (issue.message && issue.message !== "Required" && issue.message !== "Invalid") {
    return issue.message;
  }
  const field = issue.path?.length ? String(issue.path[issue.path.length - 1]) : "";
  return field ? `Please enter a valid ${field}.` : "Please check your input.";
}

export function toUserMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (!error) return fallback;

  // Handle direct ZodError instance
  if (error instanceof ZodError) {
    const firstIssue = error.issues[0];
    if (firstIssue) {
      return formatZodIssue(firstIssue);
    }
  }

  // Extract raw error string or code from Error instance or Supabase/PostgREST error object
  let rawMessage = "";
  if (error instanceof Error) {
    rawMessage = error.message;
  } else if (typeof error === "object" && error !== null) {
    const obj = error as Record<string, unknown>;
    rawMessage = [
      obj.code,
      obj.message,
      obj.details,
      obj.hint,
      obj.error_description,
    ]
      .filter(Boolean)
      .map(String)
      .join(" ");
  } else if (typeof error === "string") {
    rawMessage = error;
  }

  if (!rawMessage) return fallback;

  // Try parsing stringified Zod JSON issues
  if (rawMessage.startsWith("[{") && rawMessage.endsWith("}]")) {
    try {
      const parsed = JSON.parse(rawMessage);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.message) {
        return formatZodIssue(parsed[0]);
      }
    } catch {
      // ignore JSON parse error and proceed
    }
  }

  // Check against dictionary mappings
  for (const [code, userMessage] of Object.entries(messages)) {
    if (rawMessage.includes(code)) {
      return userMessage;
    }
  }

  // If rawMessage is a single clean sentence without technical jargon, return it
  if (
    !rawMessage.includes("P000") &&
    !rawMessage.includes("Postgres") &&
    !rawMessage.includes("PGRST") &&
    !rawMessage.includes("SQLSTATE") &&
    !rawMessage.includes("column") &&
    !rawMessage.includes("relation") &&
    !rawMessage.includes("table") &&
    rawMessage.length <= 160
  ) {
    return rawMessage;
  }

  return fallback;
}
