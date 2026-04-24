import { supabaseAdmin } from "../config/supabaseClient.js";

const SAMPLE_ASSIGNED_ORDERS = [
  {
    id: "9df4583f-931a-4a8a-a8b9-e5fd83c3ce8a",
    status: "picked_up",
    city: "Hyderabad",
    restaurant: {
      name: "Paradise Signature",
      city: "Hyderabad"
    }
  }
];

const SAMPLE_AVAILABLE_ORDERS = [
  {
    id: "1cd4583f-931a-4a8a-a8b9-e5fd83c3ce8a",
    status: "accepted",
    city: "Hyderabad",
    restaurant: {
      name: "Mehfil Restaurant",
      city: "Hyderabad"
    }
  }
];

const DELIVERY_ORDER_SELECT = `
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

function decorateOrders(orders = []) {
  return orders.map((order) => ({
    ...order,
    item_count: Array.isArray(order?.items)
      ? order.items.reduce((count, item) => count + Number(item.quantity || 0), 0)
      : 0
  }));
}

export async function listAssignedDeliveries(req, res) {
  if (!supabaseAdmin) {
    return res.json({
      success: true,
      data: decorateOrders(SAMPLE_ASSIGNED_ORDERS)
    });
  }

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select(DELIVERY_ORDER_SELECT)
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

export async function listAvailableDeliveries(req, res) {
  if (!supabaseAdmin) {
    return res.json({
      success: true,
      data: decorateOrders(SAMPLE_AVAILABLE_ORDERS)
    });
  }

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select(DELIVERY_ORDER_SELECT)
    .is("assigned_delivery_id", null)
    .in("status", ["accepted", "preparing"])
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  res.json({
    success: true,
    data: decorateOrders(data)
  });
}
