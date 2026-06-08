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
  if (!item) return EMPTY_FORM;
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
  if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
}

export function ImageUploader({ onUpload, existingUrl, label, onUploadingChange }) {
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(existingUrl || null);
  const [temporaryUrl, setTemporaryUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { setPreviewUrl(existingUrl || null); }, [existingUrl]);
  useEffect(() => () => revokeObjectUrl(temporaryUrl), [temporaryUrl]);

  function setUploadingState(v) { setIsUploading(v); onUploadingChange?.(v); }

  async function handleSelectedFile(file) {
    if (!file) return;
    if (!file.type?.startsWith("image/")) { setError("Only image files can be uploaded."); return; }
    if (file.size > MAX_SIZE_BYTES) { setError(`Image must be smaller than ${MAX_SIZE_MB} MB.`); return; }
    setError("");
    const nextTmp = URL.createObjectURL(file);
    revokeObjectUrl(temporaryUrl);
    setTemporaryUrl(nextTmp);
    setPreviewUrl(nextTmp);
    setUploadingState(true);
    try {
      const url = await uploadImage(file);
      revokeObjectUrl(nextTmp);
      setTemporaryUrl(null);
      setPreviewUrl(url);
      onUpload?.(url);
    } catch (err) {
      setError(err.message || "Image upload failed.");
    } finally {
      setUploadingState(false);
    }
  }

  function handleRemove() {
    revokeObjectUrl(temporaryUrl);
    setTemporaryUrl(null);
    setPreviewUrl(null);
    setError("");
    onUpload?.(null);
  }

  return (
    <div className="space-y-2">
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0] || null; e.target.value = ""; void handleSelectedFile(f); }} />

      <button
        type="button"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
        className="flex w-full flex-col items-center justify-center gap-3 rounded-xl px-5 py-4 text-center transition disabled:cursor-not-allowed disabled:opacity-60"
        style={{ border: "2px dashed var(--border)", background: "var(--muted)" }}
        onMouseEnter={(e) => { if (!isUploading) e.currentTarget.style.borderColor = "var(--brand)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
      >
        <span className="text-sm font-medium" style={{ color: "var(--ink)" }}>{label}</span>

        {previewUrl ? (
          <img src={previewUrl} alt="preview" className="max-h-28 w-auto rounded-xl object-contain" />
        ) : (
          <div className="rounded-xl px-4 py-5 text-sm" style={{ background: "var(--card)", color: "var(--ink-muted)" }}>
            Click to choose an image
          </div>
        )}

        {isUploading ? (
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--ink-secondary)" }}>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-t-green-600" style={{ borderColor: "var(--border)", borderTopColor: "var(--brand)" }} />
            Uploading...
          </div>
        ) : (
          <span className="text-xs" style={{ color: "var(--ink-muted)" }}>
            PNG, JPG, WebP up to {MAX_SIZE_MB} MB
          </span>
        )}
      </button>

      {previewUrl && (
        <button type="button" disabled={isUploading} onClick={handleRemove} className="text-sm" style={{ color: "#dc2626" }}>
          Remove image
        </button>
      )}

      {error && (
        <div className="rounded-xl px-4 py-2.5 text-sm" style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}>
          {error}
        </div>
      )}
    </div>
  );
}

