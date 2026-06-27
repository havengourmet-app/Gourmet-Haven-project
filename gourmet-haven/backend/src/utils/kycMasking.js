// Aadhaar and PAN are no longer stored in full at all (see migration
// 0012_kyc_mask_at_rest.sql) — only their last 4 characters ever exist in the
// database, so there is nothing left to mask/reveal for those two fields;
// admins verify the full number visually against the uploaded document
// instead. Driving license / FSSAI license / Gig Act UID are still stored in
// full and go through the same masked-by-default + logged-reveal flow.

const MASKABLE_FIELDS = new Set([
  "driving_license_number",
  "restaurant_license_number",
  "gig_act_uid"
]);

const LAST4_DISPLAY_FIELDS = new Set(["aadhaar_last4", "pan_last4"]);

function maskValue(value) {
  if (!value || typeof value !== "string") {
    return value ?? null;
  }

  const visible = value.slice(-4);
  const hiddenLength = Math.max(value.length - 4, 0);

  return `${"•".repeat(hiddenLength)}${visible}`;
}

function formatLast4Display(value) {
  if (!value) return null;
  return `•••• ${value}`;
}

// Returns a shallow copy of a kyc_submissions row with maskable fields
// replaced by their masked form, and the last4-only fields formatted for
// display. Document URLs are intentionally left as-is — see adminController
// for how those are gated separately.
export function maskKycSubmission(row) {
  if (!row) return row;

  const masked = { ...row };

  for (const field of MASKABLE_FIELDS) {
    if (field in masked) {
      masked[field] = maskValue(masked[field]);
    }
  }

  for (const field of LAST4_DISPLAY_FIELDS) {
    if (field in masked) {
      masked[field] = formatLast4Display(masked[field]);
    }
  }

  return masked;
}

export function isMaskableField(fieldName) {
  return MASKABLE_FIELDS.has(fieldName);
}

export { MASKABLE_FIELDS };