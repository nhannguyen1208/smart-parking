import { Router } from "express";
import { getZones } from "../controllers/parking.controller.js";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/zones", authenticate, asyncHandler(getZones));

export default router;
