import { useEffect, useMemo, useState } from "react";
import OrderStatusBadge from "../components/common/OrderStatusBadge";
import Shell from "../components/common/Shell";
import StatCard from "../components/common/StatCard";
import OwnerMenuManager from "../components/owner/OwnerMenuManager";
import SubscriptionBanner from "../components/owner/SubscriptionBanner";
import { useRealtimeOrders } from "../hooks/useRealtimeOrders";
import {
  formatOrderDate,
  formatOrderStatus,
  formatPaise,
  getItemCount,
  getOwnerActions,
  shortOrderId
} from "../lib/orderPresentation";
import { listOwnerOrders, updateOrderStatus } from "../services/orderService";
import {
  createMenuItem,
  createRestaurant,
  listMenuItems,
  listOwnerRestaurants,
  updateMenuItem
} from "../services/restaurantService";
import { createSubscriptionCheckout, getSubscriptionStatus } from "../services/subscriptionService";

const EMPTY_RESTAURANT_FORM = {
  name: "",
  city: "Hyderabad",
  cuisineSummary: ""
};

function normalizeSubscription(subscription) {
  if (!subscription) {
    return {
      planName: "Growth - Hyderabad",
      status: "Inactive"
    };
  }

  return {
    planName: subscription.plan_name || "Growth - Hyderabad",
    status: subscription.status ? subscription.status.replaceAll("_", " ") : "inactive",
    amountPaise: subscription.amount_paise || 0,
    currentPeriodEnd: subscription.current_period_end || null,
    razorpaySubscriptionId: subscription.razorpay_subscription_id || null
  };
}

