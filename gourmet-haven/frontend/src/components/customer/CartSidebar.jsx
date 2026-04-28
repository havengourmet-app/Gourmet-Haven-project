import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { placeOrder } from "../../services/orderService";
import { useCartStore } from "../../store/cartStore";

const MINIMUM_ORDER_PAISE = 10000;

function formatPaise(value) {
  return `Rs ${(Number(value || 0) / 100).toFixed(2)}`;
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

    if (!restaurantId) {
      setInlineError("Choose a restaurant before placing an order.");
      return;
    }

    if (items.length === 0) {
      setInlineError("Add at least one item before placing an order.");
      return;
    }

    if (subtotalPaise < MINIMUM_ORDER_PAISE) {
      setInlineError("Minimum order value is Rs 100.");
      return;
    }

    if (!deliveryAddress.trim()) {
      setInlineError("Please enter a delivery address.");
      return;
    }

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
        delivery_address: {
          full_address: deliveryAddress.trim(),
          lat: null,
          lng: null
        }
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
      <aside className="card-surface h-fit p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-[#01de1a]">Cart summary</p>
        <div className="mt-3 rounded-2xl bg-[#f8f9fa] px-4 py-3 text-sm text-slate-600">
          {activeRestaurant?.name
            ? `Ordering from ${activeRestaurant.name}`
            : "Choose a restaurant to start building your order."}
        </div>

        <div className="mt-5 space-y-4">
          {items.length === 0 ? (
            <p className="text-sm text-slate-500">Your cart is empty.</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="rounded-2xl bg-[#f8f9fa] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-[#1a1a1a]">{item.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.quantity} × {formatPaise(item.price)}
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#1a1a1a]">
                      {formatPaise(item.price * item.quantity)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => decrementItem(item.id)}
                      className="rounded-full border border-black/10 px-3 py-1 text-sm"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => incrementItem(item.id)}
                      className="rounded-full border border-black/10 px-3 py-1 text-sm"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="ml-1 text-sm text-rose-600 transition hover:text-rose-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 space-y-3 border-t border-black/10 pt-5 text-sm text-slate-500">
          <div className="flex items-center justify-between">
            <span>Subtotal</span>
            <span>{formatPaise(subtotalPaise)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Delivery fee</span>
            <span>{formatPaise(deliveryFeePaise)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Platform fee</span>
            <span>{formatPaise(platformFeePaise)}</span>
          </div>
          <div className="flex items-center justify-between text-base font-semibold text-[#1a1a1a]">
            <span>Total</span>
            <span>{formatPaise(totalPaise)}</span>
          </div>
        </div>

        {subtotalPaise > 0 && subtotalPaise < MINIMUM_ORDER_PAISE ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Minimum order Rs 100
          </div>
        ) : null}

        <label className="mt-5 block">
          <span className="mb-2 block text-sm text-slate-500">Delivery address</span>
          <textarea
            rows="3"
            value={deliveryAddress}
            onChange={(event) => setDeliveryAddress(event.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#01de1a]"
            placeholder="Flat, street, landmark, locality"
          />
        </label>

        {inlineError ? (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {inlineError}
          </div>
        ) : null}

        <button
          type="button"
          onClick={handlePlaceOrder}
          disabled={!canPlaceOrder}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#01de1a] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#00ff1e] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPlacingOrder ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
              Placing order...
            </>
          ) : (
            "Place Order"
          )}
        </button>
      </aside>

      {conflictPending ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <p className="text-lg font-semibold text-[#1a1a1a]">Replace cart items?</p>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Your cart has items from {currentRestaurantLabel}. Clear cart and add from{" "}
              {pendingItem?.restaurantName || "the new restaurant"}?
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={resolveConflict}
                className="rounded-xl bg-[#01de1a] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#00ff1e]"
              >
                Yes, clear cart
              </button>
              <button
                type="button"
                onClick={dismissConflict}
                className="rounded-xl border border-black/10 px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-[#01de1a] hover:text-[#01de1a]"
              >
                No, keep current
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
