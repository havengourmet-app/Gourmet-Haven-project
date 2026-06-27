import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "../config/supabaseClient.js";
import { assertPaise } from "../utils/money.js";
import { optionalBoolean, optionalText, requireText } from "../utils/validation.js";

async function assertOwnerOwnsRestaurant(ownerId, restaurantId) {
  const { data, error } = await supabaseAdmin
    .from("restaurants")
    .select("id")
    .eq("id", restaurantId)
    .eq("owner_id", ownerId)
    .single();

  if (error || !data) {
    const accessError = new Error("You can only manage menu items for your own restaurant.");
    accessError.statusCode = 403;
    throw accessError;
  }
}

async function assertOwnerOwnsMenuItem(ownerId, menuItemId) {
  const { data: menuItem, error: menuItemError } = await supabaseAdmin
    .from("menu_items")
    .select("id, restaurant_id")
    .eq("id", menuItemId)
    .single();

  if (menuItemError || !menuItem) {
    const missingError = new Error("Menu item not found.");
    missingError.statusCode = 404;
    throw missingError;
  }

  await assertOwnerOwnsRestaurant(ownerId, menuItem.restaurant_id);
}

export async function listMenuItems(req, res) {
  const restaurantId = req.query.restaurantId;

  if (!restaurantId) {
    return res.status(400).json({
      success: false,
      message: "restaurantId query param is required."
    });
  }

  if (!supabaseAdmin) {
    return res.json({
      success: true,
      data: []
    });
  }

  // Fixes the remaining half of C2: now that this route requires auth +
  // the owner role, also confirm the requester actually owns the restaurant
  // they're asking about. Without this, any owner could pass any other
  // owner's restaurantId and still see that restaurant's full menu —
  // including unavailable items, which is exactly what was leaking before.
  await assertOwnerOwnsRestaurant(req.profile?.id || req.user.id, restaurantId);

  const { data, error } = await supabaseAdmin
    .from("menu_items")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  res.json({
    success: true,
    data
  });
}

export async function createMenuItem(req, res) {
  assertPaise(req.body.pricePaise, "pricePaise");

  const payload = {
    id: randomUUID(),
    restaurant_id: req.body.restaurantId,
    name: requireText(req.body.name, "name", { maxLength: 120 }),
    description: optionalText(req.body.description, "description", { maxLength: 500 }),
    category: optionalText(req.body.category, "category", { defaultValue: "General", maxLength: 80 }) || "General",
    price_paise: req.body.pricePaise,
    is_veg: optionalBoolean(req.body.isVeg, "isVeg", false),
    is_available: optionalBoolean(req.body.isAvailable, "isAvailable", true),
    image_url: req.body.image_url ?? req.body.imageUrl ?? null
  };

  if (!supabaseAdmin) {
    return res.status(201).json({
      success: true,
      data: payload
    });
  }

  await assertOwnerOwnsRestaurant(req.profile?.id || req.user.id, req.body.restaurantId);

  const { data, error } = await supabaseAdmin.from("menu_items").insert(payload).select().single();

  if (error) {
    throw error;
  }

  res.status(201).json({
    success: true,
    data
  });
}

export async function updateMenuItem(req, res) {
  if (typeof req.body.pricePaise !== "undefined") {
    assertPaise(req.body.pricePaise, "pricePaise");
  }

  if (!supabaseAdmin) {
    return res.json({
      success: true,
      data: {
        id: req.params.menuItemId,
        ...req.body
      }
    });
  }

  await assertOwnerOwnsMenuItem(req.profile?.id || req.user.id, req.params.menuItemId);

  const patch = {
    ...(typeof req.body.name !== "undefined" ? { name: requireText(req.body.name, "name", { maxLength: 120 }) } : {}),
    ...(typeof req.body.description !== "undefined"
      ? { description: optionalText(req.body.description, "description", { maxLength: 500 }) }
      : {}),
    ...(typeof req.body.category !== "undefined"
      ? { category: optionalText(req.body.category, "category", { defaultValue: "General", maxLength: 80 }) || "General" }
      : {}),
    ...(typeof req.body.pricePaise !== "undefined" ? { price_paise: req.body.pricePaise } : {}),
    ...(typeof req.body.isVeg !== "undefined" ? { is_veg: optionalBoolean(req.body.isVeg, "isVeg", false) } : {}),
    ...(typeof req.body.isAvailable !== "undefined" ? { is_available: optionalBoolean(req.body.isAvailable, "isAvailable", true) } : {}),
    ...(typeof req.body.image_url !== "undefined" || typeof req.body.imageUrl !== "undefined"
      ? { image_url: req.body.image_url ?? req.body.imageUrl ?? null }
      : {})
  };

  const { data, error } = await supabaseAdmin
    .from("menu_items")
    .update(patch)
    .eq("id", req.params.menuItemId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  res.json({
    success: true,
    data
  });
}