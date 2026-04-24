import { useEffect, useRef, useState } from "react";
import { uploadMenuItemImage } from "../../services/uploadService";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_MB    = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const EMPTY_FORM = {
  name:        "",
  description: "",
  category:    "General",
  priceRupees: "",
  isVeg:       false,
  isAvailable: true
};

function toFormValues(item) {
  if (!item) return EMPTY_FORM;
  return {
    name:        item.name        || "",
    description: item.description || "",
    category:    item.category    || "General",
    priceRupees: item.price_paise ? String((item.price_paise / 100).toFixed(2)) : "",
    isVeg:       Boolean(item.is_veg),
    isAvailable: typeof item.is_available === "boolean" ? item.is_available : true
  };
}

// ─── Image upload zone ────────────────────────────────────────────────────────

function ImageUploadZone({ existingUrl, uploading, onFileChange, onClear }) {
  const inputRef             = useRef(null);
  const [preview, setPreview]   = useState(existingUrl || null);
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState("");

  useEffect(() => { setPreview(existingUrl || null); }, [existingUrl]);

  function accept(file) {
    setFileError("");
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFileError("Only JPG, PNG, WebP or GIF images are accepted.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setFileError(`Image must be smaller than ${MAX_SIZE_MB} MB.`);
      return;
    }
    setPreview(URL.createObjectURL(file));
    onFileChange(file);
  }

  function handleInput(e) {
    accept(e.target.files?.[0] || null);
    e.target.value = "";
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    accept(e.dataTransfer.files?.[0] || null);
  }

  function handleClear(e) {
    e.stopPropagation();
    setPreview(null);
    setFileError("");
    onClear();
  }

  /* ── With image preview ── */
  if (preview) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-black/10 bg-white">
        <img src={preview} alt="Dish preview" className="h-52 w-full object-cover" />

        {/* Toolbar gradient */}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-black/65 to-transparent px-4 py-3">
          <span className="text-xs font-medium text-white/90">Photo selected ✓</span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="rounded-lg bg-white/20 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition hover:bg-white/35 disabled:opacity-50"
            >
              Change
            </button>
            <button
              type="button"
              disabled={uploading}
              onClick={handleClear}
              className="rounded-lg bg-rose-500/80 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition hover:bg-rose-600 disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        </div>

        {/* Upload progress overlay */}
        {uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/55 backdrop-blur-sm">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span className="text-sm font-medium text-white">Uploading photo…</span>
          </div>
        )}

        <input ref={inputRef} type="file" accept={ACCEPTED_TYPES.join(",")} className="hidden" onChange={handleInput} />
      </div>
    );
  }

  /* ── Empty drop zone ── */
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`group flex w-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-6 py-10 transition ${
          dragging
            ? "border-[#01de1a] bg-[#e8f9eb]"
            : "border-black/15 bg-white hover:border-[#01de1a] hover:bg-[#f0fdf1]"
        }`}
      >
        {/* Camera icon */}
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl transition ${
          dragging ? "bg-[#01de1a]" : "bg-[#f8f9fa] shadow-sm group-hover:bg-[#e8f9eb]"
        }`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-7 w-7 transition ${dragging ? "text-black" : "text-slate-400 group-hover:text-[#01de1a]"}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
          </svg>
        </div>

        <div className="text-center">
          <p className="text-sm font-semibold text-[#1a1a1a]">
            {dragging ? "Drop the photo here!" : "Upload a dish photo"}
          </p>
          <p className="mt-1 text-xs text-slate-400">Tap to pick from your phone gallery or device</p>
          <p className="mt-0.5 text-xs text-slate-400">JPG · PNG · WebP · Max {MAX_SIZE_MB} MB</p>
        </div>

        {!dragging && (
          <span className="rounded-full bg-[#01de1a] px-6 py-2 text-xs font-semibold text-black transition group-hover:bg-[#00ff1e]">
            Choose photo
          </span>
        )}
      </button>

      {fileError && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-700">
          {fileError}
        </p>
      )}

      <input ref={inputRef} type="file" accept={ACCEPTED_TYPES.join(",")} className="hidden" onChange={handleInput} />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function OwnerMenuManager({
  restaurant,
  items,
  isSubmitting,
  notice,
  onCreateItem,
  onUpdateItem
}) {
  const [mode,             setMode]             = useState("idle");
  const [editingItemId,    setEditingItemId]    = useState(null);
  const [form,             setForm]             = useState(EMPTY_FORM);
  const [imageFile,        setImageFile]        = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState(null);
  const [uploading,        setUploading]        = useState(false);
  const [error,            setError]            = useState("");

  useEffect(() => {
    if (mode === "create") {
      setForm(EMPTY_FORM); setImageFile(null); setExistingImageUrl(null); setError("");
      return;
    }
    if (mode === "edit") {
      const item = items.find((i) => i.id === editingItemId);
      setForm(toFormValues(item));
      setImageFile(null);
      setExistingImageUrl(item?.image_url || null);
      setError("");
      return;
    }
    setEditingItemId(null); setForm(EMPTY_FORM); setImageFile(null); setExistingImageUrl(null); setError("");
  }, [editingItemId, items, mode]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const parsedPrice = Number(form.priceRupees);
    if (!restaurant?.id) { setError("Create a restaurant profile before managing menu items."); return; }
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) { setError("Enter a valid menu price in rupees."); return; }

    // Upload image first if a new file was selected
    let imageUrl = existingImageUrl || null;
    if (imageFile) {
      setUploading(true);
      try {
        imageUrl = await uploadMenuItemImage(imageFile);
      } catch (uploadError) {
        setError(uploadError.message || "Photo upload failed. Please try again.");
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    const payload = {
      restaurantId: restaurant.id,
      name:         form.name.trim(),
      description:  form.description.trim(),
      category:     form.category.trim() || "General",
      pricePaise:   Math.round(parsedPrice * 100),
      isVeg:        form.isVeg,
      isAvailable:  form.isAvailable,
      imageUrl
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

  const isBusy = isSubmitting || uploading;

  return (
    <div className="card-surface p-6">
      {/* Header */}
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
          onClick={() => setMode((c) => (c === "create" ? "idle" : "create"))}
          className="rounded-xl bg-[#01de1a] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#00ff1e] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {mode === "create" ? "Close form" : "Add item"}
        </button>
      </div>

      {notice && (
        <div className="mt-5 rounded-2xl border border-black/10 bg-[#f8f9fa] px-4 py-3 text-sm text-slate-600">{notice}</div>
      )}

      {/* ── Form ── */}
      {mode !== "idle" && (
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 rounded-3xl bg-[#f8f9fa] p-5 md:grid-cols-2">

          {/* Image upload — full width */}
          <div className="md:col-span-2">
            <span className="mb-2 block text-sm text-slate-500">Dish photo <span className="text-slate-400">(optional)</span></span>
            <ImageUploadZone
              existingUrl={existingImageUrl}
              uploading={uploading}
              onFileChange={(file) => setImageFile(file)}
              onClear={() => { setImageFile(null); setExistingImageUrl(null); }}
            />
          </div>

          {/* Name */}
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm text-slate-500">Item name</span>
            <input
              type="text" required
              value={form.name}
              onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#01de1a]"
              placeholder="Hyderabadi Chicken Biryani"
            />
          </label>

          {/* Description */}
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm text-slate-500">Description</span>
            <textarea
              rows="3"
              value={form.description}
              onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))}
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#01de1a]"
              placeholder="Tell customers what makes this item special."
            />
          </label>

          {/* Category */}
          <label className="block">
            <span className="mb-2 block text-sm text-slate-500">Category</span>
            <input
              type="text"
              value={form.category}
              onChange={(e) => setForm((c) => ({ ...c, category: e.target.value }))}
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#01de1a]"
              placeholder="Mains"
            />
          </label>

          {/* Price */}
          <label className="block">
            <span className="mb-2 block text-sm text-slate-500">Price in rupees</span>
            <input
              type="number" min="0" step="0.01" required
              value={form.priceRupees}
              onChange={(e) => setForm((c) => ({ ...c, priceRupees: e.target.value }))}
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#01de1a]"
              placeholder="299"
            />
          </label>

          {/* Veg */}
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-slate-600 transition hover:border-[#01de1a]">
            <input type="checkbox" checked={form.isVeg} onChange={(e) => setForm((c) => ({ ...c, isVeg: e.target.checked }))} className="h-4 w-4 accent-[#01de1a]" />
            Mark as <strong>vegetarian</strong>
          </label>

          {/* Available */}
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-slate-600 transition hover:border-[#01de1a]">
            <input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm((c) => ({ ...c, isAvailable: e.target.checked }))} className="h-4 w-4 accent-[#01de1a]" />
            Show as <strong>available</strong>
          </label>

          {/* Error */}
          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 md:col-span-2">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex flex-wrap gap-3 md:col-span-2">
            <button
              type="submit"
              disabled={isBusy}
              className="rounded-xl bg-[#01de1a] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#00ff1e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading ? "Uploading photo…" : isSubmitting ? "Saving…" : mode === "edit" ? "Save changes" : "Create item"}
            </button>
            <button
              type="button"
              onClick={() => setMode("idle")}
              className="rounded-xl border border-black/10 px-5 py-3 text-sm text-slate-600 transition hover:border-[#01de1a] hover:text-[#01de1a]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ── Item list ── */}
      <div className="mt-6 space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl bg-[#f8f9fa] p-4 text-sm leading-7 text-slate-500">
            No menu items yet. Use the add item form to publish the first dish.
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex flex-col gap-3 rounded-2xl bg-[#f8f9fa] p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="h-16 w-16 flex-shrink-0 rounded-xl object-cover shadow-sm" />
                ) : (
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-slate-200 text-2xl">🍽️</div>
                )}
                <div>
                  <h4 className="font-semibold text-[#1a1a1a]">{item.name}</h4>
                  <p className="mt-0.5 text-sm text-slate-500">{item.category} · Rs {(Number(item.price_paise || 0) / 100).toFixed(2)}</p>
                  {item.description && <p className="mt-1 line-clamp-1 text-xs text-slate-400">{item.description}</p>}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className={`rounded-full px-3 py-1 font-medium ${item.is_available ? "bg-[#e8f9eb] text-[#01de1a]" : "bg-slate-200 text-slate-600"}`}>
                  {item.is_available ? "Available" : "Paused"}
                </span>
                <span className={`rounded-full px-3 py-1 font-medium ${item.is_veg ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                  {item.is_veg ? "Veg" : "Non-veg"}
                </span>
                <button
                  type="button"
                  onClick={() => { setEditingItemId(item.id); setMode("edit"); }}
                  className="rounded-xl border border-black/10 px-4 py-2 text-sm text-slate-600 transition hover:border-[#01de1a] hover:text-[#01de1a]"
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