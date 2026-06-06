import { apiRequest } from "./apiClient";

export async function fetchOwnerAnalytics(range = "monthly") {
  const response = await apiRequest(`/analytics/owner?range=${range}`);
  return response?.data || null;
}