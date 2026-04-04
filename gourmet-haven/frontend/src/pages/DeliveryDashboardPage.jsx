import Shell from "../components/common/Shell";
import StatCard from "../components/common/StatCard";

const ACTIVE_DELIVERIES = [
  {
    id: "4d41ce61-6b72-457e-bc7a-19e540468fb8",
    restaurant: "Paradise Signature",
    customerArea: "Jubilee Hills",
    eta: "14 mins"
  },
  {
    id: "fbb69355-936a-4680-8cc1-c4d9610e8d3e",
    restaurant: "Banjara Bakehouse",
    customerArea: "Madhapur",
    eta: "19 mins"
  }
];

export default function DeliveryDashboardPage() {
  return (
    <Shell
      title="Delivery dispatch"
      subtitle="Track assigned orders, pickup timing, and customer drop-offs from a delivery-first workflow."
    >
      <section className="grid gap-5 md:grid-cols-3">
        <StatCard label="Assigned today" value="16" hint="Supabase Realtime will push new assignments here." />
        <StatCard label="Average pickup" value="8 mins" hint="Use this to monitor restaurant readiness." />
        <StatCard label="Completed trips" value="11" hint="Linked to order status updates in the backend." />
      </section>

      <section className="card-surface p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-[#01de1a]">Active drops</p>
        <div className="mt-5 space-y-4">
          {ACTIVE_DELIVERIES.map((delivery) => (
            <div
              key={delivery.id}
              className="flex flex-col gap-3 rounded-2xl bg-[#f8f9fa] p-4 lg:flex-row lg:items-center lg:justify-between"
            >
              <div>
                <h3 className="font-semibold text-[#1a1a1a]">{delivery.restaurant}</h3>
                <p className="mt-1 text-sm text-slate-500">Drop area: {delivery.customerArea}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-[#e8f9eb] px-3 py-1 text-sm text-[#01de1a]">ETA {delivery.eta}</span>
                <button
                  type="button"
                  className="rounded-xl border border-black/10 px-4 py-2 text-sm text-slate-600 hover:border-[#01de1a] hover:text-[#01de1a]"
                >
                  Mark picked up
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </Shell>
  );
}
