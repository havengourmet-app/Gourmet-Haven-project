import { apiRequest } from "./apiClient";

export async function fetchRestaurants(locality = "", search = "") {
  const params = new URLSearchParams();

  if (typeof locality === "string" && locality.trim()) {
    params.set("locality", locality.trim());
  }

  if (typeof search === "string" && search.trim()) {
    params.set("search", search.trim());
  }

  const path = params.toString() ? `/restaurants?${params.toString()}` : "/restaurants";

  try {
    const response = await apiRequest(path);
    return Array.isArray(response?.restaurants) ? response.restaurants : [];
  } catch (error) {
    throw new Error(error.message || "Unable to load restaurants right now.");
  }
}

export async function fetchLocalities() {
  try {
    const response = await apiRequest("/restaurants/localities");
    return Array.isArray(response?.localities) ? response.localities : [];
  } catch (error) {
    throw new Error(error.message || "Unable to load localities right now.");
  }
}

export async function listRestaurants(locality = "", search = "") {
  const restaurants = await fetchRestaurants(locality, search);
  return { data: restaurants };
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

export async function fetchRestaurantMenu(restaurantId) {
  try {
    const response = await apiRequest(`/restaurants/${restaurantId}/menu`);

    return {
      restaurant: response?.restaurant || null,
      menu: response?.menu || {}
    };
  } catch (error) {
    throw new Error(error.message || "Unable to load the restaurant menu right now.");
  }
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