export default function OwnerDashboardPage() {
  const [orders, setOrders] = useState([]);
  const [ordersReady, setOrdersReady] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [menuItems, setMenuItems] = useState([]);
  const [menuReady, setMenuReady] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [subscriptionReady, setSubscriptionReady] = useState(false);
  const [showSubscriptionPanel, setShowSubscriptionPanel] = useState(false);
  const [restaurantForm, setRestaurantForm] = useState(EMPTY_RESTAURANT_FORM);
  const [subscriptionPlanId, setSubscriptionPlanId] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);
  const [busyOrderId, setBusyOrderId] = useState(null);
  const [isRestaurantSubmitting, setIsRestaurantSubmitting] = useState(false);
  const [isMenuSubmitting, setIsMenuSubmitting] = useState(false);
  const [isSubscriptionSubmitting, setIsSubscriptionSubmitting] = useState(false);
  const [orderFeedback, setOrderFeedback] = useState("");
  const [restaurantNotice, setRestaurantNotice] = useState("");
  const [menuNotice, setMenuNotice] = useState("");
  const [subscriptionNotice, setSubscriptionNotice] = useState("");

  const selectedRestaurant = restaurants.find((restaurant) => restaurant.id === selectedRestaurantId) || null;
  const liveOrders = orders.filter((order) => !["delivered", "cancelled"].includes(order.status));
  const recentOrders = orders.filter((order) => ["delivered", "cancelled"].includes(order.status)).slice(0, 4);
  const grossSalesPaise = orders
    .filter((order) => order.status !== "cancelled")
    .reduce((total, order) => total + Number(order.total_paise || 0), 0);
  const preparingCount = orders.filter((order) => order.status === "preparing").length;
  const cancellationRate = orders.length
    ? `${((orders.filter((order) => order.status === "cancelled").length / orders.length) * 100).toFixed(1)}%`
    : "0.0%";
  const activeMenuItems = useMemo(
    () => menuItems.filter((item) => item.is_available).length,
    [menuItems]
  );
  const subscriptionView = normalizeSubscription(subscription);

  useEffect(() => {
    let isMounted = true;

    async function loadOwnerData() {
      try {
        const [ownerRestaurants, ownerOrders, ownerSubscription] = await Promise.all([
          listOwnerRestaurants(),
          listOwnerOrders(),
          getSubscriptionStatus()
        ]);

        if (!isMounted) {
          return;
        }

        const nextRestaurants = Array.isArray(ownerRestaurants) ? ownerRestaurants : [];
        setRestaurants(nextRestaurants);
        setOrders(Array.isArray(ownerOrders) ? ownerOrders : []);
        setSubscription(ownerSubscription || null);

        if (nextRestaurants.length > 0) {
          setSelectedRestaurantId((current) =>
            current && nextRestaurants.some((restaurant) => restaurant.id === current)
              ? current
              : nextRestaurants[0].id
          );
        } else {
          setSelectedRestaurantId("");
        }
      } catch {
        if (isMounted) {
          setRestaurants([]);
          setOrders([]);
          setSubscription(null);
          setSelectedRestaurantId("");
        }
      } finally {
        if (isMounted) {
          setOrdersReady(true);
          setSubscriptionReady(true);
        }
      }
    }

    loadOwnerData();

    return () => {
      isMounted = false;
    };
  }, [refreshToken]);

  useEffect(() => {
    let isMounted = true;

    async function loadRestaurantMenu() {
      if (!selectedRestaurantId) {
        if (isMounted) {
          setMenuItems([]);
          setMenuReady(true);
        }
        return;
      }

      setMenuReady(false);

      try {
        const items = await listMenuItems(selectedRestaurantId);

        if (isMounted) {
          setMenuItems(Array.isArray(items) ? items : []);
        }
      } catch {
        if (isMounted) {
          setMenuItems([]);
        }
      } finally {
        if (isMounted) {
          setMenuReady(true);
        }
      }
    }

    loadRestaurantMenu();

    return () => {
      isMounted = false;
    };
  }, [selectedRestaurantId, refreshToken]);

  useRealtimeOrders({
    enabled: true,
    onOrderChange: () => {
      setRefreshToken((value) => value + 1);
    }
  });

  async function handleOwnerAction(orderId, nextStatus) {
    setBusyOrderId(orderId);
    setOrderFeedback("");

    try {
      const updatedOrder = await updateOrderStatus(orderId, {
        status: nextStatus
      });

      setOrderFeedback(`${shortOrderId(updatedOrder.id)} moved to ${formatOrderStatus(updatedOrder.status)}.`);
      setRefreshToken((value) => value + 1);
    } catch (error) {
      setOrderFeedback(error.message);
    } finally {
      setBusyOrderId(null);
    }
  }

  async function handleCreateRestaurant(event) {
    event.preventDefault();
    setRestaurantNotice("");
    setIsRestaurantSubmitting(true);

    try {
      const createdRestaurant = await createRestaurant({
        name: restaurantForm.name.trim(),
        city: restaurantForm.city.trim() || "Hyderabad",
        cuisineSummary: restaurantForm.cuisineSummary.trim()
      });

      setRestaurants((current) => [createdRestaurant, ...current]);
      setSelectedRestaurantId(createdRestaurant.id);
      setRestaurantForm(EMPTY_RESTAURANT_FORM);
      setRestaurantNotice(`Restaurant profile created for ${createdRestaurant.name}.`);
    } catch (error) {
      setRestaurantNotice(error.message);
    } finally {
      setIsRestaurantSubmitting(false);
    }
  }

  async function handleCreateMenuItem(payload) {
    setMenuNotice("");
    setIsMenuSubmitting(true);

    try {
      const createdItem = await createMenuItem(payload);
      setMenuItems((current) => [createdItem, ...current]);
      setMenuNotice(`${createdItem.name} has been added to the menu.`);
      return createdItem;
    } catch (error) {
      setMenuNotice(error.message);
      throw error;
    } finally {
      setIsMenuSubmitting(false);
    }
  }

  async function handleUpdateMenuItem(menuItemId, payload) {
    setMenuNotice("");
    setIsMenuSubmitting(true);

    try {
      const updatedItem = await updateMenuItem(menuItemId, payload);
      setMenuItems((current) => current.map((item) => (item.id === menuItemId ? updatedItem : item)));
      setMenuNotice(`${updatedItem.name} has been updated.`);
      return updatedItem;
    } catch (error) {
      setMenuNotice(error.message);
      throw error;
    } finally {
      setIsMenuSubmitting(false);
    }
  }

  async function handleRefreshSubscription() {
    setSubscriptionNotice("");
    setIsSubscriptionSubmitting(true);

    try {
      const currentSubscription = await getSubscriptionStatus();
      setSubscription(currentSubscription || null);
      setSubscriptionNotice("Subscription status refreshed.");
    } catch (error) {
      setSubscriptionNotice(error.message);
    } finally {
      setIsSubscriptionSubmitting(false);
    }
  }

  async function handleStartCheckout() {
    setSubscriptionNotice("");

    if (!subscriptionPlanId.trim()) {
      setSubscriptionNotice("Enter a Razorpay plan ID to start subscription checkout.");
      return;
    }

    setIsSubscriptionSubmitting(true);

    try {
      const checkout = await createSubscriptionCheckout({
        planId: subscriptionPlanId.trim()
      });

      setSubscriptionNotice(
        `Checkout created${checkout?.id ? ` with subscription id ${checkout.id}.` : "."}`
      );
    } catch (error) {
      setSubscriptionNotice(error.message);
    } finally {
      setIsSubscriptionSubmitting(false);
    }
  }

  return (
    <Shell
      title="Owner command center"
      subtitle="Manage your restaurant profile, grow your menu, track subscription state, and keep the live order queue moving from one place."
      actions={
        <button
          type="button"
          onClick={() => setShowSubscriptionPanel((current) => !current)}
          className="rounded-xl bg-[#01de1a] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#00ff1e]"
        >
          {showSubscriptionPanel ? "Hide subscription" : "Manage subscription"}
        </button>
      }
    >
      <SubscriptionBanner subscription={subscriptionView} />

      {showSubscriptionPanel ? (
        <section className="card-surface p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[#01de1a]">Subscription control</p>
              <h2 className="mt-2 text-2xl font-semibold text-[#1a1a1a]">Billing and access</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                Refresh your current subscription state or start a Razorpay subscription checkout when a plan ID is available.
              </p>
            </div>
            <div className="rounded-3xl bg-[#f8f9fa] px-5 py-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Current state</p>
              <p className="mt-2 text-xl font-semibold text-[#1a1a1a]">{subscriptionView.planName}</p>
              <p className="mt-1 text-sm text-slate-500">{subscriptionView.status}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-[#f8f9fa] p-4 text-sm text-slate-500">
              <p>Amount: {subscriptionView.amountPaise ? formatPaise(subscriptionView.amountPaise) : "Not set yet"}</p>
              <p className="mt-2">
                Period end: {subscriptionView.currentPeriodEnd ? formatOrderDate(subscriptionView.currentPeriodEnd) : "Not available"}
              </p>
              <p className="mt-2 break-all">
                Razorpay subscription: {subscriptionView.razorpaySubscriptionId || "Not linked yet"}
              </p>
            </div>

            <div className="grid gap-3">
              <label className="block">
                <span className="mb-2 block text-sm text-slate-500">Razorpay plan ID</span>
                <input
                  type="text"
                  value={subscriptionPlanId}
                  onChange={(event) => setSubscriptionPlanId(event.target.value)}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#01de1a]"
                  placeholder="plan_XXXXXXXX"
                />
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={isSubscriptionSubmitting}
                  onClick={handleRefreshSubscription}
                  className="rounded-xl border border-black/10 px-4 py-3 text-sm text-slate-600 transition hover:border-[#01de1a] hover:text-[#01de1a] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Refresh status
                </button>
                <button
                  type="button"
                  disabled={isSubscriptionSubmitting}
                  onClick={handleStartCheckout}
                  className="rounded-xl bg-[#01de1a] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#00ff1e] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Start checkout
                </button>
              </div>
            </div>
          </div>

          {subscriptionNotice ? (
            <div className="mt-4 rounded-2xl border border-black/10 bg-[#f8f9fa] px-4 py-3 text-sm text-slate-600">
              {subscriptionNotice}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Gross sales" value={formatPaise(grossSalesPaise)} hint="Calculated from all non-cancelled orders." />
        <StatCard label="Live queue" value={String(liveOrders.length)} hint="Orders still moving through the kitchen and delivery flow." />
        <StatCard label="Active menu items" value={menuReady ? String(activeMenuItems) : "..."} hint="Pulled from the selected restaurant menu." />
        <StatCard label="Cancellation rate" value={cancellationRate} hint="Share of cancelled orders against total order volume." />
      </section>

      <section className="card-surface p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#01de1a]">Restaurant setup</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#1a1a1a]">Owner location profile</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
              Create the first restaurant profile for this owner account, then switch between owned restaurants and manage each menu separately.
            </p>
          </div>

          {restaurants.length > 0 ? (
            <div className="min-w-[240px]">
              <label className="block">
                <span className="mb-2 block text-sm text-slate-500">Active restaurant</span>
                <select
                  value={selectedRestaurantId}
                  onChange={(event) => setSelectedRestaurantId(event.target.value)}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#01de1a]"
                >
                  {restaurants.map((restaurant) => (
                    <option key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}
        </div>

        {selectedRestaurant ? (
          <div className="mt-6 rounded-3xl bg-[#f8f9fa] p-5 text-sm text-slate-500">
            <p className="font-semibold text-[#1a1a1a]">{selectedRestaurant.name}</p>
            <p className="mt-2">City: {selectedRestaurant.city || "Hyderabad"}</p>
            <p className="mt-2">Cuisine summary: {selectedRestaurant.cuisine_summary || "Add more detail in a later enhancement."}</p>
            <p className="mt-2">Subscription status: {selectedRestaurant.subscription_status || "inactive"}</p>
          </div>
        ) : null}

        <form onSubmit={handleCreateRestaurant} className="mt-6 grid gap-4 md:grid-cols-3">
          <label className="block">
            <span className="mb-2 block text-sm text-slate-500">Restaurant name</span>
            <input
              type="text"
              required
              value={restaurantForm.name}
              onChange={(event) => setRestaurantForm((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#01de1a]"
              placeholder="Paradise Signature"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-500">City</span>
            <input
              type="text"
              value={restaurantForm.city}
              onChange={(event) => setRestaurantForm((current) => ({ ...current, city: event.target.value }))}
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#01de1a]"
              placeholder="Hyderabad"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-500">Cuisine summary</span>
            <input
              type="text"
              value={restaurantForm.cuisineSummary}
              onChange={(event) => setRestaurantForm((current) => ({ ...current, cuisineSummary: event.target.value }))}
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#01de1a]"
              placeholder="Biryani, Kebabs, Andhra"
            />
          </label>

          <div className="md:col-span-3 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isRestaurantSubmitting}
              className="rounded-xl bg-[#01de1a] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#00ff1e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRestaurantSubmitting ? "Saving..." : restaurants.length > 0 ? "Add another restaurant" : "Create restaurant profile"}
            </button>
          </div>
        </form>

        {restaurantNotice ? (
          <div className="mt-4 rounded-2xl border border-black/10 bg-[#f8f9fa] px-4 py-3 text-sm text-slate-600">
            {restaurantNotice}
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="section-title">Live owner queue</h2>
          <p className="muted-copy mt-2">
            New customer orders refresh automatically here. Owners can accept, start preparing, or cancel directly from the queue.
          </p>
        </div>

        {orderFeedback ? (
          <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-slate-600">{orderFeedback}</div>
        ) : null}

        {!ordersReady ? (
          <div className="card-surface p-6 text-sm text-slate-500">Loading owner order queue...</div>
        ) : liveOrders.length === 0 ? (
          <div className="card-surface p-6 text-sm leading-7 text-slate-500">
            No live orders yet. Create a restaurant, place a customer order, and this queue will begin updating in realtime.
          </div>
        ) : (
          <div className="space-y-4">
            {liveOrders.map((order) => (
              <article key={order.id} className="card-surface p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[#01de1a]">{shortOrderId(order.id)}</p>
                    <h3 className="mt-2 text-2xl font-semibold text-[#1a1a1a]">
                      {order.restaurant?.name || "Your restaurant"}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      {formatOrderDate(order.created_at)} · {getItemCount(order)} items · {formatPaise(order.total_paise)}
                    </p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>

                <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-500">
                  <span>City: {order.city || order.restaurant?.city || "Hyderabad"}</span>
                  <span>
                    Delivery: {order.assigned_delivery_id ? `Assigned to ${shortOrderId(order.assigned_delivery_id)}` : "Waiting for partner"}
                  </span>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  {getOwnerActions(order.status).map((action) => (
                    <button
                      key={`${order.id}-${action.status}`}
                      type="button"
                      disabled={busyOrderId === order.id}
                      onClick={() => handleOwnerAction(order.id, action.status)}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        action.tone === "danger"
                          ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                          : "bg-[#01de1a] text-black hover:bg-[#00ff1e]"
                      }`}
                    >
                      {busyOrderId === order.id ? "Updating..." : action.label}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {recentOrders.length > 0 ? (
        <section className="space-y-4">
          <div>
            <h2 className="section-title">Recent resolved orders</h2>
            <p className="muted-copy mt-2">Delivered and cancelled orders stay visible for quick review.</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {recentOrders.map((order) => (
              <article key={order.id} className="card-surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{shortOrderId(order.id)}</p>
                    <h3 className="mt-2 text-lg font-semibold text-[#1a1a1a]">
                      {order.restaurant?.name || "Your restaurant"}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">{formatOrderDate(order.updated_at || order.created_at)}</p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <OwnerMenuManager
        restaurant={selectedRestaurant}
        items={menuItems}
        isSubmitting={isMenuSubmitting}
        notice={menuNotice || (!menuReady ? "Loading menu..." : "")}
        onCreateItem={handleCreateMenuItem}
        onUpdateItem={handleUpdateMenuItem}
      />
    </Shell>
  );
}
