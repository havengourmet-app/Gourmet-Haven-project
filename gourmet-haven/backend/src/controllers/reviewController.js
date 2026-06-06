import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "../config/supabaseClient.js";

export async function createReview(req, res) {
  const { orderId, restaurantId, rating, comment } = req.body;
  const customerId = req.user.id;

  if (!orderId || !restaurantId) {
    return res.status(400).json({ success: false, message: "orderId and restaurantId are required." });
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: "rating must be an integer between 1 and 5." });
  }

  if (!supabaseAdmin) {
    return res.status(201).json({
      success: true,
      data: { id: randomUUID(), order_id: orderId, restaurant_id: restaurantId, customer_id: customerId, rating, comment: comment || "" }
    });
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("id, status, customer_id")
    .eq("id", orderId)
    .eq("customer_id", customerId)
    .single();

  if (orderError || !order) {
    return res.status(404).json({ success: false, message: "Order not found." });
  }

  if (order.status !== "delivered") {
    return res.status(400).json({ success: false, message: "You can only review a delivered order." });
  }

  const { data: existing } = await supabaseAdmin
    .from("reviews")
    .select("id")
    .eq("order_id", orderId)
    .eq("customer_id", customerId)
    .maybeSingle();

  if (existing) {
    return res.status(409).json({ success: false, message: "You have already reviewed this order." });
  }

  const payload = {
    id: randomUUID(),
    order_id: orderId,
    restaurant_id: restaurantId,
    customer_id: customerId,
    rating,
    comment: comment?.trim() || ""
  };

  const { data, error } = await supabaseAdmin
    .from("reviews")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;

  res.status(201).json({ success: true, data });
}

export async function getOrderReview(req, res) {
  const { orderId } = req.params;

  if (!supabaseAdmin) {
    return res.json({ success: true, data: null });
  }

  const { data, error } = await supabaseAdmin
    .from("reviews")
    .select("*")
    .eq("order_id", orderId)
    .eq("customer_id", req.user.id)
    .maybeSingle();

  if (error) throw error;

  res.json({ success: true, data });
}

export async function listRestaurantReviews(req, res) {
  const { restaurantId } = req.params;

  if (!supabaseAdmin) {
    return res.json({ success: true, data: [] });
  }

  const { data, error } = await supabaseAdmin
    .from("reviews")
    .select("id, rating, comment, created_at, customer:profiles(full_name)")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;

  res.json({ success: true, data });
}