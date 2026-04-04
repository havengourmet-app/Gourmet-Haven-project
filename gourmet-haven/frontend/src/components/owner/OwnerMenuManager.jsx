export default function OwnerMenuManager({ items }) {
  return (
    <div className="card-surface p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Menu operations</p>
          <h3 className="mt-2 text-xl font-semibold text-[#1a1a1a]">Restaurant menu</h3>
        </div>
        <button
          type="button"
          className="rounded-xl bg-[#01de1a] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#00ff1e]"
        >
          Add item
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-3 rounded-2xl bg-[#f8f9fa] p-4 lg:flex-row lg:items-center lg:justify-between"
          >
            <div>
              <h4 className="font-semibold text-[#1a1a1a]">{item.name}</h4>
              <p className="mt-1 text-sm text-slate-500">
                {item.category} - Rs {(item.pricePaise / 100).toFixed(2)}
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span
                className={`rounded-full px-3 py-1 ${
                  item.isAvailable ? "bg-[#e8f9eb] text-[#01de1a]" : "bg-slate-200 text-slate-600"
                }`}
              >
                {item.isAvailable ? "Available" : "Paused"}
              </span>
              <button type="button" className="rounded-xl border border-black/10 px-4 py-2 hover:border-[#01de1a] hover:text-[#01de1a]">
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
