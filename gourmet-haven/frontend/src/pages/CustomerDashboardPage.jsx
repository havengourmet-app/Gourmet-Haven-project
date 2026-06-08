import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Shell from "../components/common/Shell";
import LocalityFilter from "../components/customer/LocalityFilter";
import RestaurantCard from "../components/customer/RestaurantCard";
import SearchBar from "../components/customer/SearchBar";
import { fetchLocalities, fetchRestaurants } from "../services/restaurantService";
import { useUiStore } from "../store/uiStore";

function RestaurantCardSkeleton() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="h-40 w-full" style={{ background: "var(--muted)" }} />
      <div className="p-5 space-y-3">
        <div className="flex gap-3">
          <div className="h-11 w-11 rounded-xl flex-shrink-0" style={{ background: "var(--muted)" }} />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded-lg" style={{ background: "var(--muted)" }} />
            <div className="h-3 w-1/2 rounded-lg" style={{ background: "var(--muted)" }} />
          </div>
        </div>
        <div className="h-3 w-5/6 rounded-lg" style={{ background: "var(--muted)" }} />
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
    const id = setTimeout(() => setDebouncedSearchQuery(searchQuery.trim()), 400);
    return () => clearTimeout(id);
  }, [searchQuery]);

  useEffect(() => {
    let isMounted = true;
    setInitialLoadComplete(false);

    async function loadInitial() {
      setLoading(true); setError("");
      try {
        const [locs, rests] = await Promise.all([fetchLocalities(), fetchRestaurants("", "")]);
        if (!isMounted) return;
        setLocalities(Array.isArray(locs) ? locs : []);
        setRestaurants(Array.isArray(rests) ? rests : []);
        lastAppliedFilterKeyRef.current = "__all__";
        setInitialLoadComplete(true);
      } catch (err) {
        if (!isMounted) return;
        setLocalities([]); setRestaurants([]);
        setError(err.message || "Unable to load restaurants right now.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadInitial();
    return () => { isMounted = false; };
  }, [retryToken]);

  useEffect(() => {
    if (!initialLoadComplete) return;
    const filterKey = `${selectedLocality}__${debouncedSearchQuery}`;
    if (filterKey === lastAppliedFilterKeyRef.current) return;

    let isMounted = true;

    async function loadFiltered() {
      setLoading(true); setError("");
      try {
        const rests = await fetchRestaurants(selectedLocality, debouncedSearchQuery);
        if (!isMounted) return;
        setRestaurants(Array.isArray(rests) ? rests : []);
        lastAppliedFilterKeyRef.current = filterKey;
      } catch (err) {
        if (!isMounted) return;
        setRestaurants([]);
        setError(err.message || "Unable to load restaurants.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadFiltered();
    return () => { isMounted = false; };
  }, [debouncedSearchQuery, initialLoadComplete, selectedLocality]);

  return (
    <Shell
      title={`Discover ${activeCity}`}
      subtitle="Search restaurants, browse by locality, and open live menus."
      actions={
        <button type="button" onClick={() => navigate("/orders")} className="btn-secondary">
          Open cart
        </button>
      }
    >
      {/* Search + filter */}
      <section className="card-surface p-5">
        <p className="label-xs mb-3">Find a restaurant</p>
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        <div className="mt-3">
          <LocalityFilter localities={localities} selectedLocality={selectedLocality} onSelect={setSelectedLocality} />
        </div>
      </section>

      {/* Results */}
      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="section-title">Restaurants</h2>
            <p className="muted-copy mt-1">
              {loading
                ? "Loading..."
                : error
                ? "Something went wrong."
                : restaurants.length === 0
                ? "No restaurants found"
                : `${restaurants.length} restaurant${restaurants.length === 1 ? "" : "s"} available`}
            </p>
          </div>
        </div>

        {error ? (
          <div className="card-surface p-6">
            <p className="text-sm" style={{ color: "#991b1b" }}>{error}</p>
            <button type="button" onClick={() => setRetryToken((c) => c + 1)} className="btn-primary mt-4">
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <RestaurantCardSkeleton key={i} />)}
          </div>
        ) : restaurants.length === 0 ? (
          <div className="card-surface p-10 text-center">
            <p className="text-4xl">🔍</p>
            <p className="mt-3 font-semibold" style={{ color: "var(--ink)" }}>No restaurants found</p>
            <p className="mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>
              Try a different locality or search term.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {restaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                onBrowse={(r) => navigate(`/restaurant/${r.id}`)}
              />
            ))}
          </div>
        )}
      </section>
    </Shell>
  );
}