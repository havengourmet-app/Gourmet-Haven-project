import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa] px-4">
      <div className="card-surface max-w-lg p-8 text-center">
        <p className="text-xs uppercase tracking-[0.28em] text-[#01de1a]">404</p>
        <h1 className="mt-3 text-3xl font-semibold text-[#1a1a1a]">Page not found</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          The route exists in neither the customer, owner, nor delivery experience yet.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-xl bg-[#01de1a] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#00ff1e]"
        >
          Return home
        </Link>
      </div>
    </div>
  );
}
