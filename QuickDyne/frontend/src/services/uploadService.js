import { apiRequest } from "./apiClient";

// Get a signed upload ticket from our backend
export function createUploadSignature(folder) {
  return apiRequest("/uploads/signature", {
    method: "POST",
    body: JSON.stringify({ folder })
  });
}

/**
 * Upload a File object to Cloudinary via our signed endpoint.
 * Returns the permanent HTTPS image URL on success.
 *
 * Falls back to a local blob URL if Cloudinary is not configured,
 * so the owner can still see a preview in dev mode.
 */
export async function uploadMenuItemImage(file) {
  // ── Try signed Cloudinary upload ────────────────────────────────────────────
  let signData = null;
  try {
    const response = await createUploadSignature("quickdyne/menu-items");
    signData = response?.data || null;
  } catch {
    // Cloudinary not configured — fall through to local blob fallback
  }

  if (signData?.cloudName) {
    const form = new FormData();
    form.append("file",      file);
    form.append("api_key",   signData.apiKey);
    form.append("timestamp", String(signData.timestamp));
    form.append("signature", signData.signature);
    form.append("folder",    signData.folder);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`,
      { method: "POST", body: form }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || "Cloudinary upload failed.");
    }

    const data = await res.json();
    return data.secure_url; // permanent CDN URL
  }

  // ── Fallback: blob URL (dev / no Cloudinary) ─────────────────────────────
  // This URL only lives for the current browser session.
  // It lets owners preview the image even without Cloudinary configured.
  return URL.createObjectURL(file);
}