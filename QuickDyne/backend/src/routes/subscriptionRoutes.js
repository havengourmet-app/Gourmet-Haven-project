import { Router } from "express";
import {
  createSubscriptionCheckout,
  getSubscriptionStatus,
  verifySubscription
} from "../controllers/subscriptionController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/me", requireAuth, requireRole("owner"), asyncHandler(getSubscriptionStatus));
router.post("/checkout", requireAuth, requireRole("owner"), asyncHandler(createSubscriptionCheckout));
router.post("/verify", requireAuth, requireRole("owner"), asyncHandler(verifySubscription));

export default router;
