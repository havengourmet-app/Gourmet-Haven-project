import { apiRequest } from "./apiClient";

export async function fetchPendingAccounts() {
  const response = await apiRequest("/admin/accounts/pending");
  return response?.data || [];
}

export async function fetchAllAccounts() {
  const response = await apiRequest("/admin/accounts");
  return response?.data || [];
}

export async function approveAccount(profileId) {
  const response = await apiRequest(`/admin/accounts/${profileId}/approve`, { method: "POST" });
  return response?.data || response;
}

export async function rejectAccount(profileId) {
  const response = await apiRequest(`/admin/accounts/${profileId}/reject`, { method: "POST" });
  return response?.data || response;
}