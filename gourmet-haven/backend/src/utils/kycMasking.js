// Masks sensitive identifiers so only the last 4 characters are ever sent to
// the client by default. The full value is only returned by a dedicated
// reveal endpoint, and every reveal is logged (see kycController.revealField).

const MASKABLE_FIELDS = new Set([
  "aadhaar_number",
  "pan_number",
  "driving_license_number",
  "restaurant_license_number",
  "gig_act_uid"
]);

function maskValue(value) {
  if (!value || typeof value !== "string") {
    return value ?? null;
  }

  const visible = value.slice(-4);
  const hiddenLength = Math.max(value.length - 4, 0);

  return `${"•".repeat(hiddenLength)}${visible}`;
}

// Returns a shallow copy of a kyc_submissions row with maskable fields
// replaced by their masked form. Document URLs are intentionally left as-is
// here — see kycController for how those are gated separately.
export function maskKycSubmission(row) {
  if (!row) return row;

  const masked = { ...row };

  for (const field of MASKABLE_FIELDS) {
    if (field in masked) {
      masked[field] = maskValue(masked[field]);
    }
  }

  return masked;
}

export function isMaskableField(fieldName) {
  return MASKABLE_FIELDS.has(fieldName);
}

export { MASKABLE_FIELDS };