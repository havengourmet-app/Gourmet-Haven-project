import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const ROLE_OPTIONS = [
  { value: "customer", label: "Customer", description: "Order food from restaurants" },
  { value: "owner", label: "Restaurant Owner", description: "Manage your restaurant & menu" },
  { value: "delivery", label: "Delivery Partner", description: "Handle pickups and deliveries" }
];

const inputStyle = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#f5f4f0"
};

export default function SignupPage() {
  const navigate = useNavigate();
  const { signUp, isLoading, error, clearError } = useAuth();
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({ fullName: "", email: "", password: "", role: "customer" });

  async function handleSubmit(e) {
    e.preventDefault();
    clearError();
    setNotice("");
    try {
      await signUp(form);
      const needsApproval = form.role === "owner" || form.role === "delivery";
      setNotice(
        needsApproval
          ? "Account created! Check your email to confirm it. After confirming, an admin will review your application before you get dashboard access."
          : "Account created! Check your email for a confirmation link, then sign in."
      );
      setTimeout(() => navigate("/login"), 2500);
    } catch {
      return;
    }
  }

  function focusStyle(e) {
    e.target.style.borderColor = "#16a34a";
    e.target.style.boxShadow = "0 0 0 3px rgba(22,163,74,0.15)";
  }
  function blurStyle(e) {
    e.target.style.borderColor = "rgba(255,255,255,0.10)";
    e.target.style.boxShadow = "none";
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-12"
      style={{ background: "#0f1009" }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl text-base font-bold text-white" style={{ background: "#16a34a" }}>
              Q
            </div>
            <span className="text-xl font-bold" style={{ color: "#f5f4f0" }}>QuickDyne</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold" style={{ color: "#f5f4f0" }}>Create your account</h1>
          <p className="mt-1 text-sm" style={{ color: "rgba(245,244,240,0.50)" }}>
            Choose your role and get started
          </p>
        </div>

        <div
          className="rounded-2xl p-8"
          style={{ background: "#1a1d13", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Role selector */}
            <div>
              <label className="mb-2 block text-sm font-medium" style={{ color: "rgba(245,244,240,0.70)" }}>
                I am a...
              </label>
              <div className="grid gap-2">
                {ROLE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 transition"
                    style={{
                      background: form.role === opt.value ? "rgba(22,163,74,0.12)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${form.role === opt.value ? "rgba(22,163,74,0.40)" : "rgba(255,255,255,0.08)"}`
                    }}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={opt.value}
                      checked={form.role === opt.value}
                      onChange={(e) => setForm((c) => ({ ...c, role: e.target.value }))}
                      className="accent-green-500"
                    />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#f5f4f0" }}>{opt.label}</p>
                      <p className="text-xs" style={{ color: "rgba(245,244,240,0.45)" }}>{opt.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {[
              { key: "fullName", label: "Full name", type: "text", placeholder: "Your name" },
              { key: "email", label: "Email", type: "email", placeholder: "you@example.com" },
              { key: "password", label: "Password", type: "password", placeholder: "At least 8 characters", minLength: 8 }
            ].map(({ key, label, type, placeholder, minLength }) => (
              <div key={key}>
                <label className="mb-1.5 block text-sm font-medium" style={{ color: "rgba(245,244,240,0.70)" }}>
                  {label}
                </label>
                <input
                  type={type}
                  required
                  minLength={minLength}
                  value={form[key]}
                  onChange={(e) => setForm((c) => ({ ...c, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition"
                  style={inputStyle}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                />
              </div>
            ))}

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.25)", color: "#fca5a5" }}>
                {error}
              </div>
            )}

            {notice && (
              <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(22,163,74,0.12)", border: "1px solid rgba(22,163,74,0.25)", color: "#4ade80" }}>
                {notice}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl py-3 text-sm font-semibold text-white transition disabled:opacity-55"
              style={{ background: "#16a34a", border: "1.5px solid #15803d" }}
            >
              {isLoading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: "rgba(245,244,240,0.45)" }}>
            Already have an account?{" "}
            <Link to="/login" className="font-semibold" style={{ color: "#4ade80" }}>
              Sign in
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center">
          <Link to="/" className="text-xs" style={{ color: "rgba(245,244,240,0.35)" }}>
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}