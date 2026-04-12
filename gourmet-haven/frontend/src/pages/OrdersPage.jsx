import { useEffect, useState } from "react";
import OrderStatusBadge from "../components/common/OrderStatusBadge";
import Shell from "../components/common/Shell";
import MenuItemCard from "../components/customer/MenuItemCard";
import { useRealtimeOrders } from "../hooks/useRealtimeOrders";
import { listMenuItems } from "../services/restaurantService";
import { legacyAssets } from "../lib/legacyAssets";
import {
  formatOrderDate,
  formatPaise,
  getItemCount,
  getTimelineSteps,
  shortOrderId
} from "../lib/orderPresentation";
import { createOrder, listCustomerOrders } from "../services/orderService";
import { listRestaurants } from "../services/restaurantService";
import { useCartStore } from "../store/cartStore";

const SAMPLE_MENU = [
  {
    id: "c0ad0dc8-e7d7-44b9-8ca3-697165ae7e83",
    name: "Chicken 65 Biryani",
    description: "Spiced basmati rice, marinated chicken, and house mirchi salan.",
    pricePaise: 29900,
    category: "Biryani",
    isVeg: false,
    image: legacyAssets.chicken
  },
  {
    id: "c11b0f25-4f38-497a-9b59-d7f56a4fa50c",
    name: "Double Ka Meetha",
    description: "Classic Hyderabadi dessert finished with saffron cream.",
    pricePaise: 9900,
    category: "Dessert",
    isVeg: true,
    image: legacyAssets.featureFresh
  },
  {
    id: "4274d78b-7d53-434d-b4ec-59b7703df65d",
    name: "Paneer Tikka Bowl",
    description: "Charred paneer, saffron rice, pickled onions, and mint yogurt.",
    pricePaise: 24900,
    category: "Bowls",
    isVeg: true,
    image: legacyAssets.friedRice
  }
];

