import { Router } from "express";
import multer from "multer";
import { uploadImage } from "../controllers/uploadController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter(req, file, callback) {
    if (!file.mimetype?.startsWith("image/")) {
      callback(new Error("Only image files are allowed."));
      return;
    }

    callback(null, true);
  }
});

function handleImageUpload(req, res, next) {
  upload.single("image")(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        error: "Upload failed",
        message: error.message || "Unable to parse the uploaded image."
      });
    }

    next();
  });
}

router.post("/image", requireAuth, handleImageUpload, asyncHandler(uploadImage));

export default router;
