import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const ROLE_OPTIONS = [
  { value: "customer", label: "Customer" },
  { value: "owner", label: "Owner" },
  { value: "delivery", label: "Delivery" }
];

export default function SignupPage() {
  const navigate = useNavigate();
  const { signUp, isLoading, error, clearError } = useAuth();
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "customer"
  });

  async function handleSubmit(event) {
    event.preventDefault();
    clearError();
    setNotice("");

    try {
      await signUp(form);
      setNotice("Account created. Check your email for the confirmation link, then sign in.");
      setTimeout(() => navigate("/login"), 1200);
    } catch {
      return;
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f1115] px-4 py-10">
      <div className="w-full max-w-xl rounded-[1.75rem] bg-white/10 p-8 text-white backdrop-blur">
        <div className="mb-8">
          <Link to="/" className="text-sm font-semibold text-white/80 hover:text-[#01de1a]">
            Back to landing page
          </Link>
          <h1 className="mt-4 text-3xl font-semibold">Create your account</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Start as a customer, owner, or delivery partner. Supabase Auth will manage sign-up and session handling.
          </p>
        </div>

        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm text-slate-200">Full name</span>
            <input
              type="text"
              required
              value={form.fullName}
              onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-[#01de1a]"
              placeholder="Enter your name"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm text-slate-200">Email</span>
            <input
              type="email"
              required
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-[#01de1a]"
              placeholder="you@example.com"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-200">Role</span>
            <select
              value={form.role}
              onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-[#01de1a]"
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="text-black">
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-200">Password</span>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-[#01de1a]"
              placeholder="At least 8 characters"
            />
          </label>

          {error ? (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100 md:col-span-2">
              {error}
            </div>
          ) : null}

          {notice ? (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100 md:col-span-2">
              {notice}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="md:col-span-2 w-full rounded-2xl bg-[#01de1a] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#00ff1e] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-300">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-[#01de1a]">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
