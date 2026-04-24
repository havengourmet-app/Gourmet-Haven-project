import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "../config/supabaseClient.js";

const SAMPLE_RESTAURANTS = [
  {
    id: "d178fe1b-2ed8-4d6e-a0d5-56d44ac8ea01",
    name: "Paradise Signature",
    cuisine: "Biryani, Kebabs, Andhra",
    rating: "4.7",
    deliveryTime: "28 mins",
    minimumOrderLabel: "Min Rs 199",
    subscriptionStatus: "Subscribed",
    city: "Hyderabad"
  }
];

export async function listRestaurants(req, res) {
  if (!supabaseAdmin) {
    return res.json({
      success: true,
      data: SAMPLE_RESTAURANTS
    });
  }

  const { data, error } = await supabaseAdmin
    .from("restaurants")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  res.json({
    success: true,
    data
  });
}

export async function listOwnerRestaurants(req, res) {
  if (!supabaseAdmin) {
    return res.json({
      success: true,
      data: SAMPLE_RESTAURANTS
    });
  }

  const ownerId = req.profile?.id || req.user.id;
  const { data, error } = await supabaseAdmin
    .from("restaurants")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  res.json({
    success: true,
    data
  });
}

export async function createRestaurant(req, res) {
  const payload = {
    id: randomUUID(),
    owner_id: req.profile?.id || req.user.id,
    name: req.body.name,
    city: req.body.city || "Hyderabad",
    cuisine_summary: req.body.cuisineSummary || "",
    subscription_status: "inactive",
    is_active: true
  };

  if (!supabaseAdmin) {
    return res.status(201).json({
      success: true,
      data: payload,
      message: "Restaurant scaffold created locally. Configure Supabase to persist this."
    });
  }

  const { data, error } = await supabaseAdmin.from("restaurants").insert(payload).select().single();

  if (error) {
    throw error;
  }

  res.status(201).json({
    success: true,
    data
  });
}

export async function updateRestaurant(req, res) {
  if (!supabaseAdmin) {
    return res.json({
      success: true,
      data: {
        id: req.params.restaurantId,
        ...req.body
      }
    });
  }

  const { data, error } = await supabaseAdmin
    .from("restaurants")
    .update(req.body)
    .eq("id", req.params.restaurantId)
    .eq("owner_id", req.profile?.id || req.user.id)
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
