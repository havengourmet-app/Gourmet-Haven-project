import { apiRequest } from "./apiClient";

export async function fetchMyKycSubmission() {
  const response = await apiRequest("/kyc/me");
  return response?.data || null;
}

export async function submitKyc(payload) {
  const response = await apiRequest("/kyc/me", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return response?.data || response;
}

export async function revealKycField(profileId, fieldName) {
  const response = await apiRequest(`/admin/accounts/${profileId}/kyc/${fieldName}/reveal`);
  return response?.data || response;
}