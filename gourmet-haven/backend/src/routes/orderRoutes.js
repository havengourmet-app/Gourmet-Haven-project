import { Router } from "express";
import {
  createOrder,
  listCustomerOrders,
  listDeliveryOrders,
  listOwnerOrders,
  updateOrderStatus
} from "../controllers/orderController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/customer", requireAuth, requireRole("customer"), asyncHandler(listCustomerOrders));
router.get("/owner", requireAuth, requireRole("owner"), asyncHandler(listOwnerOrders));
router.get("/delivery", requireAuth, requireRole("delivery"), asyncHandler(listDeliveryOrders));
router.post("/", requireAuth, requireRole("customer"), asyncHandler(createOrder));
router.patch(
  "/:orderId/status",
  requireAuth,
  requireRole("owner", "delivery"),
  asyncHandler(updateOrderStatus)
);

export default router;
