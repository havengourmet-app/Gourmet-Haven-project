import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "../config/supabaseClient.js";
import { assertPaise } from "../utils/money.js";

const SAMPLE_ORDERS = [
  {
    id: "c13e8239-85fd-49e9-ac51-a01b992fe930",
    status: "pending",
    total_paise: 33700,
    city: "Hyderabad",
    items: [{ quantity: 2 }],
    restaurant: {
      name: "Paradise Signature",
      city: "Hyderabad"
    }
  }
];

const ORDER_SELECT = `
  id,
  customer_id,
  restaurant_id,
  assigned_delivery_id,
  delivery_address_id,
  items,
  subtotal_paise,
  delivery_fee_paise,
  platform_fee_paise,
  total_paise,
  status,
  notes,
  city,
  created_at,
  updated_at,
  restaurant:restaurants(id, name, city),
  delivery_address:addresses(id, label, locality, line_1, pincode)
`;

const OWNER_ALLOWED_STATUSES = new Set(["accepted", "preparing", "cancelled"]);
const DELIVERY_ALLOWED_STATUSES = new Set(["picked_up", "on_the_way", "delivered"]);
const TRANSITIONS = {
  pending: new Set(["accepted", "cancelled"]),
  accepted: new Set(["preparing", "cancelled", "picked_up"]),
  preparing: new Set(["cancelled", "picked_up"]),
  picked_up: new Set(["on_the_way", "delivered"]),
  on_the_way: new Set(["delivered"]),
  delivered: new Set(),
  cancelled: new Set()
};

function decorateOrder(order) {
  return {
    ...order,
    item_count: Array.isArray(order?.items)
      ? order.items.reduce((count, item) => count + Number(item.quantity || 0), 0)
      : 0
  };
}

function decorateOrders(orders = []) {
  return orders.map(decorateOrder);
}

function isAllowedTransition(currentStatus, nextStatus) {
  if (!nextStatus || currentStatus === nextStatus) {
    return true;
  }

  return TRANSITIONS[currentStatus]?.has(nextStatus) || false;
}

async function assertOwnerCanManageOrder(profileId, restaurantId) {
  const { data, error } = await supabaseAdmin
    .from("restaurants")
    .select("id")
    .eq("id", restaurantId)
    .eq("owner_id", profileId)
    .single();

  if (error || !data) {
    const accessError = new Error("You do not have access to this order.");
    accessError.statusCode = 403;
    throw accessError;
  }
}

async function fetchOrderForUpdate(orderId) {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("id, status, restaurant_id, assigned_delivery_id")
    .eq("id", orderId)
    .single();

  if (error || !data) {
    const missingError = new Error("Order not found.");
    missingError.statusCode = 404;
    throw missingError;
  }

  return data;
}

export async function listCustomerOrders(req, res) {
  if (!supabaseAdmin) {
    return res.json({
      success: true,
      data: decorateOrders(SAMPLE_ORDERS)
    });
  }

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select(ORDER_SELECT)
    .eq("customer_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  res.json({
    success: true,
    data: decorateOrders(data)
  });
}

export async function listOwnerOrders(req, res) {
  if (!supabaseAdmin) {
    return res.json({
      success: true,
      data: decorateOrders(SAMPLE_ORDERS)
    });
  }

  const ownerId = req.profile?.id || req.user.id;
  const { data: restaurants, error: restaurantError } = await supabaseAdmin
    .from("restaurants")
    .select("id")
    .eq("owner_id", ownerId);

  if (restaurantError) {
    throw restaurantError;
  }

  const restaurantIds = restaurants.map((restaurant) => restaurant.id);

  if (restaurantIds.length === 0) {
    return res.json({
      success: true,
      data: []
    });
  }

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select(ORDER_SELECT)
    .in("restaurant_id", restaurantIds)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  res.json({
    success: true,
    data: decorateOrders(data)
  });
}

