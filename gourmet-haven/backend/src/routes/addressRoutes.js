import { Router } from "express";
import { listAddresses, createAddress, updateAddress, deleteAddress } from "../controllers/addressController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", requireAuth, asyncHandler(listAddresses));
router.post("/", requireAuth, asyncHandler(createAddress));
router.patch("/:addressId", requireAuth, asyncHandler(updateAddress));
router.delete("/:addressId", requireAuth, asyncHandler(deleteAddress));

export default router;