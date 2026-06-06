import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "../config/supabaseClient.js";

const SAMPLE_ADDRESSES = [];

export async function listAddresses(req, res) {
  if (!supabaseAdmin) {
    return res.json({ success: true, data: SAMPLE_ADDRESSES });
  }

  const { data, error } = await supabaseAdmin
    .from("addresses")
    .select("*")
    .eq("profile_id", req.user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;

  res.json({ success: true, data });
}

export async function createAddress(req, res) {
  const { label, recipient_name, phone, line_1, line_2, locality, city, pincode, is_default } = req.body;

  if (!recipient_name?.trim() || !line_1?.trim() || !locality?.trim() || !pincode?.trim() || !phone?.trim()) {
    return res.status(400).json({
      success: false,
      message: "recipient_name, phone, line_1, locality, and pincode are required."
    });
  }

  const payload = {
    id: randomUUID(),
    profile_id: req.user.id,
    label: label?.trim() || "Home",
    recipient_name: recipient_name.trim(),
    phone: phone.trim(),
    line_1: line_1.trim(),
    line_2: line_2?.trim() || "",
    locality: locality.trim(),
    city: city?.trim() || "Hyderabad",
    pincode: pincode.trim(),
    is_default: Boolean(is_default)
  };

  if (!supabaseAdmin) {
    return res.status(201).json({ success: true, data: payload });
  }

  // If this is default, unset all other defaults first
  if (payload.is_default) {
    await supabaseAdmin
      .from("addresses")
      .update({ is_default: false })
      .eq("profile_id", req.user.id);
  }

  const { data, error } = await supabaseAdmin
    .from("addresses")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;

  res.status(201).json({ success: true, data });
}

export async function updateAddress(req, res) {
  const { addressId } = req.params;

  const patch = {};
  const fields = ["label", "recipient_name", "phone", "line_1", "line_2", "locality", "city", "pincode", "is_default"];

  for (const field of fields) {
    if (typeof req.body[field] !== "undefined") {
      patch[field] = typeof req.body[field] === "string" ? req.body[field].trim() : req.body[field];
    }
  }

  if (Object.keys(patch).length === 0) {
    return res.status(400).json({ success: false, message: "No fields to update." });
  }

  if (!supabaseAdmin) {
    return res.json({ success: true, data: { id: addressId, ...patch } });
  }

  // If setting as default, unset others first
  if (patch.is_default) {
    await supabaseAdmin
      .from("addresses")
      .update({ is_default: false })
      .eq("profile_id", req.user.id)
      .neq("id", addressId);
  }

  const { data, error } = await supabaseAdmin
    .from("addresses")
    .update(patch)
    .eq("id", addressId)
    .eq("profile_id", req.user.id)
    .select()
    .single();

  if (error || !data) {
    return res.status(404).json({ success: false, message: "Address not found." });
  }

  res.json({ success: true, data });
}

export async function deleteAddress(req, res) {
  const { addressId } = req.params;

  if (!supabaseAdmin) {
    return res.json({ success: true, data: { id: addressId, deleted: true } });
  }

  const { error } = await supabaseAdmin
    .from("addresses")
    .delete()
    .eq("id", addressId)
    .eq("profile_id", req.user.id);

  if (error) throw error;

  res.json({ success: true, data: { id: addressId, deleted: true } });
}