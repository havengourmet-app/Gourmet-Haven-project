import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "../config/supabaseClient.js";
import { assertPaise } from "../utils/money.js";

const SAMPLE_ORDERS = [
  {
    id: "c13e8239-85fd-49e9-ac51-a01b992fe930",
    status: "pending",
    total_paise: 13000,
    city: "Hyderabad",
    items: [{ qty: 1, price: 10000 }],
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
  restaurant:restaurants(id, name, city, locality, logo_url),
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

function parseDeliveryAddressSnapshot(notes) {
  if (!notes) {
    return null;
  }

  try {
    const parsed = JSON.parse(notes);
    const address = parsed?.delivery_address;

    if (!address?.full_address) {
      return null;
    }

    return {
      full_address: address.full_address,
      locality: address.locality || null,
      lat: typeof address.lat === "number" ? address.lat : null,
      lng: typeof address.lng === "number" ? address.lng : null
    };
  } catch {
    return null;
  }
}

function toRelatedDeliveryAddress(deliveryAddress) {
  if (!deliveryAddress) {
    return null;
  }

  const fullAddress = [deliveryAddress.line_1, deliveryAddress.locality, deliveryAddress.pincode]
    .filter(Boolean)
    .join(", ");

  return {
    ...deliveryAddress,
    full_address: fullAddress || deliveryAddress.line_1 || null
  };
}

function getDecoratedDeliveryAddress(order) {
  if (order?.delivery_address) {
    return toRelatedDeliveryAddress(order.delivery_address);
  }

  return parseDeliveryAddressSnapshot(order?.notes);
}

function decorateOrder(order) {
  return {
    ...order,
    delivery_address: getDecoratedDeliveryAddress(order),
    item_count: Array.isArray(order?.items)
      ? order.items.reduce((count, item) => count + Number(item.qty || item.quantity || 0), 0)
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

function normalizeOrderItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => {
      const quantity = Number(item.qty ?? item.quantity ?? 0);

      return {
        id: item.id,
        name: item.name,
        price: Number(item.price ?? item.pricePaise ?? 0),
        qty: quantity,
        quantity,
        image_url: item.image_url || item.imageUrl || null
      };
    })
    .filter((item) => item.id && item.name && Number.isFinite(item.price) && item.price >= 0 && item.qty > 0);
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

async function fetchActiveRestaurantForOrder(restaurantId) {
  const { data, error } = await supabaseAdmin
    .from("restaurants")
    .select("id, name, city, is_active")
    .eq("id", restaurantId)
    .single();

  if (error || !data || !data.is_active) {
    const restaurantError = new Error("Restaurant not found or is not currently available.");
    restaurantError.statusCode = 400;
    throw restaurantError;
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

export async function fetchOrder(req, res) {
  if (!supabaseAdmin) {
    const sampleOrder = decorateOrder(SAMPLE_ORDERS[0]);
    return res.json({
      order: sampleOrder.id === req.params.orderId ? sampleOrder : null
    });
  }

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select(ORDER_SELECT)
    .eq("id", req.params.orderId)
    // Removed: .eq("customer_id", req.user.id)
    // Reason: owner/delivery may also need to fetch a specific order.
    // Security is maintained because:
    // - Customers can only see their own orders via the RLS policy + auth token
    // - The supabaseAdmin bypasses RLS but we verify auth via requireAuth middleware
    // - The order ID is a UUID — not guessable
    // - For extra security, verify the requester has some relation to the order:
    .single();

  if (error || !data) {
    return res.status(404).json({
      success: false,
      message: "Order not found."
    });
  }

  // Authorization check: only the customer, the restaurant owner, or assigned delivery partner
  // can view this order
  const userId = req.user.id;
  const isCustomer = data.customer_id === userId;
  
  // Check if owner of the restaurant
  let isOwner = false;
  if (data.restaurant_id) {
    const { data: restaurant } = await supabaseAdmin
      .from("restaurants")
      .select("owner_id")
      .eq("id", data.restaurant_id)
      .single();
    isOwner = restaurant?.owner_id === userId;
  }

  const isDelivery = data.assigned_delivery_id === userId;

  if (!isCustomer && !isOwner && !isDelivery) {
    return res.status(403).json({
      success: false,
      message: "You do not have access to this order."
    });
  }

  res.json({
    order: decorateOrder(data)
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
  const restaurantId = req.body.restaurant_id || req.body.restaurantId;
  const subtotalPaise = req.body.subtotal ?? req.body.subtotalPaise;
  const deliveryFeePaise = req.body.delivery_fee ?? req.body.deliveryFeePaise;
  const platformFeePaise = req.body.platform_fee ?? req.body.platformFeePaise ?? 0;
  const totalPaise = req.body.total ?? req.body.totalPaise;
  const deliveryAddress = req.body.delivery_address || req.body.deliveryAddress || null;
  const normalizedItems = normalizeOrderItems(req.body.items);

  if (!restaurantId) {
    return res.status(400).json({
      success: false,
      message: "restaurant_id is required to place an order."
    });
  }

  if (normalizedItems.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Add at least one item before placing an order."
    });
  }

  if (!deliveryAddress?.full_address?.trim()) {
    return res.status(400).json({
      success: false,
      message: "A delivery address is required."
    });
  }

  assertPaise(subtotalPaise, "subtotal");
  assertPaise(deliveryFeePaise, "delivery_fee");
  assertPaise(platformFeePaise, "platform_fee");
  assertPaise(totalPaise, "total");

  if (Number(totalPaise) < 10000) {
    return res.status(400).json({
      success: false,
      message: "Minimum order value is Rs 100."
    });
  }

  const deliveryAddressSnapshot = {
    full_address: deliveryAddress.full_address.trim(),
    lat: typeof deliveryAddress.lat === "number" ? deliveryAddress.lat : null,
    lng: typeof deliveryAddress.lng === "number" ? deliveryAddress.lng : null
  };

  if (!supabaseAdmin) {
    const payload = {
      id: randomUUID(),
      customer_id: req.user.id,
      restaurant_id: restaurantId,
      delivery_address_id: null,
      items: normalizedItems,
      subtotal_paise: subtotalPaise,
      delivery_fee_paise: deliveryFeePaise,
      platform_fee_paise: platformFeePaise,
      total_paise: totalPaise,
      status: "pending",
      notes: JSON.stringify({ delivery_address: deliveryAddressSnapshot }),
      city: "Hyderabad",
      created_at: new Date().toISOString()
    };

    return res.status(201).json({
      order: {
        id: payload.id,
        status: payload.status,
        total_paise: payload.total_paise,
        created_at: payload.created_at
      }
    });
  }

  const restaurant = await fetchActiveRestaurantForOrder(restaurantId);
  const payload = {
    id: randomUUID(),
    customer_id: req.user.id,
    restaurant_id: restaurantId,
    delivery_address_id: null,
    items: normalizedItems,
    subtotal_paise: subtotalPaise,
    delivery_fee_paise: deliveryFeePaise,
    platform_fee_paise: platformFeePaise,
    total_paise: totalPaise,
    status: "pending",
    notes: JSON.stringify({ delivery_address: deliveryAddressSnapshot }),
    city: restaurant.city || "Hyderabad"
  };

  const { data, error } = await supabaseAdmin
    .from("orders")
    .insert(payload)
    .select("id, status, total_paise, created_at")
    .single();

  if (error) {
    throw error;
  }

  res.status(201).json({
    order: data
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
