import { Router } from "express";
import { createReview, getOrderReview, listRestaurantReviews } from "../controllers/reviewController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/", requireAuth, requireRole("customer"), asyncHandler(createReview));
router.get("/order/:orderId", requireAuth, requireRole("customer"), asyncHandler(getOrderReview));
router.get("/restaurant/:restaurantId", asyncHandler(listRestaurantReviews));

export default router;