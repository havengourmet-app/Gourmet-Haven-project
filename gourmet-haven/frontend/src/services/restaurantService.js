import { apiRequest } from "./apiClient";

export function listRestaurants() {
  return apiRequest("/restaurants");
}

export function listOwnerRestaurants() {
  return apiRequest("/restaurants/owner");
}

export function createRestaurant(payload) {
  return apiRequest("/restaurants", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateRestaurant(restaurantId, payload) {
  return apiRequest(`/restaurants/${restaurantId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export function listMenuItems(restaurantId) {
  return apiRequest(`/menu-items?restaurantId=${restaurantId}`);
}