export default function OwnerMenuManager({ restaurant, items, isSubmitting, notice, onCreateItem, onUpdateItem }) {
  const menuItems = Array.isArray(items) ? items : [];
  const [mode, setMode] = useState("idle");
  const [editingItemId, setEditingItemId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (mode === "create") { setForm(EMPTY_FORM); setError(""); setIsImageUploading(false); return; }
    if (mode === "edit") {
      const item = menuItems.find((c) => c.id === editingItemId);
      setForm(toFormValues(item)); setError(""); setIsImageUploading(false); return;
    }
    setEditingItemId(null); setForm(EMPTY_FORM); setError(""); setIsImageUploading(false);
  }, [editingItemId, menuItems, mode]);

  async function handleSubmit(e) {
    e.preventDefault(); setError("");
    const parsedPrice = Number(form.priceRupees);
    if (!restaurant?.id) { setError("Create a restaurant before managing menu items."); return; }
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) { setError("Enter a valid price in rupees."); return; }
    if (isImageUploading) { setError("Please wait for the image upload to finish."); return; }

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
      if (mode === "edit" && editingItemId) await onUpdateItem?.(editingItemId, payload);
      else await onCreateItem?.(payload);
      setMode("idle");
    } catch (err) {
      setError(err.message || "Unable to save the menu item right now.");
    }
  }

  const isBusy = isSubmitting || isImageUploading;

  return (
    <div className="card-surface p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="label-xs">Menu management</p>
          <h3 className="mt-1 text-xl font-semibold" style={{ color: "var(--ink)" }}>
            {restaurant?.name ? `${restaurant.name} menu` : "Restaurant menu"}
          </h3>
          <p className="mt-1 text-sm" style={{ color: "var(--ink-secondary)" }}>
            {restaurant?.id ? "Add and edit dishes from your owner dashboard." : "Create a restaurant first, then build your menu."}
          </p>
        </div>
        <button
          type="button"
          disabled={!restaurant?.id}
          onClick={() => setMode((c) => (c === "create" ? "idle" : "create"))}
          className="btn-primary"
        >
          {mode === "create" ? "Close form" : "+ Add item"}
        </button>
      </div>

      {notice && (
        <div className="mt-4 rounded-xl px-4 py-3 text-sm" style={{ background: "var(--brand-lightest)", border: "1px solid var(--brand-lighter)", color: "var(--brand-dark)" }}>
          {notice}
        </div>
      )}

      {mode !== "idle" && (
        <form onSubmit={handleSubmit} className="mt-5 grid gap-4 rounded-2xl p-5 md:grid-cols-2" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
          <div className="md:col-span-2">
            <ImageUploader
              label="Item photo"
              existingUrl={form.image_url}
              onUpload={(url) => setForm((c) => ({ ...c, image_url: url }))}
              onUploadingChange={setIsImageUploading}
            />
          </div>

          <div className="md:col-span-2">
            <label className="input-label">Item name</label>
            <input type="text" required value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} className="input" placeholder="Hyderabadi Chicken Biryani" />
          </div>

          <div className="md:col-span-2">
            <label className="input-label">Description</label>
            <textarea rows="2" value={form.description} onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))} className="input resize-none" placeholder="Tell customers what makes this special." />
          </div>

          <div>
            <label className="input-label">Category</label>
            <input type="text" value={form.category} onChange={(e) => setForm((c) => ({ ...c, category: e.target.value }))} className="input" placeholder="Mains" />
          </div>

          <div>
            <label className="input-label">Price (₹)</label>
            <input type="number" min="0" step="0.01" required value={form.priceRupees} onChange={(e) => setForm((c) => ({ ...c, priceRupees: e.target.value }))} className="input" placeholder="299" />
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 transition" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <input type="checkbox" checked={form.isVeg} onChange={(e) => setForm((c) => ({ ...c, isVeg: e.target.checked }))} className="h-4 w-4 accent-green-600" />
            <span className="text-sm" style={{ color: "var(--ink-secondary)" }}>Mark as <strong style={{ color: "var(--ink)" }}>vegetarian</strong></span>
          </label>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 transition" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm((c) => ({ ...c, isAvailable: e.target.checked }))} className="h-4 w-4 accent-green-600" />
            <span className="text-sm" style={{ color: "var(--ink-secondary)" }}>Show as <strong style={{ color: "var(--ink)" }}>available</strong></span>
          </label>

          {error && (
            <div className="rounded-xl px-4 py-3 text-sm md:col-span-2" style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}>
              {error}
            </div>
          )}

          <div className="flex flex-wrap gap-3 md:col-span-2">
            <button type="submit" disabled={isBusy} className="btn-primary">
              {isImageUploading ? "Uploading photo..." : isSubmitting ? "Saving..." : mode === "edit" ? "Save changes" : "Create item"}
            </button>
            <button type="button" onClick={() => setMode("idle")} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      {/* Items list */}
      <div className="mt-5 space-y-3">
        {menuItems.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
            <p className="text-3xl">🍽️</p>
            <p className="mt-3 text-sm font-semibold" style={{ color: "var(--ink)" }}>No menu items yet</p>
            <p className="mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>Use the form above to add your first dish.</p>
          </div>
        ) : (
          menuItems.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-xl p-4 lg:flex-row lg:items-center lg:justify-between"
              style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-4">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="h-14 w-14 flex-shrink-0 rounded-xl object-cover" />
                ) : (
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl text-2xl" style={{ background: "var(--border)" }}>
                    🍽️
                  </div>
                )}
                <div>
                  <h4 className="font-semibold" style={{ color: "var(--ink)" }}>{item.name}</h4>
                  <p className="mt-0.5 text-sm" style={{ color: "var(--ink-muted)" }}>
                    {item.category} · ₹{(Number(item.price_paise || 0) / 100).toFixed(0)}
                  </p>
                  {item.description && (
                    <p className="mt-0.5 line-clamp-1 text-xs" style={{ color: "var(--ink-muted)" }}>{item.description}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className={`badge ${item.is_available ? "badge-green" : "badge-stone"}`}>
                  {item.is_available ? "Available" : "Paused"}
                </span>
                <span className={`badge ${item.is_veg ? "badge-green" : "badge-red"}`}>
                  {item.is_veg ? "Veg" : "Non-veg"}
                </span>
                <button
                  type="button"
                  onClick={() => { setEditingItemId(item.id); setMode("edit"); }}
                  className="btn-secondary text-xs py-1.5 px-3"
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