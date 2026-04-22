import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Shell from "../components/common/Shell";
import RestaurantCard from "../components/customer/RestaurantCard";
import { legacyAssets } from "../lib/legacyAssets";
import { listRestaurants } from "../services/restaurantService";
import { useUiStore } from "../store/uiStore";

const FALLBACK_RESTAURANTS = [
  {
    id: "d178fe1b-2ed8-4d6e-a0d5-56d44ac8ea01",
    name: "Paradise Signature",
    cuisine: "Biryani, Kebabs, Andhra",
    rating: "4.7",
    deliveryTime: "28 mins",
    minimumOrderLabel: "Min Rs 199",
    discountLabel: "50% OFF",
    image: legacyAssets.paradise
  },
  {
    id: "db2914c8-425e-4a3f-88a3-f6609cc5f2cb",
    name: "Absolute Barbecues",
    cuisine: "BBQ, Grills, Continental",
    rating: "4.4",
    deliveryTime: "22 mins",
    minimumOrderLabel: "Min Rs 149",
    discountLabel: "40% OFF",
    image: legacyAssets.absoluteBarbecues
  },
  {
    id: "74ee5abf-7b8d-4fd9-aadc-3946f9528830",
    name: "Mehfil Restaurant",
    cuisine: "Shawarma, Haleem, Rolls",
    rating: "4.5",
    deliveryTime: "34 mins",
    minimumOrderLabel: "Min Rs 179",
    discountLabel: "30% OFF",
    image: legacyAssets.mehfil
  }
];

export default function CustomerDashboardPage() {
  const navigate = useNavigate();
  const activeCity = useUiStore((state) => state.activeCity);
  const [restaurants, setRestaurants] = useState(FALLBACK_RESTAURANTS);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let isMounted = true;

    async function loadRestaurants() {
      try {
        const data = await listRestaurants();

        if (isMounted && Array.isArray(data?.data) && data.data.length > 0) {
          setRestaurants(
            data.data.map((restaurant, index) => ({
              ...restaurant,
              image:
                restaurant.image ||
                FALLBACK_RESTAURANTS[index % FALLBACK_RESTAURANTS.length].image,
              discountLabel:
                restaurant.discountLabel ||
                FALLBACK_RESTAURANTS[index % FALLBACK_RESTAURANTS.length].discountLabel
            }))
          );
        }
      } catch {
        return;
      } finally {
        if (isMounted) {
          setStatus("ready");
        }
      }
    }

    loadRestaurants();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Shell
      title={`Discover the best of ${activeCity}`}
      subtitle="Browse subscription-backed restaurants with predictable pricing, live order tracking, and the same clean Gourmet Haven dashboard feel you already built."
      actions={
        <button
          type="button"
          onClick={() => navigate("/orders")}
          className="rounded-xl bg-[#01de1a] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#00ff1e]"
        >
          Open cart
        </button>
      }
    >
      <section className="rounded-[1.5rem] bg-gradient-to-r from-[#01de1a] to-[#00b514] px-8 py-12 text-white">
        <h2 className="text-4xl font-bold">What are you craving today?</h2>
        <p className="mt-3 max-w-2xl text-base text-white/90">
          Order from the best restaurants near you while keeping the original Gourmet Haven bright, clean dashboard style.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {[
          { name: "Biryani", image: legacyAssets.showcase },
          { name: "Chicken", image: legacyAssets.chicken },
          { name: "Shawarma", image: legacyAssets.shawarma }
        ].map((category) => (
          <article key={category.name} className="card-surface overflow-hidden">
            <img src={category.image} alt={category.name} className="h-44 w-full object-cover" />
            <div className="p-4 text-center text-lg font-semibold text-[#1a1a1a]">{category.name}</div>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="card-surface p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-[#01de1a]">Why customers stay</p>
          <h2 className="mt-3 text-2xl font-semibold text-[#1a1a1a]">Reliable delivery without restaurant markups</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
            Gourmet Haven is built around fixed subscription revenue for owners, which means restaurants do not need to
            inflate prices to offset commission-heavy platforms.
          </p>
        </div>
        <div className="card-surface p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Platform status</p>
          <div className="mt-4 space-y-3 text-sm text-slate-500">
            <p>Realtime orders: connected</p>
            <p>Payments: Razorpay subscriptions ready for owner onboarding</p>
            <p>Media: Cloudinary upload flow reserved in service layer</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="section-title">Featured restaurants</h2>
          <p className="muted-copy mt-2">
            {status === "loading"
              ? "Loading restaurants..."
              : "Fallback sample data now uses your existing restaurant imagery until the backend is fully wired."}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {restaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              onBrowse={(restaurant) => navigate(`/orders?restaurantId=${restaurant.id}`)}
            />
          ))}
        </div>
      </section>
    </Shell>
  );
}
