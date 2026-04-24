import { apiRequest } from "./apiClient";

export function listRestaurants() {
  return apiRequest("/restaurants");
}

export async function listOwnerRestaurants() {
  const response = await apiRequest("/restaurants/owner");
  return response?.data || response;
}

export async function createRestaurant(payload) {
  const response = await apiRequest("/restaurants", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  return response?.data || response;
}

export async function updateRestaurant(restaurantId, payload) {
  const response = await apiRequest(`/restaurants/${restaurantId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });

  return response?.data || response;
}

export async function listMenuItems(restaurantId) {
  const response = await apiRequest(`/menu-items?restaurantId=${restaurantId}`);
  return response?.data || response;
}

export async function createMenuItem(payload) {
  const response = await apiRequest("/menu-items", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  return response?.data || response;
}

export async function updateMenuItem(menuItemId, payload) {
  const response = await apiRequest(`/menu-items/${menuItemId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });

  return response?.data || response;
}
