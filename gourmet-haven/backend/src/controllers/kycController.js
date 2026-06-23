import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "../config/supabaseClient.js";
import { maskKycSubmission } from "../utils/kycMasking.js";
import { requireText, optionalText } from "../utils/validation.js";

const ROLE_REQUIRED_FIELDS = {
  delivery: ["driving_license_number"],
  owner: ["restaurant_license_number"]
};

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

  return {
    profile_id: profileId,
    full_legal_name: requireText(body.full_legal_name, "full_legal_name", { maxLength: 160 }),
    date_of_birth: requireText(body.date_of_birth, "date_of_birth", { maxLength: 10 }),
    mobile_number: requireText(body.mobile_number, "mobile_number", { maxLength: 20 }),
    home_address: requireText(body.home_address, "home_address", { maxLength: 500 }),
    aadhaar_number: requireText(body.aadhaar_number, "aadhaar_number", { minLength: 12, maxLength: 12 }),
    pan_number: requireText(body.pan_number, "pan_number", { minLength: 10, maxLength: 10 }),
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

  // The applicant only ever sees their own masked view too — this keeps the
  // raw values out of network responses and browser memory entirely, even
  // for the person it belongs to. They typed it in; they don't need to see
  // it echoed back in full afterward.
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
    // Resubmission after rejection — overwrite the prior submission and
    // reset it back to pending_review.
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