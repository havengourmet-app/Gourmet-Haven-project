import Shell from "../components/common/Shell";
import StatCard from "../components/common/StatCard";
import OwnerMenuManager from "../components/owner/OwnerMenuManager";
import SubscriptionBanner from "../components/owner/SubscriptionBanner";

const SUBSCRIPTION = {
  planName: "Growth - Hyderabad",
  status: "Active via Razorpay subscription"
};

const MENU_ITEMS = [
  {
    id: "b81bbd1e-873b-4d68-b778-f4b9f877cdf8",
    name: "Hyderabadi Chicken Biryani",
    category: "Mains",
    pricePaise: 32900,
    isAvailable: true
  },
  {
    id: "47da34ec-fa1e-4b95-a0a2-af9c90ed6a31",
    name: "Paneer Tikka Wrap",
    category: "Quick bites",
    pricePaise: 18900,
    isAvailable: true
  },
  {
    id: "4fd3ca3d-b84b-4a4e-a8f7-801717c4fe26",
    name: "Saffron Falooda",
    category: "Desserts",
    pricePaise: 12900,
    isAvailable: false
  }
];

export default function OwnerDashboardPage() {
  return (
    <Shell
      title="Owner command center"
      subtitle="Track subscription health, keep menus fresh, and stay close to live demand without commission leakage."
      actions={
        <button
          type="button"
          className="rounded-xl bg-[#01de1a] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#00ff1e]"
        >
          Manage subscription
        </button>
      }
    >
      <SubscriptionBanner subscription={SUBSCRIPTION} />

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Gross sales" value="Rs 1,84,320" hint="Stored as paise in the database" />
        <StatCard label="Orders today" value="42" hint="Realtime feed will come from Supabase Realtime" />
        <StatCard label="Active menu items" value="18" hint="Cloudinary-backed images plug into menu management" />
        <StatCard label="Cancellation rate" value="1.8%" hint="Delivery coordination remains visible to owners" />
      </section>

      <OwnerMenuManager items={MENU_ITEMS} />
    </Shell>
  );
}
