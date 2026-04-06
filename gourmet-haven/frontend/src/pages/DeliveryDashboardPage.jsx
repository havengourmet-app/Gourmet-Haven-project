import { useEffect, useState } from "react";
import OrderStatusBadge from "../components/common/OrderStatusBadge";
import Shell from "../components/common/Shell";
import StatCard from "../components/common/StatCard";
import { useAuth } from "../hooks/useAuth";
import { useRealtimeOrders } from "../hooks/useRealtimeOrders";
import {
  formatOrderDate,
  formatOrderStatus,
  formatPaise,
  getDeliveryActions,
  getItemCount,
  shortOrderId
} from "../lib/orderPresentation";
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
  const activeTrips = assignedOrders.filter((order) => !["delivered", "cancelled"].includes(order.status));
  const completedToday = assignedOrders.filter((order) => {
    if (order.status !== "delivered" || !order.updated_at) {
      return false;
    }

    return new Date(order.updated_at).toDateString() === new Date().toDateString();
  }).length;

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        const [assigned, available] = await Promise.all([listAssignedDeliveries(), listAvailableDeliveries()]);

        if (isMounted) {
          setAssignedOrders(Array.isArray(assigned) ? assigned : []);
          setAvailableOrders(Array.isArray(available) ? available : []);
        }
      } catch {
        if (isMounted) {
          setAssignedOrders([]);
          setAvailableOrders([]);
        }
      } finally {
        if (isMounted) {
          setReady(true);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [refreshToken]);

  useRealtimeOrders({
    enabled: Boolean(profile?.id),
    onOrderChange: () => {
      setRefreshToken((value) => value + 1);
    }
  });

  async function handleDeliveryAction(order, action) {
    if (!profile?.id) {
      return;
    }

    setBusyOrderId(order.id);
    setFeedback("");

    try {
      const payload =
        action.mode === "claim"
          ? { assignedDeliveryId: profile.id }
          : {
              status: action.status
            };
      const updatedOrder = await updateOrderStatus(order.id, payload);

      setFeedback(`${shortOrderId(updatedOrder.id)} moved to ${formatOrderStatus(updatedOrder.status)}.`);
      setRefreshToken((value) => value + 1);
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setBusyOrderId(null);
    }
  }

  function renderDeliveryCard(order) {
    const actions = getDeliveryActions(order);

    return (
      <article key={order.id} className="card-surface p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#01de1a]">{shortOrderId(order.id)}</p>
            <h3 className="mt-2 text-2xl font-semibold text-[#1a1a1a]">
              {order.restaurant?.name || "Hyderabad restaurant"}
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              {formatOrderDate(order.created_at)} · {getItemCount(order)} items · {formatPaise(order.total_paise)}
            </p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-500">
          <span>Drop area: {order.delivery_address?.locality || order.city || "Hyderabad"}</span>
          <span>{order.assigned_delivery_id ? "Assigned to you" : "Open pickup slot"}</span>
        </div>

        {actions.length > 0 ? (
          <div className="mt-6 flex flex-wrap gap-3">
            {actions.map((action) => (
              <button
                key={`${order.id}-${action.mode}-${action.status || "claim"}`}
                type="button"
                disabled={busyOrderId === order.id}
                onClick={() => handleDeliveryAction(order, action)}
                className="rounded-xl bg-[#01de1a] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#00ff1e] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busyOrderId === order.id ? "Updating..." : action.label}
              </button>
            ))}
          </div>
        ) : null}
      </article>
    );
  }

  return (
    <Shell
      title="Delivery dispatch"
      subtitle="Claim open pickup jobs, move orders through pickup and transit, and watch the queue refresh live as customers and owners act."
    >
      <section className="grid gap-5 md:grid-cols-3">
        <StatCard label="Open pickup queue" value={String(availableOrders.length)} hint="Accepted or preparing orders waiting for a delivery partner." />
        <StatCard label="Active trips" value={String(activeTrips.length)} hint="Orders currently assigned to you and still in motion." />
        <StatCard label="Completed today" value={String(completedToday)} hint="Delivered orders updated during the current day." />
      </section>

      {feedback ? (
        <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-slate-600">{feedback}</div>
      ) : null}

      <section className="space-y-4">
        <div>
          <h2 className="section-title">Open pickup queue</h2>
          <p className="muted-copy mt-2">These are owner-approved orders that are visible to delivery partners in realtime.</p>
        </div>

        {!ready ? (
          <div className="card-surface p-6 text-sm text-slate-500">Loading delivery queue...</div>
        ) : availableOrders.length === 0 ? (
          <div className="card-surface p-6 text-sm text-slate-500">No open pickup jobs are waiting right now.</div>
        ) : (
          <div className="space-y-4">{availableOrders.map((order) => renderDeliveryCard(order))}</div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="section-title">My assigned deliveries</h2>
          <p className="muted-copy mt-2">After claiming an order, keep moving it forward from pickup to customer handoff.</p>
        </div>

        {!ready ? (
          <div className="card-surface p-6 text-sm text-slate-500">Loading assigned deliveries...</div>
        ) : activeTrips.length === 0 ? (
          <div className="card-surface p-6 text-sm text-slate-500">No active deliveries are assigned to you yet.</div>
        ) : (
          <div className="space-y-4">{activeTrips.map((order) => renderDeliveryCard(order))}</div>
        )}
      </section>
    </Shell>
  );
}
