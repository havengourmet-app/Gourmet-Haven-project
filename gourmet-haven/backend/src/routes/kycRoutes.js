import { Router } from "express";
import { getMyKycSubmission, submitMyKycSubmission } from "../controllers/kycController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/me", requireAuth, asyncHandler(getMyKycSubmission));
router.post("/me", requireAuth, asyncHandler(submitMyKycSubmission));

export default router;