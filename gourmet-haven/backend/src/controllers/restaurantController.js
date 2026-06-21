import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "../config/supabaseClient.js";
import { restaurantHasActiveSubscription } from "../utils/subscriptionAccess.js";
import { optionalInteger, optionalText, requireText } from "../utils/validation.js";

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toVisibleRestaurant(restaurant) {
  return {
    id: restaurant.id,
    name: restaurant.name,
    description: restaurant.description || "",
    locality: restaurant.locality || "",
    cuisine_summary: restaurant.cuisine_summary || "",
    logo_url: restaurant.logo_url || null,
    cover_image_url: restaurant.cover_image_url || null,
    avg_rating: Number(restaurant.avg_rating || 0),
    estimated_delivery_minutes: Number(restaurant.estimated_delivery_minutes || 35)
  };
}

function groupMenuItemsByCategory(items = []) {
  return items.reduce((groups, item) => {
    const category = normalizeText(item.category) || "General";
    if (!groups[category]) groups[category] = [];
    groups[category].push(item);
    return groups;
  }, {});
}

async function listEligibleRestaurants({ locality, search }) {
  let query = supabaseAdmin
    .from("restaurants")
    .select("id, name, description, locality, cuisine_summary, logo_url, cover_image_url, avg_rating, estimated_delivery_minutes, subscription_status, is_active")
    .eq("is_active", true);

  if (locality) query = query.ilike("locality", locality);
  if (search) query = query.or(`name.ilike.%${search}%,cuisine_summary.ilike.%${search}%`);

  query = query.order("avg_rating", { ascending: false });

  const { data: restaurants, error: restaurantError } = await query;
  if (restaurantError) throw restaurantError;
  if (!restaurants?.length) return [];

  const restaurantIds = restaurants.map((r) => r.id);
  const { data: subscriptions, error: subscriptionError } = await supabaseAdmin
    .from("subscriptions")
    .select("restaurant_id, status")
    .in("restaurant_id", restaurantIds);

  if (subscriptionError) throw subscriptionError;

  const subscriptionsByRestaurantId = new Map();
  for (const sub of subscriptions || []) {
    const current = subscriptionsByRestaurantId.get(sub.restaurant_id) || [];
    current.push(sub);
    subscriptionsByRestaurantId.set(sub.restaurant_id, current);
  }

  return restaurants
    .filter((restaurant) => {
      const subs = subscriptionsByRestaurantId.get(restaurant.id) || [];
      return restaurantHasActiveSubscription(restaurant, subs);
    })
    .map(toVisibleRestaurant)
    .sort((a, b) => Number(b.avg_rating || 0) - Number(a.avg_rating || 0));
}

export async function listRestaurants(req, res) {
  if (!supabaseAdmin) return res.json({ restaurants: [] });

  const locality = normalizeText(req.query.locality);
  const search = normalizeText(req.query.search);
  const restaurants = await listEligibleRestaurants({ locality, search });

  res.json({ restaurants });
}

export async function fetchRestaurantDetail(req, res) {
  if (!supabaseAdmin) {
    return res.status(503).json({ success: false, message: "Supabase not configured." });
  }

  const { restaurantId } = req.params;

  const { data: restaurant, error } = await supabaseAdmin
    .from("restaurants")
    .select("id, name, description, locality, cuisine_summary, logo_url, cover_image_url, avg_rating, estimated_delivery_minutes, subscription_status, is_active")
    .eq("id", restaurantId)
    .single();

  if (error || !restaurant || !restaurant.is_active || !restaurantHasActiveSubscription(restaurant)) {
    return res.status(404).json({ success: false, message: "Restaurant not found or unavailable." });
  }

  res.json({ success: true, data: toVisibleRestaurant(restaurant) });
}

export async function fetchRestaurantMenu(req, res) {
  if (!supabaseAdmin) {
    return res.json({ restaurant: null, menu: {} });
  }

  const { data: restaurant, error: restaurantError } = await supabaseAdmin
    .from("restaurants")
    .select("id, name, description, locality, cuisine_summary, logo_url, cover_image_url, avg_rating, estimated_delivery_minutes, subscription_status, is_active")
    .eq("id", req.params.restaurantId)
    .single();

  if (restaurantError || !restaurant || !restaurant.is_active || !restaurantHasActiveSubscription(restaurant)) {
    return res.status(404).json({
      success: false,
      message: "Restaurant not found or is not currently available."
    });
  }

  const { data: menuItems, error: menuError } = await supabaseAdmin
    .from("menu_items")
    .select("id, restaurant_id, name, description, price_paise, category, image_url, is_available, is_veg")
    .eq("restaurant_id", restaurant.id)
    .eq("is_available", true)
    .order("category", { ascending: true })
    .order("created_at", { ascending: true });

  if (menuError) throw menuError;

  res.json({
    restaurant: toVisibleRestaurant(restaurant),
    menu: groupMenuItemsByCategory(menuItems || [])
  });
}

