import { supabaseAdmin } from "../config/supabaseClient.js";

export function requireRole(...allowedRoles) {
  return async (req, res, next) => {
    const metadataRole = req.user?.user_metadata?.role;

    if (!supabaseAdmin) {
      if (metadataRole && allowedRoles.includes(metadataRole)) {
        req.profile = {
          id: req.user.id,
          role: metadataRole,
          full_name: req.user.user_metadata?.full_name || null
        };
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

    req.profile = data;
    next();
  };
}
