import { Router } from "express";
import {
  getMembership,
  getMembershipPlans,
} from "../controllers/membership.controller.js";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", authenticate, asyncHandler(getMembership));
router.get("/plans", authenticate, asyncHandler(getMembershipPlans));

export default router;