export async function listRestaurantLocalities(req, res) {
  if (!supabaseAdmin) return res.json({ localities: [] });

  const { data, error } = await supabaseAdmin
    .from("restaurants")
    .select("locality")
    .eq("is_active", true)
    .not("locality", "is", null)
    .order("locality", { ascending: true });

  if (error) throw error;

  const localities = Array.from(
    new Set(
      (data || [])
        .map((r) => normalizeText(r.locality))
        .filter(Boolean)
    )
  );

  res.json({ localities });
}

export async function listOwnerRestaurants(req, res) {
  if (!supabaseAdmin) return res.json({ success: true, data: [] });

  const ownerId = req.profile?.id || req.user.id;
  const { data, error } = await supabaseAdmin
    .from("restaurants")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  res.json({ success: true, data });
}

export async function createRestaurant(req, res) {
  const payload = {
    id: randomUUID(),
    owner_id: req.profile?.id || req.user.id,
    name: requireText(req.body.name, "name", { maxLength: 120 }),
    city: optionalText(req.body.city, "city", { defaultValue: "Hyderabad", maxLength: 80 }) || "Hyderabad",
    locality: optionalText(req.body.locality, "locality", { maxLength: 80 }),
    cuisine_summary: optionalText(req.body.cuisineSummary, "cuisineSummary", { maxLength: 160 }),
    estimated_delivery_minutes: optionalInteger(req.body.estimatedDeliveryMinutes, "estimatedDeliveryMinutes", {
      defaultValue: 35,
      min: 10,
      max: 120
    }),
    logo_url: req.body.logo_url ?? req.body.logoUrl ?? null,
    cover_image_url: req.body.cover_image_url ?? req.body.coverImageUrl ?? null,
    subscription_status: "inactive",
    is_active: true
  };

  if (!supabaseAdmin) {
    return res.status(201).json({ success: true, data: payload });
  }

  const { data, error } = await supabaseAdmin.from("restaurants").insert(payload).select().single();
  if (error) throw error;

  res.status(201).json({ success: true, data });
}

export async function updateRestaurant(req, res) {
  const patch = {
    ...(typeof req.body.name !== "undefined" ? { name: requireText(req.body.name, "name", { maxLength: 120 }) } : {}),
    ...(typeof req.body.city !== "undefined" ? { city: optionalText(req.body.city, "city", { maxLength: 80 }) } : {}),
    ...(typeof req.body.locality !== "undefined" ? { locality: optionalText(req.body.locality, "locality", { maxLength: 80 }) } : {}),
    ...(typeof req.body.cuisineSummary !== "undefined"
      ? { cuisine_summary: optionalText(req.body.cuisineSummary, "cuisineSummary", { maxLength: 160 }) }
      : {}),
    ...(typeof req.body.cuisine_summary !== "undefined"
      ? { cuisine_summary: optionalText(req.body.cuisine_summary, "cuisine_summary", { maxLength: 160 }) }
      : {}),
    ...(typeof req.body.estimatedDeliveryMinutes !== "undefined"
      ? {
          estimated_delivery_minutes: optionalInteger(req.body.estimatedDeliveryMinutes, "estimatedDeliveryMinutes", {
            min: 10,
            max: 120
          })
        }
      : {}),
    ...(typeof req.body.logo_url !== "undefined" || typeof req.body.logoUrl !== "undefined"
      ? { logo_url: req.body.logo_url ?? req.body.logoUrl ?? null } : {}),
    ...(typeof req.body.cover_image_url !== "undefined" || typeof req.body.coverImageUrl !== "undefined"
      ? { cover_image_url: req.body.cover_image_url ?? req.body.coverImageUrl ?? null } : {}),
    ...(typeof req.body.subscription_status !== "undefined" ? { subscription_status: req.body.subscription_status } : {}),
    ...(typeof req.body.is_active !== "undefined" ? { is_active: req.body.is_active } : {})
  };

  if (!supabaseAdmin) {
    return res.json({ success: true, data: { id: req.params.restaurantId, ...patch } });
  }

  const { data, error } = await supabaseAdmin
    .from("restaurants")
    .update(patch)
    .eq("id", req.params.restaurantId)
    .eq("owner_id", req.profile?.id || req.user.id)
    .select()
    .single();

  if (error) throw error;

  res.json({ success: true, data });
}
