import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { formatOrderDate, formatPaise, shortOrderId } from "../../lib/orderPresentation";
import { listCustomerOrders } from "../../services/orderService";
import OrderStatusBadge from "../common/OrderStatusBadge";

export default function OrderHistoryTab() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listCustomerOrders()
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card-surface h-24 animate-pulse" style={{ background: "var(--muted)" }} />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="card-surface p-10 text-center">
        <p className="text-4xl">🍽️</p>
        <p className="mt-3 font-semibold" style={{ color: "var(--ink)" }}>No orders yet</p>
        <p className="mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>
          Your order history will appear here once you place an order.
        </p>
      </div>
    );
  }

  const activeStatuses = new Set(["pending", "accepted", "preparing", "picked_up", "on_the_way"]);

  return (
    <div className="space-y-4">
      <div>
        <p className="label-xs">Past orders</p>
        <h3 className="mt-1 text-xl font-semibold" style={{ color: "var(--ink)" }}>
          {orders.length} order{orders.length !== 1 ? "s" : ""}
        </h3>
      </div>

      {orders.map((order) => (
        <div key={order.id} className="card-surface p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-medium" style={{ color: "var(--ink-muted)" }}>
                {shortOrderId(order.id)}
              </p>
              <p className="mt-1 font-semibold" style={{ color: "var(--ink)" }}>
                {order.restaurant?.name || "Restaurant"}
              </p>
              <p className="mt-0.5 text-sm" style={{ color: "var(--ink-muted)" }}>
                {formatOrderDate(order.created_at)}
              </p>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>

          <div
            className="mt-4 flex flex-wrap gap-x-6 gap-y-1 border-t pt-3 text-sm"
            style={{ borderColor: "var(--border)" }}
          >
            <span style={{ color: "var(--ink-muted)" }}>
              {Array.isArray(order.items) ? order.items.length : 0} item{(Array.isArray(order.items) ? order.items.length : 0) !== 1 ? "s" : ""}
            </span>
            <span className="font-semibold" style={{ color: "var(--ink)" }}>
              {formatPaise(order.total_paise)}
            </span>

            {/* Track link — only for active/live orders */}
            {activeStatuses.has(order.status) && (
              <Link
                to={`/order/${order.id}/track`}
                className="ml-auto text-xs font-semibold"
                style={{ color: "var(--brand)" }}
              >
                Track order →
              </Link>
            )}

            {/* View review / re-open tracking for delivered orders */}
            {order.status === "delivered" && (
              <Link
                to={`/order/${order.id}/track`}
                className="ml-auto text-xs"
                style={{ color: "var(--ink-muted)" }}
              >
                View details
              </Link>
            )}
          </div>

          {Array.isArray(order.items) && order.items.length > 0 && (
            <p className="mt-1 text-xs" style={{ color: "var(--ink-muted)" }}>
              {order.items.map((i) => `${i.name} ×${i.qty || i.quantity || 1}`).join(" · ")}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}