function VegIndicator({ isVeg }) {
  return (
    <span
      className={`inline-flex h-4 w-4 items-center justify-center rounded-full border ${
        isVeg ? "border-green-600" : "border-rose-600"
      }`}
      aria-label={isVeg ? "Vegetarian" : "Non-vegetarian"}
    >
      <span className={`h-2 w-2 rounded-full ${isVeg ? "bg-green-600" : "bg-rose-600"}`} />
    </span>
  );
}

export default function MenuItemCard({
  item,
  onAdd,
  onIncrement,
  onDecrement,
  currentQty = 0
}) {
  const priceLabel = `Rs ${(Number(item.price || 0) / 100).toFixed(2)}`;

  return (
    <article className="card-surface overflow-hidden">
      {item.image_url ? (
        <img src={item.image_url} alt={item.name} className="h-44 w-full object-cover" />
      ) : (
        <div className="flex h-44 w-full items-center justify-center bg-gradient-to-br from-[#01de1a] via-[#00c218] to-[#0f172a] text-3xl font-semibold text-white">
          {item.name?.slice(0, 1)?.toUpperCase() || "M"}
        </div>
      )}

      <div className="flex flex-col justify-between gap-4 p-5">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-[#1a1a1a]">{item.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{item.description || "Freshly prepared."}</p>
            </div>
            <VegIndicator isVeg={Boolean(item.is_veg)} />
          </div>

          <p className="text-sm text-slate-400">{item.category || "General"}</p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xl font-semibold text-[#01de1a]">{priceLabel}</p>

          {currentQty > 0 ? (
            <div className="flex items-center gap-2 rounded-xl border border-black/10 px-2 py-1">
              <button
                type="button"
                onClick={() => onDecrement?.(item)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-lg text-slate-700 transition hover:bg-slate-100"
              >
                -
              </button>
              <span className="min-w-6 text-center text-sm font-semibold text-[#1a1a1a]">{currentQty}</span>
              <button
                type="button"
                onClick={() => onIncrement?.(item)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-lg text-slate-700 transition hover:bg-slate-100"
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onAdd?.(item)}
              className="rounded-xl bg-[#01de1a] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#00ff1e]"
            >
              Add
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
