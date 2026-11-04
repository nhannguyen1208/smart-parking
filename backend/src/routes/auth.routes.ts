import { Router } from "express";
import { login, logout, me } from "../controllers/auth.controller.js";
import {
  generateGuestPassCompat,
  getSafeRide,
  lockVehicleCompat,
  miniAppMe,
  startSafeRide,
  updateSafeRideLocation,
  zaloDemoLogin,
  zaloPhoneLogin,
} from "../controllers/zaloAuth.controller.js";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/login", asyncHandler(login));
router.get("/me", authenticate, asyncHandler(me));
// Allow logout without a valid session (clears cookie; FE clears Bearer storage)
router.post("/logout", asyncHandler(logout));

// Zalo Mini App (same JWT / User store as web)
router.post("/demo-login", asyncHandler(zaloDemoLogin));
router.post("/phone-login", asyncHandler(zaloPhoneLogin));

export default router;

/** Mini App routes that live under /api (not /api/auth) — mounted separately */
export function createMiniAppCompatRouter() {
  const mini = Router();
  mini.get("/me", authenticate, asyncHandler(miniAppMe));
  mini.post("/lock-vehicle", authenticate, asyncHandler(lockVehicleCompat));
  mini.post(
    "/generate-guest-pass",
    authenticate,
    asyncHandler(generateGuestPassCompat),
  );
  mini.post("/safe-ride/start", authenticate, asyncHandler(startSafeRide));
  mini.get("/safe-ride/:token", asyncHandler(getSafeRide));
  mini.post(
    "/safe-ride/:token/location",
    asyncHandler(updateSafeRideLocation),
  );
  return mini;
}
