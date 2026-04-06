import { Router } from "express";
import { listAssignedDeliveries, listAvailableDeliveries } from "../controllers/deliveryController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/queue", requireAuth, requireRole("delivery"), asyncHandler(listAvailableDeliveries));
router.get("/", requireAuth, requireRole("delivery"), asyncHandler(listAssignedDeliveries));

export default router;
