import { Router } from "express";
import { listAssignedDeliveries } from "../controllers/deliveryController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", requireAuth, requireRole("delivery"), asyncHandler(listAssignedDeliveries));

export default router;
