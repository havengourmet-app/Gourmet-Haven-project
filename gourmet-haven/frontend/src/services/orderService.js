import { apiRequest } from "./apiClient";

export function listCustomerOrders() {
  return apiRequest("/orders/customer");
}

export function listOwnerOrders() {
  return apiRequest("/orders/owner");
}

export function listDeliveryOrders() {
  return apiRequest("/orders/delivery");
}

export function createOrder(payload) {
  return apiRequest("/orders", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateOrderStatus(orderId, payload) {
  return apiRequest(`/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}
