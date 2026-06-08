const ORDER_STATUS_LABELS = {
  pending: "Pending",
  accepted: "Accepted",
  preparing: "Preparing",
  picked_up: "Picked up",
  on_the_way: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled"
};

const ORDER_STATUS_STYLES = {
  pending: "badge-amber",
  accepted: "badge-blue",
  preparing: "badge-violet",
  picked_up: "badge-blue",
  on_the_way: "badge-green",
  delivered: "badge-green",
  cancelled: "badge-red"
};

const CUSTOMER_TIMELINE = [
  "pending",
  "accepted",
  "preparing",
  "picked_up",
  "on_the_way",
  "delivered"
];

export function formatOrderStatus(status = "pending") {
  return ORDER_STATUS_LABELS[status] || status.replaceAll("_", " ");
}

export function getOrderStatusStyle(status = "pending") {
  return ORDER_STATUS_STYLES[status] || ORDER_STATUS_STYLES.pending;
}

export function formatPaise(value = 0) {
  const amount = Number(value || 0) / 100;
  return `₹${amount.toFixed(2)}`;
}

export function shortOrderId(id) {
  if (!id) return "New order";
  return `#${id.slice(0, 8).toUpperCase()}`;
}

export function formatOrderDate(value) {
  if (!value) return "Just now";
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

export function getTimelineSteps(status = "pending") {
  const reachedIndex = CUSTOMER_TIMELINE.indexOf(status);
  return CUSTOMER_TIMELINE.map((step, index) => ({
    key: step,
    label: formatOrderStatus(step),
    isActive: reachedIndex >= index,
    isCurrent: step === status
  }));
}

export function getOwnerActions(status = "pending") {
  if (status === "pending") {
    return [
      { label: "Accept order", status: "accepted", tone: "primary" },
      { label: "Cancel order", status: "cancelled", tone: "danger" }
    ];
  }
  if (status === "accepted") {
    return [
      { label: "Mark preparing", status: "preparing", tone: "primary" },
      { label: "Cancel order", status: "cancelled", tone: "danger" }
    ];
  }
  if (status === "preparing") {
    return [{ label: "Cancel order", status: "cancelled", tone: "danger" }];
  }
  return [];
}

export function getDeliveryActions(order) {
  if (!order) return [];
  if (!order.assigned_delivery_id) {
    return [{ label: "Claim order", mode: "claim", tone: "primary" }];
  }
  if (order.status === "accepted" || order.status === "preparing") {
    return [{ label: "Mark picked up", mode: "status", status: "picked_up", tone: "primary" }];
  }
  if (order.status === "picked_up") {
    return [{ label: "Start trip", mode: "status", status: "on_the_way", tone: "primary" }];
  }
  if (order.status === "on_the_way") {
    return [{ label: "Complete delivery", mode: "status", status: "delivered", tone: "primary" }];
  }
  return [];
}

export function getItemCount(order) {
  if (!Array.isArray(order?.items)) return 0;
  return order.items.reduce((count, item) => count + Number(item.quantity || 0), 0);
}