import { apiRequest } from "./apiClient";

export async function submitReview({ orderId, restaurantId, rating, comment }) {
  const response = await apiRequest("/reviews", {
    method: "POST",
    body: JSON.stringify({ orderId, restaurantId, rating, comment })
  });
  return response?.data ?? response;
}

export async function fetchOrderReview(orderId) {
  try {
    const response = await apiRequest(`/reviews/order/${orderId}`);
    // Returns { success: true, data: review | null }
    return response?.data ?? null;
  } catch {
    // A 403/404 means no review yet or not customer role — treat as no review
    return null;
  }
}

export async function fetchRestaurantReviews(restaurantId) {
  try {
    const response = await apiRequest(`/reviews/restaurant/${restaurantId}`);
    return Array.isArray(response?.data) ? response.data : [];
  } catch {
    return [];
  }
}