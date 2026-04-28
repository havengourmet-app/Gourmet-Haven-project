const ORDER_STEPS = [
  "pending",
  "accepted",
  "preparing",
  "picked_up",
  "on_the_way",
  "delivered"
];

const STATUS_LABELS = {
  pending: "Pending",
  accepted: "Accepted",
  preparing: "Preparing",
  picked_up: "Picked up",
  on_the_way: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled"
};

export default function OrderStatusStepper({ currentStatus = "pending" }) {
  if (currentStatus === "cancelled") {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
        This order was cancelled.
      </div>
    );
  }

  const currentIndex = ORDER_STEPS.indexOf(currentStatus);

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      {ORDER_STEPS.map((step, index) => {
        const isCompleted = currentIndex > index;
        const isCurrent = currentIndex === index;
        const circleClass = isCompleted
          ? "bg-[#01de1a] text-black"
          : isCurrent
            ? "bg-[#01de1a] text-black ring-4 ring-[#01de1a]/20"
            : "bg-slate-200 text-slate-500";

        return (
          <div key={step} className="flex items-center gap-3 md:flex-1 md:flex-col md:items-center md:text-center">
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold ${circleClass}`}>
              {index + 1}
            </div>
            <div className="min-w-0">
              <p className={`text-sm font-medium ${isCurrent || isCompleted ? "text-[#1a1a1a]" : "text-slate-500"}`}>
                {STATUS_LABELS[step]}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
