export default function MenuItemCard({ item, onAdd }) {
  return (
    <div className="card-surface overflow-hidden">
      {item.image ? <img src={item.image} alt={item.name} className="h-44 w-full object-cover" /> : null}
      <div className="flex flex-col justify-between gap-4 p-5">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-[#1a1a1a]">{item.name}</h3>
            <p className="mt-1 text-sm text-slate-500">{item.description}</p>
          </div>
          <span className="rounded-full border border-black/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-500">
            {item.isVeg ? "Veg" : "Non veg"}
          </span>
        </div>
        <p className="text-sm text-slate-400">{item.category}</p>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xl font-semibold text-[#01de1a]">Rs {(item.pricePaise / 100).toFixed(2)}</p>
        <button
          type="button"
          onClick={() => onAdd?.(item)}
          className="rounded-xl bg-[#01de1a] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#00ff1e]"
        >
          Add to cart
        </button>
      </div>
      </div>
    </div>
  );
}
