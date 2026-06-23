import { Router } from "express";
import {
  approveAccount,
  listAllAccounts,
  listPendingAccounts,
  rejectAccount,
  revealKycField
} from "../controllers/adminController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/accounts/pending", requireAuth, requireRole("admin"), asyncHandler(listPendingAccounts));
router.get("/accounts", requireAuth, requireRole("admin"), asyncHandler(listAllAccounts));
router.post("/accounts/:profileId/approve", requireAuth, requireRole("admin"), asyncHandler(approveAccount));
router.post("/accounts/:profileId/reject", requireAuth, requireRole("admin"), asyncHandler(rejectAccount));
router.get(
  "/accounts/:profileId/kyc/:fieldName/reveal",
  requireAuth,
  requireRole("admin"),
  asyncHandler(revealKycField)
);

export default router;