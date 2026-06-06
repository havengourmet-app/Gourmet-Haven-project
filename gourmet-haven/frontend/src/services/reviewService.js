import { apiRequest } from "./apiClient";

export async function submitReview({ orderId, restaurantId, rating, comment }) {
  const response = await apiRequest("/reviews", {
    method: "POST",
    body: JSON.stringify({ orderId, restaurantId, rating, comment })
  });
  return response?.data || response;
}

export async function fetchOrderReview(orderId) {
  const response = await apiRequest(`/reviews/order/${orderId}`);
  return response?.data || null;
}

export async function fetchRestaurantReviews(restaurantId) {
  const response = await apiRequest(`/reviews/restaurant/${restaurantId}`);
  return response?.data || [];
}