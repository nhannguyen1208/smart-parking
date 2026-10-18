import { Router } from "express";
import { login, logout, me } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/login", asyncHandler(login));
router.get("/me", authenticate, asyncHandler(me));
// Allow logout without a valid session (clears cookie; FE clears Bearer storage)
router.post("/logout", asyncHandler(logout));

export default router;
