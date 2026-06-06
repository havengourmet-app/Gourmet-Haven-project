import { useEffect, useState } from "react";
import Shell from "../components/common/Shell";
import RoleBadge from "../components/common/RoleBadge";
import OrderStatusBadge from "../components/common/OrderStatusBadge";
import { ImageUploader } from "../components/owner/OwnerMenuManager";
import { useAuth } from "../hooks/useAuth";
import { legacyAssets } from "../lib/legacyAssets";
import { formatOrderDate, formatPaise, shortOrderId } from "../lib/orderPresentation";
import { updateProfile } from "../services/profileService";
import { listAddresses, createAddress, updateAddress, deleteAddress } from "../services/addressService";
import { listCustomerOrders } from "../services/orderService";

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
    try {
      await onSave(form);
    } catch (err) {
      setError(err.message || "Failed to save address.");
    }
  }

  const inputClass =
    "w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#01de1a]";
  const labelClass = "block";
  const spanClass = "mb-2 block text-sm text-slate-500";

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
      <label className={labelClass}>
        <span className={spanClass}>Label</span>
        <select {...field("label")} className={inputClass}>
          {["Home", "Work", "Other"].map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
      </label>

      <label className={labelClass}>
        <span className={spanClass}>Recipient name</span>
        <input type="text" required placeholder="Full name" {...field("recipient_name")} className={inputClass} />
      </label>

      <label className={labelClass}>
        <span className={spanClass}>Phone</span>
        <input type="tel" required placeholder="+91 98765 43210" {...field("phone")} className={inputClass} />
      </label>

      <label className={labelClass}>
        <span className={spanClass}>Flat / House no.</span>
        <input type="text" required placeholder="Flat 4B, Block C" {...field("line_1")} className={inputClass} />
      </label>

      <label className={labelClass}>
        <span className={spanClass}>Landmark (optional)</span>
        <input type="text" placeholder="Near metro station" {...field("line_2")} className={inputClass} />
      </label>

      <label className={labelClass}>
        <span className={spanClass}>Locality</span>
        <input type="text" required placeholder="Madhapur" {...field("locality")} className={inputClass} />
      </label>

      <label className={labelClass}>
        <span className={spanClass}>City</span>
        <input type="text" required placeholder="Hyderabad" {...field("city")} className={inputClass} />
      </label>

      <label className={labelClass}>
        <span className={spanClass}>Pincode</span>
        <input type="text" required placeholder="500081" {...field("pincode")} className={inputClass} />
      </label>

      <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-slate-600 transition hover:border-[#01de1a] md:col-span-2">
        <input
          type="checkbox"
          checked={form.is_default}
          onChange={(e) => setForm((f) => ({ ...f, is_default: e.target.checked }))}
          className="h-4 w-4 accent-[#01de1a]"
        />
        Set as <strong>default address</strong>
      </label>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 md:col-span-2">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3 md:col-span-2">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-xl bg-[#01de1a] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#00ff1e] disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save address"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-black/10 px-5 py-3 text-sm text-slate-600 transition hover:border-[#01de1a] hover:text-[#01de1a]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

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

  function startEdit(address) {
    setEditingId(address.id);
    setMode("edit");
    setNotice("");
  }

  const editingAddress = addresses.find((a) => a.id === editingId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[#01de1a]">Saved addresses</p>
          <h3 className="mt-2 text-xl font-semibold text-[#1a1a1a]">Delivery locations</h3>
        </div>
        {mode === "idle" && (
          <button
            type="button"
            onClick={() => { setMode("create"); setNotice(""); }}
            className="rounded-xl bg-[#01de1a] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#00ff1e]"
          >
            + Add address
          </button>
        )}
      </div>

      {notice && (
        <div className="rounded-2xl border border-black/10 bg-[#f8f9fa] px-4 py-3 text-sm text-slate-600">
          {notice}
        </div>
      )}

      {mode !== "idle" && (
        <div className="rounded-3xl bg-[#f8f9fa] p-5">
          <p className="mb-4 text-sm font-semibold text-[#1a1a1a]">
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
        <div className="text-sm text-slate-500">Loading addresses...</div>
      ) : addresses.length === 0 ? (
        <div className="rounded-2xl bg-[#f8f9fa] p-6 text-sm text-slate-500">
          No addresses saved yet. Add one above to speed up checkout.
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="card-surface flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#e8f9eb] text-lg">
                  {addr.label === "Home" ? "🏠" : addr.label === "Work" ? "💼" : "📍"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[#1a1a1a]">{addr.label}</p>
                    {addr.is_default && (
                      <span className="rounded-full bg-[#e8f9eb] px-2 py-0.5 text-xs font-semibold text-[#01de1a]">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{addr.recipient_name} · {addr.phone}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {[addr.line_1, addr.line_2, addr.locality, addr.city, addr.pincode]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => startEdit(addr)}
                  className="rounded-xl border border-black/10 px-3 py-2 text-slate-600 transition hover:border-[#01de1a] hover:text-[#01de1a]"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(addr.id)}
                  className="rounded-xl border border-rose-200 px-3 py-2 text-rose-600 transition hover:bg-rose-50"
                >
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

function OrderHistoryTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listCustomerOrders()
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-sm text-slate-500">Loading order history...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl bg-[#f8f9fa] p-8 text-center">
        <p className="text-3xl">🍽️</p>
        <p className="mt-3 font-semibold text-[#1a1a1a]">No orders yet</p>
        <p className="mt-2 text-sm text-slate-500">Your order history will appear here once you place an order.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-[#01de1a]">Past orders</p>
        <h3 className="mt-2 text-xl font-semibold text-[#1a1a1a]">
          {orders.length} order{orders.length !== 1 ? "s" : ""}
        </h3>
      </div>

      {orders.map((order) => (
        <div key={order.id} className="card-surface p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                {shortOrderId(order.id)}
              </p>
              <p className="mt-2 font-semibold text-[#1a1a1a]">
                {order.restaurant?.name || "Restaurant"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {formatOrderDate(order.created_at)}
              </p>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>

          <div className="mt-3 border-t border-black/5 pt-3">
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-500">
              <span>
                {Array.isArray(order.items) ? order.items.length : 0} item
                {(Array.isArray(order.items) ? order.items.length : 0) !== 1 ? "s" : ""}
              </span>
              <span className="font-semibold text-[#1a1a1a]">{formatPaise(order.total_paise)}</span>
            </div>

            {Array.isArray(order.items) && order.items.length > 0 && (
              <p className="mt-1 text-xs text-slate-400">
                {order.items.map((i) => `${i.name} ×${i.qty || i.quantity || 1}`).join(" · ")}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

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

    if (isAvatarUploading) {
      setError("Please wait for the avatar upload to finish.");
      return;
    }

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

  const inputClass =
    "w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#01de1a]";

  const avatarSrc = form.avatar_url || legacyAssets.avatar;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-[#01de1a]">Account details</p>
        <h3 className="mt-2 text-xl font-semibold text-[#1a1a1a]">Edit your profile</h3>
      </div>

      <div className="card-surface p-5">
        <p className="mb-4 text-sm font-semibold text-[#1a1a1a]">Profile photo</p>
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <img
            src={avatarSrc}
            alt="Avatar preview"
            className="h-20 w-20 flex-shrink-0 rounded-full object-cover ring-4 ring-[#01de1a]/20"
          />
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

      <div className="card-surface grid gap-4 p-5 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="mb-2 block text-sm text-slate-500">Email address</span>
          <input
            type="text"
            value={user?.email || ""}
            disabled
            className="w-full rounded-2xl border border-black/10 bg-slate-50 px-4 py-3 text-sm text-slate-400 outline-none cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-slate-400">Email cannot be changed here.</p>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-slate-500">Full name</span>
          <input
            type="text"
            value={form.full_name}
            onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
            placeholder="Your name"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-slate-500">Phone number</span>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="+91 98765 43210"
            className={inputClass}
          />
        </label>
      </div>

      <div className="card-surface p-5">
        <p className="text-sm font-semibold text-[#1a1a1a]">Account role</p>
        <div className="mt-3 flex items-center gap-3">
          <RoleBadge role={profile?.role || "customer"} />
          <p className="text-sm text-slate-500">
            {profile?.role === "owner"
              ? "You manage restaurants on this platform."
              : profile?.role === "delivery"
              ? "You handle deliveries on this platform."
              : "You order food through this platform."}
          </p>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Account ID: {profile?.id || user?.id || "—"}
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </div>
      )}

      <button
        type="submit"
        disabled={isSaving || isAvatarUploading}
        className="rounded-xl bg-[#01de1a] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#00ff1e] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isAvatarUploading ? "Uploading photo..." : isSaving ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}

export default function ProfilePage() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [localProfile, setLocalProfile] = useState(profile);
  const role = localProfile?.role || profile?.role || "customer";

  useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  const visibleTabs = role === "customer"
    ? TABS
    : TABS.filter((t) => t.id !== "orders" && t.id !== "addresses");

  return (
    <Shell
      title="Your profile"
      subtitle="Manage your account details, delivery addresses, and view your order history."
    >
      <nav className="flex flex-wrap gap-2">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.id
                ? "bg-[#01de1a] text-black"
                : "border border-black/10 text-slate-600 hover:border-[#01de1a] hover:text-[#01de1a]"
            }`}
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