import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "../config/supabaseClient.js";
import { assertPaise } from "../utils/money.js";

const SAMPLE_ORDERS = [
  {
    id: "c13e8239-85fd-49e9-ac51-a01b992fe930",
    status: "pending",
    total_paise: 33700,
    city: "Hyderabad"
  }
];

export async function listCustomerOrders(req, res) {
  if (!supabaseAdmin) {
    return res.json({
      success: true,
      data: SAMPLE_ORDERS
    });
  }

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("customer_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  res.json({
    success: true,
    data
  });
}

export async function listOwnerOrders(req, res) {
  if (!supabaseAdmin) {
    return res.json({
      success: true,
      data: SAMPLE_ORDERS
    });
  }

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*, restaurants!inner(owner_id)")
    .eq("restaurants.owner_id", req.profile?.id || req.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  res.json({
    success: true,
    data
  });
}

export async function listDeliveryOrders(req, res) {
  if (!supabaseAdmin) {
    return res.json({
      success: true,
      data: SAMPLE_ORDERS
    });
  }

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("assigned_delivery_id", req.profile?.id || req.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  res.json({
    success: true,
    data
  });
}

export async function createOrder(req, res) {
  assertPaise(req.body.subtotalPaise, "subtotalPaise");
  assertPaise(req.body.deliveryFeePaise, "deliveryFeePaise");
  assertPaise(req.body.platformFeePaise, "platformFeePaise");
  assertPaise(req.body.totalPaise, "totalPaise");

  const payload = {
    id: randomUUID(),
    customer_id: req.user.id,
    restaurant_id: req.body.restaurantId,
    items: req.body.items || [],
    subtotal_paise: req.body.subtotalPaise,
    delivery_fee_paise: req.body.deliveryFeePaise,
    platform_fee_paise: req.body.platformFeePaise,
    total_paise: req.body.totalPaise,
    status: "pending",
    city: "Hyderabad"
  };

  if (!supabaseAdmin) {
    return res.status(201).json({
      success: true,
      data: payload,
      message: "Order was validated. Configure Supabase to persist and broadcast it."
    });
  }

  const { data, error } = await supabaseAdmin.from("orders").insert(payload).select().single();

  if (error) {
    throw error;
  }

  res.status(201).json({
    success: true,
    data
  });
}

export async function updateOrderStatus(req, res) {
  const patch = {
    status: req.body.status
  };

  if (req.body.assignedDeliveryId) {
    patch.assigned_delivery_id = req.body.assignedDeliveryId;
  }

  if (!supabaseAdmin) {
    return res.json({
      success: true,
      data: {
        id: req.params.orderId,
        ...patch
      }
    });
  }

  const { data, error } = await supabaseAdmin
    .from("orders")
    .update(patch)
    .eq("id", req.params.orderId)
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
