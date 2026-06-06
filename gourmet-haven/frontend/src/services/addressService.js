import { apiRequest } from "./apiClient";

export async function listAddresses() {
  const response = await apiRequest("/addresses");
  return response?.data || [];
}

export async function createAddress(payload) {
  const response = await apiRequest("/addresses", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return response?.data || response;
}

export async function updateAddress(addressId, payload) {
  const response = await apiRequest(`/addresses/${addressId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
  return response?.data || response;
}

export async function deleteAddress(addressId) {
  const response = await apiRequest(`/addresses/${addressId}`, {
    method: "DELETE"
  });
  return response?.data || response;
}removeEventListener