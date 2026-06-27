import { useEffect, useState } from "react";
import Shell from "../components/common/Shell";
import StatCard from "../components/common/StatCard";
import { formatOrderDate } from "../lib/orderPresentation";
import { approveAccount, fetchAllAccounts, fetchPendingAccounts, rejectAccount } from "../services/adminService";
import { revealKycField } from "../services/kycService";

// Aadhaar/PAN are intentionally absent here — only their last 4 characters
// are ever stored (see migration 0012), so there's nothing to reveal. They're
// shown directly from kyc.aadhaar_last4 / kyc.pan_last4 below instead.
const REVEALABLE_FIELDS = [
  { key: "driving_license_number", label: "Driving license" },
  { key: "restaurant_license_number", label: "FSSAI license" },
  { key: "gig_act_uid", label: "Gig Act UID" }
];

function statusBadgeClass(status) {
  if (status === "approved") return "badge-green";
  if (status === "rejected") return "badge-red";
  return "badge-amber";
}

function KycDetailPanel({ account }) {
  const kyc = account.kyc;
  const [revealed, setRevealed] = useState({});
  const [revealingField, setRevealingField] = useState(null);
  const [revealError, setRevealError] = useState("");

  if (!kyc) {
    return (
      <div className="mt-3 rounded-xl px-4 py-3 text-sm" style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}>
        No KYC details submitted yet — this account cannot be approved until they submit the onboarding form.
      </div>
    );
  }

  async function handleReveal(fieldKey) {
    setRevealingField(fieldKey);
    setRevealError("");
    try {
      const result = await revealKycField(account.id, fieldKey);
      setRevealed((prev) => ({ ...prev, [fieldKey]: result.value }));
    } catch (err) {
      setRevealError(err.message || "Unable to reveal this field.");
    } finally {
      setRevealingField(null);
    }
  }

  return (
    <div className="mt-3 rounded-xl p-4 text-sm space-y-3" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
      <div className="grid gap-2 sm:grid-cols-2">
        <p><strong style={{ color: "var(--ink)" }}>Legal name:</strong> {kyc.full_legal_name}</p>
        <p><strong style={{ color: "var(--ink)" }}>DOB:</strong> {kyc.date_of_birth}</p>
        <p><strong style={{ color: "var(--ink)" }}>Mobile:</strong> {kyc.mobile_number}</p>
        <p className="sm:col-span-2"><strong style={{ color: "var(--ink)" }}>Address:</strong> {kyc.home_address}</p>
      </div>

      {/* Aadhaar/PAN: last 4 only, always — full number was never stored.
          Verify the full number against the uploaded document below. */}
      <div className="border-t pt-3 grid gap-2 sm:grid-cols-2" style={{ borderColor: "var(--border)" }}>
        <p>
          <strong style={{ color: "var(--ink)" }}>Aadhaar:</strong>{" "}
          <span className="font-mono">{kyc.aadhaar_last4}</span>
        </p>
        <p>
          <strong style={{ color: "var(--ink)" }}>PAN:</strong>{" "}
          <span className="font-mono">{kyc.pan_last4}</span>
        </p>
      </div>

      <div className="border-t pt-3 space-y-2" style={{ borderColor: "var(--border)" }}>
        {REVEALABLE_FIELDS.filter(({ key }) => kyc[key]).map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between gap-3">
            <span style={{ color: "var(--ink-secondary)" }}>
              <strong style={{ color: "var(--ink)" }}>{label}:</strong>{" "}
              <span className="font-mono">{revealed[key] ?? kyc[key]}</span>
            </span>
            {!revealed[key] && (
              <button
                type="button"
                disabled={revealingField === key}
                onClick={() => handleReveal(key)}
                className="btn-secondary text-xs py-1 px-2.5"
              >
                {revealingField === key ? "Revealing..." : "Reveal"}
              </button>
            )}
          </div>
        ))}
      </div>

      {(kyc.aadhaar_doc_url || kyc.pan_doc_url || kyc.license_doc_url) && (
        <div className="border-t pt-3 flex flex-wrap gap-3" style={{ borderColor: "var(--border)" }}>
          {kyc.aadhaar_doc_url && <a href={kyc.aadhaar_doc_url} target="_blank" rel="noreferrer" className="text-xs font-semibold" style={{ color: "var(--brand)" }}>View Aadhaar doc →</a>}
          {kyc.pan_doc_url && <a href={kyc.pan_doc_url} target="_blank" rel="noreferrer" className="text-xs font-semibold" style={{ color: "var(--brand)" }}>View PAN doc →</a>}
          {kyc.license_doc_url && <a href={kyc.license_doc_url} target="_blank" rel="noreferrer" className="text-xs font-semibold" style={{ color: "var(--brand)" }}>View license doc →</a>}
        </div>
      )}

      {revealError && (
        <p className="text-xs" style={{ color: "#991b1b" }}>{revealError}</p>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [pending, setPending] = useState([]);
  const [allAccounts, setAllAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      try {
        const [pendingAccounts, all] = await Promise.all([fetchPendingAccounts(), fetchAllAccounts()]);
        if (!isMounted) return;
        setPending(Array.isArray(pendingAccounts) ? pendingAccounts : []);
        setAllAccounts(Array.isArray(all) ? all : []);
      } catch (err) {
        if (isMounted) setFeedback(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => { isMounted = false; };
  }, [refreshToken]);

  async function handleDecision(profileId, decisionFn, successLabel) {
    setBusyId(profileId);
    setFeedback("");
    try {
      await decisionFn(profileId);
      setFeedback(successLabel);
      setRefreshToken((v) => v + 1);
    } catch (err) {
      setFeedback(err.message);
    } finally {
      setBusyId(null);
    }
  }

  const decidedAccounts = allAccounts.filter((a) => a.approval_status !== "pending");

  return (
    <Shell
      title="Account approvals"
      subtitle="Review new owner and delivery sign-ups before they get dashboard access."
    >
      <section className="grid gap-4 md:grid-cols-2">
        <StatCard label="Pending review" value={String(pending.length)} hint="Owner/delivery sign-ups waiting on you." accent />
        <StatCard label="Decided accounts" value={String(decidedAccounts.length)} hint="Already approved or rejected." />
      </section>

      {feedback && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "var(--brand-lightest)", border: "1px solid var(--brand-lighter)", color: "var(--brand-dark)" }}>
          {feedback}
        </div>
      )}

      <section className="space-y-4">
        <h2 className="section-title">Pending approvals</h2>
        {loading ? (
          <div className="card-surface p-6 text-sm" style={{ color: "var(--ink-muted)" }}>Loading...</div>
        ) : pending.length === 0 ? (
          <div className="card-surface p-8 text-center">
            <p className="text-3xl">✅</p>
            <p className="mt-3 font-semibold" style={{ color: "var(--ink)" }}>Nothing waiting on you</p>
            <p className="mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>New owner/delivery sign-ups will show up here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((account) => (
              <article key={account.id} className="card-surface p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold" style={{ color: "var(--ink)" }}>{account.full_name || "Unnamed account"}</p>
                    <p className="mt-0.5 text-sm" style={{ color: "var(--ink-muted)" }}>
                      Applying as <strong>{account.role}</strong> · {formatOrderDate(account.created_at)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setExpandedId((c) => (c === account.id ? null : account.id))}
                      className="btn-secondary text-sm"
                    >
                      {expandedId === account.id ? "Hide details" : "View KYC details"}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === account.id}
                      onClick={() => handleDecision(account.id, approveAccount, `${account.full_name || "Account"} approved.`)}
                      className="btn-primary text-sm"
                    >
                      {busyId === account.id ? "Working..." : "Approve"}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === account.id}
                      onClick={() => handleDecision(account.id, rejectAccount, `${account.full_name || "Account"} rejected.`)}
                      className="btn-danger text-sm"
                    >
                      Reject
                    </button>
                  </div>
                </div>

                {expandedId === account.id && <KycDetailPanel account={account} />}
              </article>
            ))}
          </div>
        )}
      </section>

      {decidedAccounts.length > 0 && (
        <section className="space-y-4">
          <h2 className="section-title">Decision history</h2>
          <div className="space-y-2">
            {decidedAccounts.map((account) => (
              <div key={account.id} className="card-surface flex items-center justify-between p-4">
                <div>
                  <p className="font-medium" style={{ color: "var(--ink)" }}>{account.full_name || "Unnamed account"}</p>
                  <p className="text-xs" style={{ color: "var(--ink-muted)" }}>{account.role} · {formatOrderDate(account.created_at)}</p>
                </div>
                <span className={`badge ${statusBadgeClass(account.approval_status)}`}>{account.approval_status}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </Shell>
  );
}