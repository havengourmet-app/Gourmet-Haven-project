import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, isLoading, error, clearError, defaultRouteForRole } = useAuth();
  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  async function handleSubmit(event) {
    event.preventDefault();
    clearError();

    try {
      const profile = await signIn(form);

      if (profile?.role === "owner") {
        navigate("/owner");
        return;
      }

      if (profile?.role === "delivery") {
        navigate("/delivery");
        return;
      }

      navigate(defaultRouteForRole());
    } catch {
      return;
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f1115] px-4 py-10">
      <div className="w-full max-w-md rounded-[1.75rem] bg-white/10 p-8 text-white backdrop-blur">
        <div className="mb-8">
          <Link to="/" className="text-sm font-semibold text-white/80 hover:text-[#01de1a]">
            Back to landing page
          </Link>
          <h1 className="mt-4 text-3xl font-semibold">Login</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Sign in with your Supabase Auth credentials to continue to your dashboard.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm text-slate-200">Email</span>
            <input
              type="email"
              required
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-[#01de1a]"
              placeholder="owner@gourmethaven.com"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-200">Password</span>
            <input
              type="password"
              required
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-[#01de1a]"
              placeholder="Enter your password"
            />
          </label>

          {error ? (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-2xl bg-[#01de1a] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#00ff1e] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Signing in..." : "Login"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-300">
          Don't have an account?{" "}
          <Link to="/signup" className="font-semibold text-[#01de1a]">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
