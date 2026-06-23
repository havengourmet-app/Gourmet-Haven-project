import { supabaseAdmin } from "../config/supabaseClient.js";
import { isMaskableField, maskKycSubmission } from "../utils/kycMasking.js";

const APPROVAL_GATED_ROLES = ["owner", "delivery"];

async function attachKycSubmissions(accounts) {
  if (!accounts.length) return accounts;

  const profileIds = accounts.map((a) => a.id);
  const { data: submissions, error } = await supabaseAdmin
    .from("kyc_submissions")
    .select("*")
    .in("profile_id", profileIds);

  if (error) throw error;

  const byProfileId = new Map((submissions || []).map((s) => [s.profile_id, s]));

  return accounts.map((account) => ({
    ...account,
    kyc: byProfileId.has(account.id) ? maskKycSubmission(byProfileId.get(account.id)) : null
  }));
}

export async function listPendingAccounts(req, res) {
  if (!supabaseAdmin) {
    return res.json({ success: true, data: [] });
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, role, approval_status, created_at")
    .in("role", APPROVAL_GATED_ROLES)
    .eq("approval_status", "pending")
    .order("created_at", { ascending: true });

  if (error) throw error;

  const withKyc = await attachKycSubmissions(data || []);

  res.json({ success: true, data: withKyc });
}

export async function listAllAccounts(req, res) {
  if (!supabaseAdmin) {
    return res.json({ success: true, data: [] });
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, role, approval_status, created_at")
    .in("role", APPROVAL_GATED_ROLES)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const withKyc = await attachKycSubmissions(data || []);

  res.json({ success: true, data: withKyc });
}

// Returns the FULL unmasked value of a single field, and logs the reveal.
// This is the only path through which raw Aadhaar/PAN/license numbers ever
// leave the database after initial submission.
export async function revealKycField(req, res) {
  const { profileId, fieldName } = req.params;

  if (!isMaskableField(fieldName)) {
    return res.status(400).json({ success: false, message: "That field cannot be revealed." });
  }

  if (!supabaseAdmin) {
    return res.json({ success: true, data: { field: fieldName, value: "DEV-MODE-NOT-CONFIGURED" } });
  }

  const { data: submission, error } = await supabaseAdmin
    .from("kyc_submissions")
    .select("id, profile_id")
    .eq("profile_id", profileId)
    .single();

  if (error || !submission) {
    return res.status(404).json({ success: false, message: "KYC submission not found." });
  }

  const { data: fullRow, error: fullRowError } = await supabaseAdmin
    .from("kyc_submissions")
    .select(fieldName)
    .eq("id", submission.id)
    .single();

  if (fullRowError || !fullRow) {
    return res.status(404).json({ success: false, message: "KYC submission not found." });
  }

  const { error: logError } = await supabaseAdmin.from("kyc_reveal_log").insert({
    kyc_submission_id: submission.id,
    admin_id: req.profile.id,
    field_name: fieldName
  });

  if (logError) throw logError;

  res.json({ success: true, data: { field: fieldName, value: fullRow[fieldName] } });
}

async function setApprovalStatus(req, res, nextStatus) {
  const { profileId } = req.params;

  if (!supabaseAdmin) {
    return res.json({ success: true, data: { id: profileId, approval_status: nextStatus } });
  }

  const { data: target, error: lookupError } = await supabaseAdmin
    .from("profiles")
    .select("id, role, approval_status")
    .eq("id", profileId)
    .single();

  if (lookupError || !target) {
    return res.status(404).json({ success: false, message: "Account not found." });
  }

  if (!APPROVAL_GATED_ROLES.includes(target.role)) {
    return res.status(400).json({
      success: false,
      message: "Only owner and delivery accounts go through approval."
    });
  }

  // Require a KYC submission to exist before an account can be approved —
  // an admin clicking "Approve" on someone who never submitted KYC would
  // otherwise silently bypass the whole point of this workflow.
  if (nextStatus === "approved") {
    const { data: kyc, error: kycError } = await supabaseAdmin
      .from("kyc_submissions")
      .select("id, verification_status")
      .eq("profile_id", profileId)
      .maybeSingle();

    if (kycError) throw kycError;

    if (!kyc) {
      return res.status(400).json({
        success: false,
        message: "This account has not submitted KYC details yet and cannot be approved."
      });
    }
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update({ approval_status: nextStatus })
    .eq("id", profileId)
    .select()
    .single();

  if (error) throw error;

  // Keep the KYC submission's own status in sync with the account decision,
  // and stamp who reviewed it and when.
  await supabaseAdmin
    .from("kyc_submissions")
    .update({
      verification_status: nextStatus === "approved" ? "verified" : "rejected",
      reviewed_by: req.profile.id,
      reviewed_at: new Date().toISOString()
    })
    .eq("profile_id", profileId);

  res.json({ success: true, data });
}

// Note: this also lets an admin revoke a previously-approved account by
// rejecting it later (e.g. a delivery partner who started misbehaving) —
// requireRole will start blocking them on their very next request.
export async function approveAccount(req, res) {
  await setApprovalStatus(req, res, "approved");
}

export async function rejectAccount(req, res) {
  await setApprovalStatus(req, res, "rejected");
}