export default function SubscriptionBanner({ subscription }) {
  return (
    <div className="card-surface flex flex-col gap-4 overflow-hidden bg-gradient-to-r from-[#01de1a] to-[#00b514] p-6 text-white lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-white/80">Zero commission model</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Subscription-led growth for restaurant owners</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/90">
          Owners pay a fixed platform subscription instead of per-order commission. This keeps margins predictable
          while still unlocking delivery, analytics, live order updates, and image management.
        </p>
      </div>
      <div className="rounded-3xl bg-white/15 px-5 py-4 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.24em] text-white/70">Current plan</p>
        <p className="mt-2 text-2xl font-semibold text-white">{subscription.planName}</p>
        <p className="mt-1 text-sm text-white/90">{subscription.status}</p>
      </div>
    </div>
  );
}
