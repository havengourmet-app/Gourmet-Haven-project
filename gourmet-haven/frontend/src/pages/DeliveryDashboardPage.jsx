import { useEffect, useState } from "react";
import OrderStatusBadge from "../components/common/OrderStatusBadge";
import Shell from "../components/common/Shell";
import StatCard from "../components/common/StatCard";
import { useAuth } from "../hooks/useAuth";
import { useRealtimeOrders } from "../hooks/useRealtimeOrders";
import { formatOrderDate, formatOrderStatus, formatPaise, getDeliveryActions, getItemCount, shortOrderId } from "../lib/orderPresentation";
import { listAssignedDeliveries, listAvailableDeliveries } from "../services/deliveryService";
import { updateOrderStatus } from "../services/orderService";

export default function DeliveryDashboardPage() {
  const { profile } = useAuth();
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [ready, setReady] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [busyOrderId, setBusyOrderId] = useState(null);
  const [feedback, setFeedback] = useState("");

  const activeTrips = assignedOrders.filter((o) => !["delivered", "cancelled"].includes(o.status));
  const completedToday = assignedOrders.filter((o) => {
    if (o.status !== "delivered" || !o.updated_at) return false;
    return new Date(o.updated_at).toDateString() === new Date().toDateString();
  }).length;

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const [assigned, available] = await Promise.all([listAssignedDeliveries(), listAvailableDeliveries()]);
        if (isMounted) {
          setAssignedOrders(Array.isArray(assigned) ? assigned : []);
          setAvailableOrders(Array.isArray(available) ? available : []);
        }
      } catch {
        if (isMounted) { setAssignedOrders([]); setAvailableOrders([]); }
      } finally {
        if (isMounted) setReady(true);
      }
    }

    load();
    return () => { isMounted = false; };
  }, [refreshToken]);

  useRealtimeOrders({
    enabled: Boolean(profile?.id),
    onOrderChange: () => setRefreshToken((v) => v + 1)
  });

  async function handleDeliveryAction(order, action) {
    if (!profile?.id) return;
    setBusyOrderId(order.id);
    setFeedback("");
    try {
      const payload = action.mode === "claim"
        ? { assignedDeliveryId: profile.id }
        : { status: action.status };
      const updated = await updateOrderStatus(order.id, payload);
      setFeedback(`${shortOrderId(updated.id)} moved to ${formatOrderStatus(updated.status)}.`);
      setRefreshToken((v) => v + 1);
    } catch (err) {
      setFeedback(err.message);
    } finally {
      setBusyOrderId(null);
    }
  }

  function renderOrderCard(order) {
    const actions = getDeliveryActions(order);
    return (
      <article key={order.id} className="card-surface p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-mono" style={{ color: "var(--ink-muted)" }}>{shortOrderId(order.id)}</p>
            <h3 className="mt-1 text-xl font-semibold" style={{ color: "var(--ink)" }}>
              {order.restaurant?.name || "Restaurant"}
            </h3>
            <p className="mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>
              {formatOrderDate(order.created_at)} · {getItemCount(order)} items · {formatPaise(order.total_paise)}
            </p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        <div
          className="mt-4 flex flex-wrap gap-4 rounded-xl px-4 py-3 text-sm"
          style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--ink-secondary)" }}
        >
          <span>📍 {order.delivery_address?.locality || order.city || "Hyderabad"}</span>
          <span>{order.assigned_delivery_id ? "✓ Assigned to you" : "⏳ Open slot"}</span>
        </div>

        {actions.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-3">
            {actions.map((action) => (
              <button
                key={`${order.id}-${action.mode}-${action.status || "claim"}`}
                type="button"
                disabled={busyOrderId === order.id}
                onClick={() => handleDeliveryAction(order, action)}
                className="btn-primary"
              >
                {busyOrderId === order.id ? "Updating..." : action.label}
              </button>
            ))}
          </div>
        )}
      </article>
    );
  }

  return (
    <Shell
      title="Delivery dispatch"
      subtitle="Claim pickup jobs, move orders through transit, and watch the queue refresh live."
    >
      {/* Stats */}
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Open pickup queue" value={String(availableOrders.length)} hint="Orders waiting for a delivery partner." accent />
        <StatCard label="Active trips" value={String(activeTrips.length)} hint="Orders assigned to you in motion." />
        <StatCard label="Completed today" value={String(completedToday)} hint="Delivered orders updated today." />
      </section>

      {feedback && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "var(--brand-lightest)", border: "1px solid var(--brand-lighter)", color: "var(--brand-dark)" }}>
          {feedback}
        </div>
      )}

      {/* Open queue */}
      <section className="space-y-4">
        <div>
          <h2 className="section-title">Open pickup queue</h2>
          <p className="muted-copy mt-1">Owner-approved orders visible to delivery partners in realtime.</p>
        </div>
        {!ready ? (
          <div className="card-surface p-6 text-sm" style={{ color: "var(--ink-muted)" }}>Loading queue...</div>
        ) : availableOrders.length === 0 ? (
          <div className="card-surface p-8 text-center">
            <p className="text-3xl">📭</p>
            <p className="mt-3 font-semibold" style={{ color: "var(--ink)" }}>No open jobs right now</p>
            <p className="mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>Check back shortly — new orders appear here in realtime.</p>
          </div>
        ) : (
          <div className="space-y-4">{availableOrders.map(renderOrderCard)}</div>
        )}
      </section>

      {/* My assigned */}
      <section className="space-y-4">
        <div>
          <h2 className="section-title">My assigned deliveries</h2>
          <p className="muted-copy mt-1">Move claimed orders from pickup to customer handoff.</p>
        </div>
        {!ready ? (
          <div className="card-surface p-6 text-sm" style={{ color: "var(--ink-muted)" }}>Loading...</div>
        ) : activeTrips.length === 0 ? (
          <div className="card-surface p-8 text-center">
            <p className="text-3xl">🛵</p>
            <p className="mt-3 font-semibold" style={{ color: "var(--ink)" }}>No active deliveries</p>
            <p className="mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>Claim an order from the queue above to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">{activeTrips.map(renderOrderCard)}</div>
        )}
      </section>
    </Shell>
  );
}