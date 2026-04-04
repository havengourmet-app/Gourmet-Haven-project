import { Router } from "express";
import { createUploadSignature } from "../controllers/uploadController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/signature", requireAuth, requireRole("owner"), asyncHandler(createUploadSignature));

export default router;
