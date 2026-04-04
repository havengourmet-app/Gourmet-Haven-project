import { apiRequest } from "./apiClient";

export function getSubscriptionStatus() {
  return apiRequest("/subscriptions/me");
}

export function createSubscriptionCheckout(payload) {
  return apiRequest("/subscriptions/checkout", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function verifySubscription(payload) {
  return apiRequest("/subscriptions/verify", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
