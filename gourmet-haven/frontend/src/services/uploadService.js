import { apiRequest } from "./apiClient";

export function createUploadSignature(folder) {
  return apiRequest("/uploads/signature", {
    method: "POST",
    body: JSON.stringify({ folder })
  });
}
