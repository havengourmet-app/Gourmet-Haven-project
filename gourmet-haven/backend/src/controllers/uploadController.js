import { cloudinary, hasCloudinaryConfig } from "../config/cloudinary.js";

const DEFAULT_UPLOAD_FOLDER = "quickdyne/uploads";

// Only these subfolders are allowed via the `folder` field — this is an
// allowlist, not free text, so a client can't write into arbitrary Cloudinary
// paths just by sending a different folder name.
const ALLOWED_SUBFOLDERS = new Set(["uploads", "kyc"]);

function resolveUploadFolder(requestedFolder) {
  if (!requestedFolder || !ALLOWED_SUBFOLDERS.has(requestedFolder)) {
    return DEFAULT_UPLOAD_FOLDER;
  }

  return `quickdyne/${requestedFolder}`;
}

function uploadBufferToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        reject(error);
        return;
      }

      if (!result?.secure_url) {
        reject(new Error("Cloudinary did not return a secure image URL."));
        return;
      }

      resolve(result);
    });

    stream.end(buffer);
  });
}

export async function uploadImage(req, res) {
  if (!hasCloudinaryConfig) {
    return res.status(503).json({
      error: "Upload failed",
      message:
        "Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your backend .env file."
    });
  }

  if (!req.file?.buffer) {
    return res.status(400).json({
      error: "Upload failed",
      message: "Please choose an image file to upload."
    });
  }

  try {
    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: resolveUploadFolder(req.body?.folder),
      resource_type: "image"
    });

    return res.status(201).json({
      secure_url: result.secure_url
    });
  } catch (error) {
    return res.status(500).json({
      error: "Upload failed",
      message: error.message || "Unable to upload the image right now."
    });
  }
}