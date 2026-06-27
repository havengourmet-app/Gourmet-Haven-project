import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "../config/supabaseClient.js";
import { maskKycSubmission } from "../utils/kycMasking.js";
import { optionalText, requirePattern, requireText } from "../utils/validation.js";

const ROLE_REQUIRED_FIELDS = {
  delivery: ["driving_license_number"],
  owner: ["restaurant_license_number"]
};

const AADHAAR_PATTERN = /^\d{12}$/;
const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

function assertRoleSpecificFields(role, body) {
  const required = ROLE_REQUIRED_FIELDS[role] || [];

  for (const field of required) {
    if (!body[field] || !String(body[field]).trim()) {
      const error = new Error(`${field} is required for the ${role} role.`);
      error.statusCode = 400;
      throw error;
    }
  }
}

function buildSubmissionPayload(profileId, role, body) {
  assertRoleSpecificFields(role, body);

  // Aadhaar/PAN are validated for format here and immediately reduced to
  // their last 4 characters before this payload is persisted anywhere. The
  // full values exist only for the lifetime of this request — they are
  // never written to the database (see migration 0012). Admins verify the
  // full number visually against the uploaded document instead.
  const panRaw = typeof body.pan_number === "string" ? body.pan_number.toUpperCase() : body.pan_number;

  const aadhaarNumber = requirePattern(
    body.aadhaar_number,
    "aadhaar_number",
    AADHAAR_PATTERN,
    "must be exactly 12 digits"
  );
  const panNumber = requirePattern(
    panRaw,
    "pan_number",
    PAN_PATTERN,
    "must be a valid 10-character PAN, e.g. ABCDE1234F"
  );

  return {
    profile_id: profileId,
    full_legal_name: requireText(body.full_legal_name, "full_legal_name", { maxLength: 160 }),
    date_of_birth: requireText(body.date_of_birth, "date_of_birth", { maxLength: 10 }),
    mobile_number: requireText(body.mobile_number, "mobile_number", { maxLength: 20 }),
    home_address: requireText(body.home_address, "home_address", { maxLength: 500 }),
    aadhaar_last4: aadhaarNumber.slice(-4),
    pan_last4: panNumber.slice(-4),
    driving_license_number: optionalText(body.driving_license_number, "driving_license_number", { maxLength: 40 }) || null,
    restaurant_license_number: optionalText(body.restaurant_license_number, "restaurant_license_number", { maxLength: 40 }) || null,
    gig_act_uid: optionalText(body.gig_act_uid, "gig_act_uid", { maxLength: 40 }) || null,
    aadhaar_doc_url: body.aadhaar_doc_url || null,
    pan_doc_url: body.pan_doc_url || null,
    license_doc_url: body.license_doc_url || null,
    verification_provider: "manual",
    verification_status: "pending_review",
    reviewed_by: null,
    reviewed_at: null
  };
}

export async function getMyKycSubmission(req, res) {
  if (!supabaseAdmin) {
    return res.json({ success: true, data: null });
  }

  const { data, error } = await supabaseAdmin
    .from("kyc_submissions")
    .select("*")
    .eq("profile_id", req.user.id)
    .maybeSingle();

  if (error) throw error;

  // The applicant only ever sees their own masked view too — raw values
  // never leave the database at all for Aadhaar/PAN (only last4 is stored),
  // and license/Gig UID fields stay masked here just like for admins.
  res.json({ success: true, data: maskKycSubmission(data) });
}

export async function submitMyKycSubmission(req, res) {
  const role = req.profile?.role || req.user?.user_metadata?.role;

  if (!["owner", "delivery"].includes(role)) {
    return res.status(400).json({
      success: false,
      message: "Only owner and delivery accounts require KYC submission."
    });
  }

  const payload = buildSubmissionPayload(req.user.id, role, req.body);

  if (!supabaseAdmin) {
    return res.status(201).json({
      success: true,
      data: maskKycSubmission({ id: randomUUID(), ...payload })
    });
  }

  const { data: existing } = await supabaseAdmin
    .from("kyc_submissions")
    .select("id, verification_status")
    .eq("profile_id", req.user.id)
    .maybeSingle();

  if (existing && existing.verification_status === "verified") {
    return res.status(400).json({
      success: false,
      message: "This account is already verified and cannot resubmit KYC details."
    });
  }

  if (existing) {
    // Resubmission after rejection (or correction while pending) — overwrite
    // the prior submission and reset it back to pending_review.
    const { data, error } = await supabaseAdmin
      .from("kyc_submissions")
      .update(payload)
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;
    return res.json({ success: true, data: maskKycSubmission(data) });
  }

  const { data, error } = await supabaseAdmin
    .from("kyc_submissions")
    .insert({ id: randomUUID(), ...payload })
    .select()
    .single();

  if (error) throw error;

  res.status(201).json({ success: true, data: maskKycSubmission(data) });
}