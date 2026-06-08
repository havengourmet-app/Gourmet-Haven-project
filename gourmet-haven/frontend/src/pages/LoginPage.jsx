import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, isLoading, error, clearError, defaultRouteForRole } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });

  async function handleSubmit(e) {
    e.preventDefault();
    clearError();
    try {
      const profile = await signIn(form);
      if (profile?.role === "owner") { navigate("/owner"); return; }
      if (profile?.role === "delivery") { navigate("/delivery"); return; }
      navigate(defaultRouteForRole());
    } catch { return; }
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
          <h1 className="mt-6 text-2xl font-bold" style={{ color: "#f5f4f0" }}>Welcome back</h1>
          <p className="mt-1 text-sm" style={{ color: "rgba(245,244,240,0.50)" }}>
            Sign in to your account to continue
          </p>
        </div>

        <div
          className="rounded-2xl p-8"
          style={{ background: "#1a1d13", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: "rgba(245,244,240,0.70)" }}>
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
                placeholder="you@example.com"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  color: "#f5f4f0"
                }}
                onFocus={(e) => { e.target.style.borderColor = "#16a34a"; e.target.style.boxShadow = "0 0 0 3px rgba(22,163,74,0.15)"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.10)"; e.target.style.boxShadow = "none"; }}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: "rgba(245,244,240,0.70)" }}>
                Password
              </label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))}
                placeholder="Enter your password"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  color: "#f5f4f0"
                }}
                onFocus={(e) => { e.target.style.borderColor = "#16a34a"; e.target.style.boxShadow = "0 0 0 3px rgba(22,163,74,0.15)"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.10)"; e.target.style.boxShadow = "none"; }}
              />
            </div>

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.25)", color: "#fca5a5" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl py-3 text-sm font-semibold text-white transition disabled:opacity-55"
              style={{ background: "#16a34a", border: "1.5px solid #15803d" }}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: "rgba(245,244,240,0.45)" }}>
            Don't have an account?{" "}
            <Link to="/signup" className="font-semibold" style={{ color: "#4ade80" }}>
              Sign up
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