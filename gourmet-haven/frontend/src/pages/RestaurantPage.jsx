import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Shell from "../components/common/Shell";
import CartSidebar from "../components/customer/CartSidebar";
import MenuItemCard from "../components/customer/MenuItemCard";
import RestaurantReviews from "../components/customer/RestaurantReviews";
import { fetchRestaurantMenu } from "../services/restaurantService";
import { useCartStore } from "../store/cartStore";

const VEG_FILTERS = [
  { value: "all", label: "All" },
  { value: "veg", label: "🟢 Veg" },
  { value: "nonveg", label: "🔴 Non-veg" }
];

function getRatingLabel(avg) {
  const n = Number(avg || 0);
  return n > 0 ? n.toFixed(1) : null;
}

function MenuItemSkeleton() {
  return (
    <div className="card animate-pulse flex overflow-hidden">
      <div className="flex-1 p-4 space-y-3">
        <div className="h-4 w-2/3 rounded-lg" style={{ background: "var(--muted)" }} />
        <div className="h-3 w-5/6 rounded-lg" style={{ background: "var(--muted)" }} />
        <div className="flex justify-between mt-4">
          <div className="h-5 w-16 rounded-lg" style={{ background: "var(--muted)" }} />
          <div className="h-8 w-16 rounded-xl" style={{ background: "var(--muted)" }} />
        </div>
      </div>
      <div className="w-24 sm:w-28" style={{ background: "var(--muted)" }} />
    </div>
  );
}

