import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { sendData } from "../utils/apiResponse.js";
import { buildDashboard } from "../services/dashboard.service.js";

export async function getDashboard(req: AuthenticatedRequest, res: Response) {
  const dashboard = await buildDashboard(req.user!);
  return sendData(res, dashboard);
}
