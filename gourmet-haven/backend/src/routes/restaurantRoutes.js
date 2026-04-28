import { Router } from "express";
import {
  createRestaurant,
  fetchRestaurantMenu,
  listRestaurantLocalities,
  listOwnerRestaurants,
  listRestaurants,
  updateRestaurant
} from "../controllers/restaurantController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(listRestaurants));
router.get("/localities", asyncHandler(listRestaurantLocalities));
router.get("/:restaurantId/menu", asyncHandler(fetchRestaurantMenu));
router.get("/owner", requireAuth, requireRole("owner"), asyncHandler(listOwnerRestaurants));
router.post("/", requireAuth, requireRole("owner"), asyncHandler(createRestaurant));
router.patch("/:restaurantId", requireAuth, requireRole("owner"), asyncHandler(updateRestaurant));

export default router;
