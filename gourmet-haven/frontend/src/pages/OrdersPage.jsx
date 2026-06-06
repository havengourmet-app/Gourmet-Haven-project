import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Shell from "../components/common/Shell";
import CartSidebar from "../components/customer/CartSidebar";
import MenuItemCard from "../components/customer/MenuItemCard";
import { fetchRestaurantMenu } from "../services/restaurantService";
import { useCartStore } from "../store/cartStore";

const VEG_FILTER_OPTIONS = [
  { value: "all", label: "All items" },
  { value: "veg", label: "Veg only" },
  { value: "nonveg", label: "Non-veg only" }
];

function MenuItemSkeleton({ index }) {
  return (
    <div key={`menu-skeleton-${index}`} className="card-surface overflow-hidden animate-pulse">
      <div className="h-44 w-full bg-slate-200" />
      <div className="space-y-3 p-5">
        <div className="h-5 w-2/3 rounded bg-slate-200" />
        <div className="h-4 w-5/6 rounded bg-slate-200" />
        <div className="h-4 w-1/2 rounded bg-slate-200" />
        <div className="mt-4 flex items-center justify-between">
          <div className="h-5 w-20 rounded bg-slate-200" />
          <div className="h-10 w-20 rounded-xl bg-slate-200" />
        </div>
      </div>
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
    () =>
      items.reduce((map, item) => {
        map[item.id] = Number(item.quantity || 0);
        return map;
      }, {}),
    [items]
  );

  useEffect(() => {
    let isMounted = true;

    async function loadRestaurantMenu() {
      if (!requestedRestaurantId) {
        setRestaurant(null);
        setMenu({});
        setLoading(false);
        setError("Choose a restaurant from the customer home page to start ordering.");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await fetchRestaurantMenu(requestedRestaurantId);

        if (!isMounted) return;

        setRestaurant(response.restaurant || null);
        setMenu(response.menu || {});
      } catch (loadError) {
        if (!isMounted) return;

        setRestaurant(null);
        setMenu({});
        setError(loadError.message || "Unable to load the restaurant menu right now.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadRestaurantMenu();

    return () => {
      isMounted = false;
    };
  }, [requestedRestaurantId]);

  const filteredMenu = useMemo(() => {
    if (vegFilter === "all") return menu;

    return Object.fromEntries(
      Object.entries(menu)
        .map(([category, categoryItems]) => {
          const filtered = categoryItems.filter((item) =>
            vegFilter === "veg" ? item.is_veg : !item.is_veg
          );
          return [category, filtered];
        })
        .filter(([, categoryItems]) => categoryItems.length > 0)
    );
  }, [menu, vegFilter]);

  const totalItemCount = useMemo(
    () => Object.values(menu).reduce((sum, arr) => sum + arr.length, 0),
    [menu]
  );

  const filteredItemCount = useMemo(
    () => Object.values(filteredMenu).reduce((sum, arr) => sum + arr.length, 0),
    [filteredMenu]
  );

  const menuEntries = Object.entries(filteredMenu);

  return (
    <Shell
      title="Build your order"
      subtitle="Browse the live menu, add items to your cart, and place the order when you're ready."
    >
      {restaurant ? (
        <section className="card-surface p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {restaurant.logo_url ? (
              <img
                src={restaurant.logo_url}
                alt={`${restaurant.name} logo`}
                className="h-16 w-16 rounded-2xl object-cover shadow-sm"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#01de1a] text-2xl font-semibold text-black">
                {restaurant.name?.slice(0, 1)?.toUpperCase() || "R"}
              </div>
            )}

            <div className="flex-1">
              <p className="text-xs uppercase tracking-[0.24em] text-[#01de1a]">Ordering from</p>
              <h2 className="mt-2 text-2xl font-semibold text-[#1a1a1a]">{restaurant.name}</h2>
              <p className="mt-2 text-sm text-slate-500">{restaurant.locality || "Hyderabad"}</p>
            </div>

            {!loading && totalItemCount > 0 && (
              <div className="flex items-center gap-2">
                {VEG_FILTER_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setVegFilter(option.value)}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      vegFilter === option.value
                        ? "bg-[#01de1a] text-black"
                        : "border border-black/10 text-slate-600 hover:border-[#01de1a] hover:text-[#01de1a]"
                    }`}
                  >
                    {option.value !== "all" && (
                      <span
                        className={`inline-flex h-3 w-3 items-center justify-center rounded-full border ${
                          option.value === "veg" ? "border-green-600" : "border-rose-600"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            option.value === "veg" ? "bg-green-600" : "bg-rose-600"
                          }`}
                        />
                      </span>
                    )}
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-8">
          {loading ? (
            <div className="grid gap-5 lg:grid-cols-2">
              {Array.from({ length: 4 }, (_, index) => (
                <MenuItemSkeleton key={`menu-loader-${index}`} index={index} />
              ))}
            </div>
          ) : error ? (
            <div className="card-surface p-6 text-sm text-rose-700">{error}</div>
          ) : menuEntries.length === 0 && totalItemCount > 0 ? (
            <div className="card-surface p-6 text-sm leading-7 text-slate-500">
              No{" "}
              {vegFilter === "veg" ? "vegetarian" : "non-vegetarian"} items available in this
              restaurant.{" "}
              <button
                type="button"
                onClick={() => setVegFilter("all")}
                className="font-medium text-[#01de1a] underline-offset-2 hover:underline"
              >
                Show all items
              </button>
            </div>
          ) : menuEntries.length === 0 ? (
            <div className="card-surface p-6 text-sm leading-7 text-slate-500">
              This restaurant does not have any available menu items yet.
            </div>
          ) : (
            <>
              {vegFilter !== "all" && (
                <p className="text-sm text-slate-500">
                  Showing {filteredItemCount} of {totalItemCount} items
                </p>
              )}
              {menuEntries.map(([category, categoryItems]) => (
                <section key={category} className="space-y-4">
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
                          restaurantId: restaurant?.id,
                          restaurantName: restaurant?.name
                        }}
                        currentQty={
                          cartRestaurantId === restaurant?.id
                            ? quantityByItemId[item.id] || 0
                            : 0
                        }
                        onAdd={(menuItem) =>
                          addItem({
                            id: menuItem.id,
                            name: menuItem.name,
                            price: menuItem.price,
                            image_url: menuItem.image_url || null,
                            restaurantId: restaurant?.id,
                            restaurantName: restaurant?.name
                          })
                        }
                        onIncrement={(menuItem) =>
                          addItem({
                            id: menuItem.id,
                            name: menuItem.name,
                            price: menuItem.price,
                            image_url: menuItem.image_url || null,
                            restaurantId: restaurant?.id,
                            restaurantName: restaurant?.name
                          })
                        }
                        onDecrement={(menuItem) => decrementItem(menuItem.id)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </>
          )}
        </div>

        {/* sticky cart — self-start keeps it from stretching, sticky top-6 pins it while scrolling */}
        <div className="sticky top-6 self-start">
          <CartSidebar activeRestaurant={restaurant} />
        </div>
      </section>
    </Shell>
  );
}