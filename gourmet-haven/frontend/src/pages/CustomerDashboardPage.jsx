import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Shell from "../components/common/Shell";
import LocalityFilter from "../components/customer/LocalityFilter";
import RestaurantCard from "../components/customer/RestaurantCard";
import SearchBar from "../components/customer/SearchBar";
import { fetchLocalities, fetchRestaurants } from "../services/restaurantService";
import { useUiStore } from "../store/uiStore";

function RestaurantCardSkeleton({ index }) {
  return (
    <div key={`restaurant-skeleton-${index}`} className="card-surface overflow-hidden animate-pulse">
      <div className="h-40 w-full bg-slate-200" />
      <div className="px-5 pb-5 pt-10">
        <div className="h-14 w-14 -translate-y-1/2 rounded-full border-4 border-white bg-slate-200 shadow-md" />
        <div className="-mt-2 space-y-3">
          <div className="h-5 w-2/3 rounded bg-slate-200" />
          <div className="h-4 w-1/3 rounded bg-slate-200" />
          <div className="h-4 w-1/2 rounded bg-slate-200" />
          <div className="h-4 w-5/6 rounded bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

export default function CustomerDashboardPage() {
  const navigate = useNavigate();
  const activeCity = useUiStore((state) => state.activeCity);
  const lastAppliedFilterKeyRef = useRef("__all__");
  const [restaurants, setRestaurants] = useState([]);
  const [localities, setLocalities] = useState([]);
  const [selectedLocality, setSelectedLocality] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryToken, setRetryToken] = useState(0);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 400);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  useEffect(() => {
    let isMounted = true;
    setInitialLoadComplete(false);

    async function loadInitialDiscovery() {
      setLoading(true);
      setError("");

      try {
        const [nextLocalities, nextRestaurants] = await Promise.all([
          fetchLocalities(),
          fetchRestaurants("", "")
        ]);

        if (!isMounted) {
          return;
        }

        setLocalities(Array.isArray(nextLocalities) ? nextLocalities : []);
        setRestaurants(Array.isArray(nextRestaurants) ? nextRestaurants : []);
        lastAppliedFilterKeyRef.current = "__all__";
        setInitialLoadComplete(true);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setLocalities([]);
        setRestaurants([]);
        setError(loadError.message || "Unable to load restaurant discovery right now.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadInitialDiscovery();

    return () => {
      isMounted = false;
    };
  }, [retryToken]);

  useEffect(() => {
    if (!initialLoadComplete) {
      return;
    }

    const filterKey = `${selectedLocality}__${debouncedSearchQuery}`;

    if (filterKey === lastAppliedFilterKeyRef.current) {
      return;
    }

    let isMounted = true;

    async function loadFilteredRestaurants() {
      setLoading(true);
      setError("");

      try {
        const nextRestaurants = await fetchRestaurants(selectedLocality, debouncedSearchQuery);

        if (!isMounted) {
          return;
        }

        setRestaurants(Array.isArray(nextRestaurants) ? nextRestaurants : []);
        lastAppliedFilterKeyRef.current = filterKey;
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setRestaurants([]);
        setError(loadError.message || "Unable to load restaurant discovery right now.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadFilteredRestaurants();

    return () => {
      isMounted = false;
    };
  }, [debouncedSearchQuery, initialLoadComplete, selectedLocality]);

  function handleRetry() {
    setRetryToken((current) => current + 1);
  }

  return (
    <Shell
      title={`Discover the best of ${activeCity}`}
      subtitle="Search restaurants, browse by locality, and open live menus without leaving the customer dashboard flow."
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
      <section className="card-surface p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-[#01de1a]">Search and discover</p>
        <h2 className="mt-3 text-2xl font-semibold text-[#1a1a1a]">Find a restaurant near you</h2>
        <p className="mt-2 text-sm leading-7 text-slate-500">
          Search by restaurant name or narrow the list to a specific Hyderabad locality.
        </p>

        <div className="mt-6">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>

        <div className="mt-4">
          <LocalityFilter
            localities={localities}
            selectedLocality={selectedLocality}
            onSelect={setSelectedLocality}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="section-title">Restaurants</h2>
            <p className="muted-copy mt-2">
              {loading
                ? "Loading restaurants..."
                : error
                  ? "Restaurant discovery hit a problem."
                  : restaurants.length === 0
                    ? "No restaurants found in this area yet"
                    : `${restaurants.length} restaurant${restaurants.length === 1 ? "" : "s"} available`}
            </p>
          </div>
        </div>

        {error ? (
          <div className="card-surface p-6">
            <p className="text-sm text-rose-700">{error}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="mt-4 rounded-xl bg-[#01de1a] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#00ff1e]"
            >
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <RestaurantCardSkeleton key={`skeleton-card-${index}`} index={index} />
            ))}
          </div>
        ) : restaurants.length === 0 ? (
          <div className="card-surface p-6 text-sm leading-7 text-slate-500">
            No restaurants found in this area yet
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {restaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                onBrowse={(selectedRestaurant) =>
                  navigate(`/orders?restaurantId=${selectedRestaurant.id}`)
                }
              />
            ))}
          </div>
        )}
      </section>
    </Shell>
  );
}
