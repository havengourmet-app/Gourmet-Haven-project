import { useEffect, useMemo, useState } from "react";
import OrderStatusBadge from "../components/common/OrderStatusBadge";
import Shell from "../components/common/Shell";
import StatCard from "../components/common/StatCard";
import OwnerMenuManager, { ImageUploader } from "../components/owner/OwnerMenuManager";
import OwnerAnalytics from "../components/owner/OwnerAnalytics";
import SubscriptionBanner from "../components/owner/SubscriptionBanner";
import { useRealtimeOrders } from "../hooks/useRealtimeOrders";
import { formatOrderDate, formatOrderStatus, formatPaise, getItemCount, getOwnerActions, shortOrderId } from "../lib/orderPresentation";
import { listOwnerOrders, updateOrderStatus } from "../services/orderService";
import { createMenuItem, createRestaurant, listMenuItems, listOwnerRestaurants, updateRestaurant, updateMenuItem } from "../services/restaurantService";
import { createSubscriptionCheckout, getSubscriptionStatus } from "../services/subscriptionService";

const EMPTY_RESTAURANT_FORM = { name: "", city: "Hyderabad", locality: "", cuisineSummary: "", logo_url: null, cover_image_url: null };

function toRestaurantFormValues(r) {
  if (!r) return EMPTY_RESTAURANT_FORM;
  return { name: r.name || "", city: r.city || "Hyderabad", locality: r.locality || "", cuisineSummary: r.cuisine_summary || "", logo_url: r.logo_url || null, cover_image_url: r.cover_image_url || null };
}

function normalizeSubscription(s) {
  if (!s) return { planName: "Growth - Hyderabad", status: "Inactive" };
  return { planName: s.plan_name || "Growth - Hyderabad", status: s.status ? s.status.replaceAll("_", " ") : "inactive", amountPaise: s.amount_paise || 0, currentPeriodEnd: s.current_period_end || null, razorpaySubscriptionId: s.razorpay_subscription_id || null };
}

