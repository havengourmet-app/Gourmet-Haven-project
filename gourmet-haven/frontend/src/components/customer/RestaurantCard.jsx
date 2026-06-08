function getRatingLabel(avgRating) {
  const rating = Number(avgRating || 0);
  return rating > 0 ? rating.toFixed(1) : null;
}

const CUISINE_COLORS = [
  "from-green-800 to-green-600",
  "from-stone-700 to-stone-500",
  "from-amber-800 to-amber-600",
  "from-teal-800 to-teal-600",
  "from-emerald-800 to-emerald-600"
];

function getCoverGradient(name = "") {
  const index = name.charCodeAt(0) % CUISINE_COLORS.length;
  return CUISINE_COLORS[index];
}

export default function RestaurantCard({ restaurant, onBrowse }) {
  const bannerImage = restaurant.cover_image_url || null;
  const logoImage = restaurant.logo_url || null;
  const rating = getRatingLabel(restaurant.avg_rating);
  const initials = restaurant.name?.slice(0, 2)?.toUpperCase() || "R";
  const gradient = getCoverGradient(restaurant.name);

  return (
    <button
      type="button"
      onClick={() => onBrowse?.(restaurant)}
      className="card-hover flex h-full w-full flex-col overflow-hidden text-left"
    >
      {/* Cover */}
      <div className="relative h-40 w-full overflow-hidden">
        {bannerImage ? (
          <img
            src={bannerImage}
            alt={restaurant.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className={`h-full w-full bg-gradient-to-br ${gradient} flex items-end p-4`}>
            <span className="text-3xl font-bold text-white/20">{restaurant.name}</span>
          </div>
        )}

        {/* Rating badge — overlaid on image */}
        {rating && (
          <div
            className="absolute right-3 top-3 flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold backdrop-blur-sm"
            style={{ background: "rgba(255,255,255,0.92)", color: "var(--ink)" }}
          >
            <span className="text-amber-400">★</span>
            {rating}
          </div>
        )}

        {!rating && (
          <div
            className="absolute right-3 top-3 rounded-lg px-2 py-1 text-xs font-medium backdrop-blur-sm"
            style={{ background: "rgba(255,255,255,0.92)", color: "var(--ink-muted)" }}
          >
            New
          </div>
        )}
      </div>

      {/* Logo + content */}
      <div className="flex flex-1 flex-col p-5 pt-3">
        <div className="flex items-start gap-3">
          {/* Logo */}
          <div className="mt-1 flex-shrink-0">
            {logoImage ? (
              <img
                src={logoImage}
                alt={`${restaurant.name} logo`}
                className="h-11 w-11 rounded-xl object-cover"
                style={{ border: "2px solid var(--border)" }}
              />
            ) : (
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold text-white"
                style={{ background: "var(--brand)" }}
              >
                {initials}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3
              className="truncate text-base font-semibold leading-tight"
              style={{ color: "var(--ink)" }}
            >
              {restaurant.name}
            </h3>
            <p className="mt-0.5 text-xs" style={{ color: "var(--ink-muted)" }}>
              {restaurant.locality || "Hyderabad"}
            </p>
            {restaurant.cuisine_summary && (
              <p className="mt-1 truncate text-xs" style={{ color: "var(--ink-secondary)" }}>
                {restaurant.cuisine_summary}
              </p>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-4 flex items-center justify-between">
          {restaurant.description ? (
            <p
              className="line-clamp-1 text-xs leading-5 flex-1 mr-3"
              style={{ color: "var(--ink-muted)" }}
            >
              {restaurant.description}
            </p>
          ) : (
            <span />
          )}
          <span
            className="flex-shrink-0 text-xs font-semibold"
            style={{ color: "var(--brand)" }}
          >
            View menu →
          </span>
        </div>
      </div>
    </button>
  );
}