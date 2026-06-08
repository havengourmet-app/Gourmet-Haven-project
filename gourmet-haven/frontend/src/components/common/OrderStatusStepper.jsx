const ORDER_STEPS = [
  "pending",
  "accepted",
  "preparing",
  "picked_up",
  "on_the_way",
  "delivered"
];

const STATUS_LABELS = {
  pending: "Placed",
  accepted: "Accepted",
  preparing: "Preparing",
  picked_up: "Picked up",
  on_the_way: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled"
};

const STATUS_ICONS = {
  pending: "🕐",
  accepted: "✓",
  preparing: "👨‍🍳",
  picked_up: "📦",
  on_the_way: "🛵",
  delivered: "✓"
};

export default function OrderStatusStepper({ currentStatus = "pending" }) {
  if (currentStatus === "cancelled") {
    return (
      <div
        className="rounded-2xl px-5 py-4 text-sm"
        style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}
      >
        This order was cancelled.
      </div>
    );
  }

  const currentIndex = ORDER_STEPS.indexOf(currentStatus);

  return (
    <div className="relative">
      {/* Connector line */}
      <div
        className="absolute left-5 top-5 h-0.5 hidden md:block"
        style={{
          width: "calc(100% - 2.5rem)",
          background: "var(--border)"
        }}
      />

      <div className="relative flex flex-col gap-4 md:flex-row md:justify-between">
        {ORDER_STEPS.map((step, index) => {
          const isCompleted = currentIndex > index;
          const isCurrent = currentIndex === index;

          return (
            <div
              key={step}
              className="flex items-center gap-3 md:flex-1 md:flex-col md:items-center md:text-center"
            >
              {/* Circle */}
              <div
                className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300"
                style={
                  isCompleted
                    ? { background: "var(--brand)", color: "#fff", boxShadow: "0 0 0 4px var(--brand-lightest)" }
                    : isCurrent
                    ? { background: "var(--brand-lightest)", color: "var(--brand-dark)", border: "2px solid var(--brand)", boxShadow: "0 0 0 4px var(--brand-lightest)" }
                    : { background: "var(--muted)", color: "var(--ink-muted)", border: "1px solid var(--border)" }
                }
              >
                {isCompleted ? "✓" : STATUS_ICONS[step] || index + 1}
              </div>

              {/* Label */}
              <div className="min-w-0">
                <p
                  className="text-xs font-semibold"
                  style={{
                    color: isCurrent || isCompleted ? "var(--ink)" : "var(--ink-muted)"
                  }}
                >
                  {STATUS_LABELS[step]}
                </p>
                {isCurrent && (
                  <p className="mt-0.5 text-xs" style={{ color: "var(--brand)" }}>
                    Current
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}