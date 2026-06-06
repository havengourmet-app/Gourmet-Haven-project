import { Router } from "express";
import { getOwnerAnalytics } from "../controllers/analyticsController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/owner", requireAuth, requireRole("owner"), asyncHandler(getOwnerAnalytics));

export default router;