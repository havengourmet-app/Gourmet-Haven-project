import { Router } from "express";
import {
  createOrder,
  createOrderPaymentCheckout,
  fetchOrder,
  listCustomerOrders,
  listDeliveryOrders,
  listOwnerOrders,
  updateOrderStatus,
  verifyOrderPayment
} from "../controllers/orderController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/customer", requireAuth, requireRole("customer"), asyncHandler(listCustomerOrders));
router.get("/owner", requireAuth, requireRole("owner"), asyncHandler(listOwnerOrders));
router.get("/delivery", requireAuth, requireRole("delivery"), asyncHandler(listDeliveryOrders));

router.post("/payment/checkout", requireAuth, requireRole("customer"), asyncHandler(createOrderPaymentCheckout));
router.post("/payment/verify", requireAuth, requireRole("customer"), asyncHandler(verifyOrderPayment));

router.get("/:orderId", requireAuth, asyncHandler(fetchOrder));

router.post("/", requireAuth, requireRole("customer"), asyncHandler(createOrder));

router.patch(
  "/:orderId/status",
  requireAuth,
  requireRole("customer", "owner", "delivery"),
  asyncHandler(updateOrderStatus)
);

export default router;
