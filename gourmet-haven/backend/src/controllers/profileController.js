import { supabaseAdmin } from "../config/supabaseClient.js";
import { optionalText } from "../utils/validation.js";

export async function getProfile(req, res) {
  if (!supabaseAdmin) {
    return res.json({
      success: true,
      data: {
        id: req.user.id,
        full_name: req.user.user_metadata?.full_name || null,
        role: req.user.user_metadata?.role || "customer",
        phone: null,
        avatar_url: null
      }
    });
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", req.user.id)
    .single();

  if (error || !data) {
    return res.status(404).json({ success: false, message: "Profile not found." });
  }

  return res.json({ success: true, data });
}

export async function updateProfile(req, res) {
  const patch = {};

  if (typeof req.body.full_name !== "undefined") {
    patch.full_name = optionalText(req.body.full_name, "full_name", { maxLength: 120 }) || null;
  }
  if (typeof req.body.phone !== "undefined") {
    patch.phone = optionalText(req.body.phone, "phone", { maxLength: 20 }) || null;
  }
  if (typeof req.body.avatar_url !== "undefined") {
    patch.avatar_url = optionalText(req.body.avatar_url, "avatar_url", { maxLength: 500 }) || null;
  }

  if (Object.keys(patch).length === 0) {
    return res.status(400).json({ success: false, message: "No fields to update." });
  }

  if (!supabaseAdmin) {
    return res.json({
      success: true,
      data: { id: req.user.id, ...patch }
    });
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update(patch)
    .eq("id", req.user.id)
    .select()
    .single();

  if (error) throw error;

  return res.json({ success: true, data });
}