export async function listDeliveryOrders(req, res) {
  if (!supabaseAdmin) {
    return res.json({
      success: true,
      data: decorateOrders(SAMPLE_ORDERS)
    });
  }

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select(ORDER_SELECT)
    .eq("assigned_delivery_id", req.profile?.id || req.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  res.json({
    success: true,
    data: decorateOrders(data)
  });
}

export async function createOrder(req, res) {
  assertPaise(req.body.subtotalPaise, "subtotalPaise");
  assertPaise(req.body.deliveryFeePaise, "deliveryFeePaise");
  assertPaise(req.body.platformFeePaise, "platformFeePaise");
  assertPaise(req.body.totalPaise, "totalPaise");

  if (!req.body.restaurantId) {
    return res.status(400).json({
      success: false,
      message: "restaurantId is required to place an order."
    });
  }

  const payload = {
    id: randomUUID(),
    customer_id: req.user.id,
    restaurant_id: req.body.restaurantId,
    delivery_address_id: req.body.deliveryAddressId || null,
    items: req.body.items || [],
    subtotal_paise: req.body.subtotalPaise,
    delivery_fee_paise: req.body.deliveryFeePaise,
    platform_fee_paise: req.body.platformFeePaise,
    total_paise: req.body.totalPaise,
    status: "pending",
    notes: req.body.notes || "",
    city: req.body.city || "Hyderabad"
  };

  if (!supabaseAdmin) {
    return res.status(201).json({
      success: true,
      data: decorateOrder(payload),
      message: "Order was validated. Configure Supabase to persist and broadcast it."
    });
  }

  const { data, error } = await supabaseAdmin.from("orders").insert(payload).select().single();

  if (error) {
    throw error;
  }

  res.status(201).json({
    success: true,
    data: decorateOrder(data)
  });
}

export async function updateOrderStatus(req, res) {
  const nextStatus = req.body.status;
  const requestedDeliveryId = req.body.assignedDeliveryId;
  const role = req.profile?.role;

  if (!nextStatus && !requestedDeliveryId) {
    return res.status(400).json({
      success: false,
      message: "Provide a status update or a delivery assignment."
    });
  }

  if (!supabaseAdmin) {
    return res.json({
      success: true,
      data: {
        id: req.params.orderId,
        status: nextStatus,
        assigned_delivery_id: requestedDeliveryId || null
      }
    });
  }

  const existingOrder = await fetchOrderForUpdate(req.params.orderId);
  const patch = {};

  if (role === "owner") {
    await assertOwnerCanManageOrder(req.profile.id, existingOrder.restaurant_id);

    if (requestedDeliveryId) {
      return res.status(400).json({
        success: false,
        message: "Delivery assignment is handled from the delivery workflow."
      });
    }

    if (!nextStatus || !OWNER_ALLOWED_STATUSES.has(nextStatus)) {
      return res.status(400).json({
        success: false,
        message: "Owners can move orders to accepted, preparing, or cancelled."
      });
    }

    if (!isAllowedTransition(existingOrder.status, nextStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot move an order from ${existingOrder.status} to ${nextStatus}.`
      });
    }

    patch.status = nextStatus;
  }

  if (role === "delivery") {
    const deliveryId = req.profile.id;

    if (requestedDeliveryId) {
      if (requestedDeliveryId !== deliveryId) {
        return res.status(403).json({
          success: false,
          message: "Delivery partners may only assign orders to themselves."
        });
      }

      if (existingOrder.assigned_delivery_id && existingOrder.assigned_delivery_id !== deliveryId) {
        return res.status(403).json({
          success: false,
          message: "This order is already assigned to another delivery partner."
        });
      }

      if (!["accepted", "preparing"].includes(existingOrder.status)) {
        return res.status(400).json({
          success: false,
          message: "Only accepted or preparing orders can be claimed."
        });
      }

      patch.assigned_delivery_id = deliveryId;
    }

    const effectiveDeliveryId = patch.assigned_delivery_id || existingOrder.assigned_delivery_id;

    if (nextStatus) {
      if (!DELIVERY_ALLOWED_STATUSES.has(nextStatus)) {
        return res.status(400).json({
          success: false,
          message: "Delivery partners can move orders to picked_up, on_the_way, or delivered."
        });
      }

      if (!effectiveDeliveryId || effectiveDeliveryId !== deliveryId) {
        return res.status(403).json({
          success: false,
          message: "Claim this order before updating its delivery status."
        });
      }

      if (!isAllowedTransition(existingOrder.status, nextStatus)) {
        return res.status(400).json({
          success: false,
          message: `Cannot move an order from ${existingOrder.status} to ${nextStatus}.`
        });
      }

      patch.status = nextStatus;
    }
  }

  if (Object.keys(patch).length === 0) {
    return res.status(400).json({
      success: false,
      message: "No valid order update was supplied."
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
    data: decorateOrder(data)
  });
}