export default function RestaurantPage() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const { items, addItem, decrementItem, restaurantId: cartRestaurantId } = useCartStore();

  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [vegFilter, setVegFilter] = useState("all");
  const [activeSection, setActiveSection] = useState("menu");

  const quantityByItemId = useMemo(
    () => items.reduce((map, item) => { map[item.id] = Number(item.quantity || 0); return map; }, {}),
    [items]
  );

  useEffect(() => {
    if (!restaurantId) { navigate("/customer"); return; }
    let isMounted = true;
    setLoading(true); setError("");

    fetchRestaurantMenu(restaurantId)
      .then((res) => {
        if (!isMounted) return;
        setRestaurant(res.restaurant || null);
        setMenu(res.menu || {});
      })
      .catch((err) => { if (!isMounted) return; setError(err.message || "Unable to load restaurant."); })
      .finally(() => { if (isMounted) setLoading(false); });

    return () => { isMounted = false; };
  }, [restaurantId, navigate]);

  const filteredMenu = useMemo(() => {
    if (vegFilter === "all") return menu;
    return Object.fromEntries(
      Object.entries(menu)
        .map(([cat, arr]) => [cat, arr.filter((i) => vegFilter === "veg" ? i.is_veg : !i.is_veg)])
        .filter(([, arr]) => arr.length > 0)
    );
  }, [menu, vegFilter]);

  const totalCount = useMemo(() => Object.values(menu).reduce((s, a) => s + a.length, 0), [menu]);
  const menuEntries = Object.entries(filteredMenu);
  const rating = getRatingLabel(restaurant?.avg_rating);

  if (loading) {
    return (
      <Shell title="" subtitle="">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <MenuItemSkeleton key={i} />)}
        </div>
      </Shell>
    );
  }

  if (error || !restaurant) {
    return (
      <Shell title="Restaurant not found" subtitle="">
        <div className="card-surface p-6">
          <p className="text-sm" style={{ color: "#991b1b" }}>{error || "This restaurant is not available."}</p>
          <button type="button" onClick={() => navigate("/customer")} className="btn-primary mt-4">
            Back to discover
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell title="" subtitle="">
      {/* Cover */}
      <div className="-mt-8 overflow-hidden rounded-2xl">
        {restaurant.cover_image_url ? (
          <div className="relative h-48 sm:h-60">
            <img src={restaurant.cover_image_url} alt={restaurant.name} className="h-full w-full object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(28,25,23,0.5) 0%, transparent 60%)" }} />
          </div>
        ) : (
          <div className="h-36 w-full" style={{ background: "linear-gradient(135deg, #14532d 0%, #16a34a 100%)" }} />
        )}
      </div>

      {/* Info card */}
      <section className="card-surface p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {/* Logo */}
          <div className="-mt-14 relative z-10 flex-shrink-0">
            {restaurant.logo_url ? (
              <img
                src={restaurant.logo_url}
                alt={restaurant.name}
                className="h-20 w-20 rounded-2xl object-cover"
                style={{ border: "3px solid white", boxShadow: "0 4px 12px rgba(28,25,23,0.12)" }}
              />
            ) : (
              <div
                className="flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-bold text-white"
                style={{ background: "var(--brand)", border: "3px solid white", boxShadow: "0 4px 12px rgba(28,25,23,0.12)" }}
              >
                {restaurant.name?.slice(0, 1)?.toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 sm:mt-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: "var(--ink)" }}>{restaurant.name}</h1>
                <p className="mt-0.5 text-sm" style={{ color: "var(--ink-muted)" }}>{restaurant.locality || "Hyderabad"}</p>
                {restaurant.cuisine_summary && (
                  <p className="mt-1 text-sm" style={{ color: "var(--ink-secondary)" }}>{restaurant.cuisine_summary}</p>
                )}
              </div>

              {rating && (
                <div
                  className="flex items-center gap-1.5 rounded-xl px-3 py-1.5"
                  style={{ background: "#fffbeb", border: "1px solid #fde68a" }}
                >
                  <span className="text-amber-400">★</span>
                  <span className="text-sm font-bold" style={{ color: "#92400e" }}>{rating}</span>
                </div>
              )}
            </div>

            {restaurant.description && (
              <p className="mt-3 text-sm leading-6" style={{ color: "var(--ink-secondary)" }}>
                {restaurant.description}
              </p>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div className="mt-5 flex gap-2" style={{ borderTop: "1px solid var(--border)", paddingTop: "1.25rem" }}>
          {["menu", "reviews"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveSection(tab)}
              className={`nav-pill capitalize ${activeSection === tab ? "nav-pill-active" : ""}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </section>

      {/* Menu section */}
      {activeSection === "menu" && (
        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            {/* Veg filter */}
            {totalCount > 0 && (
              <div className="flex flex-wrap gap-2">
                {VEG_FILTERS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setVegFilter(opt.value)}
                    className={`nav-pill text-sm ${vegFilter === opt.value ? "nav-pill-active" : ""}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {menuEntries.length === 0 && totalCount > 0 ? (
              <div className="card-surface p-8 text-center">
                <p className="font-semibold" style={{ color: "var(--ink)" }}>No {vegFilter} items available</p>
                <button type="button" onClick={() => setVegFilter("all")} className="btn-secondary mt-3">Show all</button>
              </div>
            ) : menuEntries.length === 0 ? (
              <div className="card-surface p-8 text-center">
                <p className="text-3xl">🍽️</p>
                <p className="mt-3 font-semibold" style={{ color: "var(--ink)" }}>No menu items yet</p>
              </div>
            ) : (
              menuEntries.map(([category, categoryItems]) => (
                <div key={category} className="space-y-3">
                  <div style={{ borderBottom: "1px solid var(--border)" }} className="pb-2">
                    <p className="label-xs">{category}</p>
                    <h3 className="mt-1 text-lg font-semibold" style={{ color: "var(--ink)" }}>{category}</h3>
                  </div>
                  <div className="space-y-3">
                    {categoryItems.map((item) => (
                      <MenuItemCard
                        key={item.id}
                        item={{ ...item, price: item.price_paise, restaurantId: restaurant.id, restaurantName: restaurant.name }}
                        currentQty={cartRestaurantId === restaurant.id ? quantityByItemId[item.id] || 0 : 0}
                        onAdd={(m) => addItem({ id: m.id, name: m.name, price: m.price, image_url: m.image_url || null, restaurantId: restaurant.id, restaurantName: restaurant.name })}
                        onIncrement={(m) => addItem({ id: m.id, name: m.name, price: m.price, image_url: m.image_url || null, restaurantId: restaurant.id, restaurantName: restaurant.name })}
                        onDecrement={(m) => decrementItem(m.id)}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="sticky top-6 self-start">
            <CartSidebar activeRestaurant={restaurant} />
          </div>
        </section>
      )}

      {/* Reviews section */}
      {activeSection === "reviews" && (
        <RestaurantReviews restaurantId={restaurant.id} avgRating={restaurant.avg_rating} />
      )}
    </Shell>
  );
}