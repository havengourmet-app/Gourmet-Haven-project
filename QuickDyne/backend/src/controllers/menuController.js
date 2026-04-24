import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "../config/supabaseClient.js";
import { assertPaise } from "../utils/money.js";

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
    name: req.body.name,
    description: req.body.description || "",
    category: req.body.category || "General",
    price_paise: req.body.pricePaise,
    is_veg: Boolean(req.body.isVeg),
    is_available: true,
    image_url: req.body.imageUrl || null
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
    ...(typeof req.body.name !== "undefined" ? { name: req.body.name } : {}),
    ...(typeof req.body.description !== "undefined" ? { description: req.body.description } : {}),
    ...(typeof req.body.category !== "undefined" ? { category: req.body.category } : {}),
    ...(typeof req.body.pricePaise !== "undefined" ? { price_paise: req.body.pricePaise } : {}),
    ...(typeof req.body.isVeg !== "undefined" ? { is_veg: req.body.isVeg } : {}),
    ...(typeof req.body.isAvailable !== "undefined" ? { is_available: req.body.isAvailable } : {}),
    ...(typeof req.body.imageUrl !== "undefined" ? { image_url: req.body.imageUrl } : {})
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