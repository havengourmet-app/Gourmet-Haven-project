import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Shell from "../components/common/Shell";
import OrderStatusStepper from "../components/customer/OrderStatusStepper";
import RatingModal from "../components/customer/RatingModal";
import { useAuth } from "../hooks/useAuth";
import { useRealtimeOrders } from "../hooks/useRealtimeOrders";
import { formatPaise } from "../lib/orderPresentation";
import { fetchOrder, updateOrderStatus } from "../services/orderService";
import { fetchOrderReview } from "../services/reviewService";

function formatAddress(order) {
  return (
    order?.delivery_address?.full_address ||
    order?.delivery_address?.line_1 ||
    order?.city ||
    "Delivery address not available"
  );
}

export default function OrderTrackingPage() {
  const { id: orderId } = useParams();
  const { profile } = useAuth();
  const isCustomer = profile?.role === "customer";

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [actionError, setActionError] = useState("");

  async function checkAndMaybeShowReview(currentOrder) {
    if (!isCustomer) return;
    if (currentOrder?.status !== "delivered") return;
    if (reviewSubmitted) return;

    try {
      const existing = await fetchOrderReview(orderId);
      if (existing) {
        setAlreadyReviewed(true);
      } else {
        setShowRatingModal(true);
      }
    } catch {
      setShowRatingModal(true);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function loadOrder() {
      setLoading(true); setError("");
      try {
        const nextOrder = await fetchOrder(orderId);
        if (!isMounted) return;
        setOrder(nextOrder);
        await checkAndMaybeShowReview(nextOrder);
      } catch (err) {
        if (!isMounted) return;
        setOrder(null);
        setError(err.message || "Unable to load the order right now.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (orderId) loadOrder();
    return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  useRealtimeOrders({
    enabled: Boolean(orderId),
    filters: [{ filter: `id=eq.${orderId}` }],
    onOrderChange: async (payload) => {
      if (!payload?.new) return;
      const nextStatus = payload.new.status;
      setOrder((curr) =>
        curr
          ? { ...curr, status: nextStatus || curr.status, updated_at: payload.new.updated_at || curr.updated_at }
          : curr
      );
      if (nextStatus === "delivered" && isCustomer && !alreadyReviewed && !reviewSubmitted) {
        try {
          const existing = await fetchOrderReview(orderId);
          if (!existing) setShowRatingModal(true);
          else setAlreadyReviewed(true);
        } catch {
          setShowRatingModal(true);
        }
      }
    }
  });

  async function handleCancelOrder() {
    if (!order?.id || order.status !== "pending") return;
    setActionError("");
    setIsCancelling(true);

    try {
      const updated = await updateOrderStatus(order.id, { status: "cancelled" });
      setOrder((current) => (current ? { ...current, status: updated.status || "cancelled" } : current));
    } catch (err) {
      setActionError(err.message || "Unable to cancel this order.");
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <Shell title="Track your order" subtitle="Follow the live journey from confirmation to delivery.">
      {loading ? (
        <div className="card-surface p-6 text-sm" style={{ color: "var(--ink-muted)" }}>Loading order details...</div>
      ) : error ? (
        <div className="card-surface p-6 text-sm" style={{ color: "#991b1b" }}>{error}</div>
      ) : !order ? (
        <div className="card-surface p-6 text-sm" style={{ color: "var(--ink-muted)" }}>Order not found.</div>
      ) : (
        <div className="space-y-5">
          {/* Status card */}
          <section className="card-surface p-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="label-xs">Live status</p>
                <h2 className="mt-1 text-2xl font-semibold" style={{ color: "var(--ink)" }}>
                  {order.restaurant?.name || "Your order"}
                </h2>
                <p className="mt-1 text-xs font-mono" style={{ color: "var(--ink-muted)" }}>
                  Order {order.id?.slice(0, 8).toUpperCase()}
                </p>
              </div>

              {isCustomer && order.status === "delivered" && !alreadyReviewed && !reviewSubmitted && (
                <button type="button" onClick={() => setShowRatingModal(true)} className="btn-secondary mt-2 sm:mt-0">
                  ⭐ Rate order
                </button>
              )}
            </div>

            {isCustomer && order.status === "pending" && (
              <div className="mt-5">
                <button
                  type="button"
                  onClick={handleCancelOrder}
                  disabled={isCancelling}
                  className="btn-danger"
                >
                  {isCancelling ? "Cancelling..." : "Cancel order"}
                </button>
              </div>
            )}

            {actionError && (
              <div className="mt-5 rounded-xl px-4 py-3 text-sm" style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}>
                {actionError}
              </div>
            )}

            <div className="mt-6">
              <OrderStatusStepper currentStatus={order.status} />
            </div>

            {isCustomer && order.status === "delivered" && (reviewSubmitted || alreadyReviewed) && (
              <div className="mt-5 rounded-xl px-4 py-3 text-sm" style={{ background: "var(--brand-lightest)", border: "1px solid var(--brand-lighter)", color: "var(--brand-dark)" }}>
                {reviewSubmitted ? "Thanks for your review! 🎉" : "You've already reviewed this order."}
              </div>
            )}
          </section>

          <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            {/* Items */}
            <div className="card-surface p-6">
              <p className="label-xs">Order summary</p>
              <div className="mt-4 space-y-3">
                {(order.items || []).map((item, index) => (
                  <div
                    key={`${item.id || item.name}-${index}`}
                    className="flex items-start justify-between gap-3 rounded-xl p-4"
                    style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
                  >
                    <div>
                      <p className="font-semibold text-sm" style={{ color: "var(--ink)" }}>{item.name}</p>
                      <p className="mt-0.5 text-xs" style={{ color: "var(--ink-muted)" }}>
                        {item.qty || item.quantity || 0} × {formatPaise(item.price || item.pricePaise || 0)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold flex-shrink-0" style={{ color: "var(--ink)" }}>
                      {formatPaise((item.price || item.pricePaise || 0) * (item.qty || item.quantity || 0))}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery + pricing */}
            <aside className="card-surface h-fit p-6">
              <p className="label-xs">Delivery details</p>
              <div
                className="mt-3 rounded-xl p-4 text-sm leading-6"
                style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--ink-secondary)" }}
              >
                {formatAddress(order)}
              </div>

              <div
                className="mt-5 space-y-2.5 border-t pt-4 text-sm"
                style={{ borderColor: "var(--border)" }}
              >
                {[
                  { label: "Subtotal", value: order.subtotal_paise },
                  { label: "Delivery fee", value: order.delivery_fee_paise },
                  { label: "Platform fee", value: order.platform_fee_paise }
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between" style={{ color: "var(--ink-secondary)" }}>
                    <span>{label}</span>
                    <span>{formatPaise(value)}</span>
                  </div>
                ))}
                <div
                  className="flex justify-between border-t pt-2.5 font-bold"
                  style={{ borderColor: "var(--border)", color: "var(--ink)" }}
                >
                  <span>Total</span>
                  <span>{formatPaise(order.total_paise)}</span>
                </div>
              </div>
            </aside>
          </section>
        </div>
      )}

      {showRatingModal && order && isCustomer && (
        <RatingModal
          order={order}
          onClose={() => setShowRatingModal(false)}
          onSubmitted={() => { setShowRatingModal(false); setReviewSubmitted(true); }}
        />
      )}
    </Shell>
  );
}
