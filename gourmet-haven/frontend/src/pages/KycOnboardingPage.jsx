import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Shell from "../components/common/Shell";
import { ImageUploader } from "../components/owner/OwnerMenuManager";
import { useAuth } from "../hooks/useAuth";
import { fetchMyKycSubmission, submitKyc } from "../services/kycService";

const EMPTY_FORM = {
  full_legal_name: "",
  date_of_birth: "",
  mobile_number: "",
  home_address: "",
  aadhaar_number: "",
  pan_number: "",
  driving_license_number: "",
  restaurant_license_number: "",
  gig_act_uid: "",
  aadhaar_doc_url: null,
  pan_doc_url: null,
  license_doc_url: null
};

export default function KycOnboardingPage() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const role = profile?.role;

  const [form, setForm] = useState(EMPTY_FORM);
  const [existingStatus, setExistingStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAny, setIsUploadingAny] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let isMounted = true;

    fetchMyKycSubmission()
      .then((existing) => {
        if (!isMounted) return;
        if (existing) {
          setExistingStatus(existing.verification_status);
          setForm((current) => ({
            ...current,
            full_legal_name: existing.full_legal_name || "",
            date_of_birth: existing.date_of_birth || "",
            mobile_number: existing.mobile_number || "",
            home_address: existing.home_address || "",
            // Masked values are never re-submitted as-is; the applicant must
            // retype identifiers on resubmission rather than have a masked
            // placeholder silently saved back as the "real" value.
            aadhaar_number: "",
            pan_number: "",
            driving_license_number: "",
            restaurant_license_number: "",
            gig_act_uid: existing.gig_act_uid || "",
            aadhaar_doc_url: existing.aadhaar_doc_url || null,
            pan_doc_url: existing.pan_doc_url || null,
            license_doc_url: existing.license_doc_url || null
          }));
        }
      })
      .catch(() => {})
      .finally(() => { if (isMounted) setLoading(false); });

    return () => { isMounted = false; };
  }, []);

  function field(key) {
    return {
      value: form[key],
      onChange: (e) => setForm((c) => ({ ...c, [key]: e.target.value }))
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setNotice("");

    if (isUploadingAny) {
      setError("Please wait for document uploads to finish.");
      return;
    }

    if (role === "delivery" && !form.driving_license_number.trim()) {
      setError("Driving license number is required for delivery partners.");
      return;
    }

    if (role === "owner" && !form.restaurant_license_number.trim()) {
      setError("Restaurant (FSSAI) license number is required for restaurant owners.");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitKyc(form);
      setNotice("Submitted! An admin will review your details before approving your account.");
      setTimeout(() => navigate(role === "owner" ? "/owner" : "/delivery"), 1800);
    } catch (err) {
      setError(err.message || "Unable to submit KYC details right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Shell title="Verify your details" subtitle="">
        <div className="card-surface p-6 text-sm" style={{ color: "var(--ink-muted)" }}>Loading...</div>
      </Shell>
    );
  }

  return (
      <Shell
    title="Verify your details"
    subtitle="We need a few details before your account can be reviewed. Aadhaar and PAN are validated and reduced to their last 4 digits before being saved — the full numbers are never stored, only verified against your uploaded documents."
    >
      {existingStatus === "rejected" && (
        <div className="card-surface p-5 text-sm" style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}>
          Your previous submission wasn't approved. Please review your details and resubmit below.
        </div>
      )}

      <form onSubmit={handleSubmit} className="card-surface grid gap-5 p-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="input-label">Full legal name</label>
          <input type="text" required placeholder="As shown on your ID" {...field("full_legal_name")} className="input" />
        </div>

        <div>
          <label className="input-label">Date of birth</label>
          <input type="date" required {...field("date_of_birth")} className="input" />
        </div>

        <div>
          <label className="input-label">Mobile number</label>
          <input type="tel" required placeholder="+91 98765 43210" {...field("mobile_number")} className="input" />
        </div>

        <div className="md:col-span-2">
          <label className="input-label">Home address</label>
          <textarea rows="2" required placeholder="Full residential address" {...field("home_address")} className="input resize-none" />
        </div>

        <div>
          <label className="input-label">Aadhaar number</label>
          <input type="text" required maxLength={12} placeholder="12-digit number" {...field("aadhaar_number")} className="input" />
        </div>

        <div>
          <label className="input-label">PAN number</label>
          <input type="text" required maxLength={10} placeholder="10-character PAN" {...field("pan_number")} className="input" style={{ textTransform: "uppercase" }} />
        </div>

        {role === "delivery" && (
          <div>
            <label className="input-label">Driving license number</label>
            <input type="text" required placeholder="DL number" {...field("driving_license_number")} className="input" />
          </div>
        )}

        {role === "owner" && (
          <div>
            <label className="input-label">Restaurant (FSSAI) license number</label>
            <input type="text" required placeholder="FSSAI license number" {...field("restaurant_license_number")} className="input" />
          </div>
        )}

        <div>
          <label className="input-label">
            Gig Act UID <span style={{ color: "var(--ink-muted)" }}>(must register)</span>
          </label>
          <input type="text" placeholder="Gig worker welfare UID" {...field("gig_act_uid")} className="input" />
        </div>

        <div className="md:col-span-2 grid gap-4 md:grid-cols-3">
          <ImageUploader
            label="Aadhaar photo/PDF"
            existingUrl={form.aadhaar_doc_url}
            onUpload={(url) => setForm((c) => ({ ...c, aadhaar_doc_url: url }))}
            onUploadingChange={setIsUploadingAny}
            folder="kyc"
          />
          <ImageUploader
            label="PAN photo/PDF"
            existingUrl={form.pan_doc_url}
            onUpload={(url) => setForm((c) => ({ ...c, pan_doc_url: url }))}
            onUploadingChange={setIsUploadingAny}
            folder="kyc"
          />
          <ImageUploader
            label={role === "owner" ? "FSSAI license photo/PDF" : "Driving license photo/PDF"}
            existingUrl={form.license_doc_url}
            onUpload={(url) => setForm((c) => ({ ...c, license_doc_url: url }))}
            onUploadingChange={setIsUploadingAny}
            folder="kyc"
          />
        </div>

        {error && (
          <div className="md:col-span-2 rounded-xl px-4 py-3 text-sm" style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}>
            {error}
          </div>
        )}
        {notice && (
          <div className="md:col-span-2 rounded-xl px-4 py-3 text-sm" style={{ background: "var(--brand-lightest)", border: "1px solid var(--brand-lighter)", color: "var(--brand-dark)" }}>
            {notice}
          </div>
        )}

        <div className="md:col-span-2 flex flex-wrap gap-3">
          <button type="submit" disabled={isSubmitting || isUploadingAny} className="btn-primary">
            {isSubmitting ? "Submitting..." : "Submit for review"}
          </button>
          <button type="button" onClick={signOut} className="btn-secondary">
            Sign out
          </button>
        </div>
      </form>
    </Shell>
  );
}