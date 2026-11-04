import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env, isDemoMode } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import authRoutes, {
  createMiniAppCompatRouter,
} from "./routes/auth.routes.js";
import {
  zaloWebhook,
  zaloWebhookProbe,
} from "./controllers/zaloWebhook.controller.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import membershipRoutes from "./routes/membership.routes.js";
import parkingRoutes from "./routes/parking.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import { createV1Router } from "./routes/v1/index.js";
import { asyncHandler } from "./utils/asyncHandler.js";

export function createApp() {
  const app = express();
  const allowedOrigins = env.CORS_ORIGIN.split(",").map((s) => s.trim());

  app.use(
    cors({
      origin(origin, callback) {
        // Mini App / native WebView may omit Origin; demo reflects unknown origins
        // so one public API host works for web + Zalo + Cloudflare tunnel.
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || isDemoMode()) {
          return callback(null, true);
        }
        return callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "256kb" }));
  app.use(cookieParser());

  app.get("/health", (_req, res) => {
    res.json({
      data: {
        status: "ok",
        service: "vnuk-parkwise-api",
        demoMode: isDemoMode(),
        stores: "mongodb",
      },
    });
  });

  app.get("/ready", (_req, res) => {
    res.json({ data: { ready: true } });
  });

  // Web + Zalo Mini App share this API (Mongo)
  app.use("/api/auth", authRoutes);
  app.use("/api", createMiniAppCompatRouter());
  // Zalo Mini App consent revoke / data deletion webhook (dashboard setup)
  app.get("/api/zalo/webhook", asyncHandler(zaloWebhookProbe));
  app.post("/api/zalo/webhook", asyncHandler(zaloWebhook));
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/profile", profileRoutes);
  app.use("/api/parking", parkingRoutes);
  app.use("/api/membership", membershipRoutes);

  // VNUK ParkWise Phase-1+ API
  app.use("/api/v1", createV1Router());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
