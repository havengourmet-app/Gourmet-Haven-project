import { apiRequest } from "./apiClient";

export async function listCustomerOrders() {
  const response = await apiRequest("/orders/customer");
  return response?.data || response;
}

export async function listOwnerOrders() {
  const response = await apiRequest("/orders/owner");
  return response?.data || response;
}

export async function listDeliveryOrders() {
  const response = await apiRequest("/orders/delivery");
  return response?.data || response;
}

export async function createOrder(payload) {
  const response = await apiRequest("/orders", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  return response?.data || response;
}

export async function updateOrderStatus(orderId, payload) {
  const response = await apiRequest(`/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });

  return response?.data || response;
}
