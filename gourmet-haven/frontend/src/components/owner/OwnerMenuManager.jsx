import { useEffect, useRef, useState } from "react";
import { uploadImage } from "../../services/uploadService";

const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const EMPTY_FORM = {
  name: "",
  description: "",
  category: "General",
  priceRupees: "",
  isVeg: false,
  isAvailable: true,
  image_url: null
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
    image_url: item.image_url || null
  };
}

function revokeObjectUrl(url) {
  if (url?.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

export function ImageUploader({ onUpload, existingUrl, label, onUploadingChange }) {
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(existingUrl || null);
  const [temporaryUrl, setTemporaryUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setPreviewUrl(existingUrl || null);
  }, [existingUrl]);

  useEffect(() => () => revokeObjectUrl(temporaryUrl), [temporaryUrl]);

  function setUploadingState(nextValue) {
    setIsUploading(nextValue);
    onUploadingChange?.(nextValue);
  }

  async function handleSelectedFile(file) {
    if (!file) {
      return;
    }

    if (!file.type?.startsWith("image/")) {
      setError("Only image files can be uploaded.");
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setError(`Image must be smaller than ${MAX_SIZE_MB} MB.`);
      return;
    }

    setError("");

    const nextTemporaryUrl = URL.createObjectURL(file);
    revokeObjectUrl(temporaryUrl);
    setTemporaryUrl(nextTemporaryUrl);
    setPreviewUrl(nextTemporaryUrl);
    setUploadingState(true);

    try {
      const secureUrl = await uploadImage(file);
      revokeObjectUrl(nextTemporaryUrl);
      setTemporaryUrl(null);
      setPreviewUrl(secureUrl);
      onUpload?.(secureUrl);
    } catch (uploadError) {
      setError(uploadError.message || "Image upload failed. Please try again.");
    } finally {
      setUploadingState(false);
    }
  }

  function handleInputChange(event) {
    const file = event.target.files?.[0] || null;
    event.target.value = "";
    void handleSelectedFile(file);
  }

  function handleRemove() {
    revokeObjectUrl(temporaryUrl);
    setTemporaryUrl(null);
    setPreviewUrl(null);
    setError("");
    onUpload?.(null);
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />

      <button
        type="button"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
        className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-black/15 bg-white px-6 py-5 text-center transition hover:border-[#01de1a] hover:bg-[#f0fdf1] disabled:cursor-not-allowed disabled:opacity-70"
      >
        <span className="text-sm font-medium text-[#1a1a1a]">{label}</span>

        {previewUrl ? (
          <img
            src={previewUrl}
            alt={`${label} preview`}
            className="max-h-[120px] w-auto rounded-2xl object-contain"
          />
        ) : (
          <div className="rounded-2xl bg-[#f8f9fa] px-4 py-6 text-sm text-slate-500">
            Click to choose an image
          </div>
        )}

        {isUploading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-[#01de1a]" />
            Uploading image...
          </div>
        ) : (
          <span className="text-xs text-slate-400">PNG, JPG, WebP or GIF up to {MAX_SIZE_MB} MB</span>
        )}
      </button>

      {previewUrl ? (
        <button
          type="button"
          disabled={isUploading}
          onClick={handleRemove}
          className="text-sm font-medium text-rose-600 transition hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Remove image
        </button>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default function OwnerMenuManager({
  restaurant,
  items,
  isSubmitting,
  notice,
  onCreateItem,
  onUpdateItem
}) {
  const menuItems = Array.isArray(items) ? items : [];
  const [mode, setMode] = useState("idle");
  const [editingItemId, setEditingItemId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (mode === "create") {
      setForm(EMPTY_FORM);
      setError("");
      setIsImageUploading(false);
      return;
    }

    if (mode === "edit") {
      const item = menuItems.find((candidate) => candidate.id === editingItemId);
      setForm(toFormValues(item));
      setError("");
      setIsImageUploading(false);
      return;
    }

    setEditingItemId(null);
    setForm(EMPTY_FORM);
    setError("");
    setIsImageUploading(false);
  }, [editingItemId, menuItems, mode]);

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

    if (isImageUploading) {
      setError("Please wait for the image upload to finish.");
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
      image_url: form.image_url || null
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

  const isBusy = isSubmitting || isImageUploading;

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
        <div className="mt-5 rounded-2xl border border-black/10 bg-[#f8f9fa] px-4 py-3 text-sm text-slate-600">
          {notice}
        </div>
      ) : null}

      {mode !== "idle" ? (
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 rounded-3xl bg-[#f8f9fa] p-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <ImageUploader
              label="Item photo"
              existingUrl={form.image_url}
              onUpload={(url) => setForm((current) => ({ ...current, image_url: url }))}
              onUploadingChange={setIsImageUploading}
            />
          </div>

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
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
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
              onChange={(event) =>
                setForm((current) => ({ ...current, priceRupees: event.target.value }))
              }
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#01de1a]"
              placeholder="299"
            />
          </label>

          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-slate-600 transition hover:border-[#01de1a]">
            <input
              type="checkbox"
              checked={form.isVeg}
              onChange={(event) =>
                setForm((current) => ({ ...current, isVeg: event.target.checked }))
              }
              className="h-4 w-4 accent-[#01de1a]"
            />
            Mark as <strong>vegetarian</strong>
          </label>

          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-slate-600 transition hover:border-[#01de1a]">
            <input
              type="checkbox"
              checked={form.isAvailable}
              onChange={(event) =>
                setForm((current) => ({ ...current, isAvailable: event.target.checked }))
              }
              className="h-4 w-4 accent-[#01de1a]"
            />
            Show as <strong>available</strong>
          </label>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 md:col-span-2">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3 md:col-span-2">
            <button
              type="submit"
              disabled={isBusy}
              className="rounded-xl bg-[#01de1a] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#00ff1e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isImageUploading
                ? "Uploading photo..."
                : isSubmitting
                  ? "Saving..."
                  : mode === "edit"
                    ? "Save changes"
                    : "Create item"}
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
      ) : null}

      <div className="mt-6 space-y-3">
        {menuItems.length === 0 ? (
          <div className="rounded-2xl bg-[#f8f9fa] p-4 text-sm leading-7 text-slate-500">
            No menu items yet. Use the add item form to publish the first dish.
          </div>
        ) : (
          menuItems.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-2xl bg-[#f8f9fa] p-4 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="flex items-center gap-4">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="h-16 w-16 flex-shrink-0 rounded-xl object-cover shadow-sm"
                  />
                ) : (
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-slate-200 text-2xl">
                    Plate
                  </div>
                )}

                <div>
                  <h4 className="font-semibold text-[#1a1a1a]">{item.name}</h4>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {item.category} · Rs {(Number(item.price_paise || 0) / 100).toFixed(2)}
                  </p>
                  {item.description ? (
                    <p className="mt-1 line-clamp-1 text-xs text-slate-400">{item.description}</p>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={`rounded-full px-3 py-1 font-medium ${
                    item.is_available ? "bg-[#e8f9eb] text-[#01de1a]" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {item.is_available ? "Available" : "Paused"}
                </span>

                <span
                  className={`rounded-full px-3 py-1 font-medium ${
                    item.is_veg ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                  }`}
                >
                  {item.is_veg ? "Veg" : "Non-veg"}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setEditingItemId(item.id);
                    setMode("edit");
                  }}
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
