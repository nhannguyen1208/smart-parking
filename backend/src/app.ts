import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env, isDemoMode } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import membershipRoutes from "./routes/membership.routes.js";
import parkingRoutes from "./routes/parking.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import { createV1Router } from "./routes/v1/index.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()),
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
      },
    });
  });

  app.get("/ready", (_req, res) => {
    res.json({ data: { ready: true } });
  });

  // Legacy ParkEase routes (preserved)
  app.use("/api/auth", authRoutes);
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
