import { Link } from "react-router-dom";
import { legacyAssets } from "../lib/legacyAssets";

const FEATURES = [
  {
    title: "Zero commission marketplace",
    description:
      "Owners pay a fixed subscription, not per-order cuts. Restaurants keep their margins — and pass the savings on.",
    image: legacyAssets.featureFresh,
    tag: "For owners"
  },
  {
    title: "Farm fresh quality",
    description:
      "Premium ingredients, expert chefs, and a platform built around food-first experiences.",
    image: legacyAssets.featureChef,
    tag: "For customers"
  },
  {
    title: "Real-time everywhere",
    description:
      "Customers, owners, and delivery partners stay synced through live order updates at every step.",
    image: legacyAssets.featureDelivery,
    tag: "Platform"
  }
];

const STATS = [
  { value: "0%", label: "Commission taken" },
  { value: "3", label: "Roles supported" },
  { value: "Live", label: "Order tracking" }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "#0f1009", color: "#f5f4f0" }}>

      {/* ── Header ── */}
      <header className="fixed inset-x-0 top-0 z-40" style={{ background: "rgba(15,16,9,0.80)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ background: "#16a34a" }}>
              Q
            </div>
            <span className="text-lg font-bold tracking-tight">QuickDyne</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden rounded-xl px-4 py-2 text-sm font-medium transition sm:block"
              style={{ color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.12)" }}
              onMouseEnter={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.3)"; e.target.style.color = "#fff"; }}
              onMouseLeave={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.12)"; e.target.style.color = "rgba(255,255,255,0.7)"; }}
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition"
              style={{ background: "#16a34a", border: "1px solid #15803d" }}
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-20 text-center">
        <video
          autoPlay muted loop playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-30"
          src={legacyAssets.heroVideo}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(15,16,9,0.3) 0%, rgba(15,16,9,0.7) 60%, rgba(15,16,9,1) 100%)" }} />

        <div className="relative z-10 mx-auto max-w-4xl px-4 pt-16">
          {/* Pill label */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold" style={{ background: "rgba(22,163,74,0.15)", border: "1px solid rgba(22,163,74,0.30)", color: "#4ade80" }}>
            <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
            Hyderabad-first food platform
          </div>

          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-6xl" style={{ color: "#f5f4f0" }}>
            Great food,{" "}
            <span style={{ color: "#4ade80" }}>zero commission</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 sm:text-lg" style={{ color: "rgba(245,244,240,0.65)" }}>
            QuickDyne is built for Hyderabad's restaurant owners — subscription-based, not commission-based.
            Better margins for owners, better prices for customers.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-semibold text-white transition"
              style={{ background: "#16a34a", border: "1.5px solid #15803d", boxShadow: "0 4px 16px rgba(22,163,74,0.30)" }}
            >
              Order now
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-medium transition"
              style={{ border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.8)" }}
            >
              Learn more
            </a>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-16 grid max-w-lg grid-cols-3 gap-6 border-t pt-10" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-bold" style={{ color: "#4ade80" }}>{stat.value}</p>
                <p className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ background: "#12140c" }} className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "#4ade80" }}>
              Why QuickDyne
            </p>
            <h2 className="text-3xl font-bold" style={{ color: "#f5f4f0" }}>
              Built differently from day one
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <article
                key={feature.title}
                className="group overflow-hidden rounded-2xl transition-all duration-300"
                style={{ background: "#1a1d13", border: "1px solid rgba(255,255,255,0.06)" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(22,163,74,0.30)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.transform = "none"; }}
              >
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="h-full w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(26,29,19,0.9) 0%, transparent 60%)" }} />
                  <span
                    className="absolute left-4 top-4 rounded-lg px-2.5 py-1 text-xs font-semibold"
                    style={{ background: "rgba(22,163,74,0.20)", border: "1px solid rgba(22,163,74,0.35)", color: "#4ade80" }}
                  >
                    {feature.tag}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="text-base font-semibold" style={{ color: "#f5f4f0" }}>
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6" style={{ color: "rgba(245,244,240,0.55)" }}>
                    {feature.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Showcase ── */}
      <section className="px-4 py-24 sm:px-6 lg:px-8" style={{ background: "#0f1009" }}>
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "#4ade80" }}>
              Our story
            </p>
            <h2 className="text-3xl font-bold leading-tight" style={{ color: "#f5f4f0" }}>
              A culinary platform built for Hyderabad
            </h2>
            <p className="mt-5 text-base leading-7" style={{ color: "rgba(245,244,240,0.60)" }}>
              QuickDyne started with a simple belief — restaurants shouldn't bleed revenue on
              every order. A fixed subscription unlocks everything: delivery, analytics, live
              order management, and real-time customer tracking.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4">
              {[
                { icon: "🍽️", text: "Real restaurant menus" },
                { icon: "📦", text: "Live order tracking" },
                { icon: "📊", text: "Owner analytics" },
                { icon: "⭐", text: "Customer reviews" }
              ].map((item) => (
                <div
                  key={item.text}
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm font-medium" style={{ color: "rgba(245,244,240,0.75)" }}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>

            <Link
              to="/signup"
              className="mt-8 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition"
              style={{ background: "#16a34a", border: "1.5px solid #15803d" }}
            >
              Get started free →
            </Link>
          </div>

          <div className="relative">
            <img
              src={legacyAssets.showcase}
              alt="Showcase dish"
              className="w-full rounded-2xl"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}
            />
            {/* Floating badge */}
            <div
              className="absolute -bottom-4 -left-4 rounded-2xl px-4 py-3 shadow-xl hidden sm:block"
              style={{ background: "#1a1d13", border: "1px solid rgba(22,163,74,0.25)" }}
            >
              <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>
                Platform fee
              </p>
              <p className="text-xl font-bold" style={{ color: "#4ade80" }}>₹0 commission</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-4 py-20 sm:px-6 lg:px-8" style={{ background: "#12140c", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold" style={{ color: "#f5f4f0" }}>
            Ready to order?
          </h2>
          <p className="mt-4 text-base" style={{ color: "rgba(245,244,240,0.55)" }}>
            Join QuickDyne as a customer, restaurant owner, or delivery partner.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/signup"
              className="rounded-xl px-8 py-3.5 text-sm font-semibold text-white"
              style={{ background: "#16a34a", border: "1.5px solid #15803d" }}
            >
              Create account
            </Link>
            <Link
              to="/login"
              className="rounded-xl px-8 py-3.5 text-sm font-medium"
              style={{ border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.75)" }}
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-4 py-10 text-center" style={{ background: "#0a0b07", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold text-white" style={{ background: "#16a34a" }}>Q</div>
          <span className="text-sm font-semibold" style={{ color: "#f5f4f0" }}>QuickDyne</span>
        </div>
        <p className="text-xs" style={{ color: "rgba(245,244,240,0.30)" }}>
          &copy; 2026 QuickDyne · Taste the perfection.
        </p>
      </footer>
    </div>
  );
}