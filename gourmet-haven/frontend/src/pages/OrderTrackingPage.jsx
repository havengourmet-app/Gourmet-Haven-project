import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Shell from "../components/common/Shell";
import OrderStatusStepper from "../components/customer/OrderStatusStepper";
import RatingModal from "../components/customer/RatingModal";
import { useRealtimeOrders } from "../hooks/useRealtimeOrders";
import { formatPaise } from "../lib/orderPresentation";
import { fetchOrder } from "../services/orderService";
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
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadOrder() {
      setLoading(true);
      setError("");

      try {
        const nextOrder = await fetchOrder(orderId);
        if (!isMounted) return;

        setOrder(nextOrder);

        if (nextOrder?.status === "delivered") {
          const existingReview = await fetchOrderReview(orderId);
          if (!isMounted) return;

          if (existingReview) {
            setAlreadyReviewed(true);
          } else {
            setShowRatingModal(true);
          }
        }
      } catch (loadError) {
        if (!isMounted) return;
        setOrder(null);
        setError(loadError.message || "Unable to load the order right now.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (orderId) loadOrder();

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  useRealtimeOrders({
    enabled: Boolean(orderId),
    filters: [{ filter: `id=eq.${orderId}` }],
    onOrderChange: async (payload) => {
      if (!payload?.new) return;

      const nextStatus = payload.new.status;

      setOrder((current) =>
        current
          ? { ...current, status: nextStatus || current.status, updated_at: payload.new.updated_at || current.updated_at }
          : current
      );

      if (nextStatus === "delivered" && !alreadyReviewed && !reviewSubmitted) {
        try {
          const existingReview = await fetchOrderReview(orderId);
          if (!existingReview) setShowRatingModal(true);
          else setAlreadyReviewed(true);
        } catch {
          setShowRatingModal(true);
        }
      }
    }
  });

  function handleReviewSubmitted() {
    setShowRatingModal(false);
    setReviewSubmitted(true);
  }

  return (
    <Shell
      title="Track your order"
      subtitle="Follow the live order journey from confirmation to delivery."
    >
      {loading ? (
        <div className="card-surface p-6 text-sm text-slate-500">Loading order details...</div>
      ) : error ? (
        <div className="card-surface p-6">
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      ) : !order ? (
        <div className="card-surface p-6 text-sm text-slate-500">Order not found.</div>
      ) : (
        <div className="space-y-6">
          <section className="card-surface p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-[#01de1a]">Live status</p>
            <h2 className="mt-3 text-2xl font-semibold text-[#1a1a1a]">
              {order.restaurant?.name || "QuickDyne order"}
            </h2>
            <p className="mt-2 text-sm text-slate-500">Order ID: {order.id}</p>

            <div className="mt-6">
              <OrderStatusStepper currentStatus={order.status} />
            </div>

            {order.status === "delivered" && (reviewSubmitted || alreadyReviewed) && (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {reviewSubmitted
                  ? "Thanks for your review!"
                  : "You have already reviewed this order."}
              </div>
            )}

            {order.status === "delivered" && !alreadyReviewed && !reviewSubmitted && (
              <button
                type="button"
                onClick={() => setShowRatingModal(true)}
                className="mt-6 rounded-xl border border-[#01de1a] px-4 py-2 text-sm font-medium text-[#01de1a] transition hover:bg-[#01de1a] hover:text-black"
              >
                Rate this order
              </button>
            )}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="card-surface p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-[#01de1a]">Order summary</p>
              <div className="mt-5 space-y-4">
                {(order.items || []).map((item, index) => (
                  <div key={`${item.id || item.name}-${index}`} className="rounded-2xl bg-[#f8f9fa] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-[#1a1a1a]">{item.name}</h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {item.qty || item.quantity || 0} × {formatPaise(item.price || item.pricePaise || 0)}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-[#1a1a1a]">
                        {formatPaise((item.price || item.pricePaise || 0) * (item.qty || item.quantity || 0))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <aside className="card-surface h-fit p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-[#01de1a]">Delivery details</p>
              <div className="mt-4 rounded-2xl bg-[#f8f9fa] p-4 text-sm leading-7 text-slate-600">
                {formatAddress(order)}
              </div>

              <div className="mt-6 space-y-3 border-t border-black/10 pt-5 text-sm text-slate-500">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>{formatPaise(order.subtotal_paise)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Delivery fee</span>
                  <span>{formatPaise(order.delivery_fee_paise)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Platform fee</span>
                  <span>{formatPaise(order.platform_fee_paise)}</span>
                </div>
                <div className="flex items-center justify-between text-base font-semibold text-[#1a1a1a]">
                  <span>Total</span>
                  <span>{formatPaise(order.total_paise)}</span>
                </div>
              </div>
            </aside>
          </section>
        </div>
      )}

      {showRatingModal && order && (
        <RatingModal
          order={order}
          onClose={() => setShowRatingModal(false)}
          onSubmitted={handleReviewSubmitted}
        />
      )}
    </Shell>
  );
}