import { Link } from "react-router-dom";
import { legacyAssets } from "../lib/legacyAssets";

const FEATURES = [
  {
    title: "Zero commission marketplace",
    description: "We keep the owner side subscription-based so restaurants do not bleed revenue on every order.",
    image: legacyAssets.featureFresh
  },
  {
    title: "Farm fresh quality",
    description: "The original QuickDyne tone stays intact: fresh ingredients, premium presentation, and fast delivery.",
    image: legacyAssets.featureChef
  },
  {
    title: "Realtime experiences",
    description: "Customers, owners, and delivery partners stay synced through Supabase-powered live order updates.",
    image: legacyAssets.featureDelivery
  }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0f1115] text-white">
      <header className="fixed inset-x-0 top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div className="text-2xl font-bold tracking-wide text-[#01de1a]">QuickDyne</div>
          <div className="hidden items-center gap-4 md:flex">
            <Link
              to="/login"
              className="rounded-full border border-white px-5 py-2 text-sm font-medium text-white transition hover:border-[#01de1a] hover:text-[#01de1a]"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="rounded-full bg-[#01de1a] px-5 py-2 text-sm font-semibold text-black transition hover:bg-[#00ff1e]"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden text-center">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
          src={legacyAssets.heroVideo}
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 pt-24">
          <h1 className="text-4xl font-bold leading-tight sm:text-6xl">
            Experience the <span className="text-[#01de1a]">Future</span> of Dining
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-200">
            Fresh ingredients, expert chefs, and a zero-commission platform model that keeps Hyderabad restaurants
            healthy while delivering great food fast.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/signup"
              className="rounded-full bg-[#01de1a] px-8 py-3 text-sm font-semibold text-black transition hover:bg-[#00ff1e]"
            >
              Order Now
            </Link>
            <a
              href="#features"
              className="rounded-full border-2 border-white px-8 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-black"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      <section id="features" className="bg-[#15181e] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center text-4xl font-semibold text-white">Why Choose Us?</h2>
          <div className="mt-14 grid gap-8 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <article
                key={feature.title}
                className="overflow-hidden rounded-[1.25rem] border border-white/10 bg-white/5 transition hover:-translate-y-1 hover:border-[#01de1a]"
              >
                <img src={feature.image} alt={feature.title} className="h-56 w-full object-cover" />
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-[#01de1a]">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{feature.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0f1115] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="text-4xl font-semibold text-white">A Culinary Journey</h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
              QuickDyne keeps the rich, premium feel of the original project while moving the platform to React,
              Express, Supabase, Razorpay, and Cloudinary. The product direction changes, but the brand mood stays the same.
            </p>
            <Link
              to="/signup"
              className="mt-8 inline-flex rounded-full bg-[#01de1a] px-8 py-3 text-sm font-semibold text-black transition hover:bg-[#00ff1e]"
            >
              Explore Menu
            </Link>
          </div>
          <div>
            <img
              src={legacyAssets.showcase}
              alt="Showcase Dish"
              className="w-full rounded-[1.5rem] shadow-[20px_20px_0px_rgba(1,222,26,0.2)]"
            />
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 bg-[#0a0b0e] px-4 py-12 text-center sm:px-6 lg:px-8">
        <h3 className="text-2xl font-semibold text-[#01de1a]">QuickDyne</h3>
        <p className="mt-2 text-slate-400">Taste the perfection.</p>
        <p className="mt-6 text-sm text-slate-500">&copy; 2026 QuickDyne. All rights reserved.</p>
      </footer>
    </div>
  );
}
