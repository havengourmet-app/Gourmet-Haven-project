import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Shell from "../components/common/Shell";
import CartSidebar from "../components/customer/CartSidebar";
import MenuItemCard from "../components/customer/MenuItemCard";
import RestaurantReviews from "../components/customer/RestaurantReviews";
import { fetchRestaurantMenu } from "../services/restaurantService";
import { useCartStore } from "../store/cartStore";

const VEG_FILTER_OPTIONS = [
  { value: "all", label: "All items" },
  { value: "veg", label: "Veg only" },
  { value: "nonveg", label: "Non-veg only" }
];

function getRatingLabel(avg) {
  const n = Number(avg || 0);
  return n > 0 ? `${n.toFixed(1)} ★` : "New";
}

function MenuItemSkeleton() {
  return (
    <div className="card-surface overflow-hidden animate-pulse">
      <div className="h-44 w-full bg-slate-200" />
      <div className="space-y-3 p-5">
        <div className="h-5 w-2/3 rounded bg-slate-200" />
        <div className="h-4 w-5/6 rounded bg-slate-200" />
        <div className="mt-4 flex items-center justify-between">
          <div className="h-5 w-20 rounded bg-slate-200" />
          <div className="h-10 w-20 rounded-xl bg-slate-200" />
        </div>
      </div>
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
  const [activeSection, setActiveSection] = useState("menu"); // menu | reviews

  const quantityByItemId = useMemo(
    () => items.reduce((map, item) => { map[item.id] = Number(item.quantity || 0); return map; }, {}),
    [items]
  );

  useEffect(() => {
    if (!restaurantId) { navigate("/customer"); return; }

    let isMounted = true;
    setLoading(true);
    setError("");

    fetchRestaurantMenu(restaurantId)
      .then((res) => {
        if (!isMounted) return;
        setRestaurant(res.restaurant || null);
        setMenu(res.menu || {});
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || "Unable to load the restaurant.");
      })
      .finally(() => { if (isMounted) setLoading(false); });

    return () => { isMounted = false; };
  }, [restaurantId, navigate]);

  const filteredMenu = useMemo(() => {
    if (vegFilter === "all") return menu;
    return Object.fromEntries(
      Object.entries(menu)
        .map(([cat, catItems]) => [
          cat,
          catItems.filter((i) => vegFilter === "veg" ? i.is_veg : !i.is_veg)
        ])
        .filter(([, catItems]) => catItems.length > 0)
    );
  }, [menu, vegFilter]);

  const totalItemCount = useMemo(
    () => Object.values(menu).reduce((s, arr) => s + arr.length, 0),
    [menu]
  );

  const menuEntries = Object.entries(filteredMenu);

  if (loading) {
    return (
      <Shell title="Loading restaurant..." subtitle="">
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <MenuItemSkeleton key={i} />)}
        </div>
      </Shell>
    );
  }

  if (error || !restaurant) {
    return (
      <Shell title="Restaurant not found" subtitle="">
        <div className="card-surface p-6">
          <p className="text-sm text-rose-700">{error || "This restaurant is not available."}</p>
          <button
            type="button"
            onClick={() => navigate("/customer")}
            className="mt-4 rounded-xl bg-[#01de1a] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#00ff1e]"
          >
            Back to discover
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell title="" subtitle="">
      {/* ── Hero / cover ── */}
      <div className="-mt-8 overflow-hidden rounded-3xl">
        {restaurant.cover_image_url ? (
          <div className="relative h-52 w-full sm:h-64">
            <img
              src={restaurant.cover_image_url}
              alt={`${restaurant.name} cover`}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        ) : (
          <div className="h-40 w-full bg-gradient-to-br from-[#01de1a] via-[#00c218] to-[#0f172a]" />
        )}
      </div>

      {/* ── Restaurant info card ── */}
      <section className="card-surface p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {/* logo */}
          {restaurant.logo_url ? (
            <img
              src={restaurant.logo_url}
              alt={`${restaurant.name} logo`}
              className="h-20 w-20 flex-shrink-0 rounded-2xl border-4 border-white object-cover shadow-md -mt-12 relative z-10"
            />
          ) : (
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-[#01de1a] text-2xl font-bold text-black shadow-md -mt-12 relative z-10">
              {restaurant.name?.slice(0, 1)?.toUpperCase()}
            </div>
          )}

          <div className="flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold text-[#1a1a1a]">{restaurant.name}</h1>
                <p className="mt-1 text-sm text-slate-500">{restaurant.locality || "Hyderabad"}</p>
                {restaurant.cuisine_summary && (
                  <p className="mt-1 text-sm text-slate-400">{restaurant.cuisine_summary}</p>
                )}
              </div>

              <div className="flex flex-col items-end gap-2">
                <span className="rounded-full bg-[#e8f9eb] px-3 py-1 text-sm font-semibold text-[#01de1a]">
                  {getRatingLabel(restaurant.avg_rating)}
                </span>
                {Number(restaurant.avg_rating) > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveSection("reviews")}
                    className="text-xs text-slate-400 underline-offset-2 hover:text-[#01de1a] hover:underline"
                  >
                    See all reviews
                  </button>
                )}
              </div>
            </div>

            {restaurant.description && (
              <p className="mt-3 text-sm leading-6 text-slate-500">{restaurant.description}</p>
            )}
          </div>
        </div>

        {/* ── Tab bar: Menu / Reviews ── */}
        <div className="mt-6 flex gap-2 border-t border-black/5 pt-5">
          {["menu", "reviews"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveSection(tab)}
              className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition ${
                activeSection === tab
                  ? "bg-[#01de1a] text-black"
                  : "border border-black/10 text-slate-600 hover:border-[#01de1a] hover:text-[#01de1a]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </section>

      {/* ── Menu section ── */}
      {activeSection === "menu" && (
        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-8">
            {/* veg filter */}
            {totalItemCount > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {VEG_FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setVegFilter(opt.value)}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      vegFilter === opt.value
                        ? "bg-[#01de1a] text-black"
                        : "border border-black/10 text-slate-600 hover:border-[#01de1a] hover:text-[#01de1a]"
                    }`}
                  >
                    {opt.value !== "all" && (
                      <span className={`inline-flex h-3 w-3 items-center justify-center rounded-full border ${opt.value === "veg" ? "border-green-600" : "border-rose-600"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${opt.value === "veg" ? "bg-green-600" : "bg-rose-600"}`} />
                      </span>
                    )}
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {/* menu items */}
            {menuEntries.length === 0 && totalItemCount > 0 ? (
              <div className="card-surface p-6 text-sm text-slate-500">
                No {vegFilter === "veg" ? "vegetarian" : "non-vegetarian"} items available.{" "}
                <button type="button" onClick={() => setVegFilter("all")} className="font-medium text-[#01de1a] underline-offset-2 hover:underline">
                  Show all
                </button>
              </div>
            ) : menuEntries.length === 0 ? (
              <div className="card-surface p-6 text-sm text-slate-500">
                No menu items available yet.
              </div>
            ) : (
              menuEntries.map(([category, categoryItems]) => (
                <div key={category} className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[#01de1a]">{category}</p>
                    <h3 className="mt-2 text-xl font-semibold text-[#1a1a1a]">{category}</h3>
                  </div>
                  <div className="grid gap-5 lg:grid-cols-2">
                    {categoryItems.map((item) => (
                      <MenuItemCard
                        key={item.id}
                        item={{
                          ...item,
                          price: item.price_paise,
                          restaurantId: restaurant.id,
                          restaurantName: restaurant.name
                        }}
                        currentQty={cartRestaurantId === restaurant.id ? quantityByItemId[item.id] || 0 : 0}
                        onAdd={(menuItem) => addItem({ id: menuItem.id, name: menuItem.name, price: menuItem.price, image_url: menuItem.image_url || null, restaurantId: restaurant.id, restaurantName: restaurant.name })}
                        onIncrement={(menuItem) => addItem({ id: menuItem.id, name: menuItem.name, price: menuItem.price, image_url: menuItem.image_url || null, restaurantId: restaurant.id, restaurantName: restaurant.name })}
                        onDecrement={(menuItem) => decrementItem(menuItem.id)}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* sticky cart */}
          <div className="sticky top-6 self-start">
            <CartSidebar activeRestaurant={restaurant} />
          </div>
        </section>
      )}

      {/* ── Reviews section ── */}
      {activeSection === "reviews" && (
        <RestaurantReviews restaurantId={restaurant.id} avgRating={restaurant.avg_rating} />
      )}
    </Shell>
  );
}