import { Router } from "express";
import { createMenuItem, listMenuItems, updateMenuItem } from "../controllers/menuController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

// Fixes C2: this route previously had no auth at all, leaking every menu
// item (including unavailable items and items for unsubscribed restaurants)
// to anyone who hit it with a restaurantId. It is now restricted to the
// owner who actually owns that restaurant — the public/customer-facing menu
// browsing path is GET /restaurants/:restaurantId/menu (restaurantController),
// which already filters to is_available=true + active subscription.
router.get("/", requireAuth, requireRole("owner"), asyncHandler(listMenuItems));
router.post("/", requireAuth, requireRole("owner"), asyncHandler(createMenuItem));
router.patch("/:menuItemId", requireAuth, requireRole("owner"), asyncHandler(updateMenuItem));

export default router;