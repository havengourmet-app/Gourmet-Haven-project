import { supabaseAdmin } from "../config/supabaseClient.js";

function groupByDate(orders, rangeType) {
  const counts = {};
  const revenue = {};

  for (const order of orders) {
    if (order.status === "cancelled") continue;

    const date = new Date(order.created_at);
    let key;

    if (rangeType === "daily") {
      key = date.toISOString().slice(0, 10); // YYYY-MM-DD
    } else if (rangeType === "weekly") {
      // ISO week: Mon-Sun, get Monday of that week
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(date.setDate(diff));
      key = monday.toISOString().slice(0, 10);
    } else {
      key = date.toISOString().slice(0, 7); // YYYY-MM
    }

    counts[key] = (counts[key] || 0) + 1;
    revenue[key] = (revenue[key] || 0) + Number(order.total_paise || 0);
  }

  const keys = Object.keys(counts).sort();
  return keys.map((k) => ({ period: k, orders: counts[k], revenue_paise: revenue[k] }));
}

function getTopItems(orders, limit = 5) {
  const tally = {};

  for (const order of orders) {
    if (order.status === "cancelled") continue;
    if (!Array.isArray(order.items)) continue;

    for (const item of order.items) {
      const key = item.name || "Unknown";
      if (!tally[key]) tally[key] = { name: key, count: 0, revenue_paise: 0 };
      const qty = Number(item.qty || item.quantity || 0);
      tally[key].count += qty;
      tally[key].revenue_paise += qty * Number(item.price || 0);
    }
  }

  return Object.values(tally)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function getStatusBreakdown(orders) {
  const breakdown = {};

  for (const order of orders) {
    const s = order.status || "unknown";
    breakdown[s] = (breakdown[s] || 0) + 1;
  }

  return Object.entries(breakdown).map(([status, count]) => ({ status, count }));
}

export async function getOwnerAnalytics(req, res) {
  const range = req.query.range || "monthly"; // daily | weekly | monthly
  const ownerId = req.profile?.id || req.user.id;

  if (!["daily", "weekly", "monthly"].includes(range)) {
    return res.status(400).json({ success: false, message: "range must be daily, weekly, or monthly." });
  }

  if (!supabaseAdmin) {
    return res.json({
      success: true,
      data: {
        timeline: [],
        topItems: [],
        statusBreakdown: [],
        totalRevenuePaise: 0,
        totalOrders: 0
      }
    });
  }

  const { data: restaurants, error: restaurantError } = await supabaseAdmin
    .from("restaurants")
    .select("id")
    .eq("owner_id", ownerId);

  if (restaurantError) throw restaurantError;

  const restaurantIds = (restaurants || []).map((r) => r.id);

  if (restaurantIds.length === 0) {
    return res.json({
      success: true,
      data: { timeline: [], topItems: [], statusBreakdown: [], totalRevenuePaise: 0, totalOrders: 0 }
    });
  }

  // Fetch last 90 days of orders
  const since = new Date();
  since.setDate(since.getDate() - 90);

  const { data: orders, error: ordersError } = await supabaseAdmin
    .from("orders")
    .select("id, status, total_paise, items, created_at")
    .in("restaurant_id", restaurantIds)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true });

  if (ordersError) throw ordersError;

  const allOrders = orders || [];

  const totalRevenuePaise = allOrders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + Number(o.total_paise || 0), 0);

  res.json({
    success: true,
    data: {
      timeline: groupByDate(allOrders, range),
      topItems: getTopItems(allOrders),
      statusBreakdown: getStatusBreakdown(allOrders),
      totalRevenuePaise,
      totalOrders: allOrders.length
    }
  });
}