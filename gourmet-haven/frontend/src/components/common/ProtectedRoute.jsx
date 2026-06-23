import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { fetchMyKycSubmission } from "../../services/kycService";

const APPROVAL_GATED_ROLES = new Set(["owner", "delivery"]);

function AccountStatusNotice({ status }) {
  const { signOut } = useAuth();
  const isRejected = status === "rejected";

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "var(--surface)" }}>
      <div className="card-surface max-w-md p-8 text-center">
        <p className="text-3xl">{isRejected ? "🚫" : "⏳"}</p>
        <h1 className="mt-4 text-xl font-semibold" style={{ color: "var(--ink)" }}>
          {isRejected ? "Account not approved" : "Approval pending"}
        </h1>
        <p className="mt-3 text-sm leading-6" style={{ color: "var(--ink-secondary)" }}>
          {isRejected
            ? "Your application for this account type wasn't approved. If you think this is a mistake, please contact support."
            : "Thanks for submitting your details! Your account is waiting for admin review before you can access this dashboard. This usually doesn't take long — check back soon."}
        </p>
        <button type="button" onClick={signOut} className="btn-secondary mt-6">
          Sign out
        </button>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa] text-sm text-slate-600">
      Loading QuickDyne...
    </div>
  );
}

export default function ProtectedRoute({ children, allowedRoles, requireApproved = false }) {
  const { isReady, session, profile, defaultRouteForRole } = useAuth();
  const [kycChecked, setKycChecked] = useState(false);
  const [hasKyc, setHasKyc] = useState(true);

  const role = profile?.role;
  const needsKycCheck = requireApproved && APPROVAL_GATED_ROLES.has(role);

  useEffect(() => {
    if (!needsKycCheck) {
      setKycChecked(true);
      return;
    }

    let isMounted = true;
    setKycChecked(false);

    fetchMyKycSubmission()
      .then((submission) => {
        if (!isMounted) return;
        setHasKyc(Boolean(submission));
      })
      .catch(() => {
        if (isMounted) setHasKyc(false);
      })
      .finally(() => {
        if (isMounted) setKycChecked(true);
      });

    return () => { isMounted = false; };
  }, [needsKycCheck, role]);

  if (!isReady) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(profile?.role)) {
    return <Navigate to={defaultRouteForRole()} replace />;
  }

  if (needsKycCheck) {
    if (!kycChecked) {
      return <LoadingScreen />;
    }

    if (!hasKyc) {
      return <Navigate to="/onboarding/kyc" replace />;
    }
  }

  if (
    requireApproved &&
    APPROVAL_GATED_ROLES.has(profile?.role) &&
    profile?.approval_status &&
    profile.approval_status !== "approved"
  ) {
    return <AccountStatusNotice status={profile.approval_status} />;
  }

  return children;
}