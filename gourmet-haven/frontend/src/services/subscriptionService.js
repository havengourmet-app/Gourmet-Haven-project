import { apiRequest } from "./apiClient";

export async function getSubscriptionStatus() {
  const response = await apiRequest("/subscriptions/me");
  return response?.data || response;
}

export async function createSubscriptionCheckout(payload) {
  const response = await apiRequest("/subscriptions/checkout", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  return response?.data || response;
}

export async function verifySubscription(payload) {
  const response = await apiRequest("/subscriptions/verify", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  return response?.data || response;
}
