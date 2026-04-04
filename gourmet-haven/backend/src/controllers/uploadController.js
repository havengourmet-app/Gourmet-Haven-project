import { hasCloudinaryConfig } from "../config/cloudinary.js";

export async function createUploadSignature(req, res) {
  if (!hasCloudinaryConfig) {
    return res.status(503).json({
      success: false,
      message: "Cloudinary is not configured yet."
    });
  }

  res.json({
    success: true,
    data: {
      message: "Add signed upload generation in the next task.",
      folder: req.body.folder || "gourmet-haven"
    }
  });
}
