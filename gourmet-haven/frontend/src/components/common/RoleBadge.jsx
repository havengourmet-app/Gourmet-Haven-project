const ROLE_STYLES = {
  customer: "role-customer",
  owner: "role-owner",
  delivery: "role-delivery"
};

export default function RoleBadge({ role = "customer" }) {
  return (
    <span className={`badge ${ROLE_STYLES[role] || "role-customer"}`}>
      {role}
    </span>
  );
}