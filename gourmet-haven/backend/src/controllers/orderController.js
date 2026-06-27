import { randomUUID } from "node:crypto";
import {
  hasRazorpayConfig,
  isRazorpayModeAllowed,
  razorpay,
  razorpayKeyId,
  verifyOrderPaymentSignature
} from "../config/razorpay.js";
import { supabaseAdmin } from "../config/supabaseClient.js";
import { assertPaise } from "../utils/money.js";
import { restaurantHasActiveSubscription } from "../utils/subscriptionAccess.js";

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

const DELIVERY_FEE_PAISE = 3000;
const PLATFORM_FEE_PAISE = 0;
const MINIMUM_ORDER_SUBTOTAL_PAISE = 10000;

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
  payment_status,
  payment_provider,
  razorpay_order_id,
  razorpay_payment_id,
  refund_status,
  refund_notes,
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

export function normalizeOrderItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  const byItemId = new Map();

  for (const item of items) {
    const id = item?.id;
    const quantity = Number(item?.qty ?? item?.quantity ?? 0);

    if (!id || !Number.isInteger(quantity) || quantity <= 0) {
      const error = new Error("Each order item must include an id and a positive integer quantity.");
      error.statusCode = 400;
      throw error;
    }

    byItemId.set(id, (byItemId.get(id) || 0) + quantity);
  }

  return Array.from(byItemId.entries()).map(([id, quantity]) => ({
    id,
    qty: quantity,
    quantity
  }));
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
    .select("id, status, restaurant_id, assigned_delivery_id, payment_status")
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
    .select("id, name, city, is_active, subscription_status")
    .eq("id", restaurantId)
    .single();

  if (error || !data || !data.is_active || !restaurantHasActiveSubscription(data)) {
    const restaurantError = new Error("Restaurant is not currently accepting orders.");
    restaurantError.statusCode = 400;
    throw restaurantError;
  }

  return data;
}

function buildSavedAddressSnapshot(address) {
  const fullAddress = [address.line_1, address.line_2, address.locality, address.city, address.pincode]
    .filter(Boolean)
    .join(", ");

  return {
    full_address: fullAddress,
    label: address.label || null,
    recipient_name: address.recipient_name || null,
    phone: address.phone || null,
    locality: address.locality || null,
    lat: null,
    lng: null
  };
}

async function resolveDeliveryAddress(customerId, deliveryAddressId, deliveryAddress) {
  if (deliveryAddressId) {
    const { data, error } = await supabaseAdmin
      .from("addresses")
      .select("id, label, recipient_name, phone, line_1, line_2, locality, city, pincode")
      .eq("id", deliveryAddressId)
      .eq("profile_id", customerId)
      .single();

    if (error || !data) {
      const addressError = new Error("Selected delivery address was not found.");
      addressError.statusCode = 400;
      throw addressError;
    }

    return {
      deliveryAddressId: data.id,
      snapshot: buildSavedAddressSnapshot(data)
    };
  }

  if (!deliveryAddress?.full_address?.trim()) {
    const addressError = new Error("A delivery address is required.");
    addressError.statusCode = 400;
    throw addressError;
  }

  return {
    deliveryAddressId: null,
    snapshot: {
      full_address: deliveryAddress.full_address.trim(),
      lat: typeof deliveryAddress.lat === "number" ? deliveryAddress.lat : null,
      lng: typeof deliveryAddress.lng === "number" ? deliveryAddress.lng : null
    }
  };
}

async function buildValidatedOrderItems(restaurantId, requestedItems) {
  const itemIds = requestedItems.map((item) => item.id);

  const { data: menuItems, error } = await supabaseAdmin
    .from("menu_items")
    .select("id, restaurant_id, name, price_paise, image_url, is_available")
    .in("id", itemIds);

  if (error) throw error;

  const menuById = new Map((menuItems || []).map((item) => [item.id, item]));

  const orderItems = requestedItems.map((requested) => {
    const menuItem = menuById.get(requested.id);

    if (!menuItem || menuItem.restaurant_id !== restaurantId) {
      const itemError = new Error("One or more cart items do not belong to this restaurant.");
      itemError.statusCode = 400;
      throw itemError;
    }

    if (!menuItem.is_available) {
      const itemError = new Error(`${menuItem.name} is not currently available.`);
      itemError.statusCode = 400;
      throw itemError;
    }

    return {
      id: menuItem.id,
      name: menuItem.name,
      price: Number(menuItem.price_paise || 0),
      qty: requested.qty,
      quantity: requested.quantity,
      image_url: menuItem.image_url || null
    };
  });

  const subtotalPaise = orderItems.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0),
    0
  );

  return { orderItems, subtotalPaise };
}

