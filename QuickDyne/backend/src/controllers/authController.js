import { supabaseAdmin } from "../config/supabaseClient.js";

export async function getCurrentUserProfile(req, res) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "User session not found."
    });
  }

  if (!supabaseAdmin) {
    return res.json({
      success: true,
      data: {
        id: req.user.id,
        email: req.user.email,
        full_name: req.user.user_metadata?.full_name || null,
        role: req.user.user_metadata?.role || "customer"
      }
    });
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", req.user.id)
    .single();

  if (error) {
    return res.status(404).json({
      success: false,
      message: "Profile not found."
    });
  }

  return res.json({
    success: true,
    data
  });
}
