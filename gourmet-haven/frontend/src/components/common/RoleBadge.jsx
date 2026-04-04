const ROLE_STYLES = {
  customer: "bg-[#e8f9eb] text-[#01de1a]",
  owner: "bg-[#01de1a] text-white",
  delivery: "bg-sky-100 text-sky-700"
};

export default function RoleBadge({ role = "customer" }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${
        ROLE_STYLES[role] || ROLE_STYLES.customer
      }`}
    >
      {role}
    </span>
  );
}
