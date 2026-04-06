import { useEffect, useState } from "react";

const EMPTY_FORM = {
  name: "",
  description: "",
  category: "General",
  priceRupees: "",
  isVeg: false,
  isAvailable: true
};

function toFormValues(item) {
  if (!item) {
    return EMPTY_FORM;
  }

  return {
    name: item.name || "",
    description: item.description || "",
    category: item.category || "General",
    priceRupees: item.price_paise ? String((item.price_paise / 100).toFixed(2)) : "",
    isVeg: Boolean(item.is_veg),
    isAvailable: typeof item.is_available === "boolean" ? item.is_available : true
  };
}

export default function OwnerMenuManager({
  restaurant,
  items,
  isSubmitting,
  notice,
  onCreateItem,
  onUpdateItem
}) {
  const [mode, setMode] = useState("idle");
  const [editingItemId, setEditingItemId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  useEffect(() => {
    if (mode === "create") {
      setForm(EMPTY_FORM);
      setError("");
      return;
    }

    if (mode === "edit") {
      const item = items.find((entry) => entry.id === editingItemId);
      setForm(toFormValues(item));
      setError("");
      return;
    }

    setEditingItemId(null);
    setForm(EMPTY_FORM);
    setError("");
  }, [editingItemId, items, mode]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const parsedPrice = Number(form.priceRupees);

    if (!restaurant?.id) {
      setError("Create a restaurant profile before managing menu items.");
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setError("Enter a valid menu price in rupees.");
      return;
    }

    const payload = {
      restaurantId: restaurant.id,
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category.trim() || "General",
      pricePaise: Math.round(parsedPrice * 100),
      isVeg: form.isVeg,
      isAvailable: form.isAvailable
    };

    try {
      if (mode === "edit" && editingItemId) {
        await onUpdateItem?.(editingItemId, payload);
      } else {
        await onCreateItem?.(payload);
      }

      setMode("idle");
    } catch (submissionError) {
      setError(submissionError.message || "Unable to save the menu item right now.");
    }
  }

  return (
    <div className="card-surface p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Menu operations</p>
          <h3 className="mt-2 text-xl font-semibold text-[#1a1a1a]">
            {restaurant?.name ? `${restaurant.name} menu` : "Restaurant menu"}
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            {restaurant?.id
              ? "Add new dishes and edit existing ones directly from the owner dashboard."
              : "Create a restaurant profile first, then start building your menu."}
          </p>
        </div>
        <button
          type="button"
          disabled={!restaurant?.id}
          onClick={() => setMode((current) => (current === "create" ? "idle" : "create"))}
          className="rounded-xl bg-[#01de1a] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#00ff1e] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {mode === "create" ? "Close form" : "Add item"}
        </button>
      </div>

      {notice ? (
        <div className="mt-5 rounded-2xl border border-black/10 bg-[#f8f9fa] px-4 py-3 text-sm text-slate-600">{notice}</div>
      ) : null}

      {mode !== "idle" ? (
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 rounded-3xl bg-[#f8f9fa] p-5 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm text-slate-500">Item name</span>
            <input
              type="text"
              required
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#01de1a]"
              placeholder="Hyderabadi Chicken Biryani"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm text-slate-500">Description</span>
            <textarea
              rows="3"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#01de1a]"
              placeholder="Tell customers what makes this item special."
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-500">Category</span>
            <input
              type="text"
              value={form.category}
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#01de1a]"
              placeholder="Mains"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-500">Price in rupees</span>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={form.priceRupees}
              onChange={(event) => setForm((current) => ({ ...current, priceRupees: event.target.value }))}
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#01de1a]"
              placeholder="299"
            />
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={form.isVeg}
              onChange={(event) => setForm((current) => ({ ...current, isVeg: event.target.checked }))}
            />
            Mark this item as vegetarian
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={form.isAvailable}
              onChange={(event) => setForm((current) => ({ ...current, isAvailable: event.target.checked }))}
            />
            Show this item as available
          </label>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 md:col-span-2">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3 md:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[#01de1a] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#00ff1e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : mode === "edit" ? "Save changes" : "Create item"}
            </button>
            <button
              type="button"
              onClick={() => setMode("idle")}
              className="rounded-xl border border-black/10 px-4 py-3 text-sm text-slate-600 transition hover:border-[#01de1a] hover:text-[#01de1a]"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <div className="mt-6 space-y-4">
        {items.length === 0 ? (
          <div className="rounded-2xl bg-[#f8f9fa] p-4 text-sm leading-7 text-slate-500">
            No menu items yet. Use the add item form to publish the first dish for this restaurant.
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-2xl bg-[#f8f9fa] p-4 lg:flex-row lg:items-center lg:justify-between"
            >
              <div>
                <h4 className="font-semibold text-[#1a1a1a]">{item.name}</h4>
                <p className="mt-1 text-sm text-slate-500">
                  {item.category} - Rs {(Number(item.price_paise || 0) / 100).toFixed(2)}
                </p>
                {item.description ? <p className="mt-2 text-sm text-slate-500">{item.description}</p> : null}
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <span
                  className={`rounded-full px-3 py-1 ${
                    item.is_available ? "bg-[#e8f9eb] text-[#01de1a]" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {item.is_available ? "Available" : "Paused"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setEditingItemId(item.id);
                    setMode("edit");
                  }}
                  className="rounded-xl border border-black/10 px-4 py-2 transition hover:border-[#01de1a] hover:text-[#01de1a]"
                >
                  Edit
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
