import Shell from "../components/common/Shell";
import RoleBadge from "../components/common/RoleBadge";
import { useAuth } from "../hooks/useAuth";
import { legacyAssets } from "../lib/legacyAssets";

export default function ProfilePage() {
  const { user, profile } = useAuth();

  return (
    <Shell
      title="Profile"
      subtitle="Profiles are stored in Supabase with UUID primary keys and RLS. This page keeps the warmer personal feel of the original profile screen while moving onto the new stack."
    >
      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="card-surface p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-[#01de1a]">Account identity</p>
          <div className="mt-4 flex items-center gap-4">
            <img src={legacyAssets.avatar} alt="Profile avatar" className="h-20 w-20 rounded-full object-cover" />
            <div>
              <h2 className="text-2xl font-semibold text-[#1a1a1a]">{profile?.full_name || "Gourmet Haven User"}</h2>
              <div className="mt-3">
                <RoleBadge role={profile?.role || "customer"} />
              </div>
            </div>
          </div>
          <dl className="mt-6 space-y-4 text-sm text-slate-500">
            <div>
              <dt className="text-slate-400">Email</dt>
              <dd className="mt-1 text-[#1a1a1a]">{user?.email || "No email available"}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Phone</dt>
              <dd className="mt-1 text-[#1a1a1a]">{profile?.phone || "Add phone number in the next task"}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Profile UUID</dt>
              <dd className="mt-1 break-all text-[#1a1a1a]">{profile?.id || user?.id || "Pending session"}</dd>
            </div>
          </dl>
        </div>

        <div className="card-surface p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Platform model</p>
          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-500">
            <p>Customers store addresses and place orders against restaurants and menu items.</p>
            <p>Owners manage restaurant records, menu items, and subscription state through Razorpay.</p>
            <p>Delivery partners receive assigned orders and update delivery status in realtime.</p>
          </div>
        </div>
      </section>
    </Shell>
  );
}
