import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Shell from "../components/common/Shell";
import CartSidebar from "../components/customer/CartSidebar";
import MenuItemCard from "../components/customer/MenuItemCard";
import { fetchRestaurantMenu } from "../services/restaurantService";
import { useCartStore } from "../store/cartStore";

const VEG_FILTERS = [
  { value: "all", label: "All" },
  { value: "veg", label: "🟢 Veg" },
  { value: "nonveg", label: "🔴 Non-veg" }
];

function MenuItemSkeleton() {
  return (
    <div className="card animate-pulse flex overflow-hidden">
      <div className="flex-1 p-4 space-y-3">
        <div className="h-4 w-2/3 rounded-lg" style={{ background: "var(--muted)" }} />
        <div className="h-3 w-5/6 rounded-lg" style={{ background: "var(--muted)" }} />
        <div className="h-3 w-1/3 rounded-lg" style={{ background: "var(--muted)" }} />
        <div className="flex justify-between items-center mt-4">
          <div className="h-5 w-16 rounded-lg" style={{ background: "var(--muted)" }} />
          <div className="h-8 w-16 rounded-xl" style={{ background: "var(--muted)" }} />
        </div>
      </div>
      <div className="w-24 sm:w-28" style={{ background: "var(--muted)" }} />
    </div>
  );
}

export default function OrdersPage() {
  const [searchParams] = useSearchParams();
  const requestedRestaurantId = searchParams.get("restaurantId");
  const { items, addItem, decrementItem, restaurantId: cartRestaurantId } = useCartStore();

  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [vegFilter, setVegFilter] = useState("all");

  const quantityByItemId = useMemo(
    () => items.reduce((map, item) => { map[item.id] = Number(item.quantity || 0); return map; }, {}),
    [items]
  );

  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (!requestedRestaurantId) {
        setRestaurant(null); setMenu({}); setLoading(false);
        setError("Choose a restaurant from the discover page to start ordering.");
        return;
      }
      setLoading(true); setError("");
      try {
        const res = await fetchRestaurantMenu(requestedRestaurantId);
        if (!isMounted) return;
        setRestaurant(res.restaurant || null);
        setMenu(res.menu || {});
      } catch (err) {
        if (!isMounted) return;
        setRestaurant(null); setMenu({});
        setError(err.message || "Unable to load the menu right now.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => { isMounted = false; };
  }, [requestedRestaurantId]);

  const filteredMenu = useMemo(() => {
    if (vegFilter === "all") return menu;
    return Object.fromEntries(
      Object.entries(menu)
        .map(([cat, catItems]) => [cat, catItems.filter((i) => vegFilter === "veg" ? i.is_veg : !i.is_veg)])
        .filter(([, arr]) => arr.length > 0)
    );
  }, [menu, vegFilter]);

  const totalCount = useMemo(() => Object.values(menu).reduce((s, a) => s + a.length, 0), [menu]);
  const filteredCount = useMemo(() => Object.values(filteredMenu).reduce((s, a) => s + a.length, 0), [filteredMenu]);
  const menuEntries = Object.entries(filteredMenu);

  return (
    <Shell title="Build your order" subtitle="Browse the menu, add items, and place your order when ready.">

      {/* Restaurant header */}
      {restaurant && (
        <section className="card-surface p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {restaurant.logo_url ? (
              <img src={restaurant.logo_url} alt={restaurant.name} className="h-14 w-14 rounded-xl object-cover" style={{ border: "1px solid var(--border)" }} />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-xl text-xl font-bold text-white" style={{ background: "var(--brand)" }}>
                {restaurant.name?.slice(0, 1)?.toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <p className="label-xs">Ordering from</p>
              <h2 className="mt-1 text-xl font-semibold" style={{ color: "var(--ink)" }}>{restaurant.name}</h2>
              <p className="text-sm" style={{ color: "var(--ink-muted)" }}>{restaurant.locality || "Hyderabad"}</p>
            </div>

            {/* Veg filter */}
            {!loading && totalCount > 0 && (
              <div className="flex gap-1.5">
                {VEG_FILTERS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setVegFilter(opt.value)}
                    className={`nav-pill text-xs py-1.5 ${vegFilter === opt.value ? "nav-pill-active" : ""}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Main grid */}
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-8">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <MenuItemSkeleton key={i} />)}
            </div>
          ) : error ? (
            <div className="card-surface p-6 text-sm" style={{ color: "#991b1b" }}>{error}</div>
          ) : menuEntries.length === 0 && totalCount > 0 ? (
            <div className="card-surface p-8 text-center">
              <p className="text-3xl">{vegFilter === "veg" ? "🥦" : "🍖"}</p>
              <p className="mt-3 font-semibold" style={{ color: "var(--ink)" }}>
                No {vegFilter === "veg" ? "vegetarian" : "non-vegetarian"} items
              </p>
              <button type="button" onClick={() => setVegFilter("all")} className="btn-secondary mt-4 text-sm">
                Show all items
              </button>
            </div>
          ) : menuEntries.length === 0 ? (
            <div className="card-surface p-8 text-center">
              <p className="text-3xl">🍽️</p>
              <p className="mt-3 font-semibold" style={{ color: "var(--ink)" }}>No menu items yet</p>
            </div>
          ) : (
            <>
              {vegFilter !== "all" && (
                <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
                  Showing {filteredCount} of {totalCount} items
                </p>
              )}
              {menuEntries.map(([category, categoryItems]) => (
                <div key={category} className="space-y-3">
                  <div style={{ borderBottom: "1px solid var(--border)" }} className="pb-2">
                    <p className="label-xs">{category}</p>
                    <h3 className="mt-1 text-lg font-semibold" style={{ color: "var(--ink)" }}>{category}</h3>
                  </div>
                  <div className="space-y-3">
                    {categoryItems.map((item) => (
                      <MenuItemCard
                        key={item.id}
                        item={{ ...item, price: item.price_paise, restaurantId: restaurant?.id, restaurantName: restaurant?.name }}
                        currentQty={cartRestaurantId === restaurant?.id ? quantityByItemId[item.id] || 0 : 0}
                        onAdd={(m) => addItem({ id: m.id, name: m.name, price: m.price, image_url: m.image_url || null, restaurantId: restaurant?.id, restaurantName: restaurant?.name })}
                        onIncrement={(m) => addItem({ id: m.id, name: m.name, price: m.price, image_url: m.image_url || null, restaurantId: restaurant?.id, restaurantName: restaurant?.name })}
                        onDecrement={(m) => decrementItem(m.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Sticky cart */}
        <div className="sticky top-6 self-start">
          <CartSidebar activeRestaurant={restaurant} />
        </div>
      </section>
    </Shell>
  );
}