import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useUiStore } from "../../store/uiStore";
import RoleBadge from "./RoleBadge";

const BASE_NAV_BY_ROLE = {
  customer: [
    { label: "Discover", to: "/customer" },
    { label: "Profile", to: "/profile" }
  ],
  owner: [
    { label: "Overview", to: "/owner" },
    { label: "Profile", to: "/profile" }
  ],
  delivery: [
    { label: "Dispatch", to: "/delivery" },
    { label: "Profile", to: "/profile" }
  ],
  admin: [
    { label: "Approvals", to: "/admin" },
    { label: "Profile", to: "/profile" }
  ]
};

const APPROVAL_GATED_ROLES = new Set(["owner", "delivery"]);

function buildNavItems(role, approvalStatus) {
  const base = BASE_NAV_BY_ROLE[role] || BASE_NAV_BY_ROLE.customer;

  // Fixes the resubmission dead-end: a pending/rejected owner or delivery
  // account otherwise has no persistent way back to the KYC form once
  // they've navigated away from the one-time AccountStatusNotice screen.
  if (APPROVAL_GATED_ROLES.has(role) && approvalStatus && approvalStatus !== "approved") {
    return [...base, { label: "Verification", to: "/onboarding/kyc" }];
  }

  return base;
}

export default function Shell({ children, title, subtitle, actions }) {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const activeCity = useUiStore((state) => state.activeCity);
  const role = profile?.role || "customer";
  const navItems = buildNavItems(role, profile?.approval_status);

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--surface)" }}>

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-40"
        style={{
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border)"
        }}
      >
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">

          {/* Top row */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2">
                {/* Logo mark */}
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white text-sm font-bold"
                  style={{ background: "var(--brand)" }}
                >
                  Q
                </div>
                <span
                  className="text-xl font-bold tracking-tight hidden sm:block"
                  style={{ color: "var(--ink)" }}
                >
                  QuickDyne
                </span>
              </Link>
              <RoleBadge role={role} />
            </div>

            <div className="flex items-center gap-2">
              <span
                className="hidden rounded-lg px-3 py-1.5 text-xs font-medium sm:inline-flex items-center gap-1"
                style={{ background: "var(--muted)", color: "var(--ink-secondary)", border: "1px solid var(--border)" }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-60">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                  <circle cx="12" cy="9" r="2.5"/>
                </svg>
                {activeCity}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                Sign out
              </button>
            </div>
          </div>

          {/* Nav row */}
          <nav className="flex flex-wrap gap-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `nav-pill text-sm ${isActive ? "nav-pill-active" : ""}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="page-shell">
        {(title || subtitle || actions) && (
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              {title && (
                <>
                  <p className="label-xs mb-2">Hyderabad-first food platform</p>
                  <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--ink)" }}>
                    {title}
                  </h1>
                </>
              )}
              {subtitle && (
                <p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: "var(--ink-secondary)" }}>
                  {subtitle}
                </p>
              )}
            </div>
            {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
          </div>
        )}

        {children}
      </main>
    </div>
  );
}