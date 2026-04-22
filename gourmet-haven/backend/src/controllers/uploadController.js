import { cloudinary, hasCloudinaryConfig } from "../config/cloudinary.js";

export async function createUploadSignature(req, res) {
  if (!hasCloudinaryConfig) {
    return res.status(503).json({
      success: false,
      message: "Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your .env file."
    });
  }

  const folder    = req.body.folder || "gourmet-haven/menu-items";
  const timestamp = Math.round(Date.now() / 1000);

  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    process.env.CLOUDINARY_API_SECRET
  );

  res.json({
    success: true,
    data: {
      signature,
      timestamp,
      folder,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey:    process.env.CLOUDINARY_API_KEY
    }
  });
}