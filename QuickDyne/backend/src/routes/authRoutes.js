import { Router } from "express";
import { getCurrentUserProfile } from "../controllers/authController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/me", requireAuth, asyncHandler(getCurrentUserProfile));

export default router;
