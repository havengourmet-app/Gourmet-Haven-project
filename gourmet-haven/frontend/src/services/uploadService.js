import { apiRequest } from "./apiClient";

export async function uploadImage(file) {
  if (!(file instanceof File)) {
    throw new Error("Please choose a valid image file before uploading.");
  }

  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await apiRequest("/uploads/image", {
      method: "POST",
      body: formData
    });

    const secureUrl = response?.secure_url;

    if (!secureUrl) {
      throw new Error("Upload succeeded but no image URL was returned.");
    }

    return secureUrl;
  } catch (error) {
    throw new Error(error.message || "Image upload failed. Please try again.");
  }
}
