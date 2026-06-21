import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "../config/supabaseClient.js";
import { optionalBoolean, optionalText, requireText } from "../utils/validation.js";

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

  const payload = {
    id: randomUUID(),
    profile_id: req.user.id,
    label: optionalText(label, "label", { defaultValue: "Home", maxLength: 40 }) || "Home",
    recipient_name: requireText(recipient_name, "recipient_name", { maxLength: 120 }),
    phone: requireText(phone, "phone", { maxLength: 20 }),
    line_1: requireText(line_1, "line_1", { maxLength: 160 }),
    line_2: optionalText(line_2, "line_2", { maxLength: 160 }),
    locality: requireText(locality, "locality", { maxLength: 80 }),
    city: optionalText(city, "city", { defaultValue: "Hyderabad", maxLength: 80 }) || "Hyderabad",
    pincode: requireText(pincode, "pincode", { maxLength: 12 }),
    is_default: optionalBoolean(is_default, "is_default", false)
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
  if (typeof req.body.label !== "undefined") patch.label = optionalText(req.body.label, "label", { maxLength: 40 });
  if (typeof req.body.recipient_name !== "undefined") patch.recipient_name = requireText(req.body.recipient_name, "recipient_name", { maxLength: 120 });
  if (typeof req.body.phone !== "undefined") patch.phone = requireText(req.body.phone, "phone", { maxLength: 20 });
  if (typeof req.body.line_1 !== "undefined") patch.line_1 = requireText(req.body.line_1, "line_1", { maxLength: 160 });
  if (typeof req.body.line_2 !== "undefined") patch.line_2 = optionalText(req.body.line_2, "line_2", { maxLength: 160 });
  if (typeof req.body.locality !== "undefined") patch.locality = requireText(req.body.locality, "locality", { maxLength: 80 });
  if (typeof req.body.city !== "undefined") patch.city = optionalText(req.body.city, "city", { maxLength: 80 });
  if (typeof req.body.pincode !== "undefined") patch.pincode = requireText(req.body.pincode, "pincode", { maxLength: 12 });
  if (typeof req.body.is_default !== "undefined") patch.is_default = optionalBoolean(req.body.is_default, "is_default", false);

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