export default function OrdersPage() {
  const { items, addItem, updateQuantity, clearCart, restaurantId, totals } = useCartStore();
  const [activeRestaurant, setActiveRestaurant] = useState(null);
  const [restaurantsReady, setRestaurantsReady] = useState(false);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [ordersReady, setOrdersReady] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const summary = totals();
  const [menuItems, setMenuItems] = useState([]);
const [menuReady, setMenuReady] = useState(false);

// Add this useEffect to fetch menu items
useEffect(() => {
  let isMounted = true;

  async function loadMenu() {
    if (!activeRestaurant?.id) {
      if (isMounted) {
        setMenuItems(SAMPLE_MENU);
        setMenuReady(true);
      }
      return;
    }

    setMenuReady(false);

    try {
      const items = await listMenuItems(activeRestaurant.id);
      
      if (isMounted) {
        // If no real menu items, show sample menu
        if (!items || items.length === 0) {
          setMenuItems(SAMPLE_MENU.map((item) => ({
            ...item,
            restaurantId: activeRestaurant.id
          })));
        } else {
          setMenuItems(items.map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            pricePaise: item.price_paise,
            category: item.category,
            isVeg: item.is_veg,
            image: item.image_url || legacyAssets.chicken,
            restaurantId: activeRestaurant.id
          })));
        }
      }
    } catch {
      if (isMounted) {
        setMenuItems(SAMPLE_MENU);
      }
    } finally {
      if (isMounted) {
        setMenuReady(true);
      }
    }
  }

  loadMenu();

  return () => {
    isMounted = false;
  };
}, [activeRestaurant?.id]);
  const activeOrders = customerOrders.filter((order) => !["delivered", "cancelled"].includes(order.status));
  const orderHistory = customerOrders.filter((order) => ["delivered", "cancelled"].includes(order.status));

  useEffect(() => {
    let isMounted = true;

    async function loadRestaurants() {
      try {
        const response = await listRestaurants();
        const restaurants = response?.data || [];

        if (isMounted) {
          setActiveRestaurant(restaurants[0] || null);
        }
      } catch {
        if (isMounted) {
          setActiveRestaurant(null);
        }
      } finally {
        if (isMounted) {
          setRestaurantsReady(true);
        }
      }
    }

    loadRestaurants();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadOrders() {
      try {
        const orders = await listCustomerOrders();

        if (isMounted) {
          setCustomerOrders(Array.isArray(orders) ? orders : []);
        }
      } catch {
        if (isMounted) {
          setCustomerOrders([]);
        }
      } finally {
        if (isMounted) {
          setOrdersReady(true);
        }
      }
    }

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, [refreshToken]);

  useRealtimeOrders({
    enabled: true,
    onOrderChange: () => {
      setRefreshToken((value) => value + 1);
    }
  });

  async function handleCheckout() {
    setNotice("");

    if (!activeRestaurant) {
      setNotice("No active restaurant record is available yet. Create one from an owner account before placing orders.");
      return;
    }

    if (items.length === 0) {
      setNotice("Add a few items before placing an order.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      restaurantId: restaurantId || activeRestaurant.id,
      items: items.map((item) => ({
        menuItemId: item.id,
        quantity: item.quantity,
        pricePaise: item.pricePaise
      })),
      subtotalPaise: summary.subtotalPaise,
      deliveryFeePaise: summary.deliveryFeePaise,
      platformFeePaise: summary.platformFeePaise,
      totalPaise: summary.totalPaise
    };

    try {
      const createdOrder = await createOrder(payload);
      clearCart();
      setNotice(`${shortOrderId(createdOrder.id)} placed successfully. Live tracking is active below.`);
      setRefreshToken((value) => value + 1);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Shell
      title="Build a Hyderabad order"
      subtitle="Place an order, then stay on the same page and watch it move through acceptance, kitchen prep, pickup, and delivery in realtime."
    >
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-5 lg:grid-cols-2">
          {menuItems.map((item) => (
            <MenuItemCard key={item.id} item={item} onAdd={addItem} />
          ))}
        </div>

        <aside className="card-surface h-fit p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-[#01de1a]">Cart summary</p>
          <div className="mt-3 rounded-2xl bg-[#f8f9fa] px-4 py-3 text-sm text-slate-600">
            {restaurantsReady
              ? activeRestaurant
                ? `Ordering from ${activeRestaurant.name}`
                : "No active restaurant found yet."
              : "Checking for active restaurants..."}
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
                      <p className="mt-1 text-sm text-slate-500">{formatPaise(item.pricePaise)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="rounded-full border border-black/10 px-3 py-1 text-sm"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="rounded-full border border-black/10 px-3 py-1 text-sm"
                      >
                        +
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
              <span>{formatPaise(summary.subtotalPaise)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Delivery fee</span>
              <span>{formatPaise(summary.deliveryFeePaise)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Platform fee</span>
              <span>{formatPaise(summary.platformFeePaise)}</span>
            </div>
            <div className="flex items-center justify-between text-base font-semibold text-[#1a1a1a]">
              <span>Total</span>
              <span>{formatPaise(summary.totalPaise)}</span>
            </div>
          </div>

          {notice ? (
            <div className="mt-5 rounded-2xl border border-black/10 bg-[#f8f9fa] px-4 py-3 text-sm text-slate-600">
              {notice}
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleCheckout}
            disabled={isSubmitting}
            className="mt-6 w-full rounded-xl bg-[#01de1a] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#00ff1e] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Placing order..." : "Place order"}
          </button>
        </aside>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="section-title">Live order tracking</h2>
          <p className="muted-copy mt-2">
            Customer-visible updates refresh automatically when owners or delivery partners move an order forward.
          </p>
        </div>

        {!ordersReady ? (
          <div className="card-surface p-6 text-sm text-slate-500">Loading your orders...</div>
        ) : activeOrders.length === 0 ? (
          <div className="card-surface p-6 text-sm leading-7 text-slate-500">
            Place a customer order to start the live status loop. New orders will appear here as soon as they are created.
          </div>
        ) : (
          <div className="space-y-4">
            {activeOrders.map((order) => (
              <article key={order.id} className="card-surface p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[#01de1a]">{shortOrderId(order.id)}</p>
                    <h3 className="mt-2 text-2xl font-semibold text-[#1a1a1a]">
                      {order.restaurant?.name || "Gourmet Haven order"}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      {formatOrderDate(order.created_at)} · {getItemCount(order)} items · {formatPaise(order.total_paise)}
                    </p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>

                <div className="mt-6 grid gap-3 lg:grid-cols-6">
                  {getTimelineSteps(order.status).map((step) => (
                    <div
                      key={step.key}
                      className={`rounded-2xl border px-4 py-3 text-sm ${
                        step.isCurrent
                          ? "border-[#01de1a] bg-[#e8f9eb] text-[#01de1a]"
                          : step.isActive
                            ? "border-slate-200 bg-slate-50 text-slate-700"
                            : "border-black/5 bg-white text-slate-400"
                      }`}
                    >
                      {step.label}
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-500">
                  <span>Drop area: {order.delivery_address?.locality || order.city || "Hyderabad"}</span>
                  <span>Delivery fee: {formatPaise(order.delivery_fee_paise)}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="section-title">Recent history</h2>
          <p className="muted-copy mt-2">Completed and cancelled orders stay here for quick review.</p>
        </div>

        {orderHistory.length === 0 ? (
          <div className="card-surface p-6 text-sm text-slate-500">No completed or cancelled orders yet.</div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {orderHistory.map((order) => (
              <article key={order.id} className="card-surface p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{shortOrderId(order.id)}</p>
                    <h3 className="mt-2 text-lg font-semibold text-[#1a1a1a]">
                      {order.restaurant?.name || "Gourmet Haven order"}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">{formatOrderDate(order.created_at)}</p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>
                <p className="mt-4 text-sm text-slate-500">
                  {getItemCount(order)} items · {formatPaise(order.total_paise)}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </Shell>
  );
}
