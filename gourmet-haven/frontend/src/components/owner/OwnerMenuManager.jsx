import { useEffect, useState } from "react";

const EMPTY_FORM = {
  name: "",
  description: "",
  category: "General",
  priceRupees: "",
  isVeg: false,
  isAvailable: true,
  imageUrl: ""
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
    isAvailable: typeof item.is_available === "boolean" ? item.is_available : true,
    imageUrl: item.image_url || ""
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
  const [imagePreviewError, setImagePreviewError] = useState(false);

  useEffect(() => {
    if (mode === "create") {
      setForm(EMPTY_FORM);
      setError("");
      setImagePreviewError(false);
      return;
    }

    if (mode === "edit") {
      const item = items.find((entry) => entry.id === editingItemId);
      setForm(toFormValues(item));
      setError("");
      setImagePreviewError(false);
      return;
    }

    setEditingItemId(null);
    setForm(EMPTY_FORM);
    setError("");
    setImagePreviewError(false);
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
      isAvailable: form.isAvailable,
      imageUrl: form.imageUrl.trim() || null
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

          {/* Image URL field with live preview */}
          <div className="md:col-span-2">
            <label className="block">
              <span className="mb-2 block text-sm text-slate-500">
                Item image URL
                <span className="ml-2 text-xs text-slate-400">(optional — paste a direct image link)</span>
              </span>
              <input
                type="url"
                value={form.imageUrl}
                onChange={(event) => {
                  setImagePreviewError(false);
                  setForm((current) => ({ ...current, imageUrl: event.target.value }));
                }}
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#01de1a]"
                placeholder="https://example.com/chicken-biryani.jpg"
              />
            </label>

            {form.imageUrl && !imagePreviewError ? (
              <div className="mt-3 overflow-hidden rounded-2xl border border-black/10 bg-white">
                <div className="flex items-center gap-2 border-b border-black/5 px-4 py-2">
                  <span className="h-2 w-2 rounded-full bg-[#01de1a]" />
                  <span className="text-xs text-slate-400">Image preview</span>
                </div>
                <img
                  src={form.imageUrl}
                  alt="Menu item preview"
                  onError={() => setImagePreviewError(true)}
                  className="h-48 w-full object-cover"
                />
              </div>
            ) : null}

            {imagePreviewError ? (
              <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                Could not load image from this URL. Make sure it's a direct link to a publicly accessible image (JPG, PNG, WebP).
              </div>
            ) : null}
          </div>

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
              <div className="flex items-center gap-4">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="h-16 w-16 flex-shrink-0 rounded-xl object-cover"
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                ) : (
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-[#1a1a1a]">{item.name}</h4>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.category} · Rs {(Number(item.price_paise || 0) / 100).toFixed(2)}
                  </p>
                  {item.description ? <p className="mt-1 text-xs text-slate-400 line-clamp-1">{item.description}</p> : null}
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <span
                  className={`rounded-full px-3 py-1 ${
                    item.is_available ? "bg-[#e8f9eb] text-[#01de1a]" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {item.is_available ? "Available" : "Paused"}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs ${item.is_veg ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                  {item.is_veg ? "Veg" : "Non-veg"}
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