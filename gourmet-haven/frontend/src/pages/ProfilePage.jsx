import { useEffect, useState } from "react";
import Shell from "../components/common/Shell";
import RoleBadge from "../components/common/RoleBadge";
import { ImageUploader } from "../components/owner/OwnerMenuManager";
import OrderHistoryTab from "../components/customer/OrderHistoryTab";
import { useAuth } from "../hooks/useAuth";
import { updateProfile } from "../services/profileService";
import { listAddresses, createAddress, updateAddress, deleteAddress } from "../services/addressService";

const TABS = [
  { id: "profile", label: "Edit Profile" },
  { id: "orders", label: "Order History" },
  { id: "addresses", label: "Addresses" }
];

const EMPTY_ADDRESS = {
  label: "Home",
  recipient_name: "",
  phone: "",
  line_1: "",
  line_2: "",
  locality: "",
  city: "Hyderabad",
  pincode: "",
  is_default: false
};

// ── Address Form ─────────────────────────────────────────────────────────────
function AddressForm({ initial = EMPTY_ADDRESS, onSave, onCancel, isSaving }) {
  const [form, setForm] = useState({ ...EMPTY_ADDRESS, ...initial });
  const [error, setError] = useState("");

  function field(key) {
    return {
      value: form[key],
      onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try { await onSave(form); }
    catch (err) { setError(err.message || "Failed to save address."); }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
      <div>
        <label className="input-label">Label</label>
        <select {...field("label")} className="input">
          {["Home", "Work", "Other"].map((l) => <option key={l}>{l}</option>)}
        </select>
      </div>

      <div>
        <label className="input-label">Recipient name</label>
        <input type="text" required placeholder="Full name" {...field("recipient_name")} className="input" />
      </div>

      <div>
        <label className="input-label">Phone</label>
        <input type="tel" required placeholder="+91 98765 43210" {...field("phone")} className="input" />
      </div>

      <div>
        <label className="input-label">Flat / House no.</label>
        <input type="text" required placeholder="Flat 4B, Block C" {...field("line_1")} className="input" />
      </div>

      <div>
        <label className="input-label">Landmark (optional)</label>
        <input type="text" placeholder="Near metro station" {...field("line_2")} className="input" />
      </div>

      <div>
        <label className="input-label">Locality</label>
        <input type="text" required placeholder="Madhapur" {...field("locality")} className="input" />
      </div>

      <div>
        <label className="input-label">City</label>
        <input type="text" required placeholder="Hyderabad" {...field("city")} className="input" />
      </div>

      <div>
        <label className="input-label">Pincode</label>
        <input type="text" required placeholder="500081" {...field("pincode")} className="input" />
      </div>

      <label
        className="flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 transition md:col-span-2"
        style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
      >
        <input
          type="checkbox"
          checked={form.is_default}
          onChange={(e) => setForm((f) => ({ ...f, is_default: e.target.checked }))}
          className="h-4 w-4 accent-green-600"
        />
        <span className="text-sm" style={{ color: "var(--ink-secondary)" }}>
          Set as <strong style={{ color: "var(--ink)" }}>default address</strong>
        </span>
      </label>

      {error && (
        <div className="rounded-xl px-4 py-3 text-sm md:col-span-2" style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}>
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3 md:col-span-2">
        <button type="submit" disabled={isSaving} className="btn-primary">
          {isSaving ? "Saving..." : "Save address"}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Addresses Tab ─────────────────────────────────────────────────────────────
function AddressesTab() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("idle");
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    listAddresses()
      .then((data) => setAddresses(Array.isArray(data) ? data : []))
      .catch(() => setAddresses([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(form) {
    setIsSaving(true);
    try {
      if (mode === "edit" && editingId) {
        const updated = await updateAddress(editingId, form);
        setAddresses((prev) => prev.map((a) => (a.id === editingId ? updated : a)));
        setNotice("Address updated.");
      } else {
        const created = await createAddress(form);
        setAddresses((prev) => [created, ...prev]);
        setNotice("Address added.");
      }
      setMode("idle");
      setEditingId(null);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this address?")) return;
    await deleteAddress(id);
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    setNotice("Address deleted.");
  }

  const editingAddress = addresses.find((a) => a.id === editingId);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="label-xs">Saved addresses</p>
          <h3 className="mt-1 text-xl font-semibold" style={{ color: "var(--ink)" }}>Delivery locations</h3>
        </div>
        {mode === "idle" && (
          <button type="button" onClick={() => { setMode("create"); setNotice(""); }} className="btn-primary">
            + Add address
          </button>
        )}
      </div>

      {notice && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "var(--brand-lightest)", border: "1px solid var(--brand-lighter)", color: "var(--brand-dark)" }}>
          {notice}
        </div>
      )}

      {mode !== "idle" && (
        <div className="card-surface p-5">
          <p className="mb-4 text-sm font-semibold" style={{ color: "var(--ink)" }}>
            {mode === "edit" ? "Edit address" : "New address"}
          </p>
          <AddressForm
            initial={editingAddress}
            onSave={handleSave}
            onCancel={() => { setMode("idle"); setEditingId(null); }}
            isSaving={isSaving}
          />
        </div>
      )}

      {loading ? (
        <div className="text-sm" style={{ color: "var(--ink-muted)" }}>Loading addresses...</div>
      ) : addresses.length === 0 ? (
        <div className="card-surface p-8 text-center">
          <p className="text-3xl">📍</p>
          <p className="mt-3 font-semibold" style={{ color: "var(--ink)" }}>No addresses saved</p>
          <p className="mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>Add one above to speed up checkout.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div key={addr.id} className="card-surface flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <div
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-lg"
                  style={{ background: "var(--brand-lightest)", border: "1px solid var(--brand-lighter)" }}
                >
                  {addr.label === "Home" ? "🏠" : addr.label === "Work" ? "💼" : "📍"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold" style={{ color: "var(--ink)" }}>{addr.label}</p>
                    {addr.is_default && (
                      <span className="badge badge-green">Default</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm" style={{ color: "var(--ink-secondary)" }}>
                    {addr.recipient_name} · {addr.phone}
                  </p>
                  <p className="mt-0.5 text-sm" style={{ color: "var(--ink-muted)" }}>
                    {[addr.line_1, addr.line_2, addr.locality, addr.city, addr.pincode].filter(Boolean).join(", ")}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setEditingId(addr.id); setMode("edit"); setNotice(""); }} className="btn-secondary text-xs py-1.5 px-3">
                  Edit
                </button>
                <button type="button" onClick={() => handleDelete(addr.id)} className="btn-danger text-xs py-1.5 px-3">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Edit Profile Tab ──────────────────────────────────────────────────────────
function EditProfileTab({ user, profile, onProfileUpdated }) {
  const [form, setForm] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
    avatar_url: profile?.avatar_url || null
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setForm({
      full_name: profile?.full_name || "",
      phone: profile?.phone || "",
      avatar_url: profile?.avatar_url || null
    });
  }, [profile?.full_name, profile?.phone, profile?.avatar_url]);

  async function handleSubmit(e) {
    e.preventDefault();
    setNotice("");
    setError("");
    if (isAvatarUploading) { setError("Please wait for the avatar upload to finish."); return; }
    setIsSaving(true);
    try {
      const updated = await updateProfile({
        full_name: form.full_name.trim() || null,
        phone: form.phone.trim() || null,
        avatar_url: form.avatar_url || null
      });
      onProfileUpdated?.(updated);
      setNotice("Profile updated successfully.");
    } catch (err) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  }

  const initials = (profile?.full_name || user?.email || "U").slice(0, 1).toUpperCase();

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <p className="label-xs">Account details</p>
        <h3 className="mt-1 text-xl font-semibold" style={{ color: "var(--ink)" }}>Edit your profile</h3>
      </div>

      {/* Avatar */}
      <div className="card-surface p-5">
        <p className="mb-4 text-sm font-semibold" style={{ color: "var(--ink)" }}>Profile photo</p>
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          {form.avatar_url ? (
            <img
              src={form.avatar_url}
              alt="Avatar"
              className="h-20 w-20 flex-shrink-0 rounded-full object-cover"
              style={{ border: "3px solid var(--brand-lighter)" }}
            />
          ) : (
            <div
              className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full text-2xl font-bold text-white"
              style={{ background: "var(--brand)", border: "3px solid var(--brand-lighter)" }}
            >
              {initials}
            </div>
          )}
          <div className="flex-1">
            <ImageUploader
              label="Upload new photo"
              existingUrl={form.avatar_url}
              onUpload={(url) => setForm((f) => ({ ...f, avatar_url: url }))}
              onUploadingChange={setIsAvatarUploading}
            />
          </div>
        </div>
      </div>

      {/* Fields */}
      <div className="card-surface grid gap-4 p-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="input-label">Email address</label>
          <input
            type="text"
            value={user?.email || ""}
            disabled
            className="input cursor-not-allowed"
            style={{ background: "var(--muted)", color: "var(--ink-muted)" }}
          />
          <p className="mt-1 text-xs" style={{ color: "var(--ink-muted)" }}>Email cannot be changed here.</p>
        </div>

        <div>
          <label className="input-label">Full name</label>
          <input
            type="text"
            value={form.full_name}
            onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
            placeholder="Your name"
            className="input"
          />
        </div>

        <div>
          <label className="input-label">Phone number</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="+91 98765 43210"
            className="input"
          />
        </div>
      </div>

      {/* Role info */}
      <div className="card-surface p-5">
        <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>Account role</p>
        <div className="mt-3 flex items-center gap-3">
          <RoleBadge role={profile?.role || "customer"} />
          {(profile?.role === "owner" || profile?.role === "delivery") && profile?.approval_status && (
            <span
              className={`badge ${
                profile.approval_status === "approved"
                  ? "badge-green"
                  : profile.approval_status === "rejected"
                  ? "badge-red"
                  : "badge-amber"
              }`}
            >
              {profile.approval_status === "approved"
                ? "Approved"
                : profile.approval_status === "rejected"
                ? "Rejected"
                : "Pending approval"}
            </span>
          )}
          <p className="text-sm" style={{ color: "var(--ink-secondary)" }}>
            {profile?.role === "owner"
              ? "You manage restaurants on this platform."
              : profile?.role === "delivery"
              ? "You handle deliveries on this platform."
              : "You order food through this platform."}
          </p>
        </div>
        <p className="mt-3 text-xs" style={{ color: "var(--ink-muted)" }}>
          Account ID: {profile?.id || user?.id || "—"}
        </p>
      </div>

      {error && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}>
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "var(--brand-lightest)", border: "1px solid var(--brand-lighter)", color: "var(--brand-dark)" }}>
          {notice}
        </div>
      )}

      <button
        type="submit"
        disabled={isSaving || isAvatarUploading}
        className="btn-primary"
      >
        {isAvatarUploading ? "Uploading photo..." : isSaving ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [localProfile, setLocalProfile] = useState(profile);
  const role = localProfile?.role || profile?.role || "customer";

  useEffect(() => { setLocalProfile(profile); }, [profile]);

  const visibleTabs = role === "customer"
    ? TABS
    : TABS.filter((t) => t.id !== "orders" && t.id !== "addresses");

  return (
    <Shell
      title="Your profile"
      subtitle="Manage your account details, delivery addresses, and view your order history."
    >
      {/* Tab bar */}
      <nav className="flex flex-wrap gap-2">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`nav-pill ${activeTab === tab.id ? "nav-pill-active" : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="min-h-[400px]">
        {activeTab === "profile" && (
          <EditProfileTab
            user={user}
            profile={localProfile}
            onProfileUpdated={(updated) => setLocalProfile((prev) => ({ ...prev, ...updated }))}
          />
        )}
        {activeTab === "orders" && role === "customer" && <OrderHistoryTab />}
        {activeTab === "addresses" && role === "customer" && <AddressesTab />}
      </div>
    </Shell>
  );
}