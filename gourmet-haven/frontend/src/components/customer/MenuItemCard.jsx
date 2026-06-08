function VegIndicator({ isVeg }) {
  return (
    <div
      className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded"
      style={{
        border: `1.5px solid ${isVeg ? "#16a34a" : "#dc2626"}`,
        background: isVeg ? "#f0fdf4" : "#fef2f2"
      }}
      aria-label={isVeg ? "Vegetarian" : "Non-vegetarian"}
    >
      <div
        className="h-2.5 w-2.5 rounded-sm"
        style={{ background: isVeg ? "#16a34a" : "#dc2626" }}
      />
    </div>
  );
}

export default function MenuItemCard({
  item,
  onAdd,
  onIncrement,
  onDecrement,
  currentQty = 0
}) {
  const priceLabel = `₹${(Number(item.price || 0) / 100).toFixed(0)}`;

  return (
    <article className="card flex overflow-hidden">
      {/* Text side */}
      <div className="flex flex-1 flex-col justify-between gap-3 p-4">
        <div className="space-y-1.5">
          <div className="flex items-start gap-2">
            <VegIndicator isVeg={Boolean(item.is_veg)} />
            <div className="flex-1 min-w-0">
              <h3
                className="text-sm font-semibold leading-snug"
                style={{ color: "var(--ink)" }}
              >
                {item.name}
              </h3>
              {item.description && (
                <p
                  className="mt-1 line-clamp-2 text-xs leading-5"
                  style={{ color: "var(--ink-muted)" }}
                >
                  {item.description}
                </p>
              )}
            </div>
          </div>

          {item.category && (
            <span
              className="inline-block text-xs"
              style={{ color: "var(--ink-muted)" }}
            >
              {item.category}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <p
            className="text-lg font-bold"
            style={{ color: "var(--brand-dark)" }}
          >
            {priceLabel}
          </p>

          {currentQty > 0 ? (
            <div
              className="flex items-center gap-1 rounded-xl overflow-hidden"
              style={{ border: "1.5px solid var(--brand)", background: "var(--brand-lightest)" }}
            >
              <button
                type="button"
                onClick={() => onDecrement?.(item)}
                className="flex h-8 w-8 items-center justify-center text-lg font-medium transition hover:bg-white/60"
                style={{ color: "var(--brand-dark)" }}
              >
                −
              </button>
              <span
                className="min-w-[1.5rem] text-center text-sm font-bold"
                style={{ color: "var(--brand-dark)" }}
              >
                {currentQty}
              </span>
              <button
                type="button"
                onClick={() => onIncrement?.(item)}
                className="flex h-8 w-8 items-center justify-center text-lg font-medium transition hover:bg-white/60"
                style={{ color: "var(--brand-dark)" }}
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onAdd?.(item)}
              className="btn-primary text-xs py-2 px-4"
            >
              Add
            </button>
          )}
        </div>
      </div>

      {/* Image side */}
      {item.image_url ? (
        <div className="relative w-28 flex-shrink-0 overflow-hidden sm:w-32">
          <img
            src={item.image_url}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div
          className="flex w-24 flex-shrink-0 items-center justify-center sm:w-28"
          style={{ background: "var(--muted)" }}
        >
          <span className="text-3xl">🍽️</span>
        </div>
      )}
    </article>
  );
}