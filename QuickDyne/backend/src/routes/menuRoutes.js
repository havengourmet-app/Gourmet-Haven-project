import { Router } from "express";
import { createMenuItem, listMenuItems, updateMenuItem } from "../controllers/menuController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(listMenuItems));
router.post("/", requireAuth, requireRole("owner"), asyncHandler(createMenuItem));
router.patch("/:menuItemId", requireAuth, requireRole("owner"), asyncHandler(updateMenuItem));

export default router;
