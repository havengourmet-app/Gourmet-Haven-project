import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { placeOrder } from "../../services/orderService";
import { useCartStore } from "../../store/cartStore";

const MINIMUM_ORDER_PAISE = 10000;

function formatPaise(value) {
  return `₹${(Number(value || 0) / 100).toFixed(0)}`;
}

export default function CartSidebar({ activeRestaurant }) {
  const navigate = useNavigate();
  const {
    items,
    restaurantId,
    restaurantName,
    subtotalPaise,
    deliveryFeePaise,
    platformFeePaise,
    totalPaise,
    conflictPending,
    pendingItem,
    clearCart,
    removeItem,
    incrementItem,
    decrementItem,
    resolveConflict,
    dismissConflict
  } = useCartStore();

  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [inlineError, setInlineError] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const canPlaceOrder = subtotalPaise >= MINIMUM_ORDER_PAISE && items.length > 0 && !isPlacingOrder;
  const currentRestaurantLabel = useMemo(
    () => restaurantName || items[0]?.restaurantName || "another restaurant",
    [items, restaurantName]
  );

  async function handlePlaceOrder() {
    setInlineError("");
    if (!restaurantId) { setInlineError("Choose a restaurant before placing an order."); return; }
    if (items.length === 0) { setInlineError("Add at least one item."); return; }
    if (subtotalPaise < MINIMUM_ORDER_PAISE) { setInlineError("Minimum order is ₹100."); return; }
    if (!deliveryAddress.trim()) { setInlineError("Please enter a delivery address."); return; }

    setIsPlacingOrder(true);
    try {
      const order = await placeOrder({
        restaurant_id: restaurantId,
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          qty: item.quantity,
          image_url: item.image_url || null
        })),
        subtotal: subtotalPaise,
        delivery_fee: deliveryFeePaise,
        platform_fee: platformFeePaise,
        total: totalPaise,
        delivery_address: { full_address: deliveryAddress.trim(), lat: null, lng: null }
      });

      clearCart();
      setDeliveryAddress("");
      navigate(`/order/${order.id}/track`);
    } catch (error) {
      setInlineError(error.message || "Unable to place the order right now.");
    } finally {
      setIsPlacingOrder(false);
    }
  }

  return (
    <>
      <aside className="card-surface overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div>
            <p className="label-xs">Your cart</p>
            {activeRestaurant?.name && (
              <p className="mt-0.5 text-xs" style={{ color: "var(--ink-muted)" }}>
                from {activeRestaurant.name}
              </p>
            )}
          </div>
          {items.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="text-xs"
              style={{ color: "var(--ink-muted)" }}
            >
              Clear
            </button>
          )}
        </div>

        <div className="p-5">
          {/* Empty state */}
          {items.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-2xl">🛒</p>
              <p className="mt-2 text-sm font-medium" style={{ color: "var(--ink)" }}>
                Your cart is empty
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--ink-muted)" }}>
                {activeRestaurant?.name
                  ? `Add items from ${activeRestaurant.name}`
                  : "Browse a restaurant to start ordering"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl p-3"
                  style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium" style={{ color: "var(--ink)" }}>
                        {item.name}
                      </p>
                      <p className="mt-0.5 text-xs" style={{ color: "var(--ink-muted)" }}>
                        {item.quantity} × {formatPaise(item.price)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => decrementItem(item.id)}
                        className="flex h-6 w-6 items-center justify-center rounded-lg text-sm font-bold transition"
                        style={{ background: "var(--border)", color: "var(--ink-secondary)" }}
                      >
                        −
                      </button>
                      <span className="w-5 text-center text-xs font-semibold" style={{ color: "var(--ink)" }}>
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => incrementItem(item.id)}
                        className="flex h-6 w-6 items-center justify-center rounded-lg text-sm font-bold transition"
                        style={{ background: "var(--brand)", color: "#fff" }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs font-semibold" style={{ color: "var(--ink)" }}>
                      {formatPaise(item.price * item.quantity)}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-xs"
                      style={{ color: "#dc2626" }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Price breakdown */}
          {items.length > 0 && (
            <div
              className="mt-4 space-y-2 rounded-xl p-3"
              style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
            >
              {[
                { label: "Subtotal", value: subtotalPaise },
                { label: "Delivery fee", value: deliveryFeePaise },
                { label: "Platform fee", value: platformFeePaise }
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-xs" style={{ color: "var(--ink-secondary)" }}>
                  <span>{label}</span>
                  <span>{formatPaise(value)}</span>
                </div>
              ))}
              <div
                className="flex justify-between border-t pt-2 text-sm font-bold"
                style={{ borderColor: "var(--border)", color: "var(--ink)" }}
              >
                <span>Total</span>
                <span>{formatPaise(totalPaise)}</span>
              </div>
            </div>
          )}

          {/* Minimum order warning */}
          {subtotalPaise > 0 && subtotalPaise < MINIMUM_ORDER_PAISE && (
            <div
              className="mt-3 rounded-xl px-3 py-2.5 text-xs"
              style={{ background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e" }}
            >
              Add ₹{((MINIMUM_ORDER_PAISE - subtotalPaise) / 100).toFixed(0)} more for minimum order
            </div>
          )}

          {/* Delivery address */}
          {items.length > 0 && (
            <div className="mt-4">
              <label className="input-label">Delivery address</label>
              <textarea
                rows="2"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="input resize-none"
                placeholder="Flat, street, landmark, locality"
              />
            </div>
          )}

          {inlineError && (
            <div
              className="mt-3 rounded-xl px-3 py-2.5 text-xs"
              style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}
            >
              {inlineError}
            </div>
          )}

          {items.length > 0 && (
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={!canPlaceOrder}
              className="btn-primary mt-4 w-full"
            >
              {isPlacingOrder ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Placing order...
                </>
              ) : (
                `Place order · ${formatPaise(totalPaise)}`
              )}
            </button>
          )}
        </div>
      </aside>

      {/* Conflict modal */}
      {conflictPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="card w-full max-w-sm p-6">
            <p className="text-base font-semibold" style={{ color: "var(--ink)" }}>
              Replace cart items?
            </p>
            <p className="mt-2 text-sm leading-6" style={{ color: "var(--ink-secondary)" }}>
              Your cart has items from {currentRestaurantLabel}. Clear and start a new order from{" "}
              {pendingItem?.restaurantName || "the new restaurant"}?
            </p>
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={resolveConflict} className="btn-primary">
                Clear & replace
              </button>
              <button type="button" onClick={dismissConflict} className="btn-secondary">
                Keep current
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}