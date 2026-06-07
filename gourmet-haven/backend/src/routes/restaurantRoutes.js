import { Router } from "express";
import {
  createRestaurant,
  fetchRestaurantDetail,
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

// Public discovery routes — ORDER MATTERS: specific paths before :param
router.get("/", asyncHandler(listRestaurants));
router.get("/localities", asyncHandler(listRestaurantLocalities));
router.get("/owner", requireAuth, requireRole("owner"), asyncHandler(listOwnerRestaurants));

// Restaurant detail + menu — public
router.get("/:restaurantId", asyncHandler(fetchRestaurantDetail));
router.get("/:restaurantId/menu", asyncHandler(fetchRestaurantMenu));

// Owner mutations
router.post("/", requireAuth, requireRole("owner"), asyncHandler(createRestaurant));
router.patch("/:restaurantId", requireAuth, requireRole("owner"), asyncHandler(updateRestaurant));

export default router;