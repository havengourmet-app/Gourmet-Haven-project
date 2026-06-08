import { formatOrderStatus, getOrderStatusStyle } from "../../lib/orderPresentation";

export default function OrderStatusBadge({ status = "pending" }) {
  return (
    <span className={`badge ${getOrderStatusStyle(status)}`}>
      {formatOrderStatus(status)}
    </span>
  );
}