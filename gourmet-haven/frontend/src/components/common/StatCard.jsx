export default function StatCard({ label, value, hint, accent = false }) {
  return (
    <div
      className="stat-card relative overflow-hidden"
      style={accent ? { borderLeft: "3px solid var(--brand)" } : {}}
    >
      {accent && (
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ background: "var(--brand)" }}
        />
      )}
      <p
        className="text-xs font-medium uppercase tracking-widest"
        style={{ color: "var(--ink-muted)", letterSpacing: "0.10em" }}
      >
        {label}
      </p>
      <p
        className="mt-3 text-3xl font-semibold tracking-tight"
        style={{ color: "var(--ink)" }}
      >
        {value}
      </p>
      {hint && (
        <p className="mt-1.5 text-xs leading-5" style={{ color: "var(--ink-muted)" }}>
          {hint}
        </p>
      )}
    </div>
  );
}