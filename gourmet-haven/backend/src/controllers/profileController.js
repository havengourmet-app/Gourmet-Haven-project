import { supabaseAdmin } from "../config/supabaseClient.js";

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
    patch.full_name = req.body.full_name?.trim() || null;
  }
  if (typeof req.body.phone !== "undefined") {
    patch.phone = req.body.phone?.trim() || null;
  }
  if (typeof req.body.avatar_url !== "undefined") {
    patch.avatar_url = req.body.avatar_url || null;
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