function getRatingLabel(avgRating) {
  const rating = Number(avgRating || 0);
  return rating > 0 ? `${rating.toFixed(1)} ★` : "New";
}

export default function RestaurantCard({ restaurant, onBrowse }) {
  const bannerImage = restaurant.cover_image_url || null;
  const logoImage = restaurant.logo_url || null;
  const ratingLabel = getRatingLabel(restaurant.avg_rating);
  const initials = restaurant.name?.slice(0, 1)?.toUpperCase() || "R";

  return (
    <button
      type="button"
      onClick={() => onBrowse?.(restaurant)}
      className="card-surface flex h-full w-full flex-col overflow-hidden text-left transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative h-40 w-full">
        {bannerImage ? (
          <img src={bannerImage} alt={restaurant.name} className="h-40 w-full object-cover" />
        ) : (
          <div className="h-40 w-full bg-gradient-to-br from-[#01de1a] via-[#00c218] to-[#0f172a]" />
        )}

        <div className="absolute bottom-0 left-5 translate-y-1/2">
          {logoImage ? (
            <img
              src={logoImage}
              alt={`${restaurant.name} logo`}
              className="h-14 w-14 rounded-full border-4 border-white object-cover shadow-md"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-[#01de1a] text-lg font-semibold text-black shadow-md">
              {initials}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-4 p-5 pt-10">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-semibold text-[#1a1a1a]">{restaurant.name}</h3>
            <span className="rounded-full bg-[#e8f9eb] px-3 py-1 text-xs font-semibold text-[#01de1a]">
              {ratingLabel}
            </span>
          </div>

          <p className="text-sm text-slate-500">{restaurant.locality || "Hyderabad"}</p>

          {restaurant.description ? (
            <p className="line-clamp-2 text-sm leading-6 text-slate-500">{restaurant.description}</p>
          ) : null}
        </div>

        <span className="text-sm font-semibold text-[#01de1a]">Browse menu</span>
      </div>
    </button>
  );
}