export function assertClientAmountMatches(clientValue, serverValue, fieldName) {
  if (typeof clientValue === "undefined" || clientValue === null) {
    return;
  }

  assertPaise(clientValue, fieldName);

  if (Number(clientValue) !== Number(serverValue)) {
    const error = new Error(`${fieldName} does not match the current menu price.`);
    error.statusCode = 400;
    throw error;
  }
}

async function buildTrustedOrderPayload(req) {
  const restaurantId = req.body.restaurant_id || req.body.restaurantId;
  const subtotalPaise = req.body.subtotal ?? req.body.subtotalPaise;
  const deliveryFeePaise = req.body.delivery_fee ?? req.body.deliveryFeePaise;
  const platformFeePaise = req.body.platform_fee ?? req.body.platformFeePaise ?? 0;
  const totalPaise = req.body.total ?? req.body.totalPaise;
  const deliveryAddress = req.body.delivery_address || req.body.deliveryAddress || null;
  const requestedDeliveryAddressId = req.body.delivery_address_id || req.body.deliveryAddressId || null;
  const normalizedItems = normalizeOrderItems(req.body.items);

  if (!restaurantId) {
    const error = new Error("restaurant_id is required to place an order.");
    error.statusCode = 400;
    throw error;
  }

  if (normalizedItems.length === 0) {
    const error = new Error("Add at least one item before placing an order.");
    error.statusCode = 400;
    throw error;
  }

  if (!requestedDeliveryAddressId && !deliveryAddress?.full_address?.trim()) {
    const error = new Error("A delivery address is required.");
    error.statusCode = 400;
    throw error;
  }

  const restaurant = await fetchActiveRestaurantForOrder(restaurantId);
  const { orderItems, subtotalPaise: calculatedSubtotalPaise } = await buildValidatedOrderItems(
    restaurantId,
    normalizedItems
  );
  const calculatedDeliveryFeePaise = calculatedSubtotalPaise > 0 ? DELIVERY_FEE_PAISE : 0;
  const calculatedPlatformFeePaise = calculatedSubtotalPaise > 0 ? PLATFORM_FEE_PAISE : 0;
  const calculatedTotalPaise = calculatedSubtotalPaise + calculatedDeliveryFeePaise + calculatedPlatformFeePaise;
  const { deliveryAddressId, snapshot: deliveryAddressSnapshot } = await resolveDeliveryAddress(
    req.user.id,
    requestedDeliveryAddressId,
    deliveryAddress
  );

  assertClientAmountMatches(subtotalPaise, calculatedSubtotalPaise, "subtotal");
  assertClientAmountMatches(deliveryFeePaise, calculatedDeliveryFeePaise, "delivery_fee");
  assertClientAmountMatches(platformFeePaise, calculatedPlatformFeePaise, "platform_fee");
  assertClientAmountMatches(totalPaise, calculatedTotalPaise, "total");

  if (calculatedSubtotalPaise < MINIMUM_ORDER_SUBTOTAL_PAISE) {
    const error = new Error("Minimum order value is Rs 100.");
    error.statusCode = 400;
    throw error;
  }

  return {
    restaurant,
    deliveryAddressId,
    deliveryAddressSnapshot,
    orderItems,
    subtotalPaise: calculatedSubtotalPaise,
    deliveryFeePaise: calculatedDeliveryFeePaise,
    platformFeePaise: calculatedPlatformFeePaise,
    totalPaise: calculatedTotalPaise
  };
}

