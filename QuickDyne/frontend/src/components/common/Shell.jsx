import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useUiStore } from "../../store/uiStore";
import RoleBadge from "./RoleBadge";

const NAV_BY_ROLE = {
  customer: [
    { label: "Discover", to: "/customer" },
    { label: "Orders", to: "/orders" },
    { label: "Profile", to: "/profile" }
  ],
  owner: [
    { label: "Overview", to: "/owner" },
    { label: "Profile", to: "/profile" }
  ],
  delivery: [
    { label: "Dispatch", to: "/delivery" },
    { label: "Profile", to: "/profile" }
  ]
};

export default function Shell({ children, title, subtitle, actions }) {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const activeCity = useUiStore((state) => state.activeCity);
  const role = profile?.role || "customer";
  const navItems = NAV_BY_ROLE[role] || NAV_BY_ROLE.customer;

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#1a1a1a]">
      <header className="sticky top-0 z-40 border-b border-black/5 bg-white/95 backdrop-blur">
        <div className="page-shell gap-4 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="text-2xl font-bold tracking-wide text-[#01de1a]"
              >
                QuickDyne
              </Link>
              <RoleBadge role={role} />
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <span className="rounded-full bg-[#f8f9fa] px-3 py-1">City: {activeCity}</span>
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-[#1a1a1a] transition hover:border-[#01de1a] hover:text-[#01de1a]"
              >
                Sign out
              </button>
            </div>
          </div>

          <nav className="flex flex-wrap gap-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-[#01de1a] text-black"
                      : "border border-black/10 text-slate-600 hover:border-[#01de1a] hover:text-[#01de1a]"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="page-shell">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#01de1a]">Hyderabad-first food platform</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#1a1a1a]">{title}</h1>
            {subtitle ? <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        </div>

        {children}
      </main>
    </div>
  );
}
