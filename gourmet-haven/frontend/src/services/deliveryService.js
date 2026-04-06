import { apiRequest } from "./apiClient";

export async function listAssignedDeliveries() {
  const response = await apiRequest("/delivery");
  return response?.data || response;
}

export async function listAvailableDeliveries() {
  const response = await apiRequest("/delivery/queue");
  return response?.data || response;
}