export default function OwnerDashboardPage() {
  const [orders, setOrders] = useState([]);
  const [ordersReady, setOrdersReady] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [menuItems, setMenuItems] = useState([]);
  const [menuReady, setMenuReady] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [showSubscriptionPanel, setShowSubscriptionPanel] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [restaurantForm, setRestaurantForm] = useState(EMPTY_RESTAURANT_FORM);
  const [isCreatingRestaurant, setIsCreatingRestaurant] = useState(false);
  const [subscriptionPlanId, setSubscriptionPlanId] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);
  const [busyOrderId, setBusyOrderId] = useState(null);
  const [isRestaurantSubmitting, setIsRestaurantSubmitting] = useState(false);
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [isMenuSubmitting, setIsMenuSubmitting] = useState(false);
  const [isSubscriptionSubmitting, setIsSubscriptionSubmitting] = useState(false);
  const [orderFeedback, setOrderFeedback] = useState("");
  const [restaurantNotice, setRestaurantNotice] = useState("");
  const [menuNotice, setMenuNotice] = useState("");
  const [subscriptionNotice, setSubscriptionNotice] = useState("");

  const selectedRestaurant = restaurants.find((r) => r.id === selectedRestaurantId) || null;
  const liveOrders = orders.filter((o) => !["delivered", "cancelled"].includes(o.status));
  const recentOrders = orders.filter((o) => ["delivered", "cancelled"].includes(o.status)).slice(0, 4);
  const grossSalesPaise = orders.filter((o) => o.status !== "cancelled").reduce((t, o) => t + Number(o.total_paise || 0), 0);
  const cancellationRate = orders.length ? `${((orders.filter((o) => o.status === "cancelled").length / orders.length) * 100).toFixed(1)}%` : "0.0%";
  const activeMenuItems = useMemo(() => menuItems.filter((i) => i.is_available).length, [menuItems]);
  const isRestaurantImageUploading = isLogoUploading || isCoverUploading;
  const isEditingRestaurant = Boolean(selectedRestaurant?.id) && !isCreatingRestaurant;
  const subscriptionView = normalizeSubscription(subscription);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const [rests, ords, sub] = await Promise.all([listOwnerRestaurants(), listOwnerOrders(), getSubscriptionStatus()]);
        if (!isMounted) return;
        const nextRests = Array.isArray(rests) ? rests : [];
        setRestaurants(nextRests); setOrders(Array.isArray(ords) ? ords : []); setSubscription(sub || null);
        if (nextRests.length > 0) setSelectedRestaurantId((c) => c && nextRests.some((r) => r.id === c) ? c : nextRests[0].id);
        else setSelectedRestaurantId("");
      } catch { if (isMounted) { setRestaurants([]); setOrders([]); setSubscription(null); setSelectedRestaurantId(""); } }
      finally { if (isMounted) { setOrdersReady(true); } }
    }
    load();
    return () => { isMounted = false; };
  }, [refreshToken]);

  useEffect(() => {
    let isMounted = true;
    async function loadMenu() {
      if (!selectedRestaurantId) { if (isMounted) { setMenuItems([]); setMenuReady(true); } return; }
      setMenuReady(false);
      try { const its = await listMenuItems(selectedRestaurantId); if (isMounted) setMenuItems(Array.isArray(its) ? its : []); }
      catch { if (isMounted) setMenuItems([]); }
      finally { if (isMounted) setMenuReady(true); }
    }
    loadMenu();
    return () => { isMounted = false; };
  }, [selectedRestaurantId, refreshToken]);

  useEffect(() => {
    if (!selectedRestaurant) { setRestaurantForm(EMPTY_RESTAURANT_FORM); return; }
    if (!isCreatingRestaurant) setRestaurantForm(toRestaurantFormValues(selectedRestaurant));
  }, [isCreatingRestaurant, selectedRestaurant]);

  useRealtimeOrders({ enabled: true, onOrderChange: () => setRefreshToken((v) => v + 1) });

  async function handleOwnerAction(orderId, nextStatus) {
    setBusyOrderId(orderId); setOrderFeedback("");
    try {
      const updated = await updateOrderStatus(orderId, { status: nextStatus });
      setOrderFeedback(`${shortOrderId(updated.id)} moved to ${formatOrderStatus(updated.status)}.`);
      setRefreshToken((v) => v + 1);
    } catch (err) { setOrderFeedback(err.message); }
    finally { setBusyOrderId(null); }
  }

  async function handleSaveRestaurant(e) {
    e.preventDefault(); setRestaurantNotice("");
    if (isRestaurantImageUploading) { setRestaurantNotice("Please wait for the image upload to finish."); return; }
    setIsRestaurantSubmitting(true);
    const payload = { name: restaurantForm.name.trim(), city: restaurantForm.city.trim() || "Hyderabad", locality: restaurantForm.locality.trim(), cuisineSummary: restaurantForm.cuisineSummary.trim(), logo_url: restaurantForm.logo_url || null, cover_image_url: restaurantForm.cover_image_url || null };
    try {
      if (isEditingRestaurant) {
        const updated = await updateRestaurant(selectedRestaurant.id, payload);
        setRestaurants((c) => c.map((r) => (r.id === updated.id ? updated : r)));
        setRestaurantForm(toRestaurantFormValues(updated));
        setRestaurantNotice(`Saved changes for ${updated.name}.`);
      } else {
        const created = await createRestaurant(payload);
        setRestaurants((c) => [created, ...c]);
        setSelectedRestaurantId(created.id);
        setIsCreatingRestaurant(false);
        setRestaurantNotice(`Restaurant profile created for ${created.name}.`);
      }
    } catch (err) { setRestaurantNotice(err.message); }
    finally { setIsRestaurantSubmitting(false); }
  }

  async function handleCreateMenuItem(payload) {
    setMenuNotice(""); setIsMenuSubmitting(true);
    try { const c = await createMenuItem(payload); setMenuItems((arr) => [c, ...arr]); setMenuNotice(`${c.name} added.`); return c; }
    catch (err) { setMenuNotice(err.message); throw err; }
    finally { setIsMenuSubmitting(false); }
  }

  async function handleUpdateMenuItem(id, payload) {
    setMenuNotice(""); setIsMenuSubmitting(true);
    try { const u = await updateMenuItem(id, payload); setMenuItems((arr) => arr.map((i) => (i.id === id ? u : i))); setMenuNotice(`${u.name} updated.`); return u; }
    catch (err) { setMenuNotice(err.message); throw err; }
    finally { setIsMenuSubmitting(false); }
  }

  async function handleRefreshSubscription() {
    setSubscriptionNotice(""); setIsSubscriptionSubmitting(true);
    try { const s = await getSubscriptionStatus(); setSubscription(s || null); setSubscriptionNotice("Subscription status refreshed."); }
    catch (err) { setSubscriptionNotice(err.message); }
    finally { setIsSubscriptionSubmitting(false); }
  }

  async function handleStartCheckout() {
    setSubscriptionNotice("");
    if (!subscriptionPlanId.trim()) { setSubscriptionNotice("Enter a Razorpay plan ID to start checkout."); return; }
    setIsSubscriptionSubmitting(true);
    try { const c = await createSubscriptionCheckout({ planId: subscriptionPlanId.trim() }); setSubscriptionNotice(`Checkout created${c?.id ? ` — ${c.id}` : "."}`); }
    catch (err) { setSubscriptionNotice(err.message); }
    finally { setIsSubscriptionSubmitting(false); }
  }

  return (
    <Shell
      title="Owner command center"
      subtitle="Manage your restaurant, menu, subscriptions, and live order queue."
      actions={
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setShowAnalytics((c) => !c)} className="btn-secondary">
            {showAnalytics ? "Hide analytics" : "📊 Analytics"}
          </button>
          <button type="button" onClick={() => setShowSubscriptionPanel((c) => !c)} className="btn-primary">
            {showSubscriptionPanel ? "Hide subscription" : "Manage subscription"}
          </button>
        </div>
      }
    >
      <SubscriptionBanner subscription={subscriptionView} />

      {showAnalytics && <OwnerAnalytics />}

      {/* Subscription panel */}
      {showSubscriptionPanel && (
        <section className="card-surface p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="label-xs">Subscription control</p>
              <h2 className="mt-1 text-2xl font-semibold" style={{ color: "var(--ink)" }}>Billing and access</h2>
              <p className="mt-2 max-w-xl text-sm" style={{ color: "var(--ink-secondary)" }}>
                Refresh subscription state or start a Razorpay checkout when a plan ID is available.
              </p>
            </div>
            <div className="rounded-xl px-5 py-4" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
              <p className="text-xs font-medium" style={{ color: "var(--ink-muted)" }}>Current plan</p>
              <p className="mt-1 text-xl font-semibold" style={{ color: "var(--ink)" }}>{subscriptionView.planName}</p>
              <p className="text-sm capitalize" style={{ color: "var(--ink-secondary)" }}>{subscriptionView.status}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl p-4 text-sm space-y-1.5" style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--ink-secondary)" }}>
              <p>Amount: {subscriptionView.amountPaise ? formatPaise(subscriptionView.amountPaise) : "Not set"}</p>
              <p>Period end: {subscriptionView.currentPeriodEnd ? formatOrderDate(subscriptionView.currentPeriodEnd) : "N/A"}</p>
              <p className="break-all">Razorpay ID: {subscriptionView.razorpaySubscriptionId || "Not linked"}</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="input-label">Razorpay plan ID</label>
                <input type="text" value={subscriptionPlanId} onChange={(e) => setSubscriptionPlanId(e.target.value)} className="input" placeholder="plan_XXXXXXXX" />
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={isSubscriptionSubmitting} onClick={handleRefreshSubscription} className="btn-secondary">Refresh status</button>
                <button type="button" disabled={isSubscriptionSubmitting} onClick={handleStartCheckout} className="btn-primary">Start checkout</button>
              </div>
            </div>
          </div>

          {subscriptionNotice && (
            <div className="mt-4 rounded-xl px-4 py-3 text-sm" style={{ background: "var(--brand-lightest)", border: "1px solid var(--brand-lighter)", color: "var(--brand-dark)" }}>
              {subscriptionNotice}
            </div>
          )}
        </section>
      )}

      {/* Stats */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Gross sales" value={formatPaise(grossSalesPaise)} hint="All non-cancelled orders." accent />
        <StatCard label="Live queue" value={String(liveOrders.length)} hint="Orders in progress." />
        <StatCard label="Active menu items" value={menuReady ? String(activeMenuItems) : "..."} hint="From selected restaurant." />
        <StatCard label="Cancellation rate" value={cancellationRate} hint="Cancelled vs total." />
      </section>

      {/* Restaurant setup */}
      <section className="card-surface p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="label-xs">Restaurant setup</p>
            <h2 className="mt-1 text-2xl font-semibold" style={{ color: "var(--ink)" }}>Location profile</h2>
            <p className="mt-2 max-w-xl text-sm" style={{ color: "var(--ink-secondary)" }}>
              Create and manage your restaurant profiles. Switch between owned restaurants and update details from here.
            </p>
          </div>

          {restaurants.length > 0 && (
            <div className="flex min-w-[220px] flex-col gap-2">
              <label className="input-label">Active restaurant</label>
              <select value={selectedRestaurantId} onChange={(e) => { setSelectedRestaurantId(e.target.value); setIsCreatingRestaurant(false); setRestaurantNotice(""); }} className="input">
                {restaurants.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <button type="button" onClick={() => { setIsCreatingRestaurant(true); setRestaurantForm(EMPTY_RESTAURANT_FORM); setRestaurantNotice(""); }} className="btn-secondary text-sm">
                + Create another
              </button>
            </div>
          )}
        </div>

        {selectedRestaurant && !isCreatingRestaurant && (
          <div className="mt-5 rounded-xl px-4 py-3 text-sm space-y-1" style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--ink-secondary)" }}>
            <p className="font-semibold" style={{ color: "var(--ink)" }}>{selectedRestaurant.name}</p>
            <p>Locality: {selectedRestaurant.locality || "—"} · Subscription: {selectedRestaurant.subscription_status || "inactive"}</p>
          </div>
        )}

        <div className="mt-4 rounded-xl px-4 py-2.5 text-sm" style={{ background: "var(--brand-lightest)", border: "1px solid var(--brand-lighter)", color: "var(--brand-dark)" }}>
          {isEditingRestaurant ? `Editing ${selectedRestaurant.name} — update details and click Save changes.` : "Create mode — fill in the details below."}
        </div>

        <form onSubmit={handleSaveRestaurant} className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="grid gap-4 md:col-span-2 md:grid-cols-2">
            <ImageUploader label="Restaurant logo" existingUrl={restaurantForm.logo_url} onUpload={(url) => setRestaurantForm((c) => ({ ...c, logo_url: url }))} onUploadingChange={setIsLogoUploading} />
            <ImageUploader label="Cover image" existingUrl={restaurantForm.cover_image_url} onUpload={(url) => setRestaurantForm((c) => ({ ...c, cover_image_url: url }))} onUploadingChange={setIsCoverUploading} />
          </div>

          {[
            { label: "Restaurant name", key: "name", placeholder: "Paradise Signature", required: true },
            { label: "City", key: "city", placeholder: "Hyderabad" },
            { label: "Locality", key: "locality", placeholder: "Madhapur" },
            { label: "Cuisine summary", key: "cuisineSummary", placeholder: "Biryani, Kebabs, Andhra" }
          ].map(({ label, key, placeholder, required }) => (
            <div key={key}>
              <label className="input-label">{label}</label>
              <input type="text" required={required} value={restaurantForm[key]} onChange={(e) => setRestaurantForm((c) => ({ ...c, [key]: e.target.value }))} className="input" placeholder={placeholder} />
            </div>
          ))}

          <div className="md:col-span-2 flex flex-wrap gap-3">
            <button type="submit" disabled={isRestaurantSubmitting || isRestaurantImageUploading} className="btn-primary">
              {isRestaurantImageUploading ? "Uploading..." : isRestaurantSubmitting ? "Saving..." : isEditingRestaurant ? "Save changes" : "Create restaurant"}
            </button>
            {isCreatingRestaurant && selectedRestaurant && (
              <button type="button" onClick={() => { setIsCreatingRestaurant(false); setRestaurantNotice(""); setRestaurantForm(toRestaurantFormValues(selectedRestaurant)); }} className="btn-secondary">
                Cancel
              </button>
            )}
          </div>
        </form>

        {restaurantNotice && (
          <div className="mt-4 rounded-xl px-4 py-3 text-sm" style={{ background: "var(--brand-lightest)", border: "1px solid var(--brand-lighter)", color: "var(--brand-dark)" }}>
            {restaurantNotice}
          </div>
        )}
      </section>

      {/* Live order queue */}
      <section className="space-y-4">
        <div>
          <h2 className="section-title">Live order queue</h2>
          <p className="muted-copy mt-1">New orders refresh automatically. Accept, prepare, or cancel from here.</p>
        </div>

        {orderFeedback && (
          <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "var(--brand-lightest)", border: "1px solid var(--brand-lighter)", color: "var(--brand-dark)" }}>
            {orderFeedback}
          </div>
        )}

        {!ordersReady ? (
          <div className="card-surface p-6 text-sm" style={{ color: "var(--ink-muted)" }}>Loading order queue...</div>
        ) : liveOrders.length === 0 ? (
          <div className="card-surface p-10 text-center">
            <p className="text-4xl">📋</p>
            <p className="mt-3 font-semibold" style={{ color: "var(--ink)" }}>No live orders</p>
            <p className="mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>New orders will appear here in realtime.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {liveOrders.map((order) => (
              <article key={order.id} className="card-surface p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-mono" style={{ color: "var(--ink-muted)" }}>{shortOrderId(order.id)}</p>
                    <h3 className="mt-1 text-xl font-semibold" style={{ color: "var(--ink)" }}>{order.restaurant?.name || "Your restaurant"}</h3>
                    <p className="mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>
                      {formatOrderDate(order.created_at)} · {getItemCount(order)} items · {formatPaise(order.total_paise)}
                    </p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>

                <div className="mt-4 flex flex-wrap gap-4 rounded-xl px-4 py-3 text-sm" style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--ink-secondary)" }}>
                  <span>📍 {order.city || "Hyderabad"}</span>
                  <span>{order.assigned_delivery_id ? `✓ Partner assigned` : "⏳ Awaiting partner"}</span>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  {getOwnerActions(order.status).map((action) => (
                    <button
                      key={`${order.id}-${action.status}`}
                      type="button"
                      disabled={busyOrderId === order.id}
                      onClick={() => handleOwnerAction(order.id, action.status)}
                      className={action.tone === "danger" ? "btn-danger" : "btn-primary"}
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

      {/* Recent resolved */}
      {recentOrders.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="section-title">Recent resolved</h2>
            <p className="muted-copy mt-1">Delivered and cancelled orders for quick reference.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {recentOrders.map((order) => (
              <article key={order.id} className="card-surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-mono" style={{ color: "var(--ink-muted)" }}>{shortOrderId(order.id)}</p>
                    <p className="mt-1 font-semibold" style={{ color: "var(--ink)" }}>{order.restaurant?.name || "Restaurant"}</p>
                    <p className="mt-0.5 text-sm" style={{ color: "var(--ink-muted)" }}>{formatOrderDate(order.updated_at || order.created_at)}</p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

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