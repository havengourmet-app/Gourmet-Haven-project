export default function SubscriptionBanner({ subscription }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 text-white"
      style={{ background: "linear-gradient(135deg, #14532d 0%, #15803d 50%, #16a34a 100%)" }}
    >
      {/* Subtle texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 40%)"
        }}
      />

      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
            Zero commission model
          </p>
          <h2 className="mt-2 text-xl font-bold text-white">
            Subscription-led growth for restaurant owners
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/75">
            Pay a fixed monthly subscription instead of per-order commission. Predictable margins,
            full delivery access, live order updates, and analytics included.
          </p>
        </div>

        <div
          className="flex-shrink-0 rounded-xl px-5 py-4"
          style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)" }}
        >
          <p className="text-xs font-medium uppercase tracking-widest text-white/60">
            Current plan
          </p>
          <p className="mt-1.5 text-xl font-bold text-white">{subscription.planName}</p>
          <div className="mt-1 flex items-center gap-1.5">
            <div
              className="h-2 w-2 rounded-full"
              style={{
                background: subscription.status === "active" || subscription.status === "Active"
                  ? "#4ade80"
                  : "#fbbf24"
              }}
            />
            <p className="text-sm capitalize text-white/80">{subscription.status}</p>
          </div>
        </div>
      </div>
    </div>
  );
}