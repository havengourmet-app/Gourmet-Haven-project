import { Router } from "express";
import {
  createOrder,
  fetchOrder,
  listCustomerOrders,
  listDeliveryOrders,
  listOwnerOrders,
  updateOrderStatus
} from "../controllers/orderController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

// Role-specific list endpoints
router.get("/customer", requireAuth, requireRole("customer"), asyncHandler(listCustomerOrders));
router.get("/owner", requireAuth, requireRole("owner"), asyncHandler(listOwnerOrders));
router.get("/delivery", requireAuth, requireRole("delivery"), asyncHandler(listDeliveryOrders));

// Single order fetch — requireAuth only (no role restriction)
// Customers can track their own orders; this is safe because the controller
// filters by customer_id = req.user.id
router.get("/:orderId", requireAuth, asyncHandler(fetchOrder));

// Create — customer only
router.post("/", requireAuth, requireRole("customer"), asyncHandler(createOrder));

// Status update — owner or delivery
router.patch(
  "/:orderId/status",
  requireAuth,
  requireRole("owner", "delivery"),
  asyncHandler(updateOrderStatus)
);

export default router;