import { apiRequest } from "./apiClient";

export async function fetchProfile() {
  const response = await apiRequest("/profile/me");
  return response?.data || response;
}

export async function updateProfile(payload) {
  const response = await apiRequest("/profile/me", {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
  return response?.data || response;
}