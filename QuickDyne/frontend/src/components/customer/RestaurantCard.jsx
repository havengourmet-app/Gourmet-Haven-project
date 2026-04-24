export default function RestaurantCard({ restaurant, onBrowse }) {
  return (
    <article className="card-surface overflow-hidden">
      <img src={restaurant.image} alt={restaurant.name} className="h-52 w-full object-cover" />
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-[#1a1a1a]">{restaurant.name}</h3>
            <p className="mt-1 text-sm text-slate-500">{restaurant.cuisine}</p>
          </div>
          <span className="rounded-full bg-[#e8f9eb] px-3 py-1 text-xs font-semibold text-[#01de1a]">
            {restaurant.discountLabel}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-500">
          <span>{restaurant.rating} rating</span>
          <span>{restaurant.deliveryTime}</span>
          <span>{restaurant.minimumOrderLabel}</span>
        </div>
        <button
          type="button"
          onClick={() => onBrowse?.(restaurant)}
          className="w-full rounded-xl bg-[#01de1a] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#00ff1e]"
        >
          Browse menu
        </button>
      </div>
    </article>
  );
}
