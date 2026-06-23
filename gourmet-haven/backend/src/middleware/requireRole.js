import { supabaseAdmin } from "../config/supabaseClient.js";

const APPROVAL_GATED_ROLES = new Set(["owner", "delivery"]);

function approvalErrorResponse(approvalStatus) {
  if (approvalStatus === "rejected") {
    return {
      statusCode: 403,
      body: {
        success: false,
        message: "Your account application was not approved. Contact support if you believe this is a mistake.",
        code: "ACCOUNT_REJECTED"
      }
    };
  }

  return {
    statusCode: 403,
    body: {
      success: false,
      message: "Your account is pending admin approval. You'll get access as soon as it's reviewed.",
      code: "ACCOUNT_PENDING_APPROVAL"
    }
  };
}

export function requireRole(...allowedRoles) {
  return async (req, res, next) => {
    const metadataRole = req.user?.user_metadata?.role;

    if (!supabaseAdmin) {
      // Dev/sample fallback only — never the real security boundary.
      if (metadataRole && allowedRoles.includes(metadataRole)) {
        req.profile = {
          id: req.user.id,
          role: metadataRole,
          full_name: req.user.user_metadata?.full_name || null,
          approval_status: metadataRole === "customer" ? "approved" : "pending"
        };

        if (APPROVAL_GATED_ROLES.has(metadataRole) && req.profile.approval_status !== "approved") {
          const { statusCode, body } = approvalErrorResponse(req.profile.approval_status);
          return res.status(statusCode).json(body);
        }

        return next();
      }

      return res.status(403).json({
        success: false,
        message: "You do not have access to this resource."
      });
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", req.user.id)
      .single();

    if (error || !data) {
      return res.status(403).json({
        success: false,
        message: "Profile lookup failed for the current user."
      });
    }

    if (!allowedRoles.includes(data.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this resource."
      });
    }

    // Admins are never self-assignable (enforced at the DB trigger), so this
    // check is intentionally scoped to owner/delivery only.
    if (APPROVAL_GATED_ROLES.has(data.role) && data.approval_status !== "approved") {
      const { statusCode, body } = approvalErrorResponse(data.approval_status);
      return res.status(statusCode).json(body);
    }

    req.profile = data;
    next();
  };
}