function toOrderInsertPayload({ customerId, trustedOrder, payment = {} }) {
  return {
    id: randomUUID(),
    customer_id: customerId,
    restaurant_id: trustedOrder.restaurant.id,
    delivery_address_id: trustedOrder.deliveryAddressId,
    items: trustedOrder.orderItems,
    subtotal_paise: trustedOrder.subtotalPaise,
    delivery_fee_paise: trustedOrder.deliveryFeePaise,
    platform_fee_paise: trustedOrder.platformFeePaise,
    total_paise: trustedOrder.totalPaise,
    status: "pending",
    notes: JSON.stringify({ delivery_address: trustedOrder.deliveryAddressSnapshot }),
    city: trustedOrder.restaurant.city || "Hyderabad",
    payment_status: payment.paymentStatus || "unpaid",
    payment_provider: payment.paymentProvider || null,
    razorpay_order_id: payment.razorpayOrderId || null,
    razorpay_payment_id: payment.razorpayPaymentId || null
  };
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
  if (process.env.ALLOW_UNPAID_CUSTOMER_ORDERS !== "true") {
    return res.status(403).json({
      success: false,
      message: "Online payment is required before placing an order.",
      code: "PAYMENT_REQUIRED"
    });
  }

  if (!supabaseAdmin) {
    const subtotalPaise = req.body.subtotal ?? req.body.subtotalPaise;
    const deliveryFeePaise = req.body.delivery_fee ?? req.body.deliveryFeePaise;
    const platformFeePaise = req.body.platform_fee ?? req.body.platformFeePaise ?? 0;
    const totalPaise = req.body.total ?? req.body.totalPaise;
    assertPaise(subtotalPaise, "subtotal");
    assertPaise(deliveryFeePaise, "delivery_fee");
    assertPaise(platformFeePaise, "platform_fee");
    assertPaise(totalPaise, "total");

    const deliveryAddressSnapshot = {
      full_address: req.body.delivery_address?.full_address?.trim() || "Delivery address",
      lat: typeof req.body.delivery_address?.lat === "number" ? req.body.delivery_address.lat : null,
      lng: typeof req.body.delivery_address?.lng === "number" ? req.body.delivery_address.lng : null
    };

    const payload = {
      id: randomUUID(),
      customer_id: req.user.id,
      restaurant_id: req.body.restaurant_id || req.body.restaurantId,
      delivery_address_id: req.body.delivery_address_id || req.body.deliveryAddressId || null,
      items: normalizeOrderItems(req.body.items),
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

  const trustedOrder = await buildTrustedOrderPayload(req);
  const payload = toOrderInsertPayload({ customerId: req.user.id, trustedOrder });

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

export async function createOrderPaymentCheckout(req, res) {
  if (!hasRazorpayConfig || !razorpay) {
    return res.status(503).json({
      success: false,
      message: "Razorpay is not configured for customer payments.",
      code: "RAZORPAY_NOT_CONFIGURED"
    });
  }

  if (!isRazorpayModeAllowed) {
    return res.status(403).json({
      success: false,
      message: "Live Razorpay keys are blocked in this environment. Use test keys first.",
      code: "RAZORPAY_LIVE_MODE_BLOCKED"
    });
  }

  if (!supabaseAdmin) {
    return res.status(503).json({
      success: false,
      message: "Supabase admin is required to create paid orders.",
      code: "SUPABASE_NOT_CONFIGURED"
    });
  }

  const trustedOrder = await buildTrustedOrderPayload(req);
  const receipt = `qd_${randomUUID().replaceAll("-", "").slice(0, 24)}`;
  const razorpayOrder = await razorpay.orders.create({
    amount: trustedOrder.totalPaise,
    currency: "INR",
    receipt,
    notes: {
      customer_id: req.user.id,
      restaurant_id: trustedOrder.restaurant.id
    }
  });

  const attemptPayload = {
    customer_id: req.user.id,
    restaurant_id: trustedOrder.restaurant.id,
    delivery_address_id: trustedOrder.deliveryAddressId,
    items: trustedOrder.orderItems,
    subtotal_paise: trustedOrder.subtotalPaise,
    delivery_fee_paise: trustedOrder.deliveryFeePaise,
    platform_fee_paise: trustedOrder.platformFeePaise,
    total_paise: trustedOrder.totalPaise,
    currency: "INR",
    status: "created",
    razorpay_order_id: razorpayOrder.id,
    notes: JSON.stringify({ delivery_address: trustedOrder.deliveryAddressSnapshot }),
    city: trustedOrder.restaurant.city || "Hyderabad"
  };

  const { data: attempt, error } = await supabaseAdmin
    .from("order_payment_attempts")
    .insert(attemptPayload)
    .select()
    .single();

  if (error) throw error;

  res.status(201).json({
    success: true,
    data: {
      key_id: razorpayKeyId,
      razorpay_order_id: razorpayOrder.id,
      amount_paise: trustedOrder.totalPaise,
      currency: "INR",
      attempt_id: attempt.id,
      checkout: {
        name: "QuickDyne",
        description: `Food order from ${trustedOrder.restaurant.name}`,
        prefill: {
          name: req.profile?.full_name || "",
          email: req.user?.email || ""
        }
      }
    }
  });
}

export async function verifyOrderPayment(req, res) {
  const razorpayOrderId = req.body.razorpay_order_id;
  const razorpayPaymentId = req.body.razorpay_payment_id;
  const signature = req.body.razorpay_signature;

  if (!verifyOrderPaymentSignature({ orderId: razorpayOrderId, paymentId: razorpayPaymentId, signature })) {
    return res.status(400).json({
      success: false,
      message: "Invalid Razorpay payment signature.",
      code: "INVALID_RAZORPAY_SIGNATURE"
    });
  }

  if (!supabaseAdmin) {
    return res.status(503).json({
      success: false,
      message: "Supabase admin is required to verify paid orders.",
      code: "SUPABASE_NOT_CONFIGURED"
    });
  }

  const { data: existingOrder, error: existingOrderError } = await supabaseAdmin
    .from("orders")
    .select("id, status, total_paise, created_at")
    .eq("razorpay_order_id", razorpayOrderId)
    .maybeSingle();

  if (existingOrderError) throw existingOrderError;
  if (existingOrder) {
    return res.json({ success: true, order: existingOrder });
  }

  const { data: attempt, error: attemptError } = await supabaseAdmin
    .from("order_payment_attempts")
    .select("*")
    .eq("razorpay_order_id", razorpayOrderId)
    .eq("customer_id", req.user.id)
    .maybeSingle();

  if (attemptError) throw attemptError;
  if (!attempt) {
    return res.status(404).json({
      success: false,
      message: "Payment attempt not found.",
      code: "PAYMENT_ATTEMPT_NOT_FOUND"
    });
  }

  if (attempt.status !== "created" && attempt.status !== "paid") {
    return res.status(400).json({
      success: false,
      message: "This payment attempt can no longer create an order.",
      code: "PAYMENT_ATTEMPT_CLOSED"
    });
  }

  const trustedOrder = {
    restaurant: { id: attempt.restaurant_id, city: attempt.city || "Hyderabad" },
    deliveryAddressId: attempt.delivery_address_id,
    deliveryAddressSnapshot: parseDeliveryAddressSnapshot(attempt.notes),
    orderItems: attempt.items,
    subtotalPaise: attempt.subtotal_paise,
    deliveryFeePaise: attempt.delivery_fee_paise,
    platformFeePaise: attempt.platform_fee_paise,
    totalPaise: attempt.total_paise
  };

  const orderPayload = toOrderInsertPayload({
    customerId: req.user.id,
    trustedOrder,
    payment: {
      paymentStatus: "paid",
      paymentProvider: "razorpay",
      razorpayOrderId,
      razorpayPaymentId
    }
  });

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert(orderPayload)
    .select("id, status, total_paise, created_at")
    .single();

  if (orderError) throw orderError;

  await supabaseAdmin
    .from("order_payment_attempts")
    .update({ status: "paid", razorpay_payment_id: razorpayPaymentId })
    .eq("id", attempt.id);

  res.status(201).json({
    success: true,
    order
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

  if (role === "customer") {
    if (requestedDeliveryId) {
      return res.status(400).json({
        success: false,
        message: "Customers cannot assign delivery partners."
      });
    }

    if (existingOrder.restaurant_id && existingOrder.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Customers can only cancel orders while they are pending."
      });
    }

    if (nextStatus !== "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Customers can only cancel pending orders."
      });
    }

    const { data: customerOrder, error: customerOrderError } = await supabaseAdmin
      .from("orders")
      .select("id")
      .eq("id", req.params.orderId)
      .eq("customer_id", req.profile.id)
      .single();

    if (customerOrderError || !customerOrder) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this order."
      });
    }

    patch.status = "cancelled";
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

  // Fixes C3: if a Razorpay-paid order is being cancelled (by any role —
  // customer, owner, or a future admin override), flag that a refund is
  // owed instead of silently doing nothing. This does not call Razorpay's
  // refund API yet; it makes the obligation visible and queryable so it
  // can't be quietly forgotten, and gives a clean column to wire the real
  // refund call into later.
  if (patch.status === "cancelled" && existingOrder.payment_status === "paid") {
    patch.refund_status = "refund_required";
    patch.refund_notes = `Order cancelled by ${role} on ${new Date().toISOString()}; payment was already captured via Razorpay and has not yet been refunded.`;
